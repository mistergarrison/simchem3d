
import { Atom, Particle, SimulationEvent } from '../types';
import { ELEMENTS, NEUTRON_ELEM, PROTON_ELEM, SM_PARTICLES, getParticleElementData } from '../elements';
import { createExplosion } from './effects';
import { addAtomToWorld, removeAtomFromWorld } from './utils';

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

// Internal local logging helper removed; using utils/addAtomToWorld instead

export const attemptFusion = (atoms: Atom[], particles: Particle[], subset: Set<string>) => {
    const group = atoms.filter(a => a && subset.has(a.id));
    if (group.length < 2) return;

    let cx = 0, cy = 0;
    group.forEach(a => { cx += a.x; cy += a.y; });
    cx /= group.length; cy /= group.length;

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
                        createdAt: Date.now(),
                        lastDecayCheck: Date.now()
                    };
                    
                    // Fusion doesn't pass eventLog ref currently, but it's rare.
                    // Ideally we'd pass eventLog here too, but for now we push directly.
                    atoms.push(product);
                    
                    createExplosion(particles, cx, cy, 0, '#FFDD00', 25);
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

export const spawnPairProduction = (
    atoms: Atom[],
    particles: Particle[],
    x: number,
    y: number,
    energy: number,
    onUnlock?: (id: string) => void,
    eventLog?: SimulationEvent[]
): Atom[] => {
    const THRESHOLDS = [1.022, 4.4, 9.4];
    let target = 0;
    let minDiff = Infinity;
    
    for (const t of THRESHOLDS) {
         const diff = Math.abs(energy - t);
         if (diff < minDiff) {
             minDiff = diff;
             target = t;
         }
    }

    // Tolerance check (5%)
    if (target === 0 || minDiff / target > 0.05) return [];

    let p1Id = '', p2Id = '';
    if (Math.abs(target - 1.022) < 0.1) { p1Id = 'electron'; p2Id = 'positron'; }
    else if (Math.abs(target - 4.4) < 0.2) { p1Id = 'up'; p2Id = 'anti-up'; }
    else if (Math.abs(target - 9.4) < 0.4) { p1Id = 'down'; p2Id = 'anti-down'; }
    else return [];

    const el1 = getParticleElementData(p1Id);
    const el2 = getParticleElementData(p2Id);
    const def1 = SM_PARTICLES.find(x => x.id === p1Id);
    const def2 = SM_PARTICLES.find(x => x.id === p2Id);
    const mass1 = def1 ? def1.massMeV / 931.5 : 0.0005; 
    const mass2 = def2 ? def2.massMeV / 931.5 : 0.0005;
    const r1 = 30; 
    const r2 = 30;

    const theta = Math.random() * Math.PI * 2;
    const speed = 50; 
    const offsetDist = 40; 
    const now = Date.now();

    const p1: Atom = {
            id: Math.random().toString(36),
            x: x + Math.cos(theta) * offsetDist, 
            y: y + Math.sin(theta) * offsetDist, 
            z: 0,
            vx: Math.cos(theta) * speed, vy: Math.sin(theta) * speed, vz: 0,
            fx: 0, fy: 0, fz: 0,
            element: el1,
            isotopeIndex: 0,
            bonds: [],
            mass: mass1,
            radius: r1,
            charge: def1?.charge,
            createdAt: now,
            lastDecayCheck: now
    };
    const p2: Atom = {
            id: Math.random().toString(36),
            x: x - Math.cos(theta) * offsetDist, 
            y: y - Math.sin(theta) * offsetDist, 
            z: 0,
            vx: -Math.cos(theta) * speed, vy: -Math.sin(theta) * speed, vz: 0,
            fx: 0, fy: 0, fz: 0,
            element: el2,
            isotopeIndex: 0,
            bonds: [],
            mass: mass2,
            radius: r2,
            charge: def2?.charge,
            createdAt: now,
            lastDecayCheck: now
    };
    
    addAtomToWorld(atoms, p1, eventLog, 'Pair Production');
    addAtomToWorld(atoms, p2, eventLog, 'Pair Production');

    createExplosion(particles, x, y, 0, '#FFFFFF', 15);
    if (onUnlock) {
        onUnlock(p1Id);
        onUnlock(p2Id);
    }

    return [p1, p2];
};

export const resolveHadronization = (atoms: Atom[], particles: Particle[], eventLog?: SimulationEvent[]) => {
    const quarks = atoms.filter(a => a.element.z === 1000);
    if (quarks.length < 3) return;

    const usedIds = new Set<string>();
    const toRemoveIds = new Set<string>();
    // Increased Proximity Square (500px^2) to allow easier gathering
    const PROXIMITY_SQ = 500 * 500; 
    const FUSION_DIST_SQ = 12 * 12; 
    const pendingAdditions: Atom[] = [];

    for (let i = 0; i < quarks.length; i++) {
        if (usedIds.has(quarks[i].id)) continue;
        
        for (let j = i + 1; j < quarks.length; j++) {
            if (usedIds.has(quarks[j].id)) continue;
            
            const dx1 = quarks[i].x - quarks[j].x;
            const dy1 = quarks[i].y - quarks[j].y;
            const dz1 = quarks[i].z - quarks[j].z;
            if (dx1*dx1 + dy1*dy1 + dz1*dz1 > PROXIMITY_SQ) continue;

            for (let k = j + 1; k < quarks.length; k++) {
                if (usedIds.has(quarks[k].id)) continue;

                const dx2 = quarks[i].x - quarks[k].x;
                const dy2 = quarks[i].y - quarks[k].y;
                const dz2 = quarks[i].z - quarks[k].z;
                if (dx2*dx2 + dy2*dy2 + dz2*dz2 > PROXIMITY_SQ) continue;

                const dx3 = quarks[j].x - quarks[k].x;
                const dy3 = quarks[j].y - quarks[k].y;
                const dz3 = quarks[j].z - quarks[k].z;
                if (dx3*dx3 + dy3*dy3 + dz3*dz3 > PROXIMITY_SQ) continue;

                // Triplet found within range
                const triplet = [quarks[i], quarks[j], quarks[k]];
                let uCount = 0;
                let dCount = 0;
                triplet.forEach(q => {
                    if (q.element.s === 'U') uCount++;
                    else if (q.element.s === 'u') uCount++; 
                    
                    if (q.element.s === 'D') dCount++;
                    else if (q.element.s === 'd') dCount++; 
                });

                let product = null;
                let color = '';

                if (uCount === 2 && dCount === 1) {
                    product = PROTON_ELEM;
                    color = '#FF3333';
                } else if (uCount === 1 && dCount === 2) {
                    product = NEUTRON_ELEM;
                    color = '#3333FF';
                }

                if (product) {
                    // Center of Mass
                    const cx = (quarks[i].x + quarks[j].x + quarks[k].x) / 3;
                    const cy = (quarks[i].y + quarks[j].y + quarks[k].y) / 3;
                    const cz = (quarks[i].z + quarks[j].z + quarks[k].z) / 3;

                    // Calculate max distance from center to see if we are "imploded" enough
                    const d1 = (quarks[i].x-cx)**2 + (quarks[i].y-cy)**2 + (quarks[i].z-cz)**2;
                    const d2 = (quarks[j].x-cx)**2 + (quarks[j].y-cy)**2 + (quarks[j].z-cz)**2;
                    const d3 = (quarks[k].x-cx)**2 + (quarks[k].y-cy)**2 + (quarks[k].z-cz)**2;
                    const maxDistSq = Math.max(d1, d2, d3);

                    if (maxDistSq > FUSION_DIST_SQ) {
                        // Pull together (Fly-in animation)
                        const pullStrength = 0.15; 
                        [quarks[i], quarks[j], quarks[k]].forEach(q => {
                            q.vx += (cx - q.x) * pullStrength;
                            q.vy += (cy - q.y) * pullStrength;
                            q.vz += (cz - q.z) * pullStrength;
                            q.vx *= 0.8; q.vy *= 0.8; q.vz *= 0.8;
                        });
                        
                        // Mark used so we don't try to fuse them with others this frame, but DO NOT remove yet
                        usedIds.add(quarks[i].id);
                        usedIds.add(quarks[j].id);
                        usedIds.add(quarks[k].id);
                        continue;
                    }

                    // --- FUSION ---
                    usedIds.add(quarks[i].id); usedIds.add(quarks[j].id); usedIds.add(quarks[k].id);
                    toRemoveIds.add(quarks[i].id); toRemoveIds.add(quarks[j].id); toRemoveIds.add(quarks[k].id);
                    
                    // Avg Velocity
                    const totalMass = quarks[i].mass + quarks[j].mass + quarks[k].mass;
                    const vx = (quarks[i].vx * quarks[i].mass + quarks[j].vx * quarks[j].mass + quarks[k].vx * quarks[k].mass) / totalMass;
                    const vy = (quarks[i].vy * quarks[i].mass + quarks[j].vy * quarks[j].mass + quarks[k].vy * quarks[k].mass) / totalMass;
                    const vz = (quarks[i].vz * quarks[i].mass + quarks[j].vz * quarks[j].mass + quarks[k].vz * quarks[k].mass) / totalMass;

                    const newAtom: Atom = {
                        id: Math.random().toString(36),
                        x: cx, y: cy, z: cz,
                        vx, vy, vz,
                        fx: 0, fy: 0, fz: 0,
                        // FIX: Use PROTON_ELEM directly to ensure 'p+' symbol is preserved for testing
                        element: product === PROTON_ELEM ? PROTON_ELEM : NEUTRON_ELEM,
                        isotopeIndex: 0,
                        mass: product === PROTON_ELEM ? 1.007 : 1.008,
                        radius: 20, // Standard nucleon radius
                        charge: product === PROTON_ELEM ? 1 : 0,
                        bonds: [],
                        createdAt: Date.now(),
                        lastDecayCheck: Date.now()
                    };
                    
                    createExplosion(particles, cx, cy, cz, color, 20);
                    pendingAdditions.push(newAtom);
                    
                    // Use helper to ensure consistent event logging
                    // NOTE: Removal here is deferred to batch, so we manually log destroy.
                    if (eventLog) {
                        eventLog.push({type: 'destroy', atomId: quarks[i].id, label: quarks[i].element.s, reason: 'Hadronization', timestamp: Date.now()});
                        eventLog.push({type: 'destroy', atomId: quarks[j].id, label: quarks[j].element.s, reason: 'Hadronization', timestamp: Date.now()});
                        eventLog.push({type: 'destroy', atomId: quarks[k].id, label: quarks[k].element.s, reason: 'Hadronization', timestamp: Date.now()});
                        eventLog.push({type: 'create', atomId: newAtom.id, label: newAtom.element.s, reason: 'Hadronization', timestamp: Date.now()});
                    }
                    break; 
                }
            }
        }
    }
    
    if (toRemoveIds.size > 0) {
        for (let i = atoms.length - 1; i >= 0; i--) {
            if (toRemoveIds.has(atoms[i].id)) {
                atoms.splice(i, 1);
            }
        }
        atoms.push(...pendingAdditions);
    }
};

export const processDecay = (atoms: Atom[], particles: Particle[], dt: number, eventLog?: SimulationEvent[]) => {
    const now = Date.now();
    const MIN_GRACE_PERIOD = 300; 

    for (let i = atoms.length - 1; i >= 0; i--) {
        const atom = atoms[i];
        if (!atom) continue;

        // FIXED: Only Quarks (Z=1000) and Leptons (Z < 0) are subject to "Particle Decay" timeout.
        // Elements (Z >= 0) persist until nuclear decay.
        if (atom.element.z === 1000 || atom.element.z < 0) {
            if (atom.element.z < 0) {
                // Keep them alive (Electrons/Positrons)
            } 
            else if (['U','D','u','d','ū','d̄'].includes(atom.element.s)) {
                if (now - atom.createdAt > 5000) {
                    createExplosion(particles, atom.x, atom.y, atom.z, '#FFA500', 5);
                    removeAtomFromWorld(atoms, i, eventLog, 'Particle Decay');
                    continue;
                }
            }
            else {
                if (now - atom.createdAt > 500) {
                    createExplosion(particles, atom.x, atom.y, atom.z, '#FF00FF', 8);
                    removeAtomFromWorld(atoms, i, eventLog, 'Particle Decay');
                    continue;
                }
            }
            continue;
        }
        
        if (atom.lastDecayCheck && (now - atom.lastDecayCheck < MIN_GRACE_PERIOD)) {
            continue;
        }
        
        const iso = atom.customIsotope || atom.element.iso[atom.isotopeIndex];
        if (!iso || iso.hl === 'stable') continue;
        
        let rawHl = typeof iso.hl === 'number' ? iso.hl : Infinity;
        if (rawHl === Infinity) continue;
        
        const hl = Math.max(rawHl, 0.3);
        const lambda = 0.693147 / hl;
        const prob = 1 - Math.exp(-lambda * dt);
        
        if (Math.random() < prob) {
            const mode = iso.mode || '';
            
            if (mode === 'sf') {
                createExplosion(particles, atom.x, atom.y, atom.z, '#FF8800', 30);
                
                const z = atom.element.z;
                const ratio = 0.4 + (Math.random() * 0.2);
                const z1 = Math.floor(z * ratio);
                const z2 = z - z1;
                
                const elem1 = ELEMENTS.find(e => e.z === z1);
                const elem2 = ELEMENTS.find(e => e.z === z2);
                
                if (elem1 && elem2) {
                    // Remove parent using helper
                    removeAtomFromWorld(atoms, i, eventLog, 'Spontaneous Fission');
                    
                    const theta = Math.random() * Math.PI * 2;
                    const kick = 8.0; 
                    
                    // Daughter 1
                    const d1 = {
                        id: Math.random().toString(36),
                        x: atom.x, y: atom.y, z: atom.z,
                        vx: atom.vx + Math.cos(theta) * kick,
                        vy: atom.vy + Math.sin(theta) * kick,
                        vz: atom.vz,
                        fx: 0, fy: 0, fz: 0,
                        element: elem1,
                        isotopeIndex: 0,
                        mass: elem1.iso[0].m,
                        radius: 30 + Math.pow(elem1.iso[0].m, 0.33) * 10,
                        bonds: [],
                        createdAt: now,
                        lastDecayCheck: now
                    };
                    addAtomToWorld(atoms, d1, eventLog, 'Fission Daughter');
                    
                    // Daughter 2
                    const d2 = {
                        id: Math.random().toString(36),
                        x: atom.x, y: atom.y, z: atom.z,
                        vx: atom.vx - Math.cos(theta) * kick,
                        vy: atom.vy - Math.sin(theta) * kick,
                        vz: atom.vz,
                        fx: 0, fy: 0, fz: 0,
                        element: elem2,
                        isotopeIndex: 0,
                        mass: elem2.iso[0].m,
                        radius: 30 + Math.pow(elem2.iso[0].m, 0.33) * 10,
                        bonds: [],
                        createdAt: now,
                        lastDecayCheck: now
                    };
                    addAtomToWorld(atoms, d2, eventLog, 'Fission Daughter');
                    
                    // Neutrons
                    const neutronCount = 2 + Math.floor(Math.random() * 2);
                    for(let n=0; n<neutronCount; n++) {
                        const nTheta = Math.random() * Math.PI * 2;
                        const nSpeed = 25;
                        const neutron = {
                            id: Math.random().toString(36),
                            x: atom.x, y: atom.y, z: atom.z,
                            vx: atom.vx + Math.cos(nTheta) * nSpeed,
                            vy: atom.vy + Math.sin(nTheta) * nSpeed,
                            vz: atom.vz,
                            fx: 0, fy: 0, fz: 0,
                            element: NEUTRON_ELEM,
                            isotopeIndex: 0,
                            mass: 1.008,
                            radius: 20,
                            charge: 0,
                            bonds: [],
                            createdAt: now,
                            lastDecayCheck: now
                        };
                        addAtomToWorld(atoms, neutron, eventLog, 'Fission Neutron');
                    }
                } else {
                    removeAtomFromWorld(atoms, i, eventLog, 'Fission Error');
                }
                continue;
            }

            // --- Standard Decay ---
            createExplosion(particles, atom.x, atom.y, atom.z, '#33FF00', 5);
            
            if (iso.p) {
                const pZ = iso.p.z;
                const pM = iso.p.m;
                const newElem = ELEMENTS.find(e => e.z === pZ);
                
                if (newElem) {
                    // Transmute existing atom object
                    let newIsoIndex = newElem.iso.findIndex(i => Math.abs(i.m - pM) < 0.5);
                    if (newIsoIndex === -1) newIsoIndex = 0;
                    
                    atom.element = newElem;
                    atom.isotopeIndex = newIsoIndex;
                    atom.mass = newElem.iso[newIsoIndex].m;
                    atom.customIsotope = undefined;
                    atom.lastDecayCheck = now; 
                    
                    if (atom.element.z === 1) {
                        if (atom.mass < 1.6 && (atom.charge || 0) >= 1) {
                            atom.radius = 20;
                        } else {
                            atom.radius = 30 + Math.pow(atom.mass, 0.33) * 10;
                        }
                    } else {
                        atom.radius = 30 + Math.pow(atom.mass, 0.33) * 10;
                    }

                    // Log Creation event for the new Element identity
                    // Technically it's the same object ID, but scientifically a new atom.
                    if (eventLog) {
                        eventLog.push({type: 'create', atomId: atom.id, label: atom.element.s, reason: 'Radioactive Decay', timestamp: Date.now()});
                    }
                    
                    // Recoil
                    let recoil = 0;
                    let pColor = '#FFFFFF';
                    let pSize = 2;
                    
                    if (mode.includes('alpha')) {
                        recoil = 3.0; pColor = '#FFFF00'; pSize = 4;
                    } else if (mode.includes('beta')) {
                        recoil = 0.8; pColor = '#00FFFF'; pSize = 2;
                    }
                    
                    if (recoil > 0) {
                        const theta = Math.random() * Math.PI * 2;
                        atom.vx -= Math.cos(theta) * recoil;
                        atom.vy -= Math.sin(theta) * recoil;
                        
                        particles.push({
                            id: Math.random().toString(),
                            x: atom.x, y: atom.y, z: atom.z,
                            vx: Math.cos(theta) * recoil * 4,
                            vy: Math.sin(theta) * recoil * 4,
                            vz: 0,
                            life: 1.0, maxLife: 1.0,
                            color: pColor, size: pSize
                        });
                    }
                } else {
                    console.warn(`[Nuclear] Decay target Z=${pZ} not found for ${atom.element.s}. Atom destroyed.`);
                    removeAtomFromWorld(atoms, i, eventLog, 'Nuclear Decay (Target Missing)');
                }
            } else {
                removeAtomFromWorld(atoms, i, eventLog, 'Nuclear Decay');
            }
        }
    }
};
