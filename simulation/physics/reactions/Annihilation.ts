
import { Atom, Particle, SimulationEvent } from '../../../types';
import { SM_PARTICLES } from '../../../elements';
import { createExplosion } from '../../effects';
import { removeAtomFromWorld, redistributeCharge } from '../../utils';
import { ReactionResult } from './ReactionTypes';

export const attemptAnnihilation = (
    atoms: Atom[], 
    particles: Particle[], 
    a: Atom, 
    b: Atom, 
    idxA: number, 
    idxB: number, 
    distSq: number, 
    eventLog?: SimulationEvent[]
): ReactionResult => {
    const touchDist = a.radius + b.radius;
    if (distSq >= touchDist * touchDist) return { occurred: false, removedIndices: [] };

    const defA = SM_PARTICLES.find(p => p.symbol === a.element.s);
    const defB = SM_PARTICLES.find(p => p.symbol === b.element.s);

    if (defA && defB && (defA.antiParticleId === defB.id || defB.antiParticleId === defA.id)) {
        const midX = (a.x+b.x)/2;
        const midY = (a.y+b.y)/2;
        const midZ = (a.z+b.z)/2;

        createExplosion(particles, midX, midY, midZ, '#FFFFFF', 60);
        createExplosion(particles, midX, midY, midZ, '#FFFF00', 20);
        
        // Remove atoms from world (High index first to preserve Low index validity during this operation)
        const first = Math.max(idxA, idxB);
        const second = Math.min(idxA, idxB);
        
        removeAtomFromWorld(atoms, first, eventLog, 'Annihilation');
        removeAtomFromWorld(atoms, second, eventLog, 'Annihilation');

        return { occurred: true, removedIndices: [first, second] };
    }
    return { occurred: false, removedIndices: [] };
};

export const attemptPositronAnnihilation = (
    atoms: Atom[], 
    particles: Particle[], 
    a: Atom, 
    b: Atom, 
    idxA: number, 
    idxB: number, 
    distSq: number, 
    eventLog?: SimulationEvent[]
): ReactionResult => {
    let positron: Atom | null = null;
    let atom: Atom | null = null;
    let positronIdx = -1;

    // Check A=Positron, B=Atom
    if (a.element.z === -2 && b.element.z >= 1) { positron = a; atom = b; positronIdx = idxA; }
    // Check B=Positron, A=Atom
    else if (b.element.z === -2 && a.element.z >= 1) { positron = b; atom = a; positronIdx = idxB; }

    if (!positron || !atom) return { occurred: false, removedIndices: [] };

    // Can only annihilate electron if the atom has electrons (Charge < Z)
    const currentCharge = atom.charge || 0;
    if (currentCharge >= atom.element.z) return { occurred: false, removedIndices: [] };

    const touchDist = positron.radius + atom.radius;
    if (distSq < touchDist * touchDist) {
        createExplosion(particles, positron.x, positron.y, positron.z, '#FF00FF', 10);
        
        removeAtomFromWorld(atoms, positronIdx, eventLog, 'Positron Annihilation');
        
        // Ionize Atom (Lose electron -> Charge goes UP)
        atom.charge = currentCharge + 1;
        
        // Special Case: Hydrogen/Proton visualization update
        if (atom.element.z === 1 && atom.mass < 1.6 && atom.charge === 1) {
            atom.radius = 20; 
        }
        
        redistributeCharge(atoms, atom.id);
        return { occurred: true, removedIndices: [positronIdx] };
    }

    return { occurred: false, removedIndices: [] };
};
