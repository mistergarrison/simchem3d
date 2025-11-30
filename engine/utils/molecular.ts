
import { Atom } from '../../types/core';
import { Molecule } from '../../types/chemistry';
import { FloatingLabel } from '../../types/ui';
import { MOLECULES } from '../../data/molecules';
import { getMoleculeGroup } from './general';

// --- FINGERPRINTING SYSTEM ---

/**
 * Generates a unique structural signature for a group of atoms.
 * Format: "Formula|BondHistogram|ConnectivitySpectrum"
 * Example Ethanol: "C2H6O|C-C:1,C-H:5,C-O:1,O-H:1|C:2,4,H:1,1,1,1,1,1,O:2"
 */
const generateFingerprint = (atoms: Atom[]): string => {
    // 1. Formula (Z Counts)
    const zCounts = new Map<number, number>();
    atoms.forEach(a => zCounts.set(a.element.z, (zCounts.get(a.element.z) || 0) + 1));
    const sortedZs = Array.from(zCounts.keys()).sort((a,b) => a-b);
    const formulaPart = sortedZs.map(z => `${z}:${zCounts.get(z)}`).join(',');

    // 2. Bond Histogram (Edge Types)
    const bondCounts = new Map<string, number>();
    const processedBonds = new Set<string>();

    atoms.forEach(a => {
        a.bonds.forEach(bid => {
            // Ensure we only count bonds internal to this group
            const b = atoms.find(x => x.id === bid);
            if (!b) return;

            // Unique Key for the Bond (LowID-HighID)
            const bondId = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
            
            if (!processedBonds.has(bondId)) {
                processedBonds.add(bondId);
                
                // Determine Bond Type Key (e.g. "6-8-1" for C-O single)
                // We estimate order by checking if there are multiple bond entries for same pair? 
                // In this engine, `bonds` array contains duplicates for higher order.
                // Count how many times `bid` appears in `a.bonds`
                let order = 0;
                a.bonds.forEach(id => { if (id === bid) order++; });
                
                const z1 = Math.min(a.element.z, b.element.z);
                const z2 = Math.max(a.element.z, b.element.z);
                const typeKey = `${z1}-${z2}-${order}`;
                
                bondCounts.set(typeKey, (bondCounts.get(typeKey) || 0) + 1);
            }
        });
    });

    const sortedBondKeys = Array.from(bondCounts.keys()).sort();
    const bondsPart = sortedBondKeys.map(k => `${k}:${bondCounts.get(k)}`).join(',');

    // 3. Connectivity Spectrum (Node Degrees)
    // For each Element Z, list the neighbor signatures of all atoms of that Z.
    // Neighbor Signature = Sorted List of Neighbor Zs (including duplicates for bond order)
    
    const connectivity = new Map<number, string[]>();
    
    atoms.forEach(a => {
        // Collect neighbor Zs
        const neighborZs: number[] = [];
        a.bonds.forEach(bid => {
            const b = atoms.find(x => x.id === bid);
            if (b) neighborZs.push(b.element.z);
        });
        
        neighborZs.sort((x, y) => x - y);
        const sig = `[${neighborZs.join(',')}]`;

        if (!connectivity.has(a.element.z)) connectivity.set(a.element.z, []);
        connectivity.get(a.element.z)!.push(sig);
    });

    const connParts: string[] = [];
    sortedZs.forEach(z => {
        const sigs = connectivity.get(z);
        if (sigs) {
            sigs.sort(); // Sort the signatures to be canonical
            connParts.push(`${z}:${sigs.join('')}`);
        }
    });
    const connPart = connParts.join('|');

    return `${formulaPart}|${bondsPart}|${connPart}`;
};

// Cache for Molecule Definitions
const MOLECULE_FINGERPRINTS = new Map<string, string>();

const getDefinitionFingerprint = (mol: Molecule): string => {
    if (MOLECULE_FINGERPRINTS.has(mol.id)) return MOLECULE_FINGERPRINTS.get(mol.id)!;

    // Simulate atoms to generate fingerprint
    if (!mol.structure) return "INVALID";

    const simAtoms: Atom[] = mol.structure.atoms.map((z, i) => ({
        id: `sim-${i}`,
        element: { z } as any, // Mock
        bonds: [] as string[],
        x:0, y:0, z:0, vx:0, vy:0, vz:0, fx:0, fy:0, fz:0, isotopeIndex:0, mass:1, radius:1,
        createdAt: 0
    }));

    mol.structure.bonds.forEach(([u, v, order]) => {
        const a = simAtoms[u];
        const b = simAtoms[v];
        if (a && b) {
            for(let k=0; k<order; k++) {
                a.bonds.push(b.id);
                b.bonds.push(a.id);
            }
        }
    });

    const fp = generateFingerprint(simAtoms);
    MOLECULE_FINGERPRINTS.set(mol.id, fp);
    return fp;
};

// --- MAIN FUNCTIONS ---

export const identifyMoleculeData = (groupAtoms: Atom[]): Molecule | null => {
    // Optimization: Quick stoichiometry check first?
    // No, let's rely on the fingerprint cache for correctness.
    const groupFP = generateFingerprint(groupAtoms);

    // 1. Exact Structural Match
    for (const mol of MOLECULES) {
        if (getDefinitionFingerprint(mol) === groupFP) {
            return mol;
        }
    }

    return null;
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
