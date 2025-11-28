

import React from 'react';
import { SimulationEngine } from '../Engine';
import { Viewport } from '../geometry/Viewport';
import { getMoleculeGroup, isPointInPolygon, calculateOptimalRotation, debugWarn } from '../utils';
import { identifyMolecule } from '../molecular_utils';
import { resolveMolecularAssembly } from '../assembly';
import { QuantumSystem } from '../physics/nuclear/QuantumSystem';
import { getParticleElementData } from '../../elements';
import { Atom } from '../../types';
import { SUBSTEPS, WORLD_SCALE } from '../constants';
import { createEnergyDissipation } from '../effects';

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
        const mouse = this.engine.mouse;
        
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
        const targetX = worldMouse.x + mouse.dragAnchor.x;
        const targetY = worldMouse.y + mouse.dragAnchor.y;
        
        const dx = targetX - leader.x;
        const dy = targetY - leader.y;
        const dz = this.dragZ - leader.z;
        
        // KINEMATIC DRAG:
        // Directly set velocity to move towards cursor.
        // This overrides inertia and prevents "orbiting".
        // Factor 0.3 means "close 30% of the distance this frame".
        const SNAP_FACTOR = 0.3; 
        
        leader.vx = dx * SNAP_FACTOR;
        leader.vy = dy * SNAP_FACTOR;
        leader.vz = dz * SNAP_FACTOR;

        // Clear other forces on the leader (Gravity/Bonds) to give the mouse "God Mode" authority.
        // Bonds will still pull followers, but the leader won't be pulled back.
        leader.fx = 0;
        leader.fy = 0;
        leader.fz = 0;

        // Rigid Body coupling for the rest of the molecule
        if (mouse.dragGroup.size > 1) {
            mouse.dragGroup.forEach(id => {
                if (id === leader.id) return;
                const follower = this.engine.atoms.find(a => a.id === id);
                if (follower) {
                    const offset = mouse.dragOffsets.get(id);
                    if (offset) {
                        const idealX = leader.x + offset.x;
                        const idealY = leader.y + offset.y;
                        const idealZ = leader.z + offset.z;
                        
                        const fdx = idealX - follower.x;
                        const fdy = idealY - follower.y;
                        const fdz = idealZ - follower.z;
                        
                        const fMass = follower.mass || 1;
                        // Stiff spring to keep shape
                        const kFollow = 0.5; 
                        
                        follower.fx += fdx * kFollow * fMass; 
                        follower.fy += fdy * kFollow * fMass;
                        follower.fz += fdz * kFollow * fMass;
                        
                        // High damping for followers
                        follower.vx *= 0.8; 
                        follower.vy *= 0.8; 
                        follower.vz *= 0.8;
                    }
                }
            });
        }
    }

    /**
     * Updates dragging physics when the user flings the mouse.
     */
    private applyThrowVelocity() {
        const mouse = this.engine.mouse;
        if (!mouse.dragId || this.recentVelocities.length === 0) return;

        // 1. Calculate Average Velocity (pixels / ms)
        let avgX = 0, avgY = 0;
        this.recentVelocities.forEach(v => { avgX += v.vx; avgY += v.vy; });
        avgX /= this.recentVelocities.length;
        avgY /= this.recentVelocities.length;

        // 2. Convert to Physics Units (WorldUnits / Substep)
        // Approx 16.6ms per frame @ 60fps
        const pxPerFrameX = avgX * 16.6;
        const pxPerFrameY = avgY * 16.6;

        const worldPerFrameX = pxPerFrameX * WORLD_SCALE;
        const worldPerFrameY = pxPerFrameY * WORLD_SCALE;

        // 3. Apply Boost Factor
        // Simulation drag (even reduced) feels sluggish compared to hand motion.
        // A 1.5x boost aligns the visual speed with user intent.
        const BOOST = 1.5; 
        const atomVx = (worldPerFrameX / SUBSTEPS) * BOOST;
        const atomVy = (worldPerFrameY / SUBSTEPS) * BOOST;

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
        let minDepth = Infinity;

        // Iterate atoms to find closest intersection
        this.engine.atoms.forEach(a => {
            const p = this.viewport.project(a.x, a.y, a.z, a.radius);
            if (p) {
                const dx = screenX - p.x;
                const dy = screenY - p.y;
                // Hitbox slightly larger than visual radius
                if (dx*dx + dy*dy < (p.r * 1.2)**2) {
                    if (p.depth < minDepth) {
                        minDepth = p.depth;
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
        
        // Store rigid body offsets for the whole molecule
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
        const worldPos = this.viewport.unproject(start.x, start.y, 0);
        
        // Drag: Spawn with velocity (Throw)
        const power = 0.15;
        const velocity = { vx: dx * power, vy: dy * power, vz: 0 };
        const item = config.activeEntity!;

        // CLICK (Static) or DRAG (Velocity)
        // If CLICK (<10px), we pass the client coordinates to Engine.handleSpawnRequest to resolve World Position there.
        // If DRAG, we use the `start` World Position calculated here.
        
        if (dist < 10) {
            // Click: Spawn static
            this.engine.handleSpawnRequest({ item: config.activeEntity!, x: clientX, y: clientY });
        } else {
            if (item.type === 'atom' && item.element) {
                this.engine.spawnAtom(worldPos.x, worldPos.y, 0, item.element, item.isotopeIndex || 0, velocity);
            } else if (item.type === 'molecule' && item.molecule) {
                this.engine.spawnMolecule(worldPos.x, worldPos.y, item.molecule, velocity);
            } else if (item.type === 'particle' && item.particle) {
                // FIXED: Use spawnAtom to leverage AtomFactory physics (Boson speed etc)
                // This ensures "throwing" a photon still triggers the MAX_SPEED override in AtomFactory.
                const elem = getParticleElementData(item.particle.id);
                this.engine.spawnAtom(worldPos.x, worldPos.y, 0, elem, 0, velocity, item.particle.charge);
            }
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
                    minRadius: 100 // Target compression
                };
                debugWarn(`[Input] Lasso Compression Started: ${count} atoms, R=${maxDist.toFixed(0)}->100`);
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