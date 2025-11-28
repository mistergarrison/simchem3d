import { Molecule, Atom } from '../../types';
import { MOLECULES } from '../../molecules';
import { getBondEnergy } from '../data/BondEnergy';

interface ScoredMolecule {
    molecule: Molecule;
    score: number;
}

export interface OptimizationResult {
    molecule: Molecule;
    atoms: Atom[];
}

const ATOM_BASELINES: Record<number, number> = {
    1: 218,  // H (Half of H-H 436)
    8: 249,  // O (Half of O=O 498)
    7: 472,  // N (Half of N≡N 945)
    9: 77,   // F (Half of F-F 155)
    17: 121, // Cl (Half of Cl-Cl 242)
    35: 96,  // Br (Half of Br-Br 193)
    53: 75   // I (Half of I-I 151)
};

export class BondingOptimization {
    
    private static cache: ScoredMolecule[] | null = null;

    /**
     * Phase A: Net Energy Scoring (Standard State Normalization)
     * Scores molecules by their Net Energy Gain over a baseline gas state.
     * Score = Total Bond Energy - Sum(Atom Baselines)
     * This ensures saturated molecules (Cyclohexane) beat unsaturated ones (Benzene) + Waste Gas.
     */
    private static getScoredMolecules(): ScoredMolecule[] {
        if (this.cache) return this.cache;

        this.cache = MOLECULES.map(mol => {
            // Safety check
            if (!mol.structure) return { molecule: mol, score: -999999 };

            let totalBondEnergy = 0;
            const atomZs = mol.structure.atoms;

            mol.structure.bonds.forEach(([idxA, idxB, order]) => {
                const zA = atomZs[idxA];
                const zB = atomZs[idxB];
                totalBondEnergy += getBondEnergy(zA, zB, order);
            });

            // Score = Total Bond Energy - Sum(Atom Baselines)
            let baselineCost = 0;
            atomZs.forEach(z => {
                baselineCost += ATOM_BASELINES[z] || 0;
            });

            const score = totalBondEnergy - baselineCost;
            return { molecule: mol, score };
        }).sort((a, b) => b.score - a.score); // Descending order

        return this.cache;
    }

    /**
     * Phase B: Greedy Fill
     * Takes a soup of atoms and optimally partitions them into molecules.
     */
    public static optimize(pool: Atom[]): { results: OptimizationResult[], leftovers: Atom[] } {
        // 1. Index available atoms by Z number
        const available = new Map<number, Atom[]>();
        pool.forEach(a => {
            const z = a.element.z;
            if (!available.has(z)) available.set(z, []);
            available.get(z)!.push(a);
        });

        const candidates = this.getScoredMolecules();
        const results: OptimizationResult[] = [];

        // 2. Iterate sorted candidates
        for (const candidate of candidates) {
            const { molecule } = candidate;
            
            // Try to form as many instances of this molecule as possible
            while (true) {
                // Check if we have enough ingredients
                let possible = true;
                for (const ing of molecule.ingredients) {
                    const have = available.get(ing.z)?.length || 0;
                    if (have < ing.count) {
                        possible = false;
                        break;
                    }
                }

                if (!possible) break;

                // Allocate specific atoms matching the structure definition
                const tempAssigned: Atom[] = [];
                
                // The 'structure.atoms' array defines the exact Z required at each position (0, 1, 2...)
                if (molecule.structure) {
                    for (const requiredZ of molecule.structure.atoms) {
                        const list = available.get(requiredZ);
                        if (list && list.length > 0) {
                            tempAssigned.push(list.shift()!);
                        } else {
                            possible = false;
                        }
                    }
                }

                if (possible) {
                    results.push({ molecule, atoms: tempAssigned });
                } else {
                    // Rollback atoms to pool if something failed mid-assignment
                    tempAssigned.forEach(a => available.get(a.element.z)!.unshift(a));
                    break; 
                }
            }
        }

        // 3. Collect leftovers
        const leftovers: Atom[] = [];
        available.forEach(list => leftovers.push(...list));

        return { results, leftovers };
    }
}