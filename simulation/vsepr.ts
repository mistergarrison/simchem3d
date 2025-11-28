
import { Atom } from '../types';
import { VSEPRSolver } from './physics/VSEPRSolver';

/**
 * simulation/vsepr.ts
 * 
 * Entry point for VSEPR physics.
 * Delegates actual logic to the VSEPRSolver class.
 */

export const applyVSEPR = (atoms: Atom[], dragGroup: Set<string> | null) => {
    VSEPRSolver.apply(atoms, dragGroup);
};
