
import { Atom, Particle, Molecule } from '../types';
import { MouseState } from './types';
import { ELEMENTS } from '../elements';
import { MOLECULES } from '../molecules';
import { FloatingLabel } from './types';
import { addBond, debugWarn } from './utils';
import { ForceDirectedLayout } from './algorithms/ForceDirectedLayout';

export const resolveMolecularAssembly = (
    atoms: Atom[], 
    floatingLabels: FloatingLabel[], 
    subset: Set<string>, 
    particles: Particle[], 
    mouse?: MouseState,
    forcedCenter?: {x: number, y: number, z: number}
) => {
    debugWarn(`[Assembly] resolveMolecularAssembly triggered for ${subset.size} atoms.`);
    
    const group = atoms.filter(a => subset.has(a.id));
    if (group.length === 0) return;

    let cx = 0, cy = 0, cz = 0;
    
    if (forcedCenter) {
        if (isFinite(forcedCenter.x) && isFinite(forcedCenter.y)) {
            cx = forcedCenter.x; cy = forcedCenter.y; cz = forcedCenter.z;
        }
    } else {
        let validCount = 0;
        group.forEach(a => { 
            if(isFinite(a.x) && isFinite(a.y) && isFinite(a.z)) {
                cx += a.x; cy += a.y; cz += a.z;
                validCount++;
            }
        });
        if (validCount > 0) { cx /= validCount; cy /= validCount; cz /= validCount; }
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
            debugWarn(`[Assembly] Matched recipe: ${recipe.name}`);
            
            // 1. Calculate Ideal Topology Layout
            let idealPositions: {x: number, y: number, z: number}[] = [];
            try {
                const layoutSolver = new ForceDirectedLayout(recipe.structure.atoms, recipe.structure.bonds);
                idealPositions = layoutSolver.solve();
                // Approximate bounding box width for logging
                const xs = idealPositions.map(p => p.x);
                const width = Math.max(...xs) - Math.min(...xs);
                debugWarn(`[Layout] Solved width: ${width.toFixed(1)}px`);
            } catch (e) {
                console.error(`[Assembly] Layout solver crashed for ${recipe.name}. Using zero-fallback.`, e);
                idealPositions = recipe.structure.atoms.map(() => ({x: 0, y: 0, z: 0}));
            }
            
            // 2. Greedy Spatial Assignment
            debugWarn(`[Assembly] Assigning ${group.length} atoms to ${recipe.name} structure.`);
            const assignedAtoms: (Atom | null)[] = new Array(recipe.structure.atoms.length).fill(null);
            const usedInStruct = new Set<string>();
            const candidates = group.filter(a => potentialIds.includes(a.id));
            
            recipe.structure.atoms.forEach((requiredZ, slotIdx) => {
                const relPos = idealPositions[slotIdx];
                if (!isFinite(relPos.x) || !isFinite(relPos.y) || !isFinite(relPos.z)) {
                    relPos.x = 0; relPos.y = 0; relPos.z = 0;
                }

                const targetX = cx + relPos.x;
                const targetY = cy + relPos.y;
                const targetZ = cz + relPos.z;

                let bestAtom: Atom | null = null;
                let minDistSq = Infinity;

                for (const atom of candidates) {
                    if (usedInStruct.has(atom.id)) continue;
                    if (atom.element.z !== requiredZ) continue;

                    const dx = atom.x - targetX;
                    const dy = atom.y - targetY;
                    const dz = atom.z - targetZ;
                    const dSq = dx*dx + dy*dy + dz*dz;

                    if (dSq < minDistSq) {
                        minDistSq = dSq;
                        bestAtom = atom;
                    }
                }

                if (bestAtom) {
                    assignedAtoms[slotIdx] = bestAtom;
                    usedInStruct.add(bestAtom.id);
                }
            });

            potentialIds.forEach(id => availableIds.delete(id));
            
            // Cleanup Labels & Bonds
            for (let i = floatingLabels.length - 1; i >= 0; i--) {
                const label = floatingLabels[i];
                if (potentialIds.some(pid => label.atomIds.has(pid))) floatingLabels.splice(i, 1);
            }

            // 3. Teleport & Initialize Physics Assembly
            assignedAtoms.forEach((a, idx) => {
                if(!a) return;
                
                // Reset Physics State
                a.bonds = [];
                a.vx = 0; a.vy = 0; a.vz = 0;
                a.fx = 0; a.fy = 0; a.fz = 0;

                const pos = idealPositions[idx];
                const targetX = cx + pos.x;
                const targetY = cy + pos.y;
                const targetZ = cz + pos.z;

                // TELEPORT TO STARTING TOPOLOGY
                // We trust the ForceDirectedLayout to provide a non-tangled starting state.
                a.x = targetX;
                a.y = targetY;
                a.z = targetZ;

                // Set Assembly Flag
                // This enables "Ghost Mode" against the world, but allows internal VSEPR forces to refine the shape.
                a.isAssembling = true;
                a.assemblyTimer = 0; 
                a.assemblyTimeOut = 300; 
                a.cooldown = 1.0; 
                
                // NOTE: We do NOT set a.destination anymore. 
                // We rely on the layout + physics settling to handle the geometry.
                a.destination = undefined; 
            });

            recipe.structure.bonds.forEach(([iA, iB, order]) => {
                const a = assignedAtoms[iA];
                const b = assignedAtoms[iB];
                if (a && b) {
                    for(let k=0; k<order; k++) addBond(a, b);
                }
            });

            if (mouse) {
                mouse.moleculeTarget = { ids: potentialIds, cx, cy, startRadius: 300, visualOnly: true };
                mouse.moleculeHaloLife = 60;
                mouse.moleculeHaloMaxLife = 60;
            }

            floatingLabels.push({
               id: potentialIds.sort().join('-'),
               text: recipe.name,
               targetId: potentialIds[0],
               atomIds: new Set(potentialIds),
               life: 600, maxLife: 600, fadeDuration: 60
           });
        }
    }
};
