
import { Atom, Particle, SimulationEvent } from '../../../types';
import { ELEMENTS, NEUTRON_ELEM } from '../../../elements';
import { createExplosion } from '../../effects';
import { removeAtomFromWorld, addAtomToWorld } from '../../utils';

export class DecaySystem {
    public static process(atoms: Atom[], particles: Particle[], dt: number, eventLog?: SimulationEvent[]) {
        const now = Date.now();
        const MIN_GRACE_PERIOD = 300; 
    
        for (let i = atoms.length - 1; i >= 0; i--) {
            const atom = atoms[i];
            if (!atom) continue;
    
            // Particle Decay (Quarks/Unstable Leptons/Bosons)
            // Z=1000 (Quarks/Bosons) or Z < 0 (Leptons)
            if (atom.element.z === 1000 || atom.element.z < 0) {
                
                // 1. Stable Leptons: Electrons and Positrons persist indefinitely
                if (atom.element.s === 'e⁻' || atom.element.s === 'e⁺') {
                    continue;
                } 
                
                // 2. Up/Down Quarks: Give them time (5s) to hadronize into Protons/Neutrons
                if (['U','D','u','d','ū','d̄'].includes(atom.element.s)) {
                    if (now - atom.createdAt > 5000) {
                        createExplosion(particles, atom.x, atom.y, atom.z, '#FFA500', 5);
                        removeAtomFromWorld(atoms, i, eventLog, 'Particle Decay');
                    }
                    continue;
                }
                
                // 3. Unstable Particles: Higgs, W/Z, Gluons, Muons, Taus, Heavy Quarks, Neutrinos
                // Decay rapidly (500ms) to represent short lifespans or leaving the simulation bounds
                if (now - atom.createdAt > 500) {
                    createExplosion(particles, atom.x, atom.y, atom.z, '#FF00FF', 8);
                    removeAtomFromWorld(atoms, i, eventLog, 'Particle Decay');
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
                    DecaySystem.handleFission(atoms, particles, atom, i, now, eventLog);
                    continue;
                }
    
                // --- Standard Decay ---
                
                if (iso.p) {
                    createExplosion(particles, atom.x, atom.y, atom.z, '#33FF00', 5);
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
                    // FALLBACK: If no decay mode/product is defined
                    // If element is Heavy (Z >= 90), assume Spontaneous Fission (SF) instead of vanishing
                    if (atom.element.z >= 90) {
                        DecaySystem.handleFission(atoms, particles, atom, i, now, eventLog);
                    } else {
                        removeAtomFromWorld(atoms, i, eventLog, 'Nuclear Decay');
                    }
                }
            }
        }
    }

    private static handleFission(atoms: Atom[], particles: Particle[], atom: Atom, index: number, now: number, eventLog?: SimulationEvent[]) {
        createExplosion(particles, atom.x, atom.y, atom.z, '#FF8800', 30);
                
        const z = atom.element.z;
        const ratio = 0.4 + (Math.random() * 0.2); // Split into ~40/60
        const z1 = Math.floor(z * ratio);
        const z2 = z - z1;
        
        const elem1 = ELEMENTS.find(e => e.z === z1);
        const elem2 = ELEMENTS.find(e => e.z === z2);
        
        if (elem1 && elem2) {
            removeAtomFromWorld(atoms, index, eventLog, 'Spontaneous Fission');
            
            const theta = Math.random() * Math.PI * 2;
            const cos = Math.cos(theta);
            const sin = Math.sin(theta);
            
            // Increased separation distance to prevent immediate neutron capture
            // Daughters (Radius ~40-50) need safe spacing. 
            const dist = 100; 
            const kick = 12.0; 
            
            const d1 = {
                id: Math.random().toString(36),
                x: atom.x + cos * dist, 
                y: atom.y + sin * dist, 
                z: atom.z,
                vx: atom.vx + cos * kick,
                vy: atom.vy + sin * kick,
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
            
            const d2 = {
                id: Math.random().toString(36),
                x: atom.x - cos * dist, 
                y: atom.y - sin * dist, 
                z: atom.z,
                vx: atom.vx - cos * kick,
                vy: atom.vy - sin * kick,
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
            
            const neutronCount = 2 + Math.floor(Math.random() * 2);
            for(let n=0; n<neutronCount; n++) {
                // Spawn neutrons perpendicular to fission axis
                const nTheta = theta + Math.PI/2 + (Math.random() - 0.5);
                const nCos = Math.cos(nTheta);
                const nSin = Math.sin(nTheta);
                const nSpeed = 35;
                // Eject from 200px away as requested
                const nDist = 200;

                const neutron = {
                    id: Math.random().toString(36),
                    x: atom.x + nCos * nDist, 
                    y: atom.y + nSin * nDist, 
                    z: atom.z + (Math.random()-0.5)*20,
                    vx: atom.vx + nCos * nSpeed,
                    vy: atom.vy + nSin * nSpeed,
                    vz: atom.vz + (Math.random()-0.5)*5,
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
            // If we can't find daughters (e.g. Z is too small), just remove it
            removeAtomFromWorld(atoms, index, eventLog, 'Fission Error');
        }
    }
}
