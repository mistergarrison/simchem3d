
import { Atom, Particle, Molecule, ElementData } from '../types';
import { ELEMENTS, ELECTRON_ELEM, NEUTRON_ELEM, PROTON_ELEM } from '../elements';
import { MOLECULES } from '../molecules';
import { MouseState, FloatingLabel } from './types';
import { COVALENT_Z, MAX_SPEED, BOND_STIFFNESS, BOND_DAMPING } from './constants';
import { addBond, breakBond, decrementBond, getBondOrder, getMoleculeGroup } from './utils';
import { getTargetCosine } from './vsepr'; 

/**
 * simulation/chemistry.ts
 */

export const createExplosion = (particles: Particle[], x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      particles.push({
        id: Math.random().toString(36),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        color: color,
        size: Math.random() * 3 + 1
      });
    }
};

export const identifyMolecule = (groupAtoms: Atom[]): string | null => {
    const comp = new Map<number, number>();
    groupAtoms.forEach(a => {
        if (!a) return;
        comp.set(a.element.z, (comp.get(a.element.z) || 0) + 1);
    });
    const match = MOLECULES.find(r => {
        if (r.ingredients.length !== comp.size) return false;
        return r.ingredients.every(ing => comp.get(ing.z) === ing.count);
    });
    return match ? match.name : null;
};

// Helper to kill labels associated with broken bonds
const killRelatedLabels = (floatingLabels: FloatingLabel[], aId: string, bId: string) => {
    // Iterate backwards to allow safe splicing
    for (let i = floatingLabels.length - 1; i >= 0; i--) {
        const label = floatingLabels[i];
        // If the label depends on BOTH atoms involved in the break, it's invalid.
        // Immediate removal prevents any fading or ghosting.
        if (label.atomIds.has(aId) && label.atomIds.has(bId)) {
            floatingLabels.splice(i, 1);
        }
    }
};

// Helper to spawn label for new molecule
const trySpawnLabel = (atoms: Atom[], anchorAtom: Atom, floatingLabels: FloatingLabel[]) => {
    const group = getMoleculeGroup(atoms, anchorAtom.id);
    const groupAtoms = atoms.filter(atom => group.has(atom.id));
    const name = identifyMolecule(groupAtoms);
    
    if (name) {
        const sortedIds = Array.from(group).sort().join('-');
        const existing = floatingLabels.find(l => l.id === sortedIds);
        
        if (!existing || existing.life <= 0) {
            floatingLabels.push({
                id: sortedIds,
                text: name,
                targetId: anchorAtom.id,
                atomIds: group,
                life: 240,
                maxLife: 240,
                fadeDuration: 60
            });
        }
    }
};

// --- CHEMICAL SYNTHESIS (The Bonding Loop Resolution) ---

/**
 * Force-Directed Graph Layout Solver.
 * Runs a mini-simulation to relax the molecule structure into a valid geometric shape
 * BEFORE spawning it into the main physics world. This prevents high-energy explosions.
 * 
 * UPGRADE: Now uses physics-accurate radii and bond lengths to match the engine.
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

   // 1. Initialize with larger spread to prevent initial overlap
   const nodes = structure.atoms.map(z => ({
       x: (Math.random()-0.5)*500, 
       y: (Math.random()-0.5)*500, 
       z: (Math.random()-0.5)*500,
       r: getRadius(z)
   }));
   
   const velocities = new Array(nodeCount).fill(null).map(() => ({x:0, y:0, z:0}));
   
   // Pre-process bond map for accurate order lookup
   const bondMap = new Map<string, number>();
   structure.bonds.forEach(([a, b, order]) => {
       const key = a < b ? `${a}-${b}` : `${b}-${a}`;
       bondMap.set(key, order);
   });

   // 2. Mini-Physics Simulation (Relaxation)
   const iterations = 4000; 
   const kRepulse = 150000; 
   const kSpring = 0.3;     
   const damping = 0.5;   
   const dt = 0.1;

   for(let iter=0; iter<iterations; iter++) {
       const forces = new Array(nodeCount).fill(null).map(() => ({x:0, y:0, z:0}));

       // Repulsion (All Pairs)
       for(let i=0; i<nodeCount; i++) {
           for(let j=i+1; j<nodeCount; j++) {
               const dx = nodes[j].x - nodes[i].x;
               const dy = nodes[j].y - nodes[i].y;
               const dz = nodes[j].z - nodes[i].z;
               const d2 = dx*dx + dy*dy + dz*dz + 0.01;
               const d = Math.sqrt(d2);
               
               // Match physics engine: exact touching distance
               const minDist = (nodes[i].r + nodes[j].r); 
               
               if(d < minDist) { 
                   const f = kRepulse / d2;
                   const fx = (dx/d) * f;
                   const fy = (dy/d) * f;
                   const fz = (dz/d) * f;
                   
                   forces[i].x -= fx; forces[i].y -= fy; forces[i].z -= fz;
                   forces[j].x += fx; forces[j].y += fy; forces[j].z += fz;
               }
           }
       }

       // Spring Attraction (Bonds Only)
       structure.bonds.forEach(([idxA, idxB, order]) => {
           if(idxA >= nodeCount || idxB >= nodeCount) return;
           const nA = nodes[idxA];
           const nB = nodes[idxB];
           
           const dx = nB.x - nA.x;
           const dy = nB.y - nA.y;
           const dz = nB.z - nA.z;
           const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
           
           // EXACT PHYSICS MATCH:
           // Physics Engine: restScale = 0.9 - ((order - 1) * 0.12);
           const restScale = 0.9 - ((order - 1) * 0.12);
           const idealDist = (nA.r + nB.r) * restScale;
           
           const displacement = dist - idealDist;
           const f = kSpring * displacement;
           
           const fx = (dx/dist) * f;
           const fy = (dy/dist) * f;
           const fz = (dz/dist) * f;
           
           forces[idxA].x += fx; forces[idxA].y += fy; forces[idxA].z += fz;
           forces[idxB].x -= fx; forces[idxB].y -= fy; forces[idxB].z -= fz;
       });

       // Integration (Euler)
       for(let i=0; i<nodeCount; i++) {
           velocities[i].x = (velocities[i].x + forces[i].x * dt) * damping;
           velocities[i].y = (velocities[i].y + forces[i].y * dt) * damping;
           velocities[i].z = (velocities[i].z + forces[i].z * dt) * damping;
           
           nodes[i].x += velocities[i].x * dt;
           nodes[i].y += velocities[i].y * dt;
           nodes[i].z += velocities[i].z * dt;
       }
   }

   // 3. Re-center
   let avgX = 0, avgY = 0, avgZ = 0;
   nodes.forEach(p => { avgX += p.x; avgY += p.y; avgZ += p.z; });
   avgX /= nodeCount; avgY /= nodeCount; avgZ /= nodeCount;

   return nodes.map(p => ({
       x: cx + (p.x - avgX),
       y: cy + (p.y - avgY),
       z: cz + (p.z - avgZ)
   }));
}

export const resolveMolecularAssembly = (atoms: Atom[], floatingLabels: FloatingLabel[], subset: Set<string>, particles: Particle[]) => {
    const group = atoms.filter(a => subset.has(a.id));
    if (group.length === 0) return;

    // Calculate Center of Mass
    let cx = 0, cy = 0, cz = 0;
    group.forEach(a => { cx += a.x; cy += a.y; cz += a.z; });
    cx /= group.length; cy /= group.length; cz /= group.length;

    const availableIds = new Set(group.map(a => a.id));

    // Sort recipes by complexity (total atom count) descending
    // This ensures we try to build the biggest things first
    const sortedRecipes = [...MOLECULES].sort((a,b) => 
        b.ingredients.reduce((acc, i) => acc + i.count, 0) - 
        a.ingredients.reduce((acc, i) => acc + i.count, 0)
    );

    for (const recipe of sortedRecipes) {
        // Greedy matching: Do we have the ingredients for this recipe?
        const potentialIds: string[] = [];
        let possible = true;

        for (const ing of recipe.ingredients) {
            // Find unassigned atoms matching Z
            const matches = group.filter(a => availableIds.has(a.id) && a.element.z === ing.z && !potentialIds.includes(a.id));
            
            if (matches.length >= ing.count) {
                // Take the needed amount
                matches.slice(0, ing.count).forEach(m => potentialIds.push(m.id));
            } else {
                possible = false;
                break;
            }
        }

        if (possible && recipe.structure) {
            // SUCCESS: We can form this molecule.
            // 1. Mark atoms as used
            potentialIds.forEach(id => availableIds.delete(id));

            // Clean up existing floating labels for these atoms.
            // If an atom is consumed, any label it was part of is now invalid.
            for (let i = floatingLabels.length - 1; i >= 0; i--) {
                const label = floatingLabels[i];
                if (potentialIds.some(pid => label.atomIds.has(pid))) {
                    floatingLabels.splice(i, 1);
                }
            }

            // CRITICAL: Sever ALL existing bonds for the participating atoms first.
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
            
            // 2. Map atoms to the structure slots
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

            // 3. Teleport atoms to valid topological positions
            const layout = calculateGraphLayout(recipe.structure, cx, cy, cz);
            
            assignedAtoms.forEach((a, idx) => {
                if(!a) return;
                const pos = layout[idx];
                
                // Snap position
                a.x = pos.x; 
                a.y = pos.y; 
                a.z = pos.z;
                
                // CRITICAL: Clear all velocity AND FORCES.
                a.vx = 0; a.vy = 0; a.vz = 0; 
                a.fx = 0; a.fy = 0; a.fz = 0;
                
                a.bonds = []; 
                
                // Enable Cooldown - Starts at 1.0 but decays fast (Shock Absorber)
                a.cooldown = 1.0; 
            });

            // 4. Create Bonds
            recipe.structure.bonds.forEach(([iA, iB, order]) => {
                const a = assignedAtoms[iA];
                const b = assignedAtoms[iB];
                if (a && b) {
                    for(let k=0; k<order; k++) addBond(a, b);
                }
            });

            // 5. Visual Flair
            createExplosion(particles, cx, cy, '#00FFFF', 20);
            
            const sortedIds = potentialIds.sort().join('-');
            floatingLabels.push({
               id: sortedIds,
               text: recipe.name,
               targetId: potentialIds[0],
               atomIds: new Set(potentialIds),
               life: 240,
               maxLife: 240,
               fadeDuration: 60
           });
        }
    }

    // Attempt Nuclear Fusion on any leftovers
    if (availableIds.size >= 2) {
        attemptFusion(atoms, particles, availableIds);
    }
};

// --- FUSION LOGIC (Gravity Well) ---

const FUSION_RECIPES = [
    // H-1 + H-1 -> H-2 (Deuterium)
    { inputs: [{z:1, m:1}, {z:1, m:1}], output: {z:1, m:2} },
    // H-2 + H-1 -> He-3
    { inputs: [{z:1, m:2}, {z:1, m:1}], output: {z:2, m:3} },
    // He-3 + He-3 -> He-4
    { inputs: [{z:2, m:3}, {z:2, m:3}], output: {z:2, m:4} },
    // 3x He-4 -> C-12 (Triple Alpha)
    { inputs: [{z:2, m:4}, {z:2, m:4}, {z:2, m:4}], output: {z:6, m:12} },
    // C-12 + He-4 -> O-16
    { inputs: [{z:6, m:12}, {z:2, m:4}], output: {z:8, m:16} },
    // O-16 + He-4 -> Ne-20
    { inputs: [{z:8, m:16}, {z:2, m:4}], output: {z:10, m:20} },
    // Ne-20 + He-4 -> Mg-24
    { inputs: [{z:10, m:20}, {z:2, m:4}], output: {z:12, m:24} },
    // Mg-24 + He-4 -> Si-28 (Bridging step implied to reach Si-28)
    { inputs: [{z:12, m:24}, {z:2, m:4}], output: {z:14, m:28} },
    // Si-28 + Si-28 -> Fe-56 (Iron Limit)
    { inputs: [{z:14, m:28}, {z:14, m:28}], output: {z:26, m:56} }
];

const matchesSpec = (atom: Atom, spec: {z: number, m: number}) => {
    return atom.element.z === spec.z && Math.abs(atom.mass - spec.m) < 0.2;
};

export const attemptFusion = (atoms: Atom[], particles: Particle[], subset: Set<string>) => {
    const group = atoms.filter(a => a && subset.has(a.id));
    if (group.length < 2) return;

    let cx = 0, cy = 0;
    group.forEach(a => { cx += a.x; cy += a.y; });
    cx /= group.length; cy /= group.length;

    // We can assume density is high because this is called from the Gravity Well logic
    
    const usedIds = new Set<string>();

    for (const recipe of FUSION_RECIPES) {
        while (true) {
            const currentMatchIds: string[] = [];
            
            for (const input of recipe.inputs) {
                const match = group.find(a => 
                    !usedIds.has(a.id) && 
                    !currentMatchIds.includes(a.id) && 
                    matchesSpec(a, input)
                );
                if (match) {
                    currentMatchIds.push(match.id);
                } else {
                    break;
                }
            }

            if (currentMatchIds.length === recipe.inputs.length) {
                currentMatchIds.forEach(id => usedIds.add(id));
                
                const outElem = ELEMENTS.find(e => e.z === recipe.output.z);
                if (outElem) {
                    let isoIndex = outElem.iso.findIndex(i => Math.abs(i.m - recipe.output.m) < 0.5);
                    if (isoIndex === -1) isoIndex = 0;

                    const product: Atom = {
                        id: Math.random().toString(36),
                        x: cx + (Math.random()-0.5)*10,
                        y: cy + (Math.random()-0.5)*10,
                        z: 0,
                        vx: (Math.random()-0.5)*2,
                        vy: (Math.random()-0.5)*2,
                        vz: 0,
                        fx: 0, fy: 0, fz: 0,
                        element: outElem,
                        isotopeIndex: isoIndex,
                        mass: outElem.iso[isoIndex].m,
                        radius: 30 + Math.pow(outElem.iso[isoIndex].m, 0.33) * 10,
                        bonds: [],
                        lastDecayCheck: Date.now()
                    };
                    atoms.push(product);
                    createExplosion(particles, cx, cy, '#FFDD00', 25);
                }

            } else {
                break;
            }
        }
    }

    if (usedIds.size > 0) {
        for (let i = atoms.length - 1; i >= 0; i--) {
            if (atoms[i] && usedIds.has(atoms[i].id)) {
                atoms.splice(i, 1);
            }
        }
    }
};

export const processDecay = (atoms: Atom[], particles: Particle[], dt: number) => {
    for (let i = atoms.length - 1; i >= 0; i--) {
        const atom = atoms[i];
        if (!atom) continue;
        
        const iso = atom.customIsotope || atom.element.iso[atom.isotopeIndex];
        if (!iso || iso.hl === 'stable') continue;
        
        const hl = typeof iso.hl === 'number' ? iso.hl : Infinity;
        if (hl === Infinity) continue;

        const lambda = 0.693147 / hl;
        const prob = 1 - Math.exp(-lambda * dt);
        
        if (Math.random() < prob) {
            const mode = iso.mode || '';
            createExplosion(particles, atom.x, atom.y, '#33FF00', 5);
            
            if (iso.p) {
                const pZ = iso.p.z;
                const pM = iso.p.m;
                
                if (mode === 'sf' && pZ === 0) {
                     createExplosion(particles, atom.x, atom.y, '#FF5500', 20);
                     atoms.splice(i, 1);
                     continue;
                }

                const newElem = ELEMENTS.find(e => e.z === pZ);
                if (newElem) {
                    let newIsoIndex = newElem.iso.findIndex(i => Math.abs(i.m - pM) < 0.5);
                    
                    let recoil = 0;
                    let pColor = '#FFFFFF';
                    let pSize = 2;
                    
                    if (mode.includes('alpha')) {
                        recoil = 2.0;
                        pColor = '#FFFF00';
                        pSize = 4;
                    } else if (mode.includes('beta')) {
                        recoil = 0.5;
                        pColor = '#00FFFF';
                        pSize = 2;
                    }
                    
                    if (recoil > 0) {
                        const theta = Math.random() * Math.PI * 2;
                        atom.vx -= Math.cos(theta) * (recoil / atom.mass);
                        atom.vy -= Math.sin(theta) * (recoil / atom.mass);
                        
                        particles.push({
                            id: Math.random().toString(),
                            x: atom.x, y: atom.y,
                            vx: Math.cos(theta) * recoil * 5,
                            vy: Math.sin(theta) * recoil * 5,
                            life: 1.0, maxLife: 1.0,
                            color: pColor, size: pSize
                        });
                    }

                    atom.element = newElem;
                    if (newIsoIndex === -1) newIsoIndex = 0;
                    
                    atom.isotopeIndex = newIsoIndex;
                    atom.mass = newElem.iso[newIsoIndex].m;
                    atom.radius = 30 + Math.pow(atom.mass, 0.33) * 10;
                    
                    atom.customIsotope = undefined; 
                } else {
                    atoms.splice(i, 1);
                }
            } else {
                atoms.splice(i, 1);
            }
        }
    }
};

// --- Layer 1: Annealing (Error Correction) ---

export const annealAtoms = (
    atoms: Atom[], 
    mouse: MouseState, 
    protectionSet: Set<string> | null = null
) => {
    const { dragGroup, floatingLabels } = mouse;
    const atomCount = atoms.length;
    
    // --- PASS 1: Valency Enforcement (Smart Shedding) ---
    for (let i = 0; i < atomCount; i++) {
        const a = atoms[i];
        if (!a) continue; 
        if (dragGroup && dragGroup.has(a.id)) continue; 
        if (protectionSet && protectionSet.has(a.id)) continue; 
        
        // Skip annealing if atom is cooling down (Stabilizing)
        if ((a.cooldown || 0) > 0) continue;

        const maxValency = COVALENT_Z.has(a.element.z) ? a.element.v : 8; 
        
        if (a.bonds.length > maxValency) {
            const bondScores = a.bonds.map(bid => {
                const b = atoms.find(x => x.id === bid);
                if (!b) return { id: bid, score: 1000 };

                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dz = b.z - a.z;
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
                
                const order = getBondOrder(a, bid);
                const restScale = 0.9 - ((order - 1) * 0.12);
                const ideal = (a.radius + b.radius) * restScale;
                const ratio = dist / ideal;
                const strain = Math.abs(ratio - 1);

                let score = strain;
                if (ratio < 1.0) score *= 1.5; 
                if (strain < 0.35) score *= 0.1; 

                return { id: bid, score };
            });

            bondScores.sort((x, y) => x.score - y.score);
            const bondsToKeep = new Set(bondScores.slice(0, maxValency).map(b => b.id));
            
            const currentBonds = [...a.bonds]; 
            for (const bid of currentBonds) {
                if (!bondsToKeep.has(bid)) {
                    if (breakBond(atoms, a, bid)) {
                        killRelatedLabels(floatingLabels, a.id, bid);
                    }
                    const b = atoms.find(x => x.id === bid);
                    if (b) {
                        const dx = b.x - a.x;
                        const dy = b.y - a.y;
                        const dz = b.z - a.z;
                        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
                        const push = 5.0; 
                        const totalMass = a.mass + b.mass;
                        
                        a.vx += (dx/dist) * push * (a.mass / totalMass);
                        a.vy += (dy/dist) * push * (a.mass / totalMass);
                        a.vz += (dz/dist) * push * (a.mass / totalMass);

                        a.vx -= (dx/dist) * push * (b.mass / totalMass);
                        a.vy -= (dy/dist) * push * (b.mass / totalMass);
                        a.vz -= (dz/dist) * push * (b.mass / totalMass);
                    }
                }
            }
        }
    }

    // --- PASS 2: Structural Optimization (Homonuclear cleanup) ---
    for (let i = 0; i < atomCount; i++) {
        const a = atoms[i];
        if (!a) continue;
        if (a.bonds.length === 0) continue;
        if (dragGroup && dragGroup.has(a.id)) continue;
        if (protectionSet && protectionSet.has(a.id)) continue;
        
        // Skip annealing if atom is cooling down
        if ((a.cooldown || 0) > 0) continue;

        const homonuclearBondId = a.bonds.find(bid => {
            const b = atoms.find(x => x.id === bid);
            return b && b.element.z === a.element.z;
        });

        if (homonuclearBondId) {
            const myValency = COVALENT_Z.has(a.element.z) ? a.element.v : 6;
            if (myValency <= 2) { 
                const betterHub = atoms.find(c => {
                    if (c.id === a.id || c.id === homonuclearBondId || a.bonds.includes(c.id)) return false;
                    const cMax = COVALENT_Z.has(c.element.z) ? c.element.v : 6;
                    if (cMax <= myValency) return false; 
                    if (c.bonds.length >= cMax) return false; 

                    const dx = c.x - a.x;
                    const dy = c.y - a.y;
                    const dz = c.z - a.z;
                    return (dx*dx + dy*dy + dz*dz < (a.radius * 4.5) ** 2);
                });

                if (betterHub) {
                    if (breakBond(atoms, a, homonuclearBondId)) {
                        killRelatedLabels(floatingLabels, a.id, homonuclearBondId);
                    }
                    const dx = betterHub.x - a.x;
                    const dy = betterHub.y - a.y;
                    const dz = betterHub.z - a.z;
                    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
                    
                    const impulse = 10.0;
                    const totalMass = a.mass + betterHub.mass;
                    
                    a.vx += (dx/dist) * impulse * (betterHub.mass / totalMass);
                    a.vy += (dy/dist) * impulse * (betterHub.mass / totalMass);
                    a.vz += (dz/dist) * impulse * (betterHub.mass / totalMass);
                    
                    betterHub.vx -= (dx/dist) * impulse * (a.mass / totalMass);
                    betterHub.vy -= (dy/dist) * impulse * (a.mass / totalMass);
                    betterHub.vz -= (dz/dist) * impulse * (a.mass / totalMass);
                    
                    continue; 
                }
            }
        }
    }
};

// --- Layer 2: Interactions (Forces Accumulated into fx/fy/fz) ---

export const resolveInteractions = (
    atoms: Atom[], 
    particles: Particle[], 
    mouse: MouseState, 
    protectionSet: Set<string> | null = null
) => {
    const { dragGroup, floatingLabels } = mouse;
    const atomCount = atoms.length;

    const GENTLE_THRESHOLD_SQ = 100; 
    const FORCE_THRESHOLD_SQ = 225;  

    for (let i = atomCount - 1; i >= 0; i--) {
        const a = atoms[i];
        if (!a) continue; 
        
        for (let j = i - 1; j >= 0; j--) {
            const b = atoms[j];
            if (!b) continue;

            if (dragGroup && dragGroup.has(a.id) && dragGroup.has(b.id)) continue;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dz = b.z - a.z;
            const distSq = dx*dx + dy*dy + dz*dz;
            const dist = Math.sqrt(distSq) || 0.001; 
            
            const nx = dx / dist;
            const ny = dy / dist;
            const nz = dz / dist;
            
            const bondExists = a.bonds.includes(b.id);

            if (bondExists) {
                // --- BOND PHYSICS (Springs) ---
                const order = getBondOrder(a, b.id);
                const restScale = 0.9 - ((order - 1) * 0.12);
                const idealDist = (a.radius + b.radius) * restScale;

                if (dist > idealDist * 5.0) {
                     // Check for Cooldown Protection
                     if ((a.cooldown || 0) <= 0 && (b.cooldown || 0) <= 0) {
                         breakBond(atoms, a, b.id);
                         killRelatedLabels(floatingLabels, a.id, b.id);
                     }
                }

                const displacement = dist - idealDist;
                const springForce = BOND_STIFFNESS * displacement;
                
                const rvx = b.vx - a.vx;
                const rvy = b.vy - a.vy;
                const rvz = b.vz - a.vz;
                const vRelProj = rvx*nx + rvy*ny + rvz*nz;
                const dampingForce = BOND_DAMPING * vRelProj;

                const totalForce = springForce + dampingForce;

                const fx = nx * totalForce;
                const fy = ny * totalForce;
                const fz = nz * totalForce;

                a.fx += fx; a.fy += fy; a.fz += fz;
                b.fx -= fx; b.fy -= fy; b.fz -= fz;

            } else {
                // --- NON-BONDED INTERACTIONS ---

                // 1. Electrostatics (Ions only)
                if ((a.charge || 0) !== 0 && (b.charge || 0) !== 0) {
                    const q1 = a.charge || 0;
                    const q2 = b.charge || 0;
                    if (dist > 20) { 
                        const k = 2000; 
                        const force = (k * q1 * q2) / distSq;
                        const fx = nx * force;
                        const fy = ny * force;
                        const fz = nz * force;
                        a.fx -= fx; a.fy -= fy; a.fz -= fz;
                        b.fx += fx; b.fy += fy; b.fz += fz;
                    }
                }

                // 2. Capture Interactions
                if ((a.element.z === -1 && b.element.z > 0) || (b.element.z === -1 && a.element.z > 0)) {
                    const isAElectron = a.element.z === -1;
                    const electron = isAElectron ? a : b;
                    const atom = isAElectron ? b : a;
                    const hitRadius = atom.radius + electron.radius; 
                    if (distSq < hitRadius * hitRadius) {
                        const currentCharge = atom.charge || 0;
                        const vRelSq = (atom.vx-electron.vx)**2 + (atom.vy-electron.vy)**2 + (atom.vz-electron.vz)**2;
                        const isAttracted = currentCharge > 0;
                        const isHighSpeed = vRelSq > 225 && currentCharge > -4; 
                        if (isAttracted || isHighSpeed) {
                            atom.charge = currentCharge - 1;
                            if (atom.element.z === 1 && atom.charge === 0) {
                                const hElem = ELEMENTS.find(e => e.z === 1);
                                if (hElem) { atom.element = hElem; atom.radius = 30 + Math.pow(atom.mass, 0.33) * 10; }
                            }
                            createExplosion(particles, electron.x, electron.y, '#FFFFFF', 8);
                            const massRatio = electron.mass / atom.mass;
                            atom.vx += (electron.vx - atom.vx) * massRatio;
                            atom.vy += (electron.vy - atom.vy) * massRatio;
                            atom.vz += (electron.vz - atom.vz) * massRatio;
                            if (isAElectron) { atoms.splice(i, 1); break; } else { atoms.splice(j, 1); continue; }
                        }
                    }
                }
                
                if ((a.element.z === 0 && b.element.z >= 1) || (b.element.z === 0 && a.element.z >= 1)) {
                    const neutronIdx = a.element.z === 0 ? i : j;
                    const target = a.element.z === 0 ? b : a;
                    const neutron = a.element.z === 0 ? a : b;
                    const combinedRadius = a.radius + b.radius;
                    const vRelSq = (target.vx-neutron.vx)**2 + (target.vy-neutron.vy)**2 + (target.vz-neutron.vz)**2;
                    const isHighEnergy = vRelSq > 225;
                    const radiusMult = isHighEnergy ? 0.95 : 0.6;
                    if (distSq < (combinedRadius * radiusMult) ** 2) {
                        const captureProb = isHighEnergy ? 1.0 : 0.05;
                        if (Math.random() < captureProb) {
                            if (target.element.z === 1) {
                                const hElem = ELEMENTS.find(e => e.z === 1);
                                if (hElem && target.element !== hElem) target.element = hElem;
                            }
                            const el = target.element;
                            const newMass = target.mass + 1;
                            let newIsoIndex = el.iso.findIndex(iso => Math.abs(iso.m - newMass) < 0.5);
                            if (newIsoIndex === -1) {
                                target.mass += 1;
                                target.radius = 30 + Math.pow(target.mass, 0.33) * 10; 
                                target.customIsotope = { m: target.mass, hl: 0.05, mode: 'beta-', p: { z: el.z + 1, m: target.mass } };
                                target.lastDecayCheck = Date.now();
                                createExplosion(particles, target.x, target.y, '#00FFFF', 10);
                            } else {
                                target.isotopeIndex = newIsoIndex;
                                target.mass = el.iso[newIsoIndex].m;
                                target.radius = 30 + Math.pow(target.mass, 0.33) * 10; 
                                target.lastDecayCheck = Date.now(); target.customIsotope = undefined;
                                createExplosion(particles, target.x, target.y, '#00FFFF', 15);
                            }
                            target.vx += neutron.vx * 0.1; target.vy += neutron.vy * 0.1;
                            if (neutronIdx === i) { atoms.splice(i, 1); break; } else { atoms.splice(j, 1); continue; }
                        }
                    }
                }

                // 3. Pauli Repulsion (Soft Body)
                const touchDist = a.radius + b.radius;
                if (distSq < (touchDist * touchDist * 1.2)) {
                    const overlap = touchDist - dist;
                    const cappedOverlap = Math.min(overlap, 10.0);
                    
                    if (overlap > 0) {
                        const springK = 0.8; 
                        const force = springK * cappedOverlap;
                        const fx = nx * force;
                        const fy = ny * force;
                        const fz = nz * force;

                        a.fx -= fx; a.fy -= fy; a.fz -= fz;
                        b.fx += fx; b.fy += fy; b.fz += fz;
                    }
                    
                    // 4. Bond Formation
                    if (a.element.z >= 1 && b.element.z >= 1) {
                        const aVal = COVALENT_Z.has(a.element.z) ? a.element.v : 8;
                        const bVal = COVALENT_Z.has(b.element.z) ? b.element.v : 8;
                        
                        const dvx = a.vx - b.vx;
                        const dvy = a.vy - b.vy;
                        const dvz = a.vz - b.vz;
                        const vRelSq = dvx*dvx + dvy*dvy + dvz*dvz;

                        const hasSpace = a.bonds.length < aVal && b.bonds.length < bVal;
                        const isGentle = vRelSq < GENTLE_THRESHOLD_SQ;
                        const isForced = vRelSq > FORCE_THRESHOLD_SQ;

                        if ((hasSpace && isGentle) || isForced) {
                            addBond(a, b);
                            
                            const flashColor = isForced ? '#FFDD44' : '#FFFFFF';
                            createExplosion(particles, (a.x+b.x)/2, (a.y+b.y)/2, flashColor, 3);
                            trySpawnLabel(atoms, a, floatingLabels);
                            
                            const totalMass = a.mass + b.mass;
                            const avgVx = (a.vx * a.mass + b.vx * b.mass) / totalMass;
                            const avgVy = (a.vy * a.mass + b.vy * b.mass) / totalMass;
                            const avgVz = (a.vz * a.mass + b.vz * b.mass) / totalMass;
                            
                            a.vx = avgVx; a.vy = avgVy; a.vz = avgVz;
                            b.vx = avgVx; b.vy = avgVy; b.vz = avgVz;

                            const idealDist = (a.radius + b.radius) * 0.9;
                            const midX = (a.x + b.x) / 2;
                            const midY = (a.y + b.y) / 2;
                            const midZ = (a.z + b.z) / 2;
                            
                            a.x = midX - nx * (idealDist * 0.5);
                            a.y = midY - ny * (idealDist * 0.5);
                            a.z = midZ - nz * (idealDist * 0.5);

                            b.x = midX + nx * (idealDist * 0.5);
                            b.y = midY + ny * (idealDist * 0.5);
                            b.z = midZ + nz * (idealDist * 0.5);
                        }
                    }
                }
            }
        }
    }
};
