
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Atom, Particle, Molecule, ToolType, PaletteItem, DiscoveryState, SimulationEvent, ElementData } from '../types';
import { ELEMENTS, NEUTRON_ELEM, ELECTRON_ELEM, PROTON_ELEM, SM_PARTICLES, getParticleElementData } from '../elements';
import { MouseState } from '../simulation/types';
import { SUBSTEPS, MOUSE_SPRING_STIFFNESS, MOUSE_SPRING_DAMPING, FOV, WORLD_SCALE } from '../simulation/constants';
import { isPointInPolygon, getMoleculeGroup, calculateOptimalRotation } from '../simulation/utils';
import { applyVSEPR } from '../simulation/vsepr';
import { annealAtoms, resolveInteractions, calculateZPlaneForces, integrateMotion } from '../simulation/chemistry';
import { processDecay, resolveHadronization, spawnPairProduction } from '../simulation/nuclear';
import { identifyMolecule } from '../simulation/molecular_utils';
import { resolveMolecularAssembly } from '../simulation/assembly';
import { renderCanvas } from '../simulation/renderer';
import { runSystemTest } from '../simulation/systemTest';
import { startClearance, resolveClearance } from '../simulation/clearance';
import { createExplosion } from '../simulation/effects';
import { MOLECULES } from '../molecules';

interface CanvasProps {
  timeScale: number;
  isPlaying: boolean;
  onAtomCountChange: (count: number) => void;
  clearTrigger: number;
  spawnRequest: { item: PaletteItem, x?: number, y?: number } | null;
  moleculeRequest: { molecule: Molecule; id: number } | null;
  showBonds: boolean;
  viewMode: 'solid' | 'glass';
  activeTool: ToolType;
  activeEntity: PaletteItem | null;
  testTrigger?: number;
  onUnlockParticle: (id: string) => void;
  onDiscovery: (discovery: Partial<DiscoveryState>) => void;
}

/**
 * Canvas Component
 * 
 * The visual and physical heart of the application.
 */
const Canvas: React.FC<CanvasProps> = ({
  timeScale,
  isPlaying,
  onAtomCountChange,
  clearTrigger,
  spawnRequest,
  moleculeRequest,
  showBonds,
  viewMode,
  activeTool,
  activeEntity,
  testTrigger,
  onUnlockParticle,
  onDiscovery
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Mutable state (Physics World)
  const atomsRef = useRef<Atom[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const eventLogRef = useRef<SimulationEvent[]>([]);
  
  // Track start position of drag for shooting (Position + Time for charging)
  const dragStartRef = useRef<{x: number, y: number, time: number} | null>(null);

  const mouseRef = useRef<MouseState>({ 
      x: 0, y: 0, 
      lastX: 0, lastY: 0,
      vx: 0, vy: 0, 
      isDown: false, 
      dragId: null,
      hoverId: null,
      dragName: null,
      dragAnchor: null, 
      dragGroup: new Set<string>(),
      dragOffsets: new Map(),
      isLassoing: false,
      lassoPoints: [],
      moleculeHaloLife: 0,
      moleculeHaloMaxLife: 0,
      moleculeTarget: null,
      clearance: null,
      autoRotate: null,
      floatingLabels: [],
      energyActive: false,
      energyValue: 0,
      energyTarget: null
  });
  const rafRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  
  const dragZRef = useRef<number>(0);

  const [testToast, setTestToast] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- MATH HELPERS ---

  const project = useCallback((x: number, y: number, z: number, width: number, height: number) => {
      const worldW = width * WORLD_SCALE;
      const worldH = height * WORLD_SCALE;
      const cx = width / 2; 
      const cy = height / 2;
      const worldCx = worldW / 2;
      const worldCy = worldH / 2;

      const ZOOM = 1 / WORLD_SCALE;

      const dx = x - worldCx;
      const dy = y - worldCy;
      const dz = z;

      const zz_final = dz * ZOOM;
      const SAFE_THRESHOLD = FOV - 200;
      
      if (zz_final > SAFE_THRESHOLD) {
          return null; 
      }

      const pScale = FOV / (FOV - zz_final);

      const zx_final = dx * ZOOM;
      const zy_final = dy * ZOOM;

      const sx = cx + zx_final * pScale;
      const sy = cy + zy_final * pScale;

      return { x: sx, y: sy, scale: pScale, depth: zz_final };
  }, []);

  const unproject = useCallback((sx: number, sy: number, z: number, width: number, height: number) => {
      // Safety: Avoid division by zero if width/height are 0
      if (!width || !height) return { x: 0, y: 0 };

      const worldW = width * WORLD_SCALE;
      const worldH = height * WORLD_SCALE;
      const cx = width / 2; 
      const cy = height / 2; // Screen centers
      const worldCx = worldW / 2;
      const worldCy = worldH / 2;
      const ZOOM = 1 / WORLD_SCALE;
      
      // With pitch = 0:
      // sx = cx + (x - worldCx) * ZOOM * pScale
      // pScale = FOV / (FOV - z * ZOOM)
      
      const pScale = FOV / (FOV - z * ZOOM);
      
      const dx = (sx - cx) / (ZOOM * pScale);
      const dy = (sy - cy) / (ZOOM * pScale);
      
      return { 
          x: worldCx + dx, 
          y: worldCy + dy 
      };
  }, []);

  // --- LIFECYCLE ---

  useEffect(() => {
      const handleResize = () => {
          if (canvasRef.current && canvasRef.current.parentElement) {
              const parent = canvasRef.current.parentElement;
              const dpr = window.devicePixelRatio || 1;
              
              canvasRef.current.style.width = `${parent.clientWidth}px`;
              canvasRef.current.style.height = `${parent.clientHeight}px`;
              
              canvasRef.current.width = parent.clientWidth * dpr;
              canvasRef.current.height = parent.clientHeight * dpr;
          }
      };

      handleResize(); 
      window.addEventListener('resize', handleResize);

      let resizeObserver: ResizeObserver | null = null;
      if (canvasRef.current && canvasRef.current.parentElement) {
          resizeObserver = new ResizeObserver(() => {
              handleResize();
          });
          resizeObserver.observe(canvasRef.current.parentElement);
      }

      return () => {
          window.removeEventListener('resize', handleResize);
          if (resizeObserver) resizeObserver.disconnect();
      };
  }, []);

  useEffect(() => {
    if (clearTrigger > 0) {
      atomsRef.current = [];
      particlesRef.current = [];
      eventLogRef.current = [];
      mouseRef.current.moleculeTarget = null;
      mouseRef.current.moleculeHaloLife = 0;
      mouseRef.current.clearance = null;
      mouseRef.current.floatingLabels = [];
      mouseRef.current.dragId = null;
      mouseRef.current.dragGroup.clear();
      // We access onAtomCountChange directly without deps to prevent loop
      onAtomCountChange(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTrigger]);

  const spawnAtom = useCallback((x: number, y: number, z: number, zInput: number | ElementData, isoIdx: number, velocity?: {vx: number, vy: number, vz: number}, chargeOverride?: number) => {
    let elem: ElementData | undefined;
    
    // Resolve Element Data
    if (typeof zInput === 'object') {
        elem = zInput;
    } else {
        if (zInput === 0) elem = NEUTRON_ELEM;
        else if (zInput === -1) elem = ELECTRON_ELEM;
        else elem = ELEMENTS.find(e => e.z === zInput);
    }

    if (!elem) return null;
    const iso = elem.iso[isoIdx] || elem.iso[0];
    
    // Determine Physics Properties (Radius, Charge, Mass)
    let radius = 30 + Math.pow(iso.m, 0.33) * 10;
    let charge = 0;
    let mass = iso.m;

    // SPECIAL HANDLING: Subatomic Particles
    if (elem.z === -1) { // Electron
        charge = -1;
        radius = 30; // Consistent electron cloud size
    } else if (elem.z === 0) { // Neutron
        charge = 0;
        radius = 20;
    } else if (elem.z === 1 && elem.s === 'p⁺') { // Proton
        charge = 1;
        radius = 20;
    } else if (elem.z === 1000) { // Quarks
        radius = 15;
        if (elem.s === 'u' || elem.s === 'c' || elem.s === 't') charge = 0.66;
        else charge = -0.33;
    }

    // Apply explicit charge override if provided (critical for P+ acting as ion vs neutral H)
    if (chargeOverride !== undefined) {
        charge = chargeOverride;
        // If it's H-1 and we forced Charge +1, it's a Proton, so shrink it
        if (elem.z === 1 && charge === 1 && mass < 1.6) {
            radius = 20;
        }
    }

    // Add Jitter to prevent stacking
    const jitterX = (Math.random() - 0.5) * 2.0;
    const jitterY = (Math.random() - 0.5) * 2.0;
    const jitterZ = (Math.random() - 0.5) * 2.0;

    const newAtom: Atom = {
      id: Math.random().toString(36).substr(2, 9),
      x: x + jitterX,
      y: y + jitterY,
      z: z + jitterZ,
      vx: velocity ? velocity.vx : (Math.random() - 0.5) * 0.5,
      vy: velocity ? velocity.vy : (Math.random() - 0.5) * 0.5,
      vz: velocity ? velocity.vz : (Math.random() - 0.5) * 0.5,
      fx: 0, fy: 0, fz: 0,
      element: elem,
      isotopeIndex: isoIdx,
      bonds: [],
      mass: mass,
      radius: radius,
      charge: charge,
      createdAt: Date.now(),
      lastDecayCheck: Date.now()
    };
    
    atomsRef.current.push(newAtom);
    eventLogRef.current.push({
        type: 'create',
        atomId: newAtom.id,
        label: newAtom.element.s,
        reason: 'Manual Spawn',
        timestamp: Date.now()
    });
    return newAtom;
  }, []);

  useEffect(() => {
      if (testTrigger && testTrigger > 0) {
          runSystemTest(atomsRef, particlesRef, mouseRef, canvasRef, eventLogRef, (msg, type) => {
              if (toastTimeoutRef.current) {
                  clearTimeout(toastTimeoutRef.current);
                  toastTimeoutRef.current = null;
              }
              if (type === 'error') console.error(msg);
              setTestToast({ msg, type });
              if (type !== 'error') {
                  toastTimeoutRef.current = setTimeout(() => {
                      setTestToast(null);
                      toastTimeoutRef.current = null;
                  }, 3000);
              }
          });
      }
  }, [testTrigger]);

  const executeSpawn = useCallback((item: PaletteItem, x: number, y: number, z: number = 0, velocity?: {vx: number, vy: number, vz: number}) => {
    if (item.type === 'atom' && item.element) {
        // Standard atom spawn. Charge defaults to 0 unless element logic overrides it.
        spawnAtom(x, y, z, item.element, item.isotopeIndex || 0, velocity);
    } else if (item.type === 'molecule' && item.molecule) {
        startClearance(mouseRef.current, x, y, item.molecule);
    } else if (item.type === 'particle' && item.particle) {
        const pDef = item.particle;
        const mass = pDef.massMeV / 931.5;
        const now = Date.now();
        
        // Determine Z for special particles to avoid collisions
        let zVal = 1000;
        if (pDef.id === 'electron') zVal = -1;
        else if (pDef.id === 'proton') zVal = 1;
        else if (pDef.id === 'neutron') zVal = 0;
        
        // Protons and Neutrons should participate in physics as atoms
        // CRITICAL: Pass pDef.charge to ensure Proton is +1 and attracts Electrons
        if (zVal === 1 || zVal === 0) {
             const elem = zVal === 1 ? PROTON_ELEM : NEUTRON_ELEM;
             spawnAtom(x, y, z, elem, 0, velocity, pDef.charge);
             return;
        }
        
        // Electrons and other particles
        const newAtom: Atom = {
             id: Math.random().toString(36),
             x: x, y: y, z: z,
             vx: velocity ? velocity.vx : 0, 
             vy: velocity ? velocity.vy : 0, 
             vz: velocity ? velocity.vz : 0,
             fx: 0, fy: 0, fz: 0,
             element: getParticleElementData(pDef.id),
             isotopeIndex: 0,
             bonds: [],
             mass: mass,
             radius: zVal === -1 ? 30 : 15,
             charge: pDef.charge,
             createdAt: now,
             lastDecayCheck: now
        };
        atomsRef.current.push(newAtom);
        eventLogRef.current.push({
            type: 'create',
            atomId: newAtom.id,
            label: newAtom.element.s,
            reason: 'Manual Spawn',
            timestamp: Date.now()
        });
    }
  }, [spawnAtom]);

  useEffect(() => {
    if (spawnRequest && canvasRef.current) {
        const { item, x: reqX, y: reqY } = spawnRequest;
        
        const dpr = window.devicePixelRatio || 1;
        const width = canvasRef.current.width / dpr;
        const height = canvasRef.current.height / dpr;
        
        let spawnX, spawnY, spawnZ = 0;

        if (reqX !== undefined && reqY !== undefined) {
             const rect = canvasRef.current.getBoundingClientRect();
             const sx = reqX - rect.left;
             const sy = reqY - rect.top;
             const worldPos = unproject(sx, sy, 0, width, height); 
             spawnX = worldPos.x;
             spawnY = worldPos.y;
        } else {
             const worldW = width * WORLD_SCALE;
             const worldH = height * WORLD_SCALE;
             const cx = worldW / 2;
             const cy = worldH / 2;
             spawnX = cx + (Math.random() - 0.5) * 400;
             spawnY = cy + (Math.random() - 0.5) * 400;
             spawnZ = (Math.random() - 0.5) * 400;
        }

        executeSpawn(item, spawnX, spawnY, spawnZ);
    }
  }, [spawnRequest, unproject, executeSpawn]);

  // --- PHYSICS LOOP ---

  const update = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    
    const worldW = width * WORLD_SCALE;
    const worldH = height * WORLD_SCALE;

    // Mobile Safety Bounds Logic
    // Check if width is small (Mobile breakpoint)
    const isMobile = width < 1024; 
    // 180px covers Toolbar + Palette + Safe Area
    const mobileBottomBarHeightPx = 180; 
    const safeAreaWorld = isMobile ? mobileBottomBarHeightPx * WORLD_SCALE : 0;

    const mouseDx = mouseRef.current.x - mouseRef.current.lastX;
    const mouseDy = mouseRef.current.y - mouseRef.current.lastY;
    mouseRef.current.lastX = mouseRef.current.x;
    mouseRef.current.lastY = mouseRef.current.y;
    mouseRef.current.vx = mouseRef.current.vx * 0.5 + mouseDx * 0.5;
    mouseRef.current.vy = mouseRef.current.vy * 0.5 + mouseDy * 0.5;

    frameCountRef.current++;

    if (frameCountRef.current % 60 === 0) {
        onAtomCountChange(atomsRef.current.length);
        const newElements = new Set<number>();
        const newParticles = new Set<string>();
        const newMolecules = new Set<string>();

        atomsRef.current.forEach(a => {
            const z = a.element.z;
            if (z > 0 && z < 200) {
                newElements.add(z);
                if (z === 1) newParticles.add('proton');
            }
            if (z === -1) newParticles.add('electron');
            else if (z === 0) newParticles.add('neutron');
            else if (z === 1000) {
                const pDef = SM_PARTICLES.find(p => p.symbol === a.element.s);
                if (pDef) newParticles.add(pDef.id);
            }
        });

        mouseRef.current.floatingLabels.forEach(lbl => {
            const match = MOLECULES.find(m => m.name === lbl.text);
            if (match) newMolecules.add(match.id);
        });

        onDiscovery({
            elements: newElements,
            particles: newParticles,
            molecules: newMolecules
        });
    }

    // --- AUTO ROTATION BEHAVIOR ---
    if (mouseRef.current.autoRotate && mouseRef.current.autoRotate.active) {
        const ar = mouseRef.current.autoRotate;
        if (ar.currentFrame < ar.duration) {
            const groupIds = mouseRef.current.dragGroup;
            const group = atomsRef.current.filter(a => groupIds.has(a.id));
            
            if (group.length > 0) {
                // Calculate Center of Mass
                let cx = 0, cy = 0, cz = 0;
                group.forEach(a => { cx += a.x; cy += a.y; cz += a.z; });
                cx /= group.length; cy /= group.length; cz /= group.length;

                const stepAngle = ar.totalAngle / ar.duration;
                const cos = Math.cos(stepAngle);
                const sin = Math.sin(stepAngle);
                const k = ar.axis;
                const oneMinusCos = 1 - cos;

                group.forEach(a => {
                    const dx = a.x - cx;
                    const dy = a.y - cy;
                    const dz = a.z - cz;

                    const kDotV = k.x * dx + k.y * dy + k.z * dz;

                    const rx = dx * cos + (k.y * dz - k.z * dy) * sin + k.x * kDotV * oneMinusCos;
                    const ry = dy * cos + (k.z * dx - k.x * dz) * sin + k.y * kDotV * oneMinusCos;
                    const rz = dz * cos + (k.x * dy - k.y * dx) * sin + k.z * kDotV * oneMinusCos;

                    a.x = cx + rx;
                    a.y = cy + ry;
                    a.z = cz + rz;

                    // ZERO VELOCITY to prevent momentum buildup during kinematic override
                    // This prevents atoms from "flying off" when the rotation ends
                    a.vx = 0; a.vy = 0; a.vz = 0;
                });

                // Re-sync rigid body offsets to preventing physics fighting the rotation
                const leader = atomsRef.current.find(a => a.id === mouseRef.current.dragId);
                if (leader) {
                    mouseRef.current.dragOffsets.clear();
                    group.forEach(a => {
                        if (a.id !== leader.id) {
                            mouseRef.current.dragOffsets.set(a.id, {
                                x: a.x - leader.x,
                                y: a.y - leader.y,
                                z: a.z - leader.z
                            });
                        }
                    });

                    // CRITICAL FIX: Update Z-Plane Reference
                    // The leader's Z changes during rotation. We must update the locked Z-plane
                    // so the Z-spring force (dz = lockedZ - leader.z) doesn't explode.
                    dragZRef.current = leader.z;

                    // Update Drag Anchor with new Z
                    // This moves the "pivot" to the Center of Mass visually while keeping the mouse "attached"
                    const lockedZ = dragZRef.current;
                    const worldMouse = unproject(mouseRef.current.x, mouseRef.current.y, lockedZ, width, height);
                    mouseRef.current.dragAnchor = {
                        x: leader.x - worldMouse.x,
                        y: leader.y - worldMouse.y
                    };
                }
            }
            ar.currentFrame++;
        } else {
            ar.active = false;
        }
    }

    if (mouseRef.current.energyActive) {
        mouseRef.current.energyValue += 0.009; 
        if (mouseRef.current.energyValue > 12) mouseRef.current.energyValue = 12; 

        const THRESHOLDS = [1.022, 4.4, 9.4];
        let nearest = null;
        let minDiff = Infinity;
        for (const t of THRESHOLDS) {
             const diff = Math.abs(mouseRef.current.energyValue - t);
             if (diff < minDiff) {
                 minDiff = diff;
                 nearest = t;
             }
        }
        mouseRef.current.energyTarget = nearest;
    } else {
        mouseRef.current.energyValue = 0;
        mouseRef.current.energyTarget = null;
    }

    if (isPlaying) {
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx; 
        p.y += p.vy;
        p.z = (p.z || 0) + (p.vz || 0);
        p.life -= 0.02;
        if (p.life <= 0) particlesRef.current.splice(i, 1);
      }
      
      for (let i = mouseRef.current.floatingLabels.length - 1; i >= 0; i--) {
          const l = mouseRef.current.floatingLabels[i];
          l.life -= 1;
          if (l.life <= 0) {
              mouseRef.current.floatingLabels.splice(i, 1);
          }
      }

      // Animation Step for Visual Halo Effect
      if (mouseRef.current.moleculeHaloLife > 0) {
          mouseRef.current.moleculeHaloLife--;
      }

      processDecay(atomsRef.current, particlesRef.current, 0.016 * timeScale, eventLogRef.current);
      
      for (const a of atomsRef.current) {
          if (isNaN(a.x) || !isFinite(a.x)) { a.x = worldW/2; a.vx=0; }
          if (isNaN(a.y) || !isFinite(a.y)) { a.y = worldH/2; a.vy=0; }
          if (isNaN(a.z) || !isFinite(a.z)) { a.z = 0; a.vz=0; }
      }

      // Check for newly spawned atoms from clearance phase and run layout immediately
      const newAtoms = resolveClearance(atomsRef.current, mouseRef.current, spawnAtom);
      if (newAtoms && newAtoms.length > 0) {
          const idSet = new Set(newAtoms.map(a => a.id));
          // Pass mouseRef.current to enable visual halo triggering
          resolveMolecularAssembly(atomsRef.current, mouseRef.current.floatingLabels, idSet, particlesRef.current, mouseRef.current);
      }

      if (mouseRef.current.isDown && mouseRef.current.dragId && mouseRef.current.dragGroup.size === 0) {
          const exists = atomsRef.current.some(a => a.id === mouseRef.current.dragId);
          if (!exists) {
              mouseRef.current.dragId = null;
              mouseRef.current.isDown = false;
          } else {
              mouseRef.current.dragGroup = getMoleculeGroup(atomsRef.current, mouseRef.current.dragId);
          }
      }

      if (mouseRef.current.isLassoing) {
         if (mouseRef.current.moleculeHaloLife < mouseRef.current.moleculeHaloMaxLife) mouseRef.current.moleculeHaloLife = 0;
      }
      
      resolveMolecularAssembly(atomsRef.current, mouseRef.current.floatingLabels, mouseRef.current.lassoPoints.length > 0 ? new Set() : new Set(), particlesRef.current, mouseRef.current);

      annealAtoms(atomsRef.current, mouseRef.current);

      for (let step = 0; step < SUBSTEPS; step++) {
          // 1. Clear Forces (CRITICAL: Fixes infinite force accumulation bug)
          for (const a of atomsRef.current) {
              a.fx = 0; a.fy = 0; a.fz = 0;
          }

          // 2. Apply Drag Forces (Inside Loop for Stability)
          if (mouseRef.current.isDown && mouseRef.current.dragId && mouseRef.current.dragAnchor) {
             const leader = atomsRef.current.find(a => a.id === mouseRef.current.dragId);
             if (leader) {
                 const lockedZ = dragZRef.current; 
                 const worldMouse = unproject(mouseRef.current.x, mouseRef.current.y, lockedZ, width, height);
                 
                 const targetX = worldMouse.x + mouseRef.current.dragAnchor.x;
                 const targetY = worldMouse.y + mouseRef.current.dragAnchor.y;
                 
                 const dx = targetX - leader.x;
                 const dy = targetY - leader.y;
                 const dz = lockedZ - leader.z;
                 
                 const MAX_FORCE = 8.0; 
                 const fx = Math.max(-MAX_FORCE, Math.min(MAX_FORCE, dx * MOUSE_SPRING_STIFFNESS));
                 const fy = Math.max(-MAX_FORCE, Math.min(MAX_FORCE, dy * MOUSE_SPRING_STIFFNESS));
                 const fz = Math.max(-MAX_FORCE, Math.min(MAX_FORCE, dz * MOUSE_SPRING_STIFFNESS)); 

                 if (isFinite(fx)) leader.fx += fx;
                 if (isFinite(fy)) leader.fy += fy;
                 if (isFinite(fz)) leader.fz += fz;

                 // Velocity Clamp (prevents explosion from extreme mouse movements)
                 const MAX_DRAG_SPEED = 60.0; 
                 const spdSq = leader.vx*leader.vx + leader.vy*leader.vy + leader.vz*leader.vz;
                 if (spdSq > MAX_DRAG_SPEED*MAX_DRAG_SPEED) {
                     const scale = MAX_DRAG_SPEED / Math.sqrt(spdSq);
                     leader.vx *= scale; leader.vy *= scale; leader.vz *= scale;
                 }

                 // Damping (Adjusted for per-substep application: 0.95^8 ~ 0.66)
                 const SUBSTEP_DAMPING = 0.95;
                 leader.vx *= SUBSTEP_DAMPING;
                 leader.vy *= SUBSTEP_DAMPING;
                 leader.vz *= SUBSTEP_DAMPING;

                 if (mouseRef.current.dragGroup.size > 1) {
                     mouseRef.current.dragGroup.forEach(id => {
                         if (id === leader.id) return;
                         const follower = atomsRef.current.find(a => a.id === id);
                         if (follower) {
                             const offset = mouseRef.current.dragOffsets.get(id);
                             if (offset) {
                                 const idealX = leader.x + offset.x;
                                 const idealY = leader.y + offset.y;
                                 const idealZ = leader.z + offset.z;
                                 
                                 const fdx = idealX - follower.x;
                                 const fdy = idealY - follower.y;
                                 const fdz = idealZ - follower.z;
                                 
                                 follower.fx += fdx * 0.1; 
                                 follower.fy += fdy * 0.1;
                                 follower.fz += fdz * 0.1;
                                 
                                 follower.vx *= 0.9;
                                 follower.vy *= 0.9;
                                 follower.vz *= 0.9;
                             }
                         }
                     });
                 }
             }
          }

          // 3. Internal Physics
          applyVSEPR(atomsRef.current, mouseRef.current.dragId ? mouseRef.current.dragGroup : null);
          resolveInteractions(atomsRef.current, particlesRef.current, mouseRef.current, null, eventLogRef.current);
          const zForceMap = calculateZPlaneForces(atomsRef.current);
          
          // PASS SAFE AREA FOR MOBILE BOUNDARY
          integrateMotion(atomsRef.current, zForceMap, worldW, worldH, safeAreaWorld);
          
          resolveHadronization(atomsRef.current, particlesRef.current, eventLogRef.current);
      }
    }

    renderCanvas(ctx, atomsRef.current, particlesRef.current, mouseRef.current, width, height, dpr, showBonds, viewMode, dragStartRef.current);
    rafRef.current = requestAnimationFrame(update);
  }, [timeScale, isPlaying, showBonds, viewMode, unproject, onAtomCountChange, onDiscovery]);

  useEffect(() => {
      rafRef.current = requestAnimationFrame(update);
      return () => cancelAnimationFrame(rafRef.current);
  }, [update]);

  // --- SCROLL HANDLER FOR PER-MOLECULE TUMBLING ---
  // This rotates molecules around their local center of mass instead of tilting the world.
  const handleWheel = useCallback((e: React.WheelEvent) => {
      const dTheta = e.deltaY * 0.002; // Rotation speed
      const atoms = atomsRef.current;
      const processed = new Set<string>();

      atoms.forEach(a => {
          if (processed.has(a.id)) return;
          
          // Identify Connected Component
          const groupIds = getMoleculeGroup(atoms, a.id);
          const group = atoms.filter(at => groupIds.has(at.id));
          
          // Calculate Center of Mass
          let cy = 0, cz = 0;
          group.forEach(at => { cy += at.y; cz += at.z; });
          cy /= group.length;
          cz /= group.length;

          const cos = Math.cos(dTheta);
          const sin = Math.sin(dTheta);

          // Apply Rotation around Center of Mass
          group.forEach(at => {
              const dy = at.y - cy;
              const dz = at.z - cz;
              
              // Rotate around X-axis (Pitch)
              at.y = cy + (dy * cos - dz * sin);
              at.z = cz + (dy * sin + dz * cos);
          });

          groupIds.forEach(id => processed.add(id));
      });
  }, []);

  // Event Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
      if (!canvasRef.current) return;
      (e.target as Element).setPointerCapture(e.pointerId);
      
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      mouseRef.current.x = x;
      mouseRef.current.y = y;
      mouseRef.current.lastX = x;
      mouseRef.current.lastY = y;
      mouseRef.current.isDown = true;

      const dpr = window.devicePixelRatio || 1;
      const width = canvasRef.current.width / dpr;
      const height = canvasRef.current.height / dpr;

      // Hit Test
      let hitId: string | null = null;
      let minDepth = Infinity;

      atomsRef.current.forEach(a => {
          const p = project(a.x, a.y, a.z, width, height);
          if (p) {
              const dx = x - p.x;
              const dy = y - p.y;
              if (dx*dx + dy*dy < p.scale * a.radius * p.scale * a.radius * 1.5) { // 1.5x hit area
                  if (p.depth < minDepth) {
                      minDepth = p.depth;
                      hitId = a.id;
                  }
              }
          }
      });

      if (hitId) {
          const atom = atomsRef.current.find(a => a.id === hitId);
          if (atom) {
              mouseRef.current.dragId = hitId;
              mouseRef.current.dragGroup = getMoleculeGroup(atomsRef.current, hitId);
              
              // Store Z plane for drag stability
              dragZRef.current = isFinite(atom.z) ? atom.z : 0;
              
              // Set Anchor
              const worldMouse = unproject(x, y, dragZRef.current, width, height);
              mouseRef.current.dragAnchor = {
                  x: atom.x - worldMouse.x,
                  y: atom.y - worldMouse.y
              };
              
              // Rigid Body Setup
              mouseRef.current.dragOffsets.clear();
              mouseRef.current.dragGroup.forEach(id => {
                  const m = atomsRef.current.find(a => a.id === id);
                  if (m) {
                      mouseRef.current.dragOffsets.set(id, {
                          x: m.x - atom.x,
                          y: m.y - atom.y,
                          z: m.z - atom.z
                      });
                  }
              });

              // Identify
              const groupAtoms = atomsRef.current.filter(a => mouseRef.current.dragGroup.has(a.id));
              mouseRef.current.dragName = identifyMolecule(groupAtoms);

              // --- TRIGGER AUTO-ROTATION (Face the Camera) ---
              if (groupAtoms.length > 2) {
                  const rot = calculateOptimalRotation(atomsRef.current, mouseRef.current.dragGroup);
                  if (rot) {
                      mouseRef.current.autoRotate = {
                          active: true,
                          axis: rot.axis,
                          totalAngle: rot.angle,
                          currentFrame: 0,
                          duration: 45 // 0.75 seconds @ 60fps
                      };
                  } else {
                      mouseRef.current.autoRotate = null;
                  }
              } else {
                  mouseRef.current.autoRotate = null;
              }
          }
      } else {
          // Empty space click
          if (activeEntity) {
               // START DRAG TO SHOOT
               dragStartRef.current = { x, y, time: Date.now() };
          } else if (activeTool === 'lasso') {
              mouseRef.current.isLassoing = true;
              mouseRef.current.lassoPoints = [{x, y}];
          } else if (activeTool === 'energy') {
              mouseRef.current.energyActive = true;
              mouseRef.current.energyValue = 0;
          }
      }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (!canvasRef.current) return;
      const x = e.clientX - canvasRef.current.getBoundingClientRect().left;
      const y = e.clientY - canvasRef.current.getBoundingClientRect().top;
      
      mouseRef.current.x = x;
      mouseRef.current.y = y;

      if (mouseRef.current.isLassoing) {
          mouseRef.current.lassoPoints.push({x, y});
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      if (!canvasRef.current) return;
      (e.target as Element).releasePointerCapture(e.pointerId);
      
      // Handle Drag-to-Shoot Launch
      if (dragStartRef.current && activeEntity) {
          const start = dragStartRef.current;
          const endX = mouseRef.current.x;
          const endY = mouseRef.current.y;
          const dx = start.x - endX;
          const dy = start.y - endY;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          const dpr = window.devicePixelRatio || 1;
          const width = canvasRef.current.width / dpr;
          const height = canvasRef.current.height / dpr;
          
          // Unproject Start Position to get World Coordinates
          const worldPos = unproject(start.x, start.y, 0, width, height);
          
          if (dist < 10) {
              // Simple Click: Place with zero velocity
              executeSpawn(activeEntity, worldPos.x, worldPos.y, 0, {vx: 0, vy: 0, vz: 0});
          } else {
              // Drag: Shoot with velocity
              // Multiplier controls launch power
              const power = 0.15; 
              const vx = dx * power;
              const vy = dy * power;
              executeSpawn(activeEntity, worldPos.x, worldPos.y, 0, {vx, vy, vz: 0});
          }
          dragStartRef.current = null;
      }

      mouseRef.current.isDown = false;
      mouseRef.current.dragId = null;
      mouseRef.current.dragGroup.clear();
      mouseRef.current.dragName = null;
      mouseRef.current.dragAnchor = null;

      if (mouseRef.current.isLassoing) {
          mouseRef.current.isLassoing = false;
          // Process Lasso
          if (mouseRef.current.lassoPoints.length > 5) {
              const dpr = window.devicePixelRatio || 1;
              const width = canvasRef.current.width / dpr;
              const height = canvasRef.current.height / dpr;

              const selected = new Set<string>();
              atomsRef.current.forEach(a => {
                  const p = project(a.x, a.y, a.z, width, height);
                  if (p && isPointInPolygon({x: p.x, y: p.y}, mouseRef.current.lassoPoints)) {
                      selected.add(a.id);
                  }
              });
              
              if (selected.size > 0) {
                  // Pass mouseRef.current to trigger visual halo
                  resolveMolecularAssembly(atomsRef.current, mouseRef.current.floatingLabels, selected, particlesRef.current, mouseRef.current);
              }
          }
          mouseRef.current.lassoPoints = [];
      }

      if (mouseRef.current.energyActive) {
          mouseRef.current.energyActive = false;
          if (mouseRef.current.energyValue > 0.5) { // Min threshold
             const dpr = window.devicePixelRatio || 1;
             const width = canvasRef.current.width / dpr;
             const height = canvasRef.current.height / dpr;
             const worldPos = unproject(mouseRef.current.x, mouseRef.current.y, 0, width, height);
             spawnPairProduction(atomsRef.current, particlesRef.current, worldPos.x, worldPos.y, mouseRef.current.energyValue, onUnlockParticle, eventLogRef.current);
          }
      }
  };

  return (
    <>
        <canvas 
            ref={canvasRef}
            className="block touch-none cursor-crosshair active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
        />
        {/* Test Toast Overlay - Centered and slightly down */}
        {testToast && (
            <div className={`fixed top-[30%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-6 py-4 rounded-lg shadow-2xl z-50 font-bold border max-w-lg w-full flex flex-col gap-2 select-text
                ${testToast.type === 'error' ? 'bg-red-900/95 border-red-500 text-white' : testToast.type === 'success' ? 'bg-green-600 border-green-400 text-white' : 'bg-blue-600 border-blue-400 text-white'}
            `}>
                <div className="flex justify-between items-start">
                    <span className="font-mono text-sm break-words">{testToast.msg}</span>
                </div>
                {testToast.type === 'error' && (
                    <button 
                        onClick={() => setTestToast(null)}
                        className="self-end px-4 py-1 bg-white/20 hover:bg-white/30 rounded text-sm uppercase tracking-wider transition-colors mt-2"
                    >
                        Okay
                    </button>
                )}
            </div>
        )}
    </>
  );
};

export default Canvas;