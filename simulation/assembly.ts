
import { Atom, Particle, Molecule } from '../types';
import { MouseState } from './types';
import { FloatingLabel } from './types';
import { addBond, debugWarn } from './utils';
import { ForceDirectedLayout } from './algorithms/ForceDirectedLayout';
import { BondingOptimization } from './algorithms/BondingOptimization';
import { MOLECULES } from '../molecules';

/**
 * Takes a soup of atoms and attempts to match them to optimal Molecular Recipes.
 * Uses deterministic energy-density scoring to partition atoms into valid molecules.
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
    const pool = atoms.filter(a => subset.has(a.id));
    if (pool.length === 0) return;

    // 2. Setup Physics Center
    let gcx = 0, gcy = 0, gcz = 0;
    if (forcedCenter) {
        gcx = forcedCenter.x; gcy = forcedCenter.y; gcz = forcedCenter.z;
    } else {
        pool.forEach(a => { gcx += a.x; gcy += a.y; gcz += a.z; });
        gcx /= pool.length; gcy /= pool.length; gcz /= pool.length;
    }

    // 3. Determine Ejection Velocity (Conservation of Momentum)
    let evx = 0, evy = 0, evz = 0;
    if (initialVelocity) {
        evx = initialVelocity.vx;
        evy = initialVelocity.vy;
        evz = initialVelocity.vz;
    } else {
        // If no explicit velocity provided (e.g. Lasso), conserve average momentum of the pool
        let totalMass = 0;
        pool.forEach(a => {
            const m = a.mass || 1;
            evx += a.vx * m;
            evy += a.vy * m;
            evz += a.vz * m;
            totalMass += m;
        });
        if (totalMass > 0) {
            evx /= totalMass;
            evy /= totalMass;
            evz /= totalMass;
        }
    }

    // 4. Reset Atoms State
    pool.forEach(a => {
        a.bonds = [];
        a.vx = 0; a.vy = 0; a.vz = 0;
        a.fx = 0; a.fy = 0; a.fz = 0;
        a.isAssembling = true;
        a.assemblyGroupId = undefined; 
        a.cooldown = 0;

        // Clear old labels
        for (let j = floatingLabels.length - 1; j >= 0; j--) {
            const label = floatingLabels[j];
            if (label.atomIds.has(a.id)) floatingLabels.splice(j, 1);
        }
    });

    // 5. Check for EXACT Recipe Match (Override Optimization)
    // If the atoms provided exactly match a known molecule's ingredients, force that molecule.
    // This allows creating energetically unfavorable molecules (like Ozone O3 vs O2+O) if explicitly requested.
    let override: { results: { molecule: Molecule, atoms: Atom[] }[], leftovers: Atom[] } | null = null;
    
    const zCounts = new Map<number, number>();
    pool.forEach(a => zCounts.set(a.element.z, (zCounts.get(a.element.z) || 0) + 1));
    
    const exactMatch = MOLECULES.find(m => {
        if (m.ingredients.length !== zCounts.size) return false;
        return m.ingredients.every(ing => zCounts.get(ing.z) === ing.count);
    });

    if (exactMatch && exactMatch.structure) {
        // Verify we can map specific atoms to the structure slots
        const available = new Map<number, Atom[]>();
        pool.forEach(a => {
            const z = a.element.z;
            if (!available.has(z)) available.set(z, []);
            available.get(z)!.push(a);
        });

        const assignedAtoms: Atom[] = [];
        let validAssignment = true;
        
        for (const z of exactMatch.structure.atoms) {
            const list = available.get(z);
            if (list && list.length > 0) {
                assignedAtoms.push(list.shift()!);
            } else {
                validAssignment = false;
                break;
            }
        }

        if (validAssignment) {
            override = {
                results: [{ molecule: exactMatch, atoms: assignedAtoms }],
                leftovers: []
            };
        }
    }

    // 6. Run Bonding Algorithm
    const { results, leftovers } = override || BondingOptimization.optimize(pool);

    // 7. Build Structures
    results.forEach((res, index) => {
        const { molecule, atoms: resAtoms } = res;
        const groupId = Math.floor(Math.random() * 10000000);

        // Spatial Distribution & Radial Ejection
        let mcx = gcx;
        let mcy = gcy;
        let mcz = gcz;
        
        let mvx = evx;
        let mvy = evy;
        let mvz = evz;

        // If multiple molecules formed, spread them out radially
        if (results.length > 1) {
            const offsetR = 80;
            const angle = (index / results.length) * Math.PI * 2;
            
            // Position offset
            mcx += Math.cos(angle) * offsetR;
            mcy += Math.sin(angle) * offsetR;
            
            // Velocity kick (Explode outwards)
            const kick = 50; 
            mvx += Math.cos(angle) * kick;
            mvy += Math.sin(angle) * kick;
        }

        // Configure Atoms
        resAtoms.forEach(a => {
            a.assemblyGroupId = groupId;
            a.assemblyTimer = 0;
            a.assemblyTimeOut = 300;
            a.destination = { x: mvx, y: mvy, z: mvz };
        });

        // Run Force Directed Layout
        const atomZs = resAtoms.map(a => a.element.z);
        let offsets: {x:number, y:number, z:number}[] = [];
        
        try {
            const solver = new ForceDirectedLayout(atomZs, molecule.structure?.bonds || []);
            offsets = solver.solve();
        } catch (e) { 
            // Fallback
            offsets = resAtoms.map((_, i) => ({x: Math.cos(i)*10, y: Math.sin(i)*10, z:0})); 
        }

        // Apply Positions relative to Molecule Center
        resAtoms.forEach((a, idx) => {
            if (offsets[idx]) {
                a.x = mcx + offsets[idx].x;
                a.y = mcy + offsets[idx].y;
                a.z = mcz + offsets[idx].z;
            }
        });

        // Apply Bonds from Recipe
        molecule.structure?.bonds.forEach(([u, v, order]) => {
            const a = resAtoms[u];
            const b = resAtoms[v];
            if (a && b) {
                for(let i=0; i<order; i++) addBond(a, b);
            }
        });

        // Add Floating Label
        floatingLabels.push({
            id: resAtoms.map(a => a.id).sort().join('-'),
            text: molecule.name,
            targetId: resAtoms[0].id,
            atomIds: new Set(resAtoms.map(a => a.id)),
            life: 600, maxLife: 600, fadeDuration: 60
        });
    });

    // 8. Handle Leftovers
    leftovers.forEach((a, i) => {
        // Scatter slightly
        a.x = gcx + (Math.random()-0.5)*60;
        a.y = gcy + (Math.random()-0.5)*60;
        a.z = gcz + (Math.random()-0.5)*60;
        
        a.isAssembling = false; // Release immediately
        a.assemblyGroupId = undefined;
        
        // Eject leftovers with randomness
        a.vx = evx + (Math.random()-0.5)*50;
        a.vy = evy + (Math.random()-0.5)*50;
        a.vz = evz + (Math.random()-0.5)*50;
    });

    if (leftovers.length > 1) {
        floatingLabels.push({
            id: leftovers.map(a => a.id).sort().join('-'),
            text: 'Unbound',
            targetId: leftovers[0].id,
            atomIds: new Set(leftovers.map(a => a.id)),
            life: 300, maxLife: 300, fadeDuration: 60
        });
    }

    // Trigger Visual "Crunch" Effect
    if (mouse) {
        mouse.moleculeTarget = { 
            ids: pool.map(a => a.id), 
            cx: gcx, cy: gcy, 
            startRadius: 100, 
            visualOnly: true 
        };
        mouse.moleculeHaloLife = 45;
        mouse.moleculeHaloMaxLife = 45;
    }
};
