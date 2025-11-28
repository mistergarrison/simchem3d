
import { Atom, Molecule } from '../types';
import { MOLECULES } from '../molecules';
import { FloatingLabel } from './types';
import { getMoleculeGroup } from './utils';

export const identifyMoleculeData = (groupAtoms: Atom[]): Molecule | null => {
    const comp = new Map<number, number>();
    groupAtoms.forEach(a => {
        if (!a) return;
        comp.set(a.element.z, (comp.get(a.element.z) || 0) + 1);
    });
    const match = MOLECULES.find(r => {
        if (r.ingredients.length !== comp.size) return false;
        return r.ingredients.every(ing => comp.get(ing.z) === ing.count);
    });
    return match || null;
};

export const identifyMolecule = (groupAtoms: Atom[]): string | null => {
    const match = identifyMoleculeData(groupAtoms);
    return match ? match.name : null;
};

/**
 * Instantly removes any floating labels associated with a bond that has just broken.
 * 
 * Requirement: Labels must vanish the EXACT frame a molecule loses structural integrity.
 * No fading allowed for broken bonds to prevent "Ghost Labels" (labels floating on separated atoms).
 */
export const killRelatedLabels = (floatingLabels: FloatingLabel[], aId: string, bId: string) => {
    // Iterate backwards to allow safe splicing
    for (let i = floatingLabels.length - 1; i >= 0; i--) {
        const label = floatingLabels[i];
        // If the label depends on BOTH atoms involved in the break, it's invalid.
        if (label.atomIds.has(aId) && label.atomIds.has(bId)) {
            floatingLabels.splice(i, 1);
        }
    }
};

export const trySpawnLabel = (atoms: Atom[], anchorAtom: Atom, floatingLabels: FloatingLabel[]) => {
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
                life: 600, // 10 seconds
                maxLife: 600,
                fadeDuration: 60
            });
        }
    }
};
