
import React from 'react';
import { SimulationEngine } from '../Core';
import { Viewport } from '../graphics/Viewport';
import { getMoleculeGroup, isPointInPolygon, calculateOptimalRotation, debugWarn } from '../utils/general';
import { identifyMolecule } from '../utils/molecular';
import { resolveMolecularAssembly } from '../physics/Assembly';
import { QuantumSystem } from '../physics/nuclear/QuantumSystem';
import { getParticleElementData } from '../../data/elements';
import { Atom } from '../../types/core';
import { SUBSTEPS, WORLD_SCALE } from '../config';
import { createEnergyDissipation } from '../graphics/Effects';

/**
 * Handles user input (Mouse/Touch), Hit Testing, and Tool Logic.
 */
export class InputManager {
    private engine: SimulationEngine;
    private viewport: Viewport;
    
    private dragStart: { x: number, y: number, time: number } | null = null;
    private dragZ: number = 0;

    // Smoothing buffer for throw velocity
    private recentVelocities: {vx: number, vy: number}[] = [];
    private lastTime: number = 0;

    // Multi-touch State
    private activePointers = new Map<number, {x: number, y: number}>();
    private lastTwoFingerY: number | null = null;

    constructor(engine: SimulationEngine, viewport: Viewport) {
        this.engine = engine;
        this.viewport = viewport;
    }

    public getDragStart() {
        return this.dragStart;
    }

    public handlePointerDown(e: React.PointerEvent, canvasRect: DOMRect) {
        (e.target as Element).setPointerCapture(e.pointerId);
        
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;
        
        // Track pointer
        this.activePointers.set(e.pointerId, {x: e.clientX, y: e.clientY});

        const mouse = this.engine.mouse;
        
        // If 2 pointers are active, we switch to rotation mode and cancel any single-touch actions
        if (this.activePointers.size === 2) {
            mouse.isDown = false;
            mouse.dragId = null;
            mouse.dragGroup.clear();
            this.dragStart = null;
            mouse.isLassoing = false;
            mouse.energyActive = false;
            return;
        }

        // --- Single Touch Logic ---
        mouse.x = x;
        mouse.y = y;
        mouse.lastX = x;
        mouse.lastY = y;
        mouse.vx = 0;
        mouse.vy = 0;
        mouse.isDown = true;
        
        this.recentVelocities = [];
        this.lastTime = Date.now();

        // --- 1. Hit Testing ---
        const hitId = this.performHitTest(x, y);

        if (hitId) {
            this.initiateDrag(hitId, x, y);
        } else {
            // --- 2. Tool Activation (Empty Space) ---
            if (this.engine.getConfig().activeEntity) {
                 this.dragStart = { x, y, time: Date.now() };
            } else if (this.engine.getConfig().activeTool === 'lasso') {
                mouse.isLassoing = true;
                mouse.lassoPoints = [{x, y}];
            } else if (this.engine.getConfig().activeTool === 'energy') {
                mouse.energyActive = true;
                mouse.energyValue = 0;
            }
        }
    }

    public handlePointerMove(e: React.PointerEvent, canvasRect: DOMRect) {
        this.activePointers.set(e.pointerId, {x: e.clientX, y: e.clientY});

        // --- 2-Finger Rotation Logic ---
        if (this.activePointers.size === 2) {
            const points = Array.from(this.activePointers.values());
            const avgY = (points[0].y + points[1].y) / 2;
            
            if (this.lastTwoFingerY !== null) {
                const dy = avgY - this.lastTwoFingerY;
                const dTheta = dy * 0.02; 
                this.rotateHoveredGroups(dTheta);
            }
            this.lastTwoFingerY = avgY;
            return; // Skip single-pointer logic
        } else {
            // If we lose a finger, reset tracking to avoid jumps
            this.lastTwoFingerY = null;
        }

        // --- Single Pointer Logic ---
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;
        const mouse = this.engine.mouse;
        const now = Date.now();
        const dt = now - this.lastTime;

        // Accurate Velocity Tracking (px/ms)
        if (dt > 0 && dt < 100) {
            const vX_ms = (x - mouse.x) / dt;
            const vY_ms = (y - mouse.y) / dt;
            this.recentVelocities.push({vx: vX_ms, vy: vY_ms});
            if (this.recentVelocities.length > 5) this.recentVelocities.shift();
        }
        // Reset if stalled
        if (now - this.lastTime > 100) {
            this.recentVelocities = [];
        }
        this.lastTime = now;
        
        // Update State
        mouse.vx = x - mouse.x; // Instant delta for other systems if needed
        mouse.vy = y - mouse.y;
        mouse.lastX = mouse.x;
        mouse.lastY = mouse.y;
        mouse.x = x;
        mouse.y = y;

        if (mouse.isLassoing) {
            mouse.lassoPoints.push({x, y});
        } else if (!mouse.isDown && !this.engine.getConfig().activeEntity) {
            this.handleHover(x, y);
        }
    }

    public handlePointerUp(e: React.PointerEvent, canvasRect: DOMRect) {
        (e.target as Element).releasePointerCapture(e.pointerId);
        this.activePointers.delete(e.pointerId);
        
        if (this.activePointers.size < 2) {
            this.lastTwoFingerY = null;
        }

        // If we are still touching with one finger, don't trigger release logic yet
        if (this.activePointers.size > 0) return;

        const mouse = this.engine.mouse;
        const config = this.engine.getConfig();

        // 0. Apply Throw Physics (Must be done before drag state is cleared)
        if (mouse.dragId) {
            this.applyThrowVelocity();
        }

        // 1. Spawning via Drag-Release
        if (this.dragStart && config.activeEntity) {
            this.finalizeSpawnDrag(e.clientX, e.clientY, canvasRect);
        }

        // 2. Lasso Selection
        if (mouse.isLassoing) {
            this.finalizeLasso();
        }

        // 3. Energy Tool Release
        if (mouse.energyActive) {
            this.finalizeEnergyTool();
        }

        // Reset State
        mouse.isDown = false;
        mouse.dragId = null;
        mouse.dragGroup.clear();
        mouse.dragName = null;
        mouse.dragAnchor = null;
        this.recentVelocities = [];
    }

    public handleWheel(e: React.WheelEvent) {
        const dTheta = e.deltaY * 0.002;
        this.rotateHoveredGroups(dTheta);
    }

    private rotateHoveredGroups(dTheta: number) {
        const processed = new Set<string>();
        const atoms = this.engine.atoms;

        // Rotates hovered/dragged molecules in place
        atoms.forEach(a => {
            if (processed.has(a.id)) return;
            const groupIds = getMoleculeGroup(atoms, a.id);
            const group = atoms.filter(at => groupIds.has(at.id));
            
            // Rotate around Group Center of Mass
            let cy = 0, cz = 0;
            group.forEach(at => { cy += at.y; cz += at.z; });
            cy /= group.length;
            cz /= group.length;

            const cos = Math.cos(dTheta);
            const sin = Math.sin(dTheta);

            group.forEach(at => {
                const dy = at.y - cy;
                const dz = at.z - cz;
                at.y = cy + (dy * cos - dz * sin);
                at.z = cz + (dy * sin + dz * cos);
            });

            groupIds.forEach(id => processed.add(id));
        });
    }

    /**
     * Logic to apply forces to dragged atoms.
     * Called every physics frame.
     */
    public applyDragForces() {
        const mouse = this.engine.mouse;
        if (!mouse.isDown || !mouse.dragId || !mouse.dragAnchor) return;

        const leader = this.engine.atoms.find(a => a.id === mouse.dragId);
        if (!leader) return;

        const worldMouse = this.viewport.unproject(mouse.x, mouse.y, this.dragZ);
        
        // Calculate where the LEADER should be
        const leaderTargetX = worldMouse.x + mouse.dragAnchor.x;
        const leaderTargetY = worldMouse.y + mouse.dragAnchor.y;
        const leaderTargetZ = this.dragZ;
        
        const SNAP_FACTOR = 0.3; 
        
        // Apply individual velocity to each member to maintain Rigid Body structure
        mouse.dragGroup.forEach(id => {
            const atom = this.engine.atoms.find(a => a.id === id);
            if (atom) {
                // Determine target position for THIS atom
                let targetX = leaderTargetX;
                let targetY = leaderTargetY;
                let targetZ = leaderTargetZ;

                // Apply saved offset relative to leader
                if (id !== leader.id) {
                    const offset = mouse.dragOffsets.get(id);
                    if (offset) {
                        targetX += offset.x;
                        targetY += offset.y;
                        targetZ += offset.z;
                    }
                }

                // P-Controller: Velocity proportional to distance from target
                const dx = targetX - atom.x;
                const dy = targetY - atom.y;
                const dz = targetZ - atom.z;

                atom.vx = dx * SNAP_FACTOR;
                atom.vy = dy * SNAP_FACTOR;
                atom.vz = dz * SNAP_FACTOR;

                // Zero out accumulated forces to give Kinematic control absolute authority
                atom.fx = 0;
                atom.fy = 0;
                atom.fz = 0;
            }
        });
    }

    /**
     * Updates dragging physics when the user flings the mouse.
     */
    private applyThrowVelocity() {
        const mouse = this.engine.mouse;
        if (!mouse.dragId || this.recentVelocities.length === 0) return;

        // Check for staleness
        // If user stopped moving before release, do not fling
        const timeSinceLastMove = Date.now() - this.lastTime;
        // Relaxed threshold to 100ms to allow for slight pauses/browser lag
        if (timeSinceLastMove > 100) return;

        // 1. Calculate Average Velocity (pixels / ms)
        let avgX = 0, avgY = 0;
        this.recentVelocities.forEach(v => { avgX += v.vx; avgY += v.vy; });
        avgX /= this.recentVelocities.length;
        avgY /= this.recentVelocities.length;

        // 2. Convert to Physics Units (WorldUnits / Frame)
        // Approx 16.6ms per frame @ 60fps
        const pxPerFrameX = avgX * 16.6;
        const pxPerFrameY = avgY * 16.6;

        const worldPerFrameX = pxPerFrameX * WORLD_SCALE;
        const worldPerFrameY = pxPerFrameY * WORLD_SCALE;

        // 3. Apply Boost Factor
        const BOOST = 1.5; 
        const atomVx = worldPerFrameX * BOOST;
        const atomVy = worldPerFrameY * BOOST;

        const speed = Math.sqrt(atomVx*atomVx + atomVy*atomVy);

        // Only apply if it's a deliberate throw (not a gentle placement)
        if (speed > 0.5) {
            mouse.dragGroup.forEach(id => {
                const atom = this.engine.atoms.find(a => a.id === id);
                if (atom) {
                    atom.vx = atomVx;
                    atom.vy = atomVy;
                }
            });
        } else {
            // Kill velocity for static placement
            mouse.dragGroup.forEach(id => {
                const atom = this.engine.atoms.find(a => a.id === id);
                if (atom) {
                    atom.vx = 0;
                    atom.vy = 0;
                }
            });
        }
    }

    // --- PRIVATE HELPERS ---

    private performHitTest(screenX: number, screenY: number): string | null {
        let hitId: string | null = null;
        
        // FIXED: Use maxScale to find the CLOSEST atom (foreground)
        // Previous logic used minDepth, which might select atoms further away if Z-axis orientation is +Towards.
        let maxScale = -Infinity;

        // Iterate atoms to find closest intersection
        this.engine.atoms.forEach(a => {
            const p = this.viewport.project(a.x, a.y, a.z, a.radius);
            if (p) {
                const dx = screenX - p.x;
                const dy = screenY - p.y;
                // Hitbox slightly larger than visual radius
                if (dx*dx + dy*dy < (p.r * 1.2)**2) {
                    if (p.scale > maxScale) {
                        maxScale = p.scale;
                        hitId = a.id;
                    }
                }
            }
        });
        return hitId;
    }

    private initiateDrag(hitId: string, screenX: number, screenY: number) {
        const mouse = this.engine.mouse;
        const atom = this.engine.atoms.find(a => a.id === hitId);
        
        if (!atom) return;

        mouse.dragId = hitId;
        mouse.dragGroup = getMoleculeGroup(this.engine.atoms, hitId);
        
        // Cache the Z-depth at the start of drag to keep motion planar relative to camera
        this.dragZ = isFinite(atom.z) ? atom.z : 0;
        
        const worldMouse = this.viewport.unproject(screenX, screenY, this.dragZ);
        
        // Store offset from mouse to atom center
        mouse.dragAnchor = {
            x: atom.x - worldMouse.x,
            y: atom.y - worldMouse.y
        };
        
        // Store rigid body offsets for the whole molecule relative to the leader
        mouse.dragOffsets.clear();
        mouse.dragGroup.forEach(id => {
            const m = this.engine.atoms.find(a => a.id === id);
            if (m) {
                mouse.dragOffsets.set(id, {
                    x: m.x - atom.x,
                    y: m.y - atom.y,
                    z: m.z - atom.z
                });
            }
        });

        // UI Updates
        const groupAtoms = this.engine.atoms.filter(a => mouse.dragGroup.has(a.id));
        mouse.dragName = identifyMolecule(groupAtoms);

        // Auto-Rotate Effect
        if (groupAtoms.length > 2) {
            const rot = calculateOptimalRotation(this.engine.atoms, mouse.dragGroup);
            if (rot) {
                mouse.autoRotate = {
                    active: true,
                    axis: rot.axis,
                    totalAngle: rot.angle,
                    currentFrame: 0,
                    duration: 45
                };
            } else {
                mouse.autoRotate = null;
            }
        }
    }

    private handleHover(screenX: number, screenY: number) {
        const mouse = this.engine.mouse;
        const hitId = this.performHitTest(screenX, screenY);

        if (hitId !== mouse.hoverId) {
            mouse.hoverId = hitId;
            if (hitId) {
                mouse.hoverGroup = getMoleculeGroup(this.engine.atoms, hitId);
            } else {
                mouse.hoverGroup = null;
            }
        }
    }

    private finalizeSpawnDrag(clientX: number, clientY: number, canvasRect: DOMRect) {
        const start = this.dragStart!;
        // Normalize client coordinates to local canvas space to check drag distance
        const localX = clientX - canvasRect.left;
        const localY = clientY - canvasRect.top;

        const dx = start.x - localX;
        const dy = start.y - localY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        const config = this.engine.getConfig();
        
        // FIXED: Always calculate spawn origin from start.x/start.y to prevent placement drift.
        // Even for clicks (dist < 10), we want the atom to appear where the user originally aimed (start),
        // not where they lifted their finger (up/client).
        const worldPos = this.viewport.unproject(start.x, start.y, 0);
        
        // Drag: Spawn with velocity (Throw)
        // Calculate Supercharge based on hold duration (max 4 seconds)
        const duration = Date.now() - start.time;
        const charge = Math.min(duration / 4000, 1.0); // 0.0 to 1.0
        const boostMultiplier = 1 + (charge * 4); // 1x to 5x boost

        const power = 0.15 * boostMultiplier;
        
        // If dist is small, treat as a static click (zero velocity)
        const isDrag = dist >= 10;
        const velocity = isDrag ? { vx: dx * power, vy: dy * power, vz: 0 } : { vx: 0, vy: 0, vz: 0 };
        const item = config.activeEntity!;

        // DEBUG: Log Spawn Request
        if (config.debug) {
            console.log(`[InputManager] Spawn: ${item.type} at World(${worldPos.x.toFixed(1)}, ${worldPos.y.toFixed(1)})`);
            console.log(`[InputManager] Velocity: vx=${velocity.vx.toFixed(1)}, vy=${velocity.vy.toFixed(1)}, vz=${velocity.vz.toFixed(1)} | Charge: ${(charge*100).toFixed(0)}% (x${boostMultiplier.toFixed(1)})`);
        }

        // Unified Spawn Call
        if (item.type === 'atom' && item.element) {
            this.engine.spawnAtom(worldPos.x, worldPos.y, 0, item.element, item.isotopeIndex || 0, velocity);
        } else if (item.type === 'molecule' && item.molecule) {
            this.engine.spawnMolecule(worldPos.x, worldPos.y, item.molecule, velocity);
        } else if (item.type === 'particle' && item.particle) {
            const elem = getParticleElementData(item.particle.id);
            this.engine.spawnAtom(worldPos.x, worldPos.y, 0, elem, 0, velocity, item.particle.charge);
        }
        
        this.dragStart = null;
    }

    private finalizeLasso() {
        const mouse = this.engine.mouse;
        mouse.isLassoing = false;
        
        const pointCount = mouse.lassoPoints.length;
        if (pointCount > 5) {
            const selected = new Set<string>();
            let cx = 0, cy = 0;
            let count = 0;

            this.engine.atoms.forEach(a => {
                // Project atom to screen to check if inside 2D Lasso polygon
                const p = this.viewport.project(a.x, a.y, a.z, a.radius);
                if (p && isPointInPolygon({x: p.x, y: p.y}, mouse.lassoPoints)) {
                    // Neutron Immunity: Lasso ignores Neutrons (Z=0)
                    if (a.element.z !== 0) {
                        selected.add(a.id);
                        cx += a.x;
                        cy += a.y;
                        count++;
                    }
                }
            });
            
            if (selected.size > 0) {
                cx /= count;
                cy /= count;

                // Calculate max distance to set initial ring radius
                let maxDist = 0;
                this.engine.atoms.forEach(a => {
                    if (selected.has(a.id)) {
                        const dist = Math.sqrt((a.x-cx)**2 + (a.y-cy)**2);
                        if (dist > maxDist) maxDist = dist;
                    }
                });

                // Start Compression Phase
                mouse.compression = {
                    active: true,
                    atomIds: selected,
                    cx, cy,
                    currentRadius: Math.max(maxDist + 50, 300), // Start slightly larger
                    minRadius: 15 // Target compression (shrunk from 100 to ensure all atoms are close enough)
                };
                debugWarn(`[Input] Lasso Compression Started: ${count} atoms, R=${maxDist.toFixed(0)}->15`);
            }
        }
        mouse.lassoPoints = [];
    }

    private finalizeEnergyTool() {
        const mouse = this.engine.mouse;
        mouse.energyActive = false;
        
        const worldPos = this.viewport.unproject(mouse.x, mouse.y, 0);
        const spawned = QuantumSystem.spawnPairProduction(
           this.engine.atoms, 
           this.engine.particles, 
           worldPos.x, 
           worldPos.y, 
           mouse.energyValue, 
           this.engine.getCallbacks().onUnlockParticle, 
           this.engine.eventLog
        );

        if (spawned.length === 0) {
            createEnergyDissipation(this.engine.particles, worldPos.x, worldPos.y, 0, mouse.energyValue);
        }
    }
}
