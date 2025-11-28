
import { Atom, Particle, SimulationEvent } from '../../../types';
import { ELEMENTS } from '../../../elements';
import { createExplosion } from '../../effects';
import { removeAtomFromWorld, redistributeCharge } from '../../utils';
import { ReactionResult } from './ReactionTypes';

export const attemptElectronCapture = (
    atoms: Atom[], 
    particles: Particle[], 
    a: Atom, 
    b: Atom, 
    idxA: number, 
    idxB: number, 
    distSq: number, 
    eventLog?: SimulationEvent[]
): ReactionResult => {
    if (!((a.element.z === -1 && b.element.z > 0) || (b.element.z === -1 && a.element.z > 0))) {
        return { occurred: false, removedIndices: [] };
    }

    const isAElectron = a.element.z === -1;
    const electron = isAElectron ? a : b;
    const atom = isAElectron ? b : a;
    const elecIdx = isAElectron ? idxA : idxB;

    const hitRadius = atom.radius + electron.radius; 
    
    // Check collision (slightly relaxed radius)
    if (distSq < (hitRadius * 1.2) ** 2) {
        const currentCharge = atom.charge || 0;
        
        // Physics: Must have attraction or high kinetic energy
        const vRelSq = (atom.vx-electron.vx)**2 + (atom.vy-electron.vy)**2 + (atom.vz-electron.vz)**2;
        const isAttracted = currentCharge > 0;
        const isHighSpeed = vRelSq > 225 && currentCharge > -4; 
        
        if (isAttracted || isHighSpeed) {
            // Conservation of Momentum
            const mAtom = atom.mass;
            const mElec = electron.mass;
            const totalMass = mAtom + mElec;

            atom.vx = (atom.vx * mAtom + electron.vx * mElec) / totalMass;
            atom.vy = (atom.vy * mAtom + electron.vy * mElec) / totalMass;
            atom.vz = (atom.vz * mAtom + electron.vz * mElec) / totalMass;

            atom.charge = currentCharge - 1;
            atom.mass = totalMass;

            // Update Element Identity if it was a generic Proton
            if (atom.element.z === 1) {
                if (atom.element !== ELEMENTS[0]) atom.element = ELEMENTS[0];
                
                // Visual Radius Update
                if (atom.mass < 1.6 && (atom.charge || 0) >= 1) {
                    atom.radius = 20;
                } else {
                    atom.radius = 30 + Math.pow(atom.mass, 0.33) * 10;
                }
            }

            createExplosion(particles, electron.x, electron.y, electron.z, '#FFFFFF', 8);
            redistributeCharge(atoms, atom.id);
            removeAtomFromWorld(atoms, elecIdx, eventLog, 'Electron Capture');
            
            return { occurred: true, removedIndices: [elecIdx] };
        }
    }
    return { occurred: false, removedIndices: [] };
};

export const attemptNeutronCapture = (
    atoms: Atom[], 
    particles: Particle[], 
    a: Atom, 
    b: Atom, 
    idxA: number, 
    idxB: number, 
    distSq: number, 
    eventLog?: SimulationEvent[]
): ReactionResult => {
    if (!((a.element.z === 0 && b.element.z >= 1) || (b.element.z === 0 && a.element.z >= 1))) {
            return { occurred: false, removedIndices: [] };
    }

    const neutronIdx = a.element.z === 0 ? idxA : idxB;
    const target = a.element.z === 0 ? b : a;
    const neutron = a.element.z === 0 ? a : b;
    
    const combinedRadius = a.radius + b.radius;
    const vRelSq = (target.vx-neutron.vx)**2 + (target.vy-neutron.vy)**2 + (target.vz-neutron.vz)**2;
    const isHighEnergy = vRelSq > 225;
    const radiusMult = isHighEnergy ? 1.2 : 0.8; 
    
    if (distSq < (combinedRadius * radiusMult) ** 2) {
        const captureProb = isHighEnergy ? 1.0 : 0.05;
        
        if (Math.random() < captureProb) {
            // Momentum Transfer
            const mTarget = target.mass;
            const mNeutron = neutron.mass;
            const totalMass = mTarget + mNeutron;

            target.vx = (target.vx * mTarget + neutron.vx * mNeutron) / totalMass;
            target.vy = (target.vy * mTarget + neutron.vy * mNeutron) / totalMass;
            target.vz = (target.vz * mTarget + neutron.vz * mNeutron) / totalMass;

            // Handle Identity Change (Proton -> Deuteron, etc.)
            let el = target.element;
            if (el.z === 1 && el.s === 'p⁺') {
                el = ELEMENTS[0]; 
                target.element = el;
            }

            // Isotope Update
            const newMass = target.mass + 1; 
            let newIsoIndex = el.iso.findIndex(iso => Math.abs(iso.m - newMass) < 0.5);
            
            if (newIsoIndex === -1) {
                // Create Unstable/Unknown Isotope
                target.mass += 1;
                updateRadius(target);
                target.customIsotope = { m: target.mass, hl: 0.3, mode: 'beta-', p: { z: el.z + 1, m: target.mass } };
                createExplosion(particles, target.x, target.y, target.z, '#00FFFF', 10);
            } else {
                // Match Known Isotope
                target.isotopeIndex = newIsoIndex;
                target.mass = el.iso[newIsoIndex].m;
                updateRadius(target);
                target.customIsotope = undefined;
                createExplosion(particles, target.x, target.y, target.z, '#00FFFF', 15);
            }
            
            target.lastDecayCheck = Date.now();
            removeAtomFromWorld(atoms, neutronIdx, eventLog, 'Neutron Capture');
            return { occurred: true, removedIndices: [neutronIdx] };
        }
    }
    return { occurred: false, removedIndices: [] };
};

const updateRadius = (atom: Atom) => {
    if (atom.element.z === 1) {
        if (atom.mass < 1.6 && (atom.charge || 0) >= 1) {
            atom.radius = 20;
        } else {
            atom.radius = 30 + Math.pow(atom.mass, 0.33) * 10;
        }
    } else {
        atom.radius = 30 + Math.pow(atom.mass, 0.33) * 10;
    }
};
