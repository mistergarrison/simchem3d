
import { Atom } from '../../../types';
import { COVALENT_Z } from '../../constants';

/**
 * Validates if a bond is chemically permissible based on Intro Chemistry rules.
 */
export const canFormBond = (atoms: Atom[], a: Atom, b: Atom): boolean => {
    // Basic filtering for Bond eligibility
    if (a.element.z < 1 || b.element.z < 1) return false;
    if (a.element.z > 118 || b.element.z > 118) return false;
    
    // Electron requirement
    const eA = Math.max(0, a.element.z - (a.charge || 0));
    const eB = Math.max(0, b.element.z - (b.charge || 0));
    if (eA + eB < 1) return false;

    // Noble Gas Check
    const NOBLES = [2, 10, 18, 36, 54, 86];
    if (NOBLES.includes(a.element.z) || NOBLES.includes(b.element.z)) {
        // Allow Heavy Noble Gas chemistry (XeF4 etc)
        const HEAVY = [36, 54, 86];
        const REACTIVE = [8, 9];
        if (HEAVY.includes(a.element.z) && !REACTIVE.includes(b.element.z)) return false;
        if (HEAVY.includes(b.element.z) && !REACTIVE.includes(a.element.z)) return false;
        if (!HEAVY.includes(a.element.z) && !HEAVY.includes(b.element.z)) return false;
    }

    // Metal-NonMetal restrictions (Simplified)
    const isAMetal = !COVALENT_Z.has(a.element.z);
    const isBMetal = !COVALENT_Z.has(b.element.z);
    if ((isAMetal && b.element.z === 1) || (isBMetal && a.element.z === 1)) return false; // No Metal Hydrides

    // Prevent 3-Membered Rings (Triangle constraint)
    const sharesNeighbor = a.bonds.some(neighborId => 
        neighborId !== b.id && b.bonds.includes(neighborId)
    );
    if (sharesNeighbor) return false;

    return true;
};
