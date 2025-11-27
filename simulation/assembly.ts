
import { Atom, Particle } from '../types';
import { MouseState } from './types';
import { ELEMENTS } from '../elements';
import { MOLECULES } from '../molecules';
import { FloatingLabel } from './types';
import { createExplosion } from './effects';
import { attemptFusion } from './nuclear';
import { addBond } from './utils';

/**
 * Force-Directed Graph Layout Solver.
 * Runs a mini-simulation to relax the molecule structure into a valid geometric shape
 * BEFORE spawning it into the main physics world. This prevents high-energy explosions.
 */
function calculateGraphLayout(structure: {atoms: number[], bonds: [number, number, number][]}, cx: number, cy: number, cz: number) {
   const nodeCount = structure.atoms.length;
   
   // Helper to get physics radius for layout calculation
   const getRadius = (z: number) => {
       if (z === 1) return 40; // H approx
       const elem = ELEMENTS.find(e => e.z === z);
       const m = elem ? elem.iso[0].m : z * 2;
       return 30 + Math.pow(m, 0.33) * 10;
   };

   // 1. DETERMINISTIC INITIALIZATION (Volumetric Fibonacci Sphere)
   // Replaces random spread to prevent initial overlaps/singularities.
   // Places atoms in a spherical pattern to avoid 2D flattening artifacts.
   const nodes = structure.atoms.map((z, i) => {
       // Fibonacci Sphere distribution for more uniform 3D coverage
       const offset = 2 / nodeCount;
       const increment = Math.PI * (3 - Math.sqrt(5));
       
       const y = ((i * offset) - 1) + (offset / 2);
       const r = Math.sqrt(1 - Math.pow(y, 2));
       const phi = ((i + 1) % nodeCount) * increment;
       
       const scale = 90 * Math.pow(nodeCount, 0.33); // Scales with molecule size

       return {
           x: Math.cos(phi) * r * scale,
           y: y * scale,
           z: Math.sin(phi) * r * scale,
           r: getRadius(z)
       };
   });
   
   const velocities = new Array(nodeCount).fill(null).map(() => ({x:0, y:0, z:0}));
   
   // 2. Mini-Physics Simulation (Relaxation)
   const iterations = 2500; // Increased iterations for better convergence
   const kRepulse = 10000; 
   const kSpring = 0.5;   
   const damping = 0.5; 
   const dt = 0.1; 
   
   let maxSpeed = 100; 
   const coolingRate = 0.998;

   for(let iter=0; iter<iterations; iter++) {
       const forces = new Array(nodeCount).fill(null).map(() => ({x:0, y:0, z:0}));

       // Centering Force (Gravity to Origin)
       for(let i=0; i<nodeCount; i++) {
           forces[i].x -= nodes[i].x * 0.02;
           forces[i].y -= nodes[i].y * 0.02;
           forces[i].z -= nodes[i].z * 0.02;
       }

       // Repulsion (All Pairs)
       for(let i=0; i<nodeCount; i++) {
           for(let j=i+1; j<nodeCount; j++) {
               const dx = nodes[j].x - nodes[i].x;
               const dy = nodes[j].y - nodes[i].y;
               const dz = nodes[j].z - nodes[i].z;
               const d2 = dx*dx + dy*dy + dz*dz + 0.1;
               const d = Math.sqrt(d2);
               
               const minDist = (nodes[i].r + nodes[j].r); 
               
               // Interact if close
               if(d < minDist * 2.5) { 
                   let f = kRepulse / d2;
                   f = Math.min(f, 1000); // Stricter cap on repulsion to prevent ejections
                   
                   const fx = (dx/d) * f;
                   const fy = (dy/d) * f;
                   const fz = (dz/d) * f;
                   
                   forces[i].x -= fx; forces[i].y -= fy; forces[i].z -= fz;
                   forces[j].x += fx; forces[j].y += fy; forces[j].z += fz;
               }
           }
       }

       // Spring Attraction (Bonds)
       structure.bonds.forEach(([idxA, idxB, order]) => {
           if(idxA >= nodeCount || idxB >= nodeCount) return;
           const nA = nodes[idxA];
           const nB = nodes[idxB];
           
           const dx = nB.x - nA.x;
           const dy = nB.y - nA.y;
           const dz = nB.z - nA.z;
           const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
           
           const restScale = (0.9 - ((order - 1) * 0.12));
           const idealDist = (nA.r + nB.r) * restScale;
           
           const displacement = dist - idealDist;
           const f = kSpring * displacement;
           
           const fx = (dx/dist) * f;
           const fy = (dy/dist) * f;
           const fz = (dz/dist) * f;
           
           forces[idxA].x += fx; forces[idxA].y += fy; forces[idxA].z += fz;
           forces[idxB].x -= fx; forces[idxB].y -= fy; forces[idxB].z -= fz;
       });

       // Integration (Euler) with Displacement Clamping
       for(let i=0; i<nodeCount; i++) {
           velocities[i].x = (velocities[i].x + forces[i].x * dt) * damping;
           velocities[i].y = (velocities[i].y + forces[i].y * dt) * damping;
           velocities[i].z = (velocities[i].z + forces[i].z * dt) * damping;
           
           // Global Velocity Cap
           const speed = Math.sqrt(velocities[i].x**2 + velocities[i].y**2 + velocities[i].z**2);
           if(speed > maxSpeed) { 
               const scale = maxSpeed/speed;
               velocities[i].x *= scale;
               velocities[i].y *= scale;
               velocities[i].z *= scale;
           }

           // Displacement Cap (Prevent tunneling/teleporting in one frame)
           const MAX_DISP = 5.0;
           const dx = velocities[i].x * dt;
           const dy = velocities[i].y * dt;
           const dz = velocities[i].z * dt;
           
           // Soft Clamp Position Updates
           nodes[i].x += Math.max(-MAX_DISP, Math.min(MAX_DISP, dx));
           nodes[i].y += Math.max(-MAX_DISP, Math.min(MAX_DISP, dy));
           nodes[i].z += Math.max(-MAX_DISP, Math.min(MAX_DISP, dz));
           
           // Boundary check (Keep simulation contained)
           const R_BOUND = 500;
           const rSq = nodes[i].x**2 + nodes[i].y**2 + nodes[i].z**2;
           if (rSq > R_BOUND**2) {
               const r = Math.sqrt(rSq);
               const scale = R_BOUND / r;
               nodes[i].x *= scale;
               nodes[i].y *= scale;
               nodes[i].z *= scale;
               velocities[i].x *= 0.5; // Dampen on wall hit
               velocities[i].y *= 0.5;
               velocities[i].z *= 0.5;
           }
       }
       maxSpeed *= coolingRate;
   }

   // 3. Re-center & Sanitize
   let avgX = 0, avgY = 0, avgZ = 0;
   nodes.forEach(p => { avgX += p.x; avgY += p.y; avgZ += p.z; });
   avgX /= nodeCount; avgY /= nodeCount; avgZ /= nodeCount;

   const result = nodes.map(p => ({
       x: cx + (p.x - avgX),
       y: cy + (p.y - avgY),
       z: cz + (p.z - avgZ)
   }));

   // --- FINAL SAFETY PASS ---
   if (result.some(p => !isFinite(p.x) || !isFinite(p.y) || !isFinite(p.z))) {
        const step = (Math.PI * 2) / nodeCount;
        return result.map((_, i) => ({
            x: cx + Math.cos(step * i) * 50,
            y: cy + Math.sin(step * i) * 50,
            z: cz
        }));
   }

   return result;
}

/**
 * The "Super Crunch" / Synthesis Resolver.
 */
export const resolveMolecularAssembly = (atoms: Atom[], floatingLabels: FloatingLabel[], subset: Set<string>, particles: Particle[], mouse?: MouseState) => {
    const group = atoms.filter(a => subset.has(a.id));
    if (group.length === 0) return;

    // Calculate Center of Mass - Robust
    let cx = 0, cy = 0, cz = 0;
    let validCount = 0;
    
    group.forEach(a => { 
        if(isFinite(a.x) && isFinite(a.y) && isFinite(a.z)) {
            cx += a.x; 
            cy += a.y; 
            cz += a.z;
            validCount++;
        }
    });
    
    if (validCount > 0) {
        cx /= validCount; 
        cy /= validCount; 
        cz /= validCount;
    } else {
        // If essentially everything is broken, fallback to World Center approx or 0
        cx = 0; cy = 0; cz = 0;
    }

    const availableIds = new Set(group.map(a => a.id));

    const sortedRecipes = [...MOLECULES].sort((a,b) => 
        b.ingredients.reduce((acc, i) => acc + i.count, 0) - 
        a.ingredients.reduce((acc, i) => acc + i.count, 0)
    );

    for (const recipe of sortedRecipes) {
        const potentialIds: string[] = [];
        let possible = true;

        for (const ing of recipe.ingredients) {
            const matches = group.filter(a => availableIds.has(a.id) && a.element.z === ing.z && !potentialIds.includes(a.id));
            if (matches.length >= ing.count) {
                matches.slice(0, ing.count).forEach(m => potentialIds.push(m.id));
            } else {
                possible = false;
                break;
            }
        }

        if (possible && recipe.structure) {
            potentialIds.forEach(id => availableIds.delete(id));

            for (let i = floatingLabels.length - 1; i >= 0; i--) {
                const label = floatingLabels[i];
                if (potentialIds.some(pid => label.atomIds.has(pid))) {
                    floatingLabels.splice(i, 1);
                }
            }

            potentialIds.forEach(pid => {
                const a = atoms.find(x => x.id === pid);
                if (a) {
                    a.bonds.forEach(neighborId => {
                        const neighbor = atoms.find(x => x.id === neighborId);
                        if (neighbor) {
                            neighbor.bonds = neighbor.bonds.filter(bid => bid !== a.id);
                        }
                    });
                    a.bonds = [];
                }
            });
            
            const assignedAtoms: Atom[] = new Array(recipe.structure.atoms.length);
            const usedInStruct = new Set<string>();

            recipe.structure.atoms.forEach((z, idx) => {
                const candidateId = potentialIds.find(pid => {
                    if (usedInStruct.has(pid)) return false;
                    const a = group.find(g => g.id === pid);
                    return a && a.element.z === z;
                });
                if (candidateId) {
                    usedInStruct.add(candidateId);
                    const a = group.find(g => g.id === candidateId);
                    if(a) assignedAtoms[idx] = a;
                }
            });

            // RUN ROBUST LAYOUT
            const layout = calculateGraphLayout(recipe.structure, cx, cy, cz);
            
            // EXPANSION FACTOR: Start 2.5x larger so they "Crunch" in via bond springs
            const EXPANSION = 2.5;

            assignedAtoms.forEach((a, idx) => {
                if(!a) return;
                const pos = layout[idx];
                
                // Start expanded relative to center
                a.x = cx + (pos.x - cx) * EXPANSION; 
                a.y = cy + (pos.y - cy) * EXPANSION; 
                a.z = cz + (pos.z - cz) * EXPANSION;
                
                a.destination = pos; // Target is the relaxed layout
                a.isAssembling = true;
                a.assemblyTimeOut = 5000; 
                
                // ZERO ALL MOTION
                // Critical for preventing frame 1 explosions
                a.vx = 0; a.vy = 0; a.vz = 0; 
                a.fx = 0; a.fy = 0; a.fz = 0;
                
                a.bonds = []; 
                a.cooldown = 1.0; 
            });

            recipe.structure.bonds.forEach(([iA, iB, order]) => {
                const a = assignedAtoms[iA];
                const b = assignedAtoms[iB];
                if (a && b) {
                    for(let k=0; k<order; k++) addBond(a, b);
                }
            });

            createExplosion(particles, cx, cy, cz, '#00FFFF', 20);
            
            if (mouse) {
                mouse.moleculeTarget = {
                    ids: potentialIds,
                    cx, cy,
                    startRadius: 300,
                    visualOnly: true
                };
                mouse.moleculeHaloLife = 60; // 1 second flash
                mouse.moleculeHaloMaxLife = 60;
            }

            const sortedIds = potentialIds.sort().join('-');
            floatingLabels.push({
               id: sortedIds,
               text: recipe.name,
               targetId: potentialIds[0],
               atomIds: new Set(potentialIds),
               life: 600, // 10 seconds @ 60fps
               maxLife: 600,
               fadeDuration: 60
           });
        }
    }

    if (availableIds.size >= 2) {
        attemptFusion(atoms, particles, availableIds);
    }
};
