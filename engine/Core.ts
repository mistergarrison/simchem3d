
import React from 'react';
import { Atom, Particle } from '../types/core';
import { PaletteItem, ToolType, DiscoveryState, SimulationEvent, MouseState } from '../types/ui';
import { ElementData, Molecule } from '../types/chemistry';
import { Viewport } from './graphics/Viewport';
import { SceneRenderer } from './graphics/SceneRenderer';
import { InputManager } from './input/InputManager';
import { resolveInteractions, annealAtoms, calculateZPlaneForces } from './physics/Solver';
import { applyVSEPR } from './physics/VSEPR';
import { DecaySystem } from './physics/nuclear/DecaySystem';
import { QuantumSystem } from './physics/nuclear/QuantumSystem';
import { HadronSystem } from './physics/nuclear/HadronSystem';
import { spawnAtomInWorld, AtomFactory } from './physics/Spawner';
import { PROTON_ELEM, NEUTRON_ELEM, getParticleElementData, SM_PARTICLES } from '../data/elements';
import { startClearance, resolveClearance } from './physics/Clearance';
import { resolveMolecularAssembly } from './physics/Assembly';
import { SUBSTEPS, WORLD_SCALE } from './config';
import { setDebug, debugLog } from './utils/general';
import { createEnergyDissipation } from './graphics/Effects';
import { GraphAnalyzer } from './algorithms/topology/GraphAnalyzer';
import { identifyMoleculeData } from './utils/molecular';
import { Integrator } from './physics/Integrator';

interface EngineConfig {
    timeScale: number;
    showBonds: boolean;
    viewMode: 'solid' | 'glass';
    activeTool: ToolType;
    activeEntity: PaletteItem | null;
    mobileBottomOffset: number;
    debug: boolean;
}

interface EngineCallbacks {
    onAtomCountChange: (count: number) => void;
    onDiscovery: (discovery: Partial<DiscoveryState>) => void;
    onUnlockParticle: (id: string) => void;
}

export class SimulationEngine {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    config: EngineConfig;
    callbacks: EngineCallbacks;

    atoms: Atom[] = [];
    particles: Particle[] = [];
    eventLog: SimulationEvent[] = [];
    
    viewport: Viewport;
    renderer: SceneRenderer;
    input: InputManager;
    
    mouse: MouseState = {
        x: 0, y: 0, lastX: 0, lastY: 0, vx: 0, vy: 0,
        isDown: false, dragId: null, hoverId: null, hoverGroup: null, dragName: null,
        energyActive: false, energyValue: 0, energyTarget: null,
        dragAnchor: null, dragGroup: new Set(), dragOffsets: new Map(),
        isLassoing: false, lassoPoints: [],
        moleculeHaloLife: 0, moleculeHaloMaxLife: 0, moleculeTarget: null,
        clearance: null, compression: null, autoRotate: null, floatingLabels: []
    };

    isRunning: boolean = false;
    animationFrameId: number | null = null;
    frame: number = 0;
    
    // State tracking to prevent excessive React updates
    private lastAtomCount: number = -1;

    constructor(canvas: HTMLCanvasElement, config: EngineConfig, callbacks: EngineCallbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false })!;
        this.config = config;
        this.callbacks = callbacks;

        // Apply initial debug state
        setDebug(config.debug);

        this.viewport = new Viewport();
        this.renderer = new SceneRenderer();
        this.input = new InputManager(this, this.viewport);
        
        this.handleResize();
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.loop();
        }
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    updateConfig(newConfig: EngineConfig) {
        this.config = newConfig;
        setDebug(this.config.debug);
    }

    getConfig() {
        return this.config;
    }

    getCallbacks() {
        return this.callbacks;
    }

    handleResize() {
        const { width, height } = this.canvas.getBoundingClientRect();
        this.viewport.update(width, height, window.devicePixelRatio || 1);
    }

    private updateEnergyTool() {
        if (!this.mouse.energyActive) return;

        // Initialize or Grow
        // Starts at 1 eV (1e-6 MeV) to allow discovering low-mass particles like Neutrinos.
        if (this.mouse.energyValue === 0) this.mouse.energyValue = 0.000001;
        else {
            // Constant 0.5% growth rate per frame
            this.mouse.energyValue *= 1.005;
        }

        // Hard Cap at 400 GeV (400,000 MeV)
        // If reached, auto-trigger release
        if (this.mouse.energyValue >= 400000) {
            this.mouse.energyValue = 400000;
            this.finalizeEnergyTool();
            return;
        }

        // Find nearest target for UI feedback
        const val = this.mouse.energyValue;
        let bestTarget: number | null = null;
        let minDiff = Infinity;

        // SM_PARTICLES with pairThreshold are valid targets
        const candidates = SM_PARTICLES.filter(p => p.pairThreshold !== undefined).map(p => p.pairThreshold!);
        
        for (const t of candidates) {
            const diff = Math.abs(val - t);
            // Must be within reasonable range to "lock on" visually
            if (diff < minDiff && diff < t * 0.5) {
                minDiff = diff;
                bestTarget = t;
            }
        }
        this.mouse.energyTarget = bestTarget;
    }

    private processAutoRotation() {
        if (!this.mouse.autoRotate || !this.mouse.autoRotate.active) return;
        
        const ar = this.mouse.autoRotate;
        if (ar.currentFrame >= ar.duration) {
            this.mouse.autoRotate = null;
            return;
        }

        const t = (ar.currentFrame + 1) / ar.duration;
        const prevT = ar.currentFrame / ar.duration;
        
        // Ease Out Cubic
        const ease = (x: number) => 1 - Math.pow(1 - x, 3);
        const currentAngle = ease(t) * ar.totalAngle;
        const prevAngle = ease(prevT) * ar.totalAngle;
        const deltaTheta = currentAngle - prevAngle;

        // Apply Rotation to Drag Group
        const groupAtoms = this.atoms.filter(a => this.mouse.dragGroup.has(a.id));
        if (groupAtoms.length > 0) {
            // Calculate Center of Rotation
            // If dragging, pivot around the dragged atom (Leader) so it stays fixed under cursor.
            // Otherwise, pivot around Center of Mass.
            let cx = 0, cy = 0, cz = 0;
            let leader: Atom | undefined;

            if (this.mouse.dragId) {
                leader = this.atoms.find(a => a.id === this.mouse.dragId);
            }

            if (leader) {
                cx = leader.x;
                cy = leader.y;
                cz = leader.z;
            } else {
                groupAtoms.forEach(a => { cx += a.x; cy += a.y; cz += a.z; });
                cx /= groupAtoms.length; cy /= groupAtoms.length; cz /= groupAtoms.length;
            }

            const u = ar.axis;
            const cos = Math.cos(deltaTheta);
            const sin = Math.sin(deltaTheta);

            groupAtoms.forEach(a => {
                // Skip rotating the leader itself if we are pivoting around it (optimization + precision)
                // Actually, math works out to delta=0 anyway, but let's run it for safety unless we check ID
                const x = a.x - cx;
                const y = a.y - cy;
                const z = a.z - cz;

                // Rodrigues' Rotation Formula
                // v_rot = v*cos + (u x v)*sin + u*(u.v)*(1-cos)
                
                const dotUV = u.x*x + u.y*y + u.z*z;
                
                const crossX = u.y*z - u.z*y;
                const crossY = u.z*x - u.x*z;
                const crossZ = u.x*y - u.y*x;

                a.x = cx + (x * cos + crossX * sin + u.x * dotUV * (1 - cos));
                a.y = cy + (y * cos + crossY * sin + u.y * dotUV * (1 - cos));
                a.z = cz + (z * cos + crossZ * sin + u.z * dotUV * (1 - cos));
            });

            // CRITICAL FIX: Update Rigid Body Drag Offsets
            // If we don't do this, the Drag system will force the atoms back 
            // to their pre-rotation relative positions on the very next frame.
            if (leader) {
                groupAtoms.forEach(a => {
                    if (a.id !== leader!.id) {
                        this.mouse.dragOffsets.set(a.id, {
                            x: a.x - leader!.x,
                            y: a.y - leader!.y,
                            z: a.z - leader!.z
                        });
                    }
                });
            }
        }

        ar.currentFrame++;
    }

    private checkForDiscoveries() {
        // Run sparingly (e.g., once every 30-60 frames)
        
        // 1. Elements & Particles
        const discoveredElements = new Set<number>();
        const discoveredParticles = new Set<string>();

        this.atoms.forEach(a => {
            // Elements
            if (a.element.z > 0 && a.element.z <= 118) {
                discoveredElements.add(a.element.z);
            }
            
            // Particles: Quarks, Bosons (Z=1000) or Leptons (Z < 0)
            if (a.element.z === 1000 || a.element.z < 0) {
                 const pDef = SM_PARTICLES.find(p => p.symbol === a.element.s);
                 if (pDef) discoveredParticles.add(pDef.id);
            } 
            // Nucleons
            else if (a.element.z === 0) {
                 discoveredParticles.add('neutron');
            } 
            else if (a.element.z === 1 && a.element.s === 'p⁺') {
                 discoveredParticles.add('proton');
            }
        });

        // 2. Molecules
        const discoveredMolecules = new Set<string>();
        // Use graph analysis to find connected components
        const { groups, atomGroupMap } = GraphAnalyzer.analyze(this.atoms);
        
        // Map Group Index -> Atom[]
        const groupAtoms: Atom[][] = [];
        this.atoms.forEach(a => {
            const gIdx = atomGroupMap.get(a.id);
            if (gIdx !== undefined) {
                if (!groupAtoms[gIdx]) groupAtoms[gIdx] = [];
                groupAtoms[gIdx].push(a);
            }
        });

        groupAtoms.forEach(group => {
            if (group && group.length > 1) {
                const mol = identifyMoleculeData(group);
                if (mol) {
                    discoveredMolecules.add(mol.id);
                }
            }
        });

        if (discoveredElements.size > 0 || discoveredMolecules.size > 0 || discoveredParticles.size > 0) {
            this.callbacks.onDiscovery({
                elements: discoveredElements,
                molecules: discoveredMolecules,
                particles: discoveredParticles
            });
        }
    }

    loop = () => {
        if (!this.isRunning) return;
        this.frame++;

        // Update Physics
        if (this.config.timeScale > 0) {
            // 1. MACRO STEP (Once per frame)
            // Tools and non-physics updates
            this.updateEnergyTool();
            this.processAutoRotation(); // Handle "Face Camera" animation
            this.input.applyDragForces(); 

            // Topology changes (Rare events)
            annealAtoms(this.atoms, this.mouse, this.mouse.dragGroup);
            HadronSystem.resolveHadronization(this.atoms, this.particles, this.eventLog);
            DecaySystem.process(this.atoms, this.particles, 1/60 * this.config.timeScale, this.eventLog);

            // Lasso Compression Logic (Macro)
            if (this.mouse.compression && this.mouse.compression.active) {
                const c = this.mouse.compression;
                c.currentRadius = Math.max(c.minRadius, c.currentRadius - 5); // Slowed down shrink
                if (c.currentRadius <= c.minRadius) {
                    // Compression complete -> Trigger Assembly
                    c.active = false;
                    resolveMolecularAssembly(
                        this.atoms,
                        this.mouse.floatingLabels,
                        c.atomIds,
                        this.particles,
                        this.mouse,
                        { x: c.cx, y: c.cy, z: 0 }
                    );
                    this.mouse.compression = null;
                }
            }

            // 2. MICRO STEP: Physics Sub-stepping
            const { w, h } = this.viewport.getWorldDimensions();
            const dt = 1.0 / SUBSTEPS; 

            for(let step = 0; step < SUBSTEPS; step++) {
                // Clear Forces
                for (let i = 0; i < this.atoms.length; i++) {
                    this.atoms[i].fx = 0;
                    this.atoms[i].fy = 0;
                    this.atoms[i].fz = 0;
                }

                // Apply Inputs per substep for smoothness
                this.input.applyDragForces(); 
                
                // Lasso Force (Micro)
                if (this.mouse.compression && this.mouse.compression.active) {
                    const c = this.mouse.compression;
                    
                    // Force Constants tuned for substeps
                    // Removed pullStrength as per user request to rely on shrinking radius
                    const wallStrength = 20.0 * dt; // Increased wall strength to ensure effective sweeping

                    this.atoms.forEach(a => {
                        if (c.atomIds.has(a.id)) {
                            const dx = c.cx - a.x;
                            const dy = c.cy - a.y;
                            const dist = Math.sqrt(dx*dx + dy*dy) || 1;

                            // Only apply force if outside the shrinking radius (Wall effect)
                            if (dist > c.currentRadius) {
                                a.vx += (dx/dist) * wallStrength;
                                a.vy += (dy/dist) * wallStrength;
                                // Damping to prevent wall-bouncing
                                a.vx *= 0.8;
                                a.vy *= 0.8;
                            }
                        }
                    });
                }

                // Force Calculations
                resolveInteractions(this.atoms, this.particles, this.mouse, this.mouse.dragGroup, this.eventLog);
                applyVSEPR(this.atoms, this.mouse.dragGroup);
                const zForces = calculateZPlaneForces(this.atoms);

                // ZERO OUT Z-FORCES for Dragged Atoms
                // This prevents the "squashing" effect where the z-plane restoration force
                // flattens a 3D molecule while it's being dragged via kinematic control.
                if (this.mouse.dragGroup.size > 0) {
                    this.mouse.dragGroup.forEach(id => zForces.set(id, 0));
                }

                // Integration with dt
                // SCALE MOBILE BOTTOM OFFSET TO WORLD UNITS
                Integrator.integrateAll(this.atoms, zForces, w, h, this.config.mobileBottomOffset * WORLD_SCALE, this.particles, dt);
            }
            
            // 3. POST-STEP (Visuals / Cleanup)
            // Particles update (Visuals only, run once per frame)
            for(let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx; p.y += p.vy; p.z += p.vz;
                p.life -= 0.01; 
                if (p.life <= 0) this.particles.splice(i, 1);
            }
            
            // Labels update
            for(let i = this.mouse.floatingLabels.length - 1; i >= 0; i--) {
                const l = this.mouse.floatingLabels[i];
                l.life--;
                if(l.life <= 0) this.mouse.floatingLabels.splice(i, 1);
            }
            
            // Molecule Halo update
            if (this.mouse.moleculeHaloLife > 0) {
                this.mouse.moleculeHaloLife--;
            }
            
            // Clearance update
            if (this.mouse.clearance && this.mouse.clearance.active) {
                // Capture the exact spawn coordinates from the clearance object
                const spawnCx = this.mouse.clearance.cx;
                const spawnCy = this.mouse.clearance.cy;
                // Capture velocity BEFORE resolving
                const spawnVelocity = this.mouse.clearance.velocity;

                const newAtoms = resolveClearance(this.atoms, this.mouse, AtomFactory.create);
                
                if (newAtoms.length > 0) {
                    const newIds = new Set<string>();
                    newAtoms.forEach(a => {
                        // Assign Debug ID for tracing
                        a._debugId = Math.floor(Math.random() * 100000);
                        // HARD RESET VELOCITY to prevent inherited velocity issues
                        a.vx = 0; a.vy = 0; a.vz = 0;
                        
                        this.atoms.push(a);
                        newIds.add(a.id);
                        this.eventLog.push({ type: 'create', atomId: a.id, label: a.element.s, reason: 'Molecule Spawn', timestamp: Date.now() });
                    });
                    
                    // Trigger assembly logic to bond the new atoms.
                    // Pass the exact spawn coordinates to force the layout center.
                    resolveMolecularAssembly(
                        this.atoms, 
                        this.mouse.floatingLabels, 
                        newIds, 
                        this.particles, 
                        this.mouse, 
                        {x: spawnCx, y: spawnCy, z: 0},
                        spawnVelocity
                    );
                }
            }

            // Periodic Discovery Check (Every ~1 second)
            if (this.frame % 60 === 0) {
                this.checkForDiscoveries();
            }
            
            // Report Atom Count Changes to React (if changed)
            // Use atoms only, particles are usually transient visual effects
            const currentCount = this.atoms.length;
            if (currentCount !== this.lastAtomCount) {
                this.lastAtomCount = currentCount;
                this.callbacks.onAtomCountChange(currentCount);
            }
        }

        // Render
        const isMobile = this.viewport.width < 1024;
        this.renderer.render(
            this.ctx,
            this.atoms,
            this.particles,
            this.mouse,
            this.viewport,
            this.config.showBonds,
            this.config.viewMode,
            this.input.getDragStart(),
            isMobile
        );

        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    clear() {
        this.atoms = [];
        this.particles = [];
        this.mouse.dragId = null;
        this.mouse.dragGroup.clear();
        this.eventLog = [];
    }

    spawnAtom(x: number, y: number, z: number, element: ElementData, isoIndex: number, velocity?: {vx:number, vy:number, vz:number}, charge?: number) {
        spawnAtomInWorld(this.atoms, this.eventLog, x, y, z, element, isoIndex, velocity, charge);
    }

    spawnMolecule(x: number, y: number, molecule: Molecule, velocity?: {vx:number, vy:number, vz:number}) {
        startClearance(this.mouse, x, y, molecule, velocity);
    }

    public handleSpawnRequest(req: { item: PaletteItem, x?: number, y?: number }) {
        const { item, x: reqX, y: reqY } = req;
        
        let spawnX, spawnY, spawnZ = 0;

        if (reqX !== undefined && reqY !== undefined) {
             const rect = this.canvas.getBoundingClientRect();
             const sx = reqX - rect.left;
             const sy = reqY - rect.top;
             const worldPos = this.viewport.unproject(sx, sy, 0); 
             spawnX = worldPos.x;
             spawnY = worldPos.y;
             debugLog(`[Engine] Spawn Requested at Client(${reqX},${reqY}) -> World(${spawnX.toFixed(2)},${spawnY.toFixed(2)})`);
        } else {
             const { w: worldW, h: worldH } = this.viewport.getWorldDimensions();
             const cx = worldW / 2;
             const cy = worldH / 2;
             spawnX = cx + (Math.random() - 0.5) * 400;
             spawnY = cy + (Math.random() - 0.5) * 400;
             spawnZ = (Math.random() - 0.5) * 400;
             debugLog(`[Engine] Random Spawn at World(${spawnX.toFixed(2)},${spawnY.toFixed(2)})`);
        }

        if (item.type === 'atom' && item.element) {
            this.spawnAtom(spawnX, spawnY, spawnZ, item.element, item.isotopeIndex || 0);
        } else if (item.type === 'molecule' && item.molecule) {
            this.spawnMolecule(spawnX, spawnY, item.molecule);
        } else if (item.type === 'particle' && item.particle) {
            const pDef = item.particle;
            // Map Particle ID to ElementData to leverage AtomFactory's physics logic
            const elem = getParticleElementData(pDef.id);
            this.spawnAtom(spawnX, spawnY, spawnZ, elem, 0, undefined, pDef.charge);
        }
    }

    // Explicitly public to be accessible from updateEnergyTool's auto-release
    public finalizeEnergyTool() {
        const mouse = this.mouse;
        mouse.energyActive = false;
        
        // Released logic
        const worldPos = this.viewport.unproject(mouse.x, mouse.y, 0);
        const spawned = QuantumSystem.spawnPairProduction(
           this.atoms, 
           this.particles, 
           worldPos.x, 
           worldPos.y, 
           mouse.energyValue, 
           this.getCallbacks().onUnlockParticle, 
           this.eventLog
        );

        if (spawned.length === 0) {
            createEnergyDissipation(this.particles, worldPos.x, worldPos.y, 0, mouse.energyValue);
        }
    }

    // Proxy Input Events
    handlePointerDown(e: React.PointerEvent) { 
        this.input.handlePointerDown(e, this.canvas.getBoundingClientRect());
    }
    handlePointerMove(e: React.PointerEvent) {
        this.input.handlePointerMove(e, this.canvas.getBoundingClientRect());
    }
    handlePointerUp(e: React.PointerEvent) {
        this.input.handlePointerUp(e, this.canvas.getBoundingClientRect());
    }
    handleWheel(e: React.WheelEvent) {
        this.input.handleWheel(e);
    }

    getWorldDimensions() {
        return this.viewport.getWorldDimensions();
    }
}
