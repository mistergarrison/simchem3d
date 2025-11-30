
import { Atom, Particle } from '../../types/core';
import { SimulationEvent, MouseState } from '../../types/ui';
import { AnnealingLogic } from './Annealing';
import { Integrator } from './Integrator';
import { pruneGhostBonds } from '../utils/general';
import { Z_SPRING } from '../config';

// Logic Modules
import { BondForce } from './forces/BondForce';
import { CoulombForce } from './forces/CoulombForce';
import { PauliForce } from './forces/PauliForce';

// Reaction Modules
import { attemptAnnihilation, attemptPositronAnnihilation } from './reactions/Annihilation';
import { attemptElectronCapture, attemptNeutronCapture } from './reactions/NucleonCapture';
import { attemptBondFormation } from './reactions/BondFormation';

/**
 * simulation/chemistry.ts -> engine/physics/Solver.ts
 * 
 * The Physics & Chemistry Solver.
 * Orchestrates the interaction loop using specialized physics modules.
 */

export const annealAtoms = (
    atoms: Atom[], 
    mouse: MouseState, 
    protectionSet: Set<string> | null = null
) => {
    const atomCount = atoms.length;
    for (let i = 0; i < atomCount; i++) {
        const a = atoms[i];
        if (!a) continue;
        pruneGhostBonds(atoms, a);
        AnnealingLogic.enforceValency(atoms, a, mouse, protectionSet);
    }
    for (let i = 0; i < atomCount; i++) {
        const a = atoms[i];
        if (!a) continue;
        AnnealingLogic.optimizeStructure(atoms, a, mouse, protectionSet);
    }
};

/**
 * Runs the main interaction loop (O(N^2)) to solve forces, collisions, and reactions.
 */
export const resolveInteractions = (
    atoms: Atom[], 
    particles: Particle[], 
    mouse: MouseState, 
    protectionSet: Set<string> | null = null,
    eventLog?: SimulationEvent[]
) => {
    const atomCount = atoms.length;

    for (let i = atomCount - 1; i >= 0; i--) {
        const a = atoms[i];
        if (!a) continue; 
        
        for (let j = i - 1; j >= 0; j--) {
            const b = atoms[j];
            if (!b) continue;

            // [ASSEMBLY PHYSICS]
            // If EITHER is assembling, we enter strict isolation checks.
            if (a.isAssembling || b.isAssembling) {
                // 1. Ghosting against the World
                // If one is assembling and the other is NOT, they ignore each other completely.
                if (a.isAssembling !== b.isAssembling) continue;

                // 2. Ghosting against Other Assemblies
                // If BOTH are assembling, they only interact if they belong to the SAME group.
                // This prevents multiple simultaneously forming molecules from exploding at the center.
                if (a.assemblyGroupId !== b.assemblyGroupId) continue;
            }

            // Skip interaction if both are part of the rigid drag group
            if (mouse.dragGroup.has(a.id) && mouse.dragGroup.has(b.id)) continue;

            // 1. Calculate Geometry
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dz = b.z - a.z;
            
            if (isNaN(dx) || isNaN(dy) || isNaN(dz)) continue;

            const distSq = dx*dx + dy*dy + dz*dz;
            let dist = Math.sqrt(distSq);
            
            // Singularity Check / Normal Calculation
            let nx = 0, ny = 0, nz = 0;
            if (dist < 0.001) {
                // Random separation vector if perfectly overlapping
                nx = Math.random() - 0.5; ny = Math.random() - 0.5; nz = Math.random() - 0.5;
                const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
                nx/=len; ny/=len; nz/=len;
                dist = 0.001;
            } else {
                nx = dx / dist; ny = dy / dist; nz = dz / dist;
            }
            const normal = { x: nx, y: ny, z: nz };

            // 2. Physics & Reactions
            const bondExists = a.bonds.includes(b.id);

            if (bondExists) {
                BondForce.apply(atoms, a, b, dist, normal, mouse);
            } else {
                // Long Range Forces
                CoulombForce.apply(a, b, dist, distSq, normal);

                // Nuclear/Quantum Reactions
                // These return { occurred: boolean, removedIndices: number[] } and may remove atoms.
                // If a reaction occurs, we stop processing this pair.
                
                const annihilation = attemptAnnihilation(atoms, particles, a, b, i, j, distSq, eventLog);
                if (annihilation.occurred) {
                    if (annihilation.removedIndices.includes(i)) break; // 'a' is gone
                    continue; // 'b' is gone, next 'j'
                }

                const positron = attemptPositronAnnihilation(atoms, particles, a, b, i, j, distSq, eventLog);
                if (positron.occurred) {
                    if (positron.removedIndices.includes(i)) break;
                    continue;
                }

                const eCap = attemptElectronCapture(atoms, particles, a, b, i, j, distSq, eventLog);
                if (eCap.occurred) {
                    if (eCap.removedIndices.includes(i)) break;
                    continue;
                }

                const nCap = attemptNeutronCapture(atoms, particles, a, b, i, j, distSq, eventLog);
                if (nCap.occurred) {
                    if (nCap.removedIndices.includes(i)) break;
                    continue;
                }

                // Short Range Forces & Bonding
                const touchDist = a.radius + b.radius;
                if (distSq < (touchDist * touchDist * 1.2)) {
                    // Check if either is a Boson (Photon/Gluon) - they don't collide or bond
                    // Bosons are 'ghosts' regarding Pauli repulsion and bonding
                    const isBoson = (a.element.s === 'γ' || a.element.s === 'g' || b.element.s === 'γ' || b.element.s === 'g');
                    
                    if (!isBoson) {
                        const overlap = touchDist - dist;
                        PauliForce.apply(a, b, overlap, normal);
                        attemptBondFormation(atoms, particles, a, b, normal, mouse);
                    }
                }
            }
        }
    }
};

export const calculateZPlaneForces = (atoms: Atom[]): Map<string, number> => {
    // Basic BFS to find connected components and center them on Z-plane
    const atomMap = new Map<string, Atom>();
    for (const a of atoms) atomMap.set(a.id, a);

    const zForceMap = new Map<string, number>();
    const zProcessed = new Set<string>();

    for (const atom of atoms) {
        if (zProcessed.has(atom.id)) continue;
        
        const componentIds: string[] = [];
        const queue = [atom.id];
        zProcessed.add(atom.id);
        
        let sumZ = 0;
        
        while (queue.length > 0) {
            const currId = queue.shift()!;
            componentIds.push(currId);
            const curr = atomMap.get(currId);
            
            if (curr) {
                sumZ += curr.z;
                for(const bondId of curr.bonds) {
                    if (!zProcessed.has(bondId)) {
                        zProcessed.add(bondId);
                        queue.push(bondId);
                    }
                }
            }
        }
        
        const count = componentIds.length;
        const avgZ = count > 0 ? sumZ / count : 0;
        const force = -avgZ * Z_SPRING; 
        
        for(const id of componentIds) {
            zForceMap.set(id, force);
        }
    }
    return zForceMap;
};

export const integrateMotion = (
    atoms: Atom[], 
    zForceMap: Map<string, number>, 
    worldW: number, 
    worldH: number, 
    safeAreaBottom: number,
    particles: Particle[],
    dt: number = 1.0
) => {
    Integrator.integrateAll(atoms, zForceMap, worldW, worldH, safeAreaBottom, particles, dt);
};
