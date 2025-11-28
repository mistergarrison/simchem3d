
import { Atom, Particle, Molecule } from '../types';
import { MouseState } from './types';
import { ELEMENTS } from '../elements';
import { MOLECULES } from '../molecules';
import { FloatingLabel } from './types';
import { addBond, debugWarn } from './utils';
import { ForceDirectedLayout } from './algorithms/ForceDirectedLayout';

/**
 * Takes a soup of atoms and tries to form as many valid molecules as possible.
 * Prioritizes complex (large) molecules first.
 * Assigns ejection velocities to separate the resulting groups.
 */
export const resolveMolecularAssembly = (
    atoms: Atom[], 
    floatingLabels: FloatingLabel[], 
    subset: Set<string>, 
    particles: Particle[], 
    mouse?: MouseState,
    forcedCenter?: {x: number, y: number, z: number},
    initialVelocity?: {vx: number, vy: number, vz: number}
) => {
    // 1. Identify atoms
    const group = atoms.filter(a => subset.has(a.id));
    if (group.length === 0) return;

    // 2. Center of Mass
    let cx = 0, cy = 0, cz = 0;
    if (forcedCenter) {
        cx = forcedCenter.x; cy = forcedCenter.y; cz = forcedCenter.z;
    } else {
        group.forEach(a => { cx += a.x; cy += a.y; cz += a.z; });
        cx /= group.length; cy /= group.length; cz /= group.length;
    }

    const results: { type: 'molecule' | 'loose', atoms: Atom[], data?: Molecule }[] = [];
    const availablePool = [...group]; // Array of atoms

    // --- STRATEGY 1: Exact Single-Molecule Match ---
    // If the entire selection perfectly matches one formula, build it directly.
    const groupComposition = new Map<number, number>();
    for (const a of group) {
        groupComposition.set(a.element.z, (groupComposition.get(a.element.z) || 0) + 1);
    }

    const exactMatch = MOLECULES.find(recipe => {
        if (recipe.ingredients.length !== groupComposition.size) return false;
        for (const ing of recipe.ingredients) {
            if (groupComposition.get(ing.z) !== ing.count) return false;
        }
        return true;
    });

    if (exactMatch) {
        results.push({ type: 'molecule', atoms: availablePool, data: exactMatch });
        // Pool is effectively empty now for next steps
    } else {
        // --- STRATEGY 2: Greedy Soup Solver (Fallback) ---
        // Prioritize by iterating MOLECULES in order (assuming standard molecules first)
        for (const recipe of MOLECULES) {
            let keepMaking = true;
            while (keepMaking) {
                // Check if we have ingredients
                const usedIndices: number[] = [];
                let possible = true;

                for (const ing of recipe.ingredients) {
                    let countNeeded = ing.count;
                    // Find atoms in pool that match Z and are not used yet for this instance
                    for (let i = 0; i < availablePool.length; i++) {
                        if (countNeeded === 0) break;
                        if (!usedIndices.includes(i) && availablePool[i].element.z === ing.z) {
                            usedIndices.push(i);
                            countNeeded--;
                        }
                    }
                    if (countNeeded > 0) {
                        possible = false;
                        break;
                    }
                }

                if (possible && usedIndices.length > 0) {
                    // Construct Molecule
                    const componentAtoms = usedIndices.map(idx => availablePool[idx]);
                    // Remove from pool
                    const compIds = new Set(componentAtoms.map(a => a.id));
                    for(let i = availablePool.length - 1; i >= 0; i--) {
                        if (compIds.has(availablePool[i].id)) {
                            availablePool.splice(i, 1);
                        }
                    }

                    results.push({ type: 'molecule', atoms: componentAtoms, data: recipe });
                } else {
                    keepMaking = false;
                }
            }
        }

        // Leftovers
        availablePool.forEach(a => {
            results.push({ type: 'loose', atoms: [a] });
        });
    }

    // 4. Ejection & Layout
    const n = results.length;
    const angleStep = (Math.PI * 2) / Math.max(1, n);
    
    // Rule 1: Single molecule stays put (speed 0). Multiple molecules eject (speed 25).
    const speed = n > 1 ? 25 : 0; 
    
    // Rule 2: Random initial angle to prevent deterministic directionality
    const startAngle = Math.random() * Math.PI * 2;

    results.forEach((res, i) => {
        const angle = startAngle + i * angleStep;
        let evx = Math.cos(angle) * speed;
        let evy = Math.sin(angle) * speed;
        let evz = 0;

        // Apply "Throw" velocity if provided (Slingshot effect)
        if (initialVelocity) {
            evx += initialVelocity.vx;
            evy += initialVelocity.vy;
            evz += initialVelocity.vz;
        }

        const groupId = Math.floor(Math.random() * 10000000);

        // Reset State
        res.atoms.forEach(a => {
            a.bonds = [];
            // HOLD PHASE: Start stationary
            a.vx = 0; a.vy = 0; a.vz = 0;
            a.fx = 0; a.fy = 0; a.fz = 0;
            
            // Store ejection velocity for Release Phase
            a.destination = { x: evx, y: evy, z: evz };

            a.isAssembling = true;
            a.assemblyGroupId = groupId;
            a.assemblyTimer = 0;
            a.assemblyTimeOut = 300;
            a.cooldown = 0; // Standard drag on release
            
            // Clear labels
             for (let j = floatingLabels.length - 1; j >= 0; j--) {
                const label = floatingLabels[j];
                if (label.atomIds.has(a.id)) floatingLabels.splice(j, 1);
            }
        });

        if (res.type === 'molecule' && res.data && res.data.structure) {
            // Run Layout
            let offsets: {x:number, y:number, z:number}[] = [];
            try {
                const solver = new ForceDirectedLayout(res.data.structure.atoms, res.data.structure.bonds);
                offsets = solver.solve();
            } catch (e) { offsets = res.atoms.map(() => ({x:0, y:0, z:0})); }

            // Assign positions (Need to match Zs correctly)
            // res.atoms is a bag. res.data.structure.atoms is an ordered list of Zs.
            const assigned = new Array(res.atoms.length).fill(null);
            const pool = [...res.atoms];
            
            res.data.structure.atoms.forEach((z, idx) => {
                const matchIdx = pool.findIndex(a => a.element.z === z);
                if (matchIdx !== -1) {
                    assigned[idx] = pool[matchIdx];
                    pool.splice(matchIdx, 1);
                }
            });

            assigned.forEach((a, idx) => {
                if (a && offsets[idx]) {
                    a.x = cx + offsets[idx].x;
                    a.y = cy + offsets[idx].y;
                    a.z = cz + offsets[idx].z;
                }
            });

            // Rebond
            res.data.structure.bonds.forEach(([iA, iB, order]) => {
                if (assigned[iA] && assigned[iB]) {
                    for(let k=0; k<order; k++) addBond(assigned[iA], assigned[iB]);
                }
            });

            // Label
            floatingLabels.push({
               id: assigned.map(a => a.id).sort().join('-'),
               text: res.data.name,
               targetId: assigned[0].id,
               atomIds: new Set(assigned.map(a => a.id)),
               life: 600, maxLife: 600, fadeDuration: 60
           });

        } else {
            // Loose
            res.atoms.forEach(a => {
                a.x = cx + (Math.random()-0.5)*20;
                a.y = cy + (Math.random()-0.5)*20;
                a.z = cz + (Math.random()-0.5)*20;
                a.isAssembling = false; // Loose atoms don't need assembly mode
                a.assemblyGroupId = undefined;
                
                // If loose, apply velocity immediately as they won't go through handleAssembly
                if (initialVelocity) {
                    a.vx = initialVelocity.vx;
                    a.vy = initialVelocity.vy;
                    a.vz = initialVelocity.vz;
                }
            });
        }
    });

    if (mouse) {
        // Visual Halo for the whole group briefly
        mouse.moleculeTarget = { 
            ids: group.map(a => a.id), 
            cx, cy, 
            startRadius: 100, 
            visualOnly: true 
        };
        mouse.moleculeHaloLife = 45;
        mouse.moleculeHaloMaxLife = 45;
    }
};
