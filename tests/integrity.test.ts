
import { ELEMENTS } from '../data/elements';
import { MOLECULES } from '../data/molecules';

/**
 * Validates the static data integrity of the application.
 * Ensures that physics chains (decay) and chemical recipes are logically consistent
 * to prevent runtime crashes (like "disappearing atoms" due to missing decay targets).
 */
export const runUnitTests = async () => {
    const errors: string[] = [];
    const zMap = new Set<number>();
    
    // Index all elements
    ELEMENTS.forEach(e => zMap.add(e.z));

    // --- 1. ELEMENT & DECAY CHAIN VALIDATION ---
    ELEMENTS.forEach(el => {
        el.iso.forEach((iso, idx) => {
            // Check Parent Isotope Validity
            if (iso.m <= 0) {
                errors.push(`[Element Data] ${el.s} isotope [${idx}] has invalid mass ${iso.m}`);
            }

            // Check Decay Target Existence
            if (iso.p) {
                const targetZ = iso.p.z;
                
                // Allow decay to Z=0 (Neutron) or Z=-1 (Electron) if specific mechanics handle it,
                // but usually Alpha/Beta decay targets another Element (Z >= 1).
                if (targetZ >= 1) {
                    if (!zMap.has(targetZ)) {
                        errors.push(`[Element Data] Broken Decay Chain: ${el.n} (${el.s}-${Math.round(iso.m)}) targets Z=${targetZ}, which is missing from ELEMENTS database.`);
                    }
                }
            }
        });
    });

    // --- 2. MOLECULE RECIPE VALIDATION ---
    MOLECULES.forEach(mol => {
        // Check Ingredient Existence
        mol.ingredients.forEach(ing => {
            if (ing.z >= 1 && !zMap.has(ing.z)) {
                errors.push(`[Molecule Data] ${mol.name} requires unknown Element Z=${ing.z}.`);
            }
        });

        // Check Structure Stoichiometry
        // The list of atoms in 'structure' must match the counts in 'ingredients'
        if (mol.structure) {
            const structCounts = new Map<number, number>();
            mol.structure.atoms.forEach(z => {
                structCounts.set(z, (structCounts.get(z) || 0) + 1);
            });

            mol.ingredients.forEach(ing => {
                const sCount = structCounts.get(ing.z) || 0;
                if (sCount !== ing.count) {
                    errors.push(`[Molecule Data] ${mol.name} stoichiometry mismatch for Z=${ing.z}. Recipe=${ing.count}, Structure=${sCount}.`);
                }
            });
            
            // Reverse check: total atoms
            const totalIngredients = mol.ingredients.reduce((acc, curr) => acc + curr.count, 0);
            if (mol.structure.atoms.length !== totalIngredients) {
                 errors.push(`[Molecule Data] ${mol.name} total atom count mismatch. Recipe=${totalIngredients}, Structure=${mol.structure.atoms.length}.`);
            }
        }
    });

    if (errors.length > 0) {
        console.error("UNIT TEST FAILURES:", errors);
        // Throwing here will stop the System Test from running
        throw new Error(`Data Integrity Check Failed:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n...and ${errors.length - 5} more.` : ''}`);
    }
    
    // If we get here, pass.
    console.log(`%c[UnitTests] Data Integrity Verified (${ELEMENTS.length} Elements, ${MOLECULES.length} Molecules)`, "color: #4ade80; font-weight: bold;");
};
