
import React, { useRef, useEffect, useCallback } from 'react';
import { Atom, Particle, Molecule, ToolType, ElementData } from '../types';
import { ELEMENTS, NEUTRON_ELEM, ELECTRON_ELEM, PROTON_ELEM } from '../elements';
import { MouseState } from '../simulation/types';
import { SUBSTEPS, MAX_SPEED, DRAG_COEFF, Z_BOUNDS, Z_SPRING, WORLD_SCALE, MOUSE_SPRING_STIFFNESS, MOUSE_SPRING_DAMPING } from '../simulation/constants';
import { isPointInPolygon, getMoleculeGroup, addBond, calculateOptimalRotation } from '../simulation/utils';
import { applyVSEPR } from '../simulation/vsepr';
import { annealAtoms, resolveInteractions, processDecay, createExplosion, identifyMolecule, resolveMolecularAssembly } from '../simulation/chemistry';
import { renderCanvas } from '../simulation/renderer';

interface CanvasProps {
  timeScale: number;
  isPlaying: boolean;
  onAtomCountChange: (count: number) => void;
  clearTrigger: number;
  spawnRequest: { z: number; isoIndex: number; id: number; x?: number; y?: number } | null;
  moleculeRequest: { molecule: Molecule; id: number } | null;
  showBonds: boolean;
  viewMode: 'solid' | 'glass';
  activeTool: ToolType;
  activeEntity: { element: ElementData, isotopeIndex: number } | null;
}

/**
 * Canvas Component
 * 
 * The visual and physical heart of the application.
 */
const Canvas: React.FC<CanvasProps> = ({
  timeScale,
  isPlaying,
  clearTrigger,
  spawnRequest,
  moleculeRequest,
  showBonds,
  viewMode,
  activeTool,
  activeEntity
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Mutable state (Physics World)
  const atomsRef = useRef<Atom[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  
  // Ref to track start position of drag for shooting particles/atoms
  const dragStartRef = useRef<{x: number, y: number} | null>(null);

  const mouseRef = useRef<MouseState>({ 
      x: 0, y: 0, // Logical screen coordinates relative to center
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
      autoRotate: null,
      floatingLabels: [] // Init floating labels
  });
  const rafRef = useRef<number>(0);

  // --- MATH HELPERS ---

  // Projection Helper (World -> Screen)
  const project = useCallback((x: number, y: number, z: number, worldW: number, worldH: number) => {
      const cx = worldW / 2;
      const cy = worldH / 2;
      const ZOOM = 1 / WORLD_SCALE;
      const fixedPitch = 0.15;
      const cosP = Math.cos(fixedPitch);
      const sinP = Math.sin(fixedPitch);

      // Translate to center relative
      const dx = x - cx;
      const dy = y - cy;
      const dz = z;

      // Rotate (Pitch)
      const ry_p = dy * cosP - dz * sinP;
      const rz_p = dy * sinP + dz * cosP;

      // Project
      const fov = 1600;
      const depthSafe = Math.min(fov - 100, rz_p * ZOOM); 
      const pScale = fov / (fov - depthSafe);

      const screenX = dx * ZOOM * pScale;
      const screenY = ry_p * ZOOM * pScale;

      return { x: screenX, y: screenY, scale: pScale * ZOOM, depth: depthSafe };
  }, []);

  // Exact Unprojection for Spawning only (Screen -> World @ Z=0)
  const unprojectZ0 = useCallback((sx: number, sy: number, worldW: number, worldH: number) => {
      const cx = worldW / 2;
      const cy = worldH / 2;
      const ZOOM = 1 / WORLD_SCALE;
      
      const factor = 1.0; 
      return { x: cx + sx * WORLD_SCALE, y: cy + sy * WORLD_SCALE * factor };
  }, []);

  // --- LIFECYCLE: RESIZE & INIT ---

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

      window.addEventListener('resize', handleResize);
      handleResize(); 

      return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (clearTrigger > 0) {
      atomsRef.current = [];
      particlesRef.current = [];
      mouseRef.current.moleculeTarget = null;
      mouseRef.current.moleculeHaloLife = 0;
      mouseRef.current.floatingLabels = [];
    }
  }, [clearTrigger]);

  const spawnAtom = useCallback((x: number, y: number, z: number, zNum: number, isoIdx: number) => {
    const elem = ELEMENTS.find(e => e.z === zNum);
    if (!elem) return null;
    const iso = elem.iso[isoIdx] || elem.iso[0];
    
    const radius = 30 + Math.pow(iso.m, 0.33) * 10;

    const newAtom: Atom = {
      id: Math.random().toString(36).substr(2, 9),
      x: x,
      y: y,
      z: z,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      vz: (Math.random() - 0.5) * 0.5,
      fx: 0,
      fy: 0,
      fz: 0,
      element: elem,
      isotopeIndex: isoIdx,
      bonds: [],
      mass: iso.m,
      radius: radius,
      lastDecayCheck: Date.now()
    };
    atomsRef.current.push(newAtom);
    return newAtom;
  }, []);

  useEffect(() => {
    if (spawnRequest && canvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const width = canvasRef.current.width / dpr;
        const height = canvasRef.current.height / dpr;
        
        const worldW = width * WORLD_SCALE;
        const worldH = height * WORLD_SCALE;
        const cx = worldW / 2;
        const cy = worldH / 2;

        let spawnX, spawnY, spawnZ = 0;

        if (spawnRequest.x !== undefined && spawnRequest.y !== undefined) {
             const rect = canvasRef.current.getBoundingClientRect();
             const sx = spawnRequest.x - rect.left;
             const sy = spawnRequest.y - rect.top;
             
             const screenRelX = sx - (width / 2);
             const screenRelY = sy - (height / 2);
             
             const worldPos = unprojectZ0(screenRelX, screenRelY, worldW, worldH);
             spawnX = worldPos.x;
             spawnY = worldPos.y;

        } else {
             spawnX = cx + (Math.random() - 0.5) * 400;
             spawnY = cy + (Math.random() - 0.5) * 400;
             spawnZ = (Math.random() - 0.5) * 400;
        }
        spawnAtom(spawnX, spawnY, spawnZ, spawnRequest.z, spawnRequest.isoIndex);
    }
  }, [spawnRequest, spawnAtom, unprojectZ0]);

  useEffect(() => {
      if (moleculeRequest && canvasRef.current) {
          const dpr = window.devicePixelRatio || 1;
          const width = canvasRef.current.width / dpr;
          const height = canvasRef.current.height / dpr;
          const cx = (width * WORLD_SCALE) / 2;
          const cy = (height * WORLD_SCALE) / 2;
          
          const mol = moleculeRequest.molecule;
          const newAtoms: Atom[] = [];

          // --- SPAWN INGREDIENT CLOUD ---
          // Spawn raw ingredients and let the Bonding Loop (Gravity Well) crunch them.
          
          mol.ingredients.forEach(ing => {
              const el = ELEMENTS.find(e => e.z === ing.z);
              const isoIndex = el ? el.iso.findIndex(iso => iso.hl === 'stable') : 0;
              const validIso = isoIndex === -1 ? 0 : isoIndex;

              for (let i = 0; i < ing.count; i++) {
                  const r = 300; // Scatter radius
                  const theta = Math.random() * Math.PI * 2;
                  const phi = Math.random() * Math.PI;
                  const x = cx + r * Math.sin(phi) * Math.cos(theta);
                  const y = cy + r * Math.sin(phi) * Math.sin(theta);
                  const z = (Math.random() - 0.5) * 300; 
                  
                  const atom = spawnAtom(x, y, z, ing.z, validIso);
                  if (atom) newAtoms.push(atom);
              }
          });

          if (newAtoms.length > 0) {
              // Initiate the Bonding Circle
              mouseRef.current.moleculeTarget = {
                 ids: newAtoms.map(a => a.id),
                 cx,
                 cy,
                 startRadius: 600, 
                 visualOnly: false
              };
              // Give it enough time to compress (1.5 seconds)
              mouseRef.current.moleculeHaloLife = 90;
              mouseRef.current.moleculeHaloMaxLife = 90;
          }
      }
  }, [moleculeRequest, spawnAtom]);


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

    const mouseDx = mouseRef.current.x - mouseRef.current.lastX;
    const mouseDy = mouseRef.current.y - mouseRef.current.lastY;
    mouseRef.current.lastX = mouseRef.current.x;
    mouseRef.current.lastY = mouseRef.current.y;
    mouseRef.current.vx = mouseRef.current.vx * 0.5 + mouseDx * 0.5;
    mouseRef.current.vy = mouseRef.current.vy * 0.5 + mouseDy * 0.5;

    if (isPlaying) {
      // Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx; p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) particlesRef.current.splice(i, 1);
      }
      
      // Floating Labels Lifecycle
      for (let i = mouseRef.current.floatingLabels.length - 1; i >= 0; i--) {
          const l = mouseRef.current.floatingLabels[i];
          l.life -= 1;
          if (l.life <= 0) {
              mouseRef.current.floatingLabels.splice(i, 1);
          }
      }

      processDecay(atomsRef.current, particlesRef.current, 0.016 * timeScale);

      // Drag Group Identification Refresh
      if (mouseRef.current.isDown && mouseRef.current.dragId && mouseRef.current.dragGroup.size === 0) {
          const exists = atomsRef.current.some(a => a.id === mouseRef.current.dragId);
          if (!exists) {
              mouseRef.current.dragId = null;
              mouseRef.current.isDown = false;
          } else {
              mouseRef.current.dragGroup = getMoleculeGroup(atomsRef.current, mouseRef.current.dragId);
          }
      }

      // --- AUTO ROTATION ---
      if (mouseRef.current.isDown && mouseRef.current.dragId && mouseRef.current.autoRotate) {
          const ar = mouseRef.current.autoRotate;
          if (ar.active && ar.currentFrame < ar.duration) {
              ar.currentFrame++;
              
              const progress = ar.currentFrame / ar.duration;
              const ease = 1 - Math.pow(1 - progress, 3);
              const prevEase = 1 - Math.pow(1 - (progress - (1/ar.duration)), 3);
              const stepFraction = ease - prevEase; 
              
              const stepAngle = ar.totalAngle * stepFraction;

              const leader = atomsRef.current.find(a => a.id === mouseRef.current.dragId);
              if (leader) {
                   const cos = Math.cos(stepAngle);
                   const sin = Math.sin(stepAngle);
                   const ux = ar.axis.x;
                   const uy = ar.axis.y;
                   const uz = ar.axis.z;

                   mouseRef.current.dragGroup.forEach(id => {
                       const a = atomsRef.current.find(at => at.id === id);
                       if (a) {
                           const dx = a.x - leader.x;
                           const dy = a.y - leader.y;
                           const dz = a.z - leader.z;

                           const dot = ux*dx + uy*dy + uz*dz;
                           const crossX = uy*dz - uz*dy;
                           const crossY = uz*dx - ux*dz;
                           const crossZ = ux*dy - uy*dx;

                           a.x = leader.x + dx*cos + crossX*sin + ux*dot*(1-cos);
                           a.y = leader.y + dy*cos + crossY*sin + uy*dot*(1-cos);
                           a.z = leader.z + dz*cos + crossZ*sin + uz*dot*(1-cos);
                       }
                   });

                   mouseRef.current.dragGroup.forEach(id => {
                       const follower = atomsRef.current.find(a => a.id === id);
                       if (follower && leader) {
                           mouseRef.current.dragOffsets.set(id, {
                               x: follower.x - leader.x,
                               y: follower.y - leader.y,
                               z: follower.z - leader.z
                           });
                       }
                   });
              }
          }
      }

      // --- MOLECULE PLANE CORRECTION ---
      const processedGroups = new Set<string>();
      const atomList = atomsRef.current; 
      for (const atom of atomList) {
          if (!atom || processedGroups.has(atom.id)) continue;
          
          const group = getMoleculeGroup(atomList, atom.id);
          let sumZ = 0;
          let count = 0;
          const groupAtoms: Atom[] = [];
          
          group.forEach(id => {
              processedGroups.add(id);
              const a = atomList.find(at => at.id === id);
              if (a) {
                  sumZ += a.z;
                  count++;
                  groupAtoms.push(a);
              }
          });
          
          if (count > 0 && !mouseRef.current.dragGroup.has(atom.id)) {
              const avgZ = sumZ / count;
              const k = 0.02; 
              groupAtoms.forEach(a => {
                  a.vz -= avgZ * k;
              });
          }
      }

      // --- PHYSICS LOOP ---
      for (let step = 0; step < SUBSTEPS; step++) {
          
          const protectionSet = (mouseRef.current.moleculeTarget && mouseRef.current.moleculeHaloLife > 0) 
              ? new Set(mouseRef.current.moleculeTarget.ids) 
              : null;

          // 1. Anneal (Topology Changes)
          // Discrete logic that may break bonds or shift velocities slightly for momentum conservation
          annealAtoms(atomsRef.current, mouseRef.current, protectionSet);

          // 2. Reset Accumulators
          atomsRef.current.forEach(a => {
              a.fx = 0;
              a.fy = 0;
              a.fz = 0;
          });

          // 3. Accumulate Forces
          // VSEPR: Adds to a.fx, a.fy, a.fz
          applyVSEPR(atomsRef.current, mouseRef.current.dragGroup);
          
          // Interactions: Electrostatics, Pauli, Bonds
          // Adds to a.fx, a.fy, a.fz
          resolveInteractions(atomsRef.current, particlesRef.current, mouseRef.current, protectionSet);

          // 4. Gravity Well / Bonding Circle Force
          if (mouseRef.current.moleculeTarget && mouseRef.current.moleculeHaloLife > 0) {
              const { ids, cx, cy } = mouseRef.current.moleculeTarget;
              
              if (!mouseRef.current.moleculeTarget.visualOnly) {
                  // Calculate Shrinking Radius
                  const lifeRatio = mouseRef.current.moleculeHaloLife / mouseRef.current.moleculeHaloMaxLife;
                  // Radius shrinks from startRadius down to 100px
                  const startR = mouseRef.current.moleculeTarget.startRadius || 500;
                  const currentBoundary = 100 + (startR - 100) * lifeRatio;

                  const idsSet = new Set(ids);
                  
                  // Phase 1: Inescapable Trap (The Piston)
                  ids.forEach(id => {
                     const a = atomsRef.current.find(at => at.id === id);
                     if (a) {
                         const dx = a.x - cx;
                         const dy = a.y - cy;
                         const dz = a.z; 
                         const distSq = dx*dx + dy*dy + dz*dz;
                         const dist = Math.sqrt(distSq) || 1;

                         // Hard Shell Constraint (The Wall)
                         // Pushes atoms inward if they hit the boundary
                         if (dist > currentBoundary) {
                             // Bounce back hard
                             const normalX = dx / dist;
                             const normalY = dy / dist;
                             const normalZ = dz / dist;
                             
                             // Position Snap
                             a.x = cx + normalX * (currentBoundary - 1);
                             a.y = cy + normalY * (currentBoundary - 1);
                             a.z = normalZ * (currentBoundary - 1); // Relative to z=0 center

                             // Velocity Reflection with Damping
                             const dot = a.vx*normalX + a.vy*normalY + a.vz*normalZ;
                             if (dot > 0) { // Moving outwards
                                 a.vx -= 1.5 * dot * normalX;
                                 a.vy -= 1.5 * dot * normalY;
                                 a.vz -= 1.5 * dot * normalZ;
                             }
                         }
                         
                         // Friction inside the trap to cool down superheated atoms
                         a.vx *= 0.95; a.vy *= 0.95; a.vz *= 0.95; 
                     }
                  });
                  
                  // Phase 2: Final Resolution (When trap is smallest or time is up)
                  // Use stricter threshold to ensure it happens at the very end
                  if (mouseRef.current.moleculeHaloLife <= (2 / SUBSTEPS)) {
                       resolveMolecularAssembly(atomsRef.current, mouseRef.current.floatingLabels, idsSet, particlesRef.current);
                       // Force end of lifecycle immediately to prevent re-triggering
                       mouseRef.current.moleculeHaloLife = 0;
                  }
              }
              mouseRef.current.moleculeHaloLife -= (1 / SUBSTEPS);
          }

          // 5. Mouse Drag Force (Spring Constraint)
          if (mouseRef.current.isDown && mouseRef.current.dragId && mouseRef.current.dragGroup.size > 0) {
             const leader = atomsRef.current.find(a => a.id === mouseRef.current.dragId);
             if (leader && mouseRef.current.dragAnchor) {
                 const proj = project(leader.x, leader.y, leader.z, worldW, worldH);
                 const targetScreenX = mouseRef.current.x + mouseRef.current.dragAnchor.x;
                 const targetScreenY = mouseRef.current.y + mouseRef.current.dragAnchor.y;
                 const diffScreenX = targetScreenX - proj.x;
                 const diffScreenY = targetScreenY - proj.y;
                 const diffWorldX = diffScreenX / proj.scale;
                 const diffWorldY = diffScreenY / proj.scale;

                 const k = MOUSE_SPRING_STIFFNESS;
                 const c = MOUSE_SPRING_DAMPING;

                 // Calculate average velocity for damping and Z-Plane correction
                 let avgVx = 0, avgVy = 0, avgVz = 0;
                 let avgZ = 0;
                 let count = 0;
                 
                 mouseRef.current.dragGroup.forEach(id => {
                     const a = atomsRef.current.find(at => at.id === id);
                     if (a) {
                         avgVx += a.vx; avgVy += a.vy; avgVz += a.vz;
                         avgZ += a.z;
                         count++;
                     }
                 });
                 if (count > 0) { 
                    avgVx /= count; avgVy /= count; avgVz /= count; 
                    avgZ /= count;
                 }

                 const springFx = diffWorldX * k - avgVx * c;
                 const springFy = diffWorldY * k - avgVy * c;
                 
                 // Z-Constraint: Pull Center of Mass of dragged molecule towards Z=0
                 const springFz = (0 - avgZ) * k - avgVz * c;

                 // Apply to all atoms in drag group
                 mouseRef.current.dragGroup.forEach(id => {
                     const a = atomsRef.current.find(at => at.id === id);
                     if (a) {
                         a.fx += springFx * a.mass; // F = ma
                         a.fy += springFy * a.mass;
                         a.fz += springFz * a.mass;
                     }
                 });
             }
          }

          // 6. Integrate (Symplectic Euler)
          const atomCount = atomsRef.current.length;
          for (let i = 0; i < atomCount; i++) {
              const a = atomsRef.current[i];
              if (!a) continue;

              // F = ma -> a = F/m
              a.vx += a.fx / a.mass;
              a.vy += a.fy / a.mass;
              a.vz += a.fz / a.mass;

              // Apply Drag
              // Thermal Stabilization Logic:
              // If the atom is cooling down (after synthesis), apply heavy drag to prevent snapping.
              // But ensure decay is fast so it doesn't feel like a pause.
              let drag = (a.element.z <= 0 || a.charge) ? 0.998 : DRAG_COEFF;
              
              if ((a.cooldown || 0) > 0) {
                  drag = 0.8; // High damping prevents initial jitter
                  a.cooldown = (a.cooldown || 0) - 0.005; // Gentle decay (approx 0.4s)
              }

              a.vx *= drag;
              a.vy *= drag;
              a.vz *= drag;

              // Z-Bounds Soft Constraint
              if (Math.abs(a.z) > Z_BOUNDS) {
                  // Apply directly to velocity for soft bounce effect
                  a.vz -= Math.sign(a.z) * (Math.abs(a.z) - Z_BOUNDS) * Z_SPRING;
                  a.vz *= 0.9;
              }

              // Speed Limit
              const speedSq = a.vx*a.vx + a.vy*a.vy + a.vz*a.vz;
              if (speedSq > MAX_SPEED*MAX_SPEED) {
                  const scale = MAX_SPEED / Math.sqrt(speedSq);
                  a.vx *= scale; a.vy *= scale; a.vz *= scale;
              }

              // Update Position
              a.x += a.vx;
              a.y += a.vy;
              a.z += a.vz;

              // Wall Bouncing
              const restitution = 0.5;
              if (a.x < a.radius) { a.x = a.radius; a.vx = Math.abs(a.vx) * restitution; }
              else if (a.x > worldW - a.radius) { a.x = worldW - a.radius; a.vx = -Math.abs(a.vx) * restitution; }
              if (a.y < a.radius) { a.y = a.radius; a.vy = Math.abs(a.vy) * restitution; }
              else if (a.y > worldH - a.radius) { a.y = worldH - a.radius; a.vy = -Math.abs(a.vy) * restitution; }
          }
          
          // Rigid Body Correction for Dragging
          if (mouseRef.current.dragId && mouseRef.current.dragOffsets.size > 0) {
              const leader = atomsRef.current.find(a => a.id === mouseRef.current.dragId);
              if (leader) {
                  mouseRef.current.dragGroup.forEach(id => {
                      if (id === leader.id) return;
                      const a = atomsRef.current.find(at => at.id === id);
                      const offset = mouseRef.current.dragOffsets.get(id);
                      if (a && offset) {
                          a.x = leader.x + offset.x;
                          a.y = leader.y + offset.y;
                          a.z = leader.z + offset.z;
                      }
                  });
              }
          }
      }
      if (mouseRef.current.moleculeHaloLife <= 0) mouseRef.current.moleculeTarget = null;
    }

    renderCanvas(ctx, atomsRef.current, particlesRef.current, mouseRef.current, width, height, dpr, showBonds, viewMode);
    
    // --- DRAW PLACEMENT/SLINGSHOT LINE ---
    if (activeTool !== 'lasso' && dragStartRef.current) {
        ctx.save();
        ctx.scale(dpr, dpr);
        const {x: cx, y: cy} = {x: width/2, y: height/2}; // screen center
        
        const startX = cx + dragStartRef.current.x;
        const startY = cy + dragStartRef.current.y;
        
        const currX = cx + mouseRef.current.x;
        const currY = cy + mouseRef.current.y;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(currX, currY);
        
        ctx.lineWidth = 2;
        // Use color of active entity if available, otherwise fallback
        const color = activeEntity ? activeEntity.element.c : '#CCCCCC';
        ctx.strokeStyle = color;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        
        ctx.restore();
    }

    rafRef.current = requestAnimationFrame(update);
  }, [isPlaying, timeScale, showBonds, project, viewMode, activeTool, activeEntity]);

  // --- HANDLERS ---

  useEffect(() => {
    rafRef.current = requestAnimationFrame(update);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }
  }, [update]);

  const handleWheel = (e: React.WheelEvent) => {
      const dTheta = e.deltaY * 0.002;
      const cos = Math.cos(dTheta);
      const sin = Math.sin(dTheta);
      const visited = new Set<string>();

      atomsRef.current.forEach(atom => {
          if (!atom || visited.has(atom.id)) return;
          const groupIds = getMoleculeGroup(atomsRef.current, atom.id);
          const groupAtoms: Atom[] = [];
          let sumY = 0, sumZ = 0;
          
          groupIds.forEach(id => {
              visited.add(id);
              const a = atomsRef.current.find(at => at.id === id);
              if (a) {
                  groupAtoms.push(a);
                  sumY += a.y;
                  sumZ += a.z;
              }
          });

          const cy = sumY / groupAtoms.length;
          const cz = sumZ / groupAtoms.length;

          groupAtoms.forEach(a => {
              const dy = a.y - cy;
              const dz = a.z - cz;
              a.y = cy + (dy * cos - dz * sin);
              a.z = cz + (dy * sin + dz * cos);

              const vy = a.vy;
              const vz = a.vz;
              a.vy = vy * cos - vz * sin;
              a.vz = vy * sin + vz * cos;
          });
      });
      
      if (mouseRef.current.dragId && mouseRef.current.dragGroup.size > 0) {
          const leader = atomsRef.current.find(a => a.id === mouseRef.current.dragId);
          if (leader) {
               mouseRef.current.dragGroup.forEach(id => {
                   const follower = atomsRef.current.find(a => a.id === id);
                   if (follower) {
                       mouseRef.current.dragOffsets.set(id, {
                           x: follower.x - leader.x,
                           y: follower.y - leader.y,
                           z: follower.z - leader.z
                       });
                   }
               });
          }
      }
  };

  const getPointerLogicalPos = (e: React.PointerEvent | React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = canvasRef.current.width / dpr;
    const height = canvasRef.current.height / dpr;
    
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    return { 
        x: sx - (width / 2), 
        y: sy - (height / 2),
        absoluteX: sx,
        absoluteY: sy
    };
  }

  const handlePointerDown = (e: React.PointerEvent) => {
      e.preventDefault();
      const pos = getPointerLogicalPos(e);
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const worldW = width * WORLD_SCALE;
      const worldH = height * WORLD_SCALE;
      const cx = worldW / 2;
      const cy = worldH / 2;

      mouseRef.current.x = pos.x; 
      mouseRef.current.y = pos.y;
      mouseRef.current.lastX = pos.x;
      mouseRef.current.lastY = pos.y;

      (e.target as Element).setPointerCapture(e.pointerId);

      // --- PLACEMENT TOOL LOGIC (Particles & Atoms) ---
      if (activeTool !== 'lasso' && activeEntity) {
          dragStartRef.current = { x: pos.x, y: pos.y };
          return;
      }

      // --- STANDARD LASSO LOGIC ---

      const ZOOM = 1 / WORLD_SCALE;

      const candidates = atomsRef.current.map(a => {
          if (!a) return null;
          const dx = a.x - cx;
          const dy = a.y - cy;
          const dz = a.z;

          const fixedPitch = 0.15; 
          const cosP = Math.cos(fixedPitch);
          const sinP = Math.sin(fixedPitch);
          
          const ry_p = dy * cosP - dz * sinP;
          const rz_p = dy * sinP + dz * cosP;

          const fov = 1600;
          const pScale = fov / (fov - rz_p * ZOOM); 

          const screenX = dx * ZOOM * pScale;
          const screenY = ry_p * ZOOM * pScale;
          const screenR = a.radius * ZOOM * pScale;

          const dist = Math.sqrt(Math.pow(screenX - pos.x, 2) + Math.pow(screenY - pos.y, 2));
          return { atom: a, dist, r: screenR, depth: rz_p, screenX, screenY };
      }).filter((c): c is NonNullable<typeof c> => c !== null && c.dist < Math.max(10, c.r * 1.5));

      candidates.sort((a, b) => a.depth - b.depth);

      if (candidates.length > 0) {
          const target = candidates[0].atom;
          mouseRef.current.isDown = true;
          mouseRef.current.dragId = target.id;
          mouseRef.current.vx = 0;
          mouseRef.current.vy = 0;
          
          mouseRef.current.dragAnchor = {
              x: candidates[0].screenX - pos.x,
              y: candidates[0].screenY - pos.y
          };
          
          mouseRef.current.dragGroup = getMoleculeGroup(atomsRef.current, target.id);
          const groupAtoms = atomsRef.current.filter(a => mouseRef.current.dragGroup.has(a.id));
          mouseRef.current.dragName = identifyMolecule(groupAtoms);
          
          mouseRef.current.dragOffsets.clear();
          const leader = atomsRef.current.find(a => a.id === target.id);
          if (leader) {
               mouseRef.current.dragGroup.forEach(id => {
                   const follower = atomsRef.current.find(a => a.id === id);
                   if (follower) {
                       mouseRef.current.dragOffsets.set(id, {
                           x: follower.x - leader.x,
                           y: follower.y - leader.y,
                           z: follower.z - leader.z
                       });
                   }
               });
          }

          const rotationData = calculateOptimalRotation(atomsRef.current, mouseRef.current.dragGroup);
          if (rotationData) {
              mouseRef.current.autoRotate = {
                  active: true,
                  axis: rotationData.axis,
                  totalAngle: rotationData.angle,
                  currentFrame: 0,
                  duration: 60 
              };
          } else {
              mouseRef.current.autoRotate = null;
          }
          
      } else {
          mouseRef.current.isLassoing = true;
          mouseRef.current.lassoPoints = [{x: pos.absoluteX, y: pos.absoluteY}];
      }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      e.preventDefault();
      const pos = getPointerLogicalPos(e);
      mouseRef.current.x = pos.x;
      mouseRef.current.y = pos.y;

      if (mouseRef.current.isLassoing) {
          mouseRef.current.lassoPoints.push({x: pos.absoluteX, y: pos.absoluteY});
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      e.preventDefault();
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const worldW = width * WORLD_SCALE;
      const worldH = height * WORLD_SCALE;

      // --- PLACEMENT TOOL FIRE (Unified for Particles & Atoms) ---
      if (activeTool !== 'lasso' && dragStartRef.current && activeEntity) {
          const start = dragStartRef.current;
          const end = { x: mouseRef.current.x, y: mouseRef.current.y };
          
          const dx = start.x - end.x;
          const dy = start.y - end.y;
          const dragDistSq = dx*dx + dy*dy;
          
          const worldPos = unprojectZ0(start.x, start.y, worldW, worldH);
          const power = 0.15; 
          
          const element = activeEntity.element;
          
          let charge = 0;
          let mass = activeEntity.element.iso[activeEntity.isotopeIndex]?.m || element.iso[0].m;
          let radius = 30 + Math.pow(mass, 0.33) * 10;
          
          // Specific Logic for Particles
          if (element.z === -1) { // Electron
              charge = -1;
              mass = 0.02; 
              radius = 30; 
          } else if (element.z === 1 && element.s === 'p⁺') { // Proton
              charge = 1;
              mass = 1.007;
              radius = 20;
          } else if (element.z === 0) { // Neutron
              radius = 20;
          }

          // Velocity Logic
          // If click (no drag), use 0 or random drift. 
          // If drag, use vector.
          let finalVx = dx * power;
          let finalVy = dy * power;
          
          if (dragDistSq < 100) { // Considered a "Click" (<10px drag)
              // Give it a tiny drift so it doesn't freeze in space if physics is calm
              finalVx = (Math.random() - 0.5) * 0.5;
              finalVy = (Math.random() - 0.5) * 0.5;
          }

          const p: Atom = {
              id: Math.random().toString(36),
              x: worldPos.x,
              y: worldPos.y,
              z: 0,
              vx: finalVx,
              vy: finalVy,
              vz: (Math.random() - 0.5) * 0.5,
              fx: 0,
              fy: 0,
              fz: 0,
              element: element,
              isotopeIndex: activeEntity.isotopeIndex,
              bonds: [],
              mass: mass,
              radius: radius,
              charge: charge,
              lastDecayCheck: Date.now()
          };
          
          atomsRef.current.push(p);
          dragStartRef.current = null;
          (e.target as Element).releasePointerCapture(e.pointerId);
          return;
      }

      // --- LASSO SELECTION END ---
      if (mouseRef.current.isLassoing) {
          const poly = mouseRef.current.lassoPoints;
          if (poly.length > 2) {
                const ZOOM = 1 / WORLD_SCALE;

                const selectedIds: string[] = [];
                atomsRef.current.forEach(a => {
                    if (!a) return;
                    const dx = a.x - (worldW / 2); 
                    const dy = a.y - (worldH / 2); 
                    const dz = a.z;

                    const fixedPitch = 0.15; 
                    const cosP = Math.cos(fixedPitch);
                    const sinP = Math.sin(fixedPitch);
                    
                    const ry_p = dy * cosP - dz * sinP;
                    const rz_p = dy * sinP + dz * cosP;

                    const fov = 1600;
                    const pScale = fov / (fov - rz_p * ZOOM);
                    
                    const screenX = (width/2) + dx * ZOOM * pScale;
                    const screenY = (height/2) + ry_p * ZOOM * pScale;

                    if (isPointInPolygon({x: screenX, y: screenY}, poly)) {
                        selectedIds.push(a.id);
                    }
                });
                
                if (selectedIds.length > 0) {
                    let sumX = 0;
                    let sumY = 0;
                    poly.forEach(p => {
                        sumX += p.x;
                        sumY += p.y;
                    });
                    const avgX = sumX / poly.length;
                    const avgY = sumY / poly.length;

                    const relX = avgX - (width / 2);
                    const relY = avgY - (height / 2);
                    const targetPos = unprojectZ0(relX, relY, worldW, worldH);

                    // Dynamic Radius Calculation to prevent instant clamping/snapping
                    let maxR = 0;
                    selectedIds.forEach(id => {
                        const a = atomsRef.current.find(at => at.id === id);
                        if (a) {
                            const dx = a.x - targetPos.x;
                            const dy = a.y - targetPos.y;
                            // Include Z in the containment radius check
                            const d = Math.sqrt(dx*dx + dy*dy + a.z*a.z);
                            if (d > maxR) maxR = d;
                        }
                    });

                    // Start slightly larger than the furthest atom to prevent instant snap
                    const safeRadius = Math.max(maxR + 50, 400);

                    // TRIGGER BONDING CIRCLE
                    mouseRef.current.moleculeTarget = {
                        ids: selectedIds,
                        cx: targetPos.x,
                        cy: targetPos.y,
                        startRadius: safeRadius,
                        visualOnly: false
                    };
                    // Longer duration for Lasso crunch to allow atoms to travel
                    mouseRef.current.moleculeHaloLife = 90;
                    mouseRef.current.moleculeHaloMaxLife = 90;
                }
          }
      }

      // --- DRAG RELEASE ---
      if (mouseRef.current.dragGroup.size > 0) {
           const flingVx = (mouseRef.current.vx * WORLD_SCALE) / SUBSTEPS;
           const flingVy = (mouseRef.current.vy * WORLD_SCALE) / SUBSTEPS;

           mouseRef.current.dragGroup.forEach(id => {
               const a = atomsRef.current.find(at => at.id === id);
               if (a) {
                   a.vx = flingVx;
                   a.vy = flingVy;
               }
           });
           
           if (mouseRef.current.dragName && mouseRef.current.dragId) {
               const sortedIds = Array.from(mouseRef.current.dragGroup).sort().join('-');
               mouseRef.current.floatingLabels.push({
                   id: sortedIds,
                   text: mouseRef.current.dragName,
                   targetId: mouseRef.current.dragId, 
                   atomIds: new Set(mouseRef.current.dragGroup), 
                   life: 60, 
                   maxLife: 60,
                   fadeDuration: 60 
               });
           }
      }

      mouseRef.current.isDown = false;
      mouseRef.current.dragId = null;
      mouseRef.current.dragName = null; 
      mouseRef.current.dragAnchor = null;
      mouseRef.current.dragGroup.clear();
      mouseRef.current.dragOffsets.clear();
      mouseRef.current.isLassoing = false;
      mouseRef.current.lassoPoints = [];
      mouseRef.current.autoRotate = null;
      (e.target as Element).releasePointerCapture(e.pointerId);
  };

  return (
    <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        className="w-full h-full touch-none block select-none cursor-crosshair active:cursor-grabbing"
        onContextMenu={(e) => e.preventDefault()}
        style={{ cursor: activeTool === 'lasso' ? 'default' : 'crosshair' }}
    />
  );
};

export default Canvas;
