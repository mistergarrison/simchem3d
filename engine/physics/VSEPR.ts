
import { Atom } from '../../types/core';
import { VSEPRSolver } from './forces/VSEPRSolver';

/**
 * engine/physics/VSEPR.ts
 * 
 * Entry point for VSEPR physics.
 * Delegates actual logic to the VSEPRSolver class.
 */

export const applyVSEPR = (atoms: Atom[], dragGroup: Set<string> | null) => {
    VSEPRSolver.apply(atoms, dragGroup);
};
