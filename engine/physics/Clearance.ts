
import { Atom } from '../../types/core';
import { Molecule } from '../../types/chemistry';
import { MouseState } from '../../types/ui';
import { ELEMENTS } from '../../data/elements';
import { getMoleculeGroup, debugWarn } from '../utils/general';

export const CLEARANCE_RADIUS = 675;
export const CLEARANCE_FRAMES = 60; // 1 second @ 60fps (Synced with Test Speed)

/**
 * Initiates the Clearance Phase.
 * Sets up the mouse state to push existing atoms away from the spawn target.
 */
export const startClearance = (
    mouse: MouseState, 
    cx: number, 
    cy: number, 
    molecule: Molecule,
    velocity?: { vx: number, vy: number, vz: number }
) => {
    debugWarn(`[Clearance] Started for ${molecule.name} at (${cx.toFixed(0)}, ${cy.toFixed(0)})`);
    mouse.clearance = {
        active: true,
        cx,
        cy,
        maxRadius: CLEARANCE_RADIUS,
        life: CLEARANCE_FRAMES,
        maxLife: CLEARANCE_FRAMES,
        molecule,
        velocity
    };
};

/**
 * Executes the physics of the Clearance Phase.
 * Applies rigid-body forces to push atoms away, then spawns the molecule when finished.
 * 
 * Returns the array of newly spawned atoms (if any) so the caller can run layout algorithms.
 */
export const resolveClearance = (
    atoms: Atom[], 
    mouse: MouseState,
    spawnAtomFn: (x: number, y: number, z: number, zNum: number, isoIdx: number, vel?: any, charge?: number) => Atom | null
): Atom[] => {
    if (!mouse.clearance || !mouse.clearance.active) return [];

    const c = mouse.clearance;
    const progress = 1 - (c.life / c.maxLife);
    const currentRadius = c.maxRadius * progress;
    
    // MOLECULAR PUSH: Treat molecules as rigid bodies to prevent explosion
    const processed = new Set<string>();

    atoms.forEach(a => {
       if (processed.has(a.id)) return;

       // 1. Identify Molecular Group
       const groupIds = getMoleculeGroup(atoms, a.id);
       groupIds.forEach(id => processed.add(id));

       // 2. Calculate Center of Mass (CoM)
       let cx = 0, cy = 0, cz = 0;
       const groupAtoms: Atom[] = [];
       
       groupIds.forEach(id => {
           const atom = atoms.find(at => at.id === id);
           if (atom) {
               cx += atom.x; cy += atom.y; cz += atom.z;
               groupAtoms.push(atom);
           }
       });
       
       if (groupAtoms.length === 0) return;
       cx /= groupAtoms.length;
       cy /= groupAtoms.length;
       cz /= groupAtoms.length;

       // 3. Apply Force relative to CoM
       const dx = cx - c.cx;
       const dy = cy - c.cy;
       const dz = cz; // Z-axis relative to 0 plane
       const distSq = dx*dx + dy*dy + dz*dz;
       const dist = Math.sqrt(distSq) || 1;
       
       if (dist < currentRadius) {
           // Gentle Push
           const pushStrength = (currentRadius - dist) * 0.02; 
           const nx = dx / dist;
           const ny = dy / dist;
           const nz = dz / dist;
           
           // 4. Apply Rigid Body Force to all atoms in molecule
           groupAtoms.forEach(atom => {
               atom.vx += nx * pushStrength;
               atom.vy += ny * pushStrength;
               atom.vz += nz * pushStrength;
           });
       }
    });
    
    c.life--;
    
    // --- CLEARANCE FINISHED -> SPAWN MOLECULE ---
    if (c.life <= 0) {
        c.active = false;
        if (c.molecule) {
           const mol = c.molecule;
           const cx = c.cx;
           const cy = c.cy;
           const newAtoms: Atom[] = [];
           
           mol.ingredients.forEach(ing => {
              const el = ELEMENTS.find(e => e.z === ing.z);
              const isoIndex = el ? el.iso.findIndex(iso => iso.hl === 'stable') : 0;
              const validIso = isoIndex === -1 ? 0 : isoIndex;

              // Debug Log for Atom Spawning
              debugWarn(`[Clearance] Spawning ${ing.count}x ${el?.s || ing.z} for ${mol.name}`);

              for (let i = 0; i < ing.count; i++) {
                  // SPAWN FIX: Reverted radius to 300 to match user expectation for spawn cloud size
                  const r = Math.random() * 300; 
                  const theta = Math.random() * Math.PI * 2;
                  const phi = Math.random() * Math.PI;
                  const x = cx + r * Math.sin(phi) * Math.cos(theta);
                  const y = cy + r * Math.sin(phi) * Math.sin(theta);
                  const z = (Math.random() - 0.5) * 40; 
                  
                  const atom = spawnAtomFn(x, y, z, ing.z, validIso, c.velocity, 0); 
                  if (atom) newAtoms.push(atom);
              }
           });

           mouse.clearance = null;
           
           // Return the new atoms so we can run the layout solver immediately
           return newAtoms;
        }
        mouse.clearance = null;
    }
    
    return [];
};
