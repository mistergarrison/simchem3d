
import { Atom } from '../../../types/core';

export interface MoleculeGroup {
    cx: number;
    cy: number;
    cz: number;
    charge: number;
    count: number;
}

export interface GraphAnalysisResult {
    groups: MoleculeGroup[];
    atomGroupMap: Map<string, number>;
}

/**
 * Service responsible for analyzing the connectivity of the atom graph.
 * Identifies distinct molecules (connected components) and calculates their aggregate properties.
 */
export class GraphAnalyzer {
    
    /**
     * Traverses the atom list to find all connected components.
     * @param atoms The list of atoms in the world.
     * @returns A list of molecule groups and a map linking atom IDs to group indices.
     */
    static analyze(atoms: Atom[]): GraphAnalysisResult {
        const atomGroupMap = new Map<string, number>();
        const groups: MoleculeGroup[] = [];
        const processed = new Set<string>();

        // We traverse every atom. If it hasn't been visited, it's the start of a new molecule.
        for (const atom of atoms) {
            if (processed.has(atom.id)) continue;

            const queue = [atom];
            processed.add(atom.id);
            
            let sumX = 0, sumY = 0, sumZ = 0, sumCharge = 0;
            const members: string[] = [];

            // BFS Traversal
            while (queue.length > 0) {
                const curr = queue.shift()!;
                members.push(curr.id);
                
                sumX += curr.x; 
                sumY += curr.y; 
                sumZ += curr.z;
                sumCharge += (curr.charge || 0);

                curr.bonds.forEach(bid => {
                    if (!processed.has(bid)) {
                        const neighbor = atoms.find(a => a.id === bid);
                        if (neighbor) {
                            processed.add(bid);
                            queue.push(neighbor);
                        }
                    }
                });
            }

            const count = members.length;
            groups.push({
                cx: sumX / count,
                cy: sumY / count,
                cz: sumZ / count,
                charge: sumCharge,
                count: count
            });

            const groupIndex = groups.length - 1;
            members.forEach(mid => atomGroupMap.set(mid, groupIndex));
        }

        return { groups, atomGroupMap };
    }
}
