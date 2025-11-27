
import { Atom, Particle, SimulationEvent } from '../types';
import { MouseState } from './types';
import { COVALENT_Z, BOND_STIFFNESS, BOND_DAMPING, PAULI_STIFFNESS } from './constants';
import { addBond, breakBond, getBondOrder, redistributeCharge, getMoleculeGroup, removeAtomFromWorld } from './utils';
import { createExplosion } from './effects';
import { killRelatedLabels, trySpawnLabel } from './molecular_utils';
import { ELEMENTS, PROTON_ELEM, NEUTRON_ELEM, SM_PARTICLES } from '../elements';

export interface CaptureResult {
    captured: boolean;
    removedIndex: number;
}

export interface AnnihilationResult {
    annihilated: boolean;
    removedIndex?: number;
}

/**
 * Validates if a bond is chemically permissible based on Intro Chemistry rules.
 */
const canFormBond = (atoms: Atom[], a: Atom, b: Atom) => {
    const zA = a.element.z;
    const zB = b.element.z;
    const bondsA = a.bonds.length;
    const bondsB = b.bonds.length;

    // --- RULE 0: FUNDAMENTAL PARTICLES CANNOT BOND ---
    if (zA < 1 || zA > 118) return false;
    if (zB < 1 || zB > 118) return false;

    // --- RULE 0.5: ELECTRON REQUIREMENT ---
    const electronsA = Math.max(0, zA - (a.charge || 0));
    const electronsB = Math.max(0, zB - (b.charge || 0));
    
    if (electronsA + electronsB < 1) {
        return false;
    }

    const VALID_EXPANDERS = new Set([8, 9, 17]); // Oxygen, Fluorine, Chlorine

    // --- RULE 1: NOBLE GASES ---
    if ([2, 10, 18].includes(zA) || [2, 10, 18].includes(zB)) return false;

    const HEAVY_NOBLE = [36, 54, 86];
    if (HEAVY_NOBLE.includes(zA)) {
        if (![8, 9].includes(zB)) return false;
    }
    if (HEAVY_NOBLE.includes(zB)) {
        if (![8, 9].includes(zA)) return false;
    }

    // --- RULE 2: METAL-NONMETAL RESTRICTIONS ---
    const isAMetal = !COVALENT_Z.has(zA);
    const isBMetal = !COVALENT_Z.has(zB);

    if ((isAMetal && zB === 1) || (isBMetal && zA === 1)) return false;
    if ((isAMetal && zB === 6) || (isBMetal && zA === 6)) return false;

    // --- RULE 3: HYPERVALENCY CHECKS ---
    const HALOGENS = [17, 35, 53]; 
    if (HALOGENS.includes(zA) && bondsA >= 1 && !VALID_EXPANDERS.has(zB)) return false;
    if (HALOGENS.includes(zB) && bondsB >= 1 && !VALID_EXPANDERS.has(zA)) return false;

    const CHALCOGENS = [16, 34, 52];
    if (CHALCOGENS.includes(zA) && bondsA >= 2 && !VALID_EXPANDERS.has(zB)) return false;
    if (CHALCOGENS.includes(zB) && bondsB >= 2 && !VALID_EXPANDERS.has(zA)) return false;

    const PNICTOGENS = [15, 33, 51];
    if (PNICTOGENS.includes(zA) && bondsA >= 3 && !VALID_EXPANDERS.has(zB)) return false;
    if (PNICTOGENS.includes(zB) && bondsB >= 3 && !VALID_EXPANDERS.has(zA)) return false;

    // --- RULE 4: PREVENT 3-MEMBERED RINGS ---
    const sharesNeighbor = a.bonds.some(neighborId => 
        neighborId !== b.id && b.bonds.includes(neighborId)
    );
    
    if (sharesNeighbor) {
        return false;
    }

    return true;
};

export const InteractionLogic = {
    /**
     * Check for Particle-Antiparticle Annihilation.
     */
    attemptAnnihilation: (atoms: Atom[], particles: Particle[], a: Atom, b: Atom, i: number, j: number, distSq: number, eventLog?: SimulationEvent[]): AnnihilationResult => {
        const touchDist = a.radius + b.radius;
        if (distSq < touchDist * touchDist) {
            const defA = SM_PARTICLES.find(p => p.symbol === a.element.s);
            const defB = SM_PARTICLES.find(p => p.symbol === b.element.s);

            if (defA && defB) {
                if (defA.antiParticleId === defB.id || defB.antiParticleId === defA.id) {
                    createExplosion(particles, (a.x+b.x)/2, (a.y+b.y)/2, (a.z+b.z)/2, '#FFFFFF', 60);
                    createExplosion(particles, (a.x+b.x)/2, (a.y+b.y)/2, (a.z+b.z)/2, '#FFFF00', 20);
                    
                    // Standardized removal
                    // IMPORTANT: When removing two items from an array inside a loop, indices shift.
                    // The main loop in chemistry.ts iterates backwards, so removing i and j (where i > j) is safe
                    // IF the main loop handles the break correctly.
                    
                    // However, here we just flag the event. The chemistry.ts loop does the splice.
                    // But we should log the event here using the helper conceptually, 
                    // or let chemistry.ts handle removal.
                    
                    // Actually chemistry.ts calls splice manually if this returns true.
                    // To keep logging consistent, we should log here but NOT splice here to avoid index confusion in the loop?
                    // NO, `removeAtomFromWorld` splices.
                    // Let's rely on chemistry.ts loop to do the splice to be safe with indices,
                    // BUT we must log the event.
                    
                    if (eventLog) {
                        eventLog.push({type: 'destroy', atomId: a.id, label: a.element.s, reason: 'Annihilation', timestamp: Date.now()});
                        eventLog.push({type: 'destroy', atomId: b.id, label: b.element.s, reason: 'Annihilation', timestamp: Date.now()});
                    }

                    return { annihilated: true };
                }
            }
        }
        return { annihilated: false };
    },

    /**
     * Check for Positron Annihilating with Bound Electron in Atom
     */
    attemptPositronAnnihilation: (atoms: Atom[], particles: Particle[], a: Atom, b: Atom, i: number, j: number, distSq: number, eventLog?: SimulationEvent[]): AnnihilationResult => {
        let positron: Atom | null = null;
        let atom: Atom | null = null;
        let pIndex = -1;

        if (a.element.z === -2 && b.element.z >= 1) { positron = a; atom = b; pIndex = i; }
        else if (b.element.z === -2 && a.element.z >= 1) { positron = b; atom = a; pIndex = j; }

        if (!positron || !atom) return { annihilated: false };

        const currentCharge = atom.charge || 0;
        if (currentCharge >= atom.element.z) return { annihilated: false };

        const touchDist = positron.radius + atom.radius;
        if (distSq < touchDist * touchDist) {
            createExplosion(particles, positron.x, positron.y, positron.z, '#FFFFFF', 30);
            createExplosion(particles, positron.x, positron.y, positron.z, '#FF00FF', 10);

            // Remove Positron using helper (which splices and logs)
            removeAtomFromWorld(atoms, pIndex, eventLog, 'Positron Annihilation');

            atom.charge = currentCharge + 1;
            
            if (atom.element.z === 1) {
                if (atom.mass < 1.6 && atom.charge === 1) {
                    atom.radius = 20; 
                }
            }
            
            redistributeCharge(atoms, atom.id);
            return { annihilated: true, removedIndex: pIndex };
        }

        return { annihilated: false };
    },

    applyBondForces: (atoms: Atom[], a: Atom, b: Atom, dist: number, nx: number, ny: number, nz: number, mouse: MouseState) => {
        const order = getBondOrder(a, b.id);
        const restScale = 0.9 - ((order - 1) * 0.12);
        const idealDist = (a.radius + b.radius) * restScale;
        const isCooling = (a.cooldown || 0) > 0 || (b.cooldown || 0) > 0;

        if (dist > idealDist * 5.0) {
             if (!isCooling) {
                 breakBond(atoms, a, b.id);
                 killRelatedLabels(mouse.floatingLabels, a.id, b.id);
                 redistributeCharge(atoms, a.id);
                 redistributeCharge(atoms, b.id);
             }
        }

        const displacement = dist - idealDist;
        const strengthMult = isCooling ? 0.25 : 1.0;
        const springForce = BOND_STIFFNESS * strengthMult * displacement;
        
        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const rvz = b.vz - a.vz;
        const vRelProj = rvx*nx + rvy*ny + rvz*nz;
        
        const dampingForce = BOND_DAMPING * (isCooling ? 20.0 : 1.0) * vRelProj;
        const totalForce = springForce + dampingForce;

        const fx = nx * totalForce;
        const fy = ny * totalForce;
        const fz = nz * totalForce;

        a.fx += fx; a.fy += fy; a.fz += fz;
        b.fx -= fx; b.fy -= fy; b.fz -= fz;
    },

    applyElectrostatics: (a: Atom, b: Atom, dist: number, distSq: number, nx: number, ny: number, nz: number) => {
        if (a.element.z === 1000 && b.element.z === 1000) return;

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
    },

    attemptElectronCapture: (atoms: Atom[], particles: Particle[], a: Atom, b: Atom, i: number, j: number, distSq: number, eventLog?: SimulationEvent[]): CaptureResult => {
        if (!((a.element.z === -1 && b.element.z > 0) || (b.element.z === -1 && a.element.z > 0))) {
            return { captured: false, removedIndex: -1 };
        }

        const isAElectron = a.element.z === -1;
        const electron = isAElectron ? a : b;
        const atom = isAElectron ? b : a;
        const hitRadius = atom.radius + electron.radius; 
        
        if (distSq < (hitRadius * 1.2) ** 2) {
            const currentCharge = atom.charge || 0;
            const vRelSq = (atom.vx-electron.vx)**2 + (atom.vy-electron.vy)**2 + (atom.vz-electron.vz)**2;
            const isAttracted = currentCharge > 0;
            const isHighSpeed = vRelSq > 225 && currentCharge > -4; 
            
            if (isAttracted || isHighSpeed) {
                const mAtom = atom.mass;
                const mElec = electron.mass;
                const totalMass = mAtom + mElec;

                atom.vx = (atom.vx * mAtom + electron.vx * mElec) / totalMass;
                atom.vy = (atom.vy * mAtom + electron.vy * mElec) / totalMass;
                atom.vz = (atom.vz * mAtom + electron.vz * mElec) / totalMass;

                atom.charge = currentCharge - 1;
                atom.mass = totalMass;

                if (atom.element.z === 1) {
                    if (atom.element !== ELEMENTS[0]) {
                        atom.element = ELEMENTS[0];
                    }
                    
                    if (atom.mass < 1.6 && (atom.charge || 0) >= 1) {
                        atom.radius = 20;
                    } else {
                        atom.radius = 30 + Math.pow(atom.mass, 0.33) * 10;
                    }
                }

                createExplosion(particles, electron.x, electron.y, electron.z, '#FFFFFF', 8);
                redistributeCharge(atoms, atom.id);

                const removedIdx = isAElectron ? i : j;
                const removedAtom = isAElectron ? a : b;
                
                removeAtomFromWorld(atoms, removedIdx, eventLog, 'Electron Capture');
                
                return { captured: true, removedIndex: removedIdx };
            }
        }
        return { captured: false, removedIndex: -1 };
    },

    attemptNeutronCapture: (atoms: Atom[], particles: Particle[], a: Atom, b: Atom, i: number, j: number, distSq: number, eventLog?: SimulationEvent[]): CaptureResult => {
        if (!((a.element.z === 0 && b.element.z >= 1) || (b.element.z === 0 && a.element.z >= 1))) {
             return { captured: false, removedIndex: -1 };
        }

        const neutronIdx = a.element.z === 0 ? i : j;
        const target = a.element.z === 0 ? b : a;
        const neutron = a.element.z === 0 ? a : b;
        const combinedRadius = a.radius + b.radius;
        const vRelSq = (target.vx-neutron.vx)**2 + (target.vy-neutron.vy)**2 + (target.vz-neutron.vz)**2;
        const isHighEnergy = vRelSq > 225;
        const radiusMult = isHighEnergy ? 1.2 : 0.8; 
        
        if (distSq < (combinedRadius * radiusMult) ** 2) {
            const captureProb = isHighEnergy ? 1.0 : 0.05;
            if (Math.random() < captureProb) {
                const mTarget = target.mass;
                const mNeutron = neutron.mass;
                const totalMass = mTarget + mNeutron;

                target.vx = (target.vx * mTarget + neutron.vx * mNeutron) / totalMass;
                target.vy = (target.vy * mTarget + neutron.vy * mNeutron) / totalMass;
                target.vz = (target.vz * mTarget + neutron.vz * mNeutron) / totalMass;

                let el = target.element;
                if (el.z === 1 && el.s === 'p⁺') {
                    el = ELEMENTS[0]; 
                    target.element = el;
                }

                const newMass = target.mass + 1; 
                let newIsoIndex = el.iso.findIndex(iso => Math.abs(iso.m - newMass) < 0.5);
                
                if (newIsoIndex === -1) {
                    target.mass += 1;
                    if (target.element.z === 1) {
                        if (target.mass < 1.6 && (target.charge || 0) >= 1) {
                            target.radius = 20;
                        } else {
                            target.radius = 30 + Math.pow(target.mass, 0.33) * 10;
                        }
                    } else {
                        target.radius = 30 + Math.pow(target.mass, 0.33) * 10;
                    }
                    target.customIsotope = { m: target.mass, hl: 0.3, mode: 'beta-', p: { z: el.z + 1, m: target.mass } };
                    target.lastDecayCheck = Date.now();
                    createExplosion(particles, target.x, target.y, target.z, '#00FFFF', 10);
                } else {
                    target.isotopeIndex = newIsoIndex;
                    target.mass = el.iso[newIsoIndex].m;
                    if (target.element.z === 1) {
                        if (target.mass < 1.6 && (target.charge || 0) >= 1) {
                            target.radius = 20;
                        } else {
                            target.radius = 30 + Math.pow(target.mass, 0.33) * 10;
                        }
                    } else {
                        target.radius = 30 + Math.pow(target.mass, 0.33) * 10;
                    }
                    target.lastDecayCheck = Date.now(); 
                    target.customIsotope = undefined;
                    createExplosion(particles, target.x, target.y, target.z, '#00FFFF', 15);
                }
                
                removeAtomFromWorld(atoms, neutronIdx, eventLog, 'Neutron Capture');
                return { captured: true, removedIndex: neutronIdx };
            }
        }
        return { captured: false, removedIndex: -1 };
    },

    resolveCollisionAndBonding: (atoms: Atom[], particles: Particle[], a: Atom, b: Atom, dist: number, distSq: number, nx: number, ny: number, nz: number, mouse: MouseState) => {
        const touchDist = a.radius + b.radius;
        if (distSq < (touchDist * touchDist * 1.2)) {
            const overlap = touchDist - dist;
            const cappedOverlap = Math.min(overlap, 10.0);
            const isCooling = (a.cooldown || 0) > 0 || (b.cooldown || 0) > 0;
            
            const isQuarkPair = a.element.z === 1000 && b.element.z === 1000;

            if (overlap > 0 && !isQuarkPair) {
                let ramp = 1.0;
                
                if (isCooling) {
                    const c = Math.max(a.cooldown || 0, b.cooldown || 0);
                    if (c > 0.8) {
                        ramp = 0.0;
                    } else {
                        const progress = (0.8 - c) / 0.8; 
                        ramp = progress * progress; 
                    }
                }
                
                if (ramp > 0.001) {
                    const baseK = isCooling ? 1.0 : PAULI_STIFFNESS; 
                    const springK = baseK * ramp; 
                    
                    const force = springK * cappedOverlap;
                    const fx = nx * force;
                    const fy = ny * force;
                    const fz = nz * force;

                    a.fx -= fx; a.fy -= fy; a.fz -= fz;
                    b.fx += fx; b.fy += fy; b.fz += fz;
                }
            }
            
            if (a.element.z >= 1 && b.element.z >= 1 || (a.element.z === 1000 && b.element.z === 1000)) {
                const aVal = COVALENT_Z.has(a.element.z) ? a.element.v : 8;
                const bVal = COVALENT_Z.has(b.element.z) ? b.element.v : 8;
                
                const dvx = a.vx - b.vx;
                const dvy = a.vy - b.vy;
                const dvz = a.vz - b.vz;
                const vRelSq = dvx*dvx + dvy*dvy + dvz*dvz;

                const hasSpace = a.bonds.length < aVal && b.bonds.length < bVal;
                const isGentle = vRelSq < 100;
                const isForced = vRelSq > 400;

                const chemicalSense = canFormBond(atoms, a, b);

                if (chemicalSense && ((hasSpace && isGentle) || isForced)) {
                    addBond(a, b);
                    
                    const flashColor = isForced ? '#FFDD44' : '#FFFFFF';
                    createExplosion(particles, (a.x+b.x)/2, (a.y+b.y)/2, (a.z+b.z)/2, flashColor, 3);
                    trySpawnLabel(atoms, a, mouse.floatingLabels);
                    
                    redistributeCharge(atoms, a.id);

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
};
