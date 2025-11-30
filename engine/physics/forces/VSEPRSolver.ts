
import { Atom } from '../../../types/core';
import { COVALENT_Z, ANGULAR_STIFFNESS } from '../../config';

/**
 * Implements 3D Valence Shell Electron Pair Repulsion (VSEPR) theory.
 * Responsible for calculating and applying angular restoration forces
 * to maintain molecular geometry.
 */
export class VSEPRSolver {
    
    // Elements that typically cause twists due to lone pairs on adjacent atoms
    // N(7), O(8), P(15), S(16), As(33), Se(34)
    private static readonly TWIST_CANDIDATES = new Set([7, 8, 15, 16, 33, 34]);

    /**
     * Applies VSEPR forces to the provided list of atoms.
     * @param atoms The list of all atoms in the simulation.
     * @param dragGroup (Optional) Set of IDs currently being dragged (excluded from forces).
     */
    static apply(atoms: Atom[], dragGroup: Set<string> | null): void {
        const atomCount = atoms.length;

        for (let i = 0; i < atomCount; i++) {
            const center = atoms[i];
            
            // Skip logic for atoms involved in rigid body interaction
            if (dragGroup && dragGroup.has(center.id)) continue;

            // 1. Angular Forces (Bond Angle)
            // Only process covalent centers with enough neighbors to define an angle
            if (COVALENT_Z.has(center.element.z) && center.bonds.length >= 2) {
                VSEPRSolver.processAtom(center, atoms);
            }

            // 2. Dihedral Forces (Twist)
            // Apply if this atom is a "Twist Candidate" (has lone pairs)
            if (VSEPRSolver.TWIST_CANDIDATES.has(center.element.z)) {
                center.bonds.forEach(bid => {
                    // Unique check: only process bond A-B once (when A.id < B.id)
                    if (bid < center.id) return; 
                    
                    const neighbor = atoms.find(a => a.id === bid);
                    
                    // Apply if neighbor is also a twist candidate (e.g. O-O, N-N, O-N)
                    if (neighbor && VSEPRSolver.TWIST_CANDIDATES.has(neighbor.element.z)) {
                        VSEPRSolver.applyDihedralForce(center, neighbor, atoms);
                    }
                });
            }
        }
    }

    private static processAtom(center: Atom, allAtoms: Atom[]): void {
        const uniqueBondIds = [...new Set(center.bonds)];
        const neighborCount = uniqueBondIds.length;
        
        if (neighborCount < 2) return;

        // 1. Determine Geometry Constraints
        // We must pass neighborCount to correctly calculate domains for double bonds
        const targetCosine = VSEPRSolver.calculateTargetCosine(center.element.z, center.bonds.length, neighborCount);

        // 2. Resolve Neighbors
        const neighbors = uniqueBondIds
            .map(id => allAtoms.find(a => a.id === id))
            .filter((a): a is Atom => !!a);

        // 3. Apply Forces to Neighbor Pairs
        for (let j = 0; j < neighbors.length; j++) {
            for (let k = j + 1; k < neighbors.length; k++) {
                VSEPRSolver.applyAngularForce(center, neighbors[j], neighbors[k], targetCosine);
            }
        }
    }

    private static calculateTargetCosine(z: number, totalBondOrder: number, neighborCount: number): number {
        const valence = VSEPRSolver.getValenceElectrons(z);
        if (valence === null) return 0;

        // Domains = Sigma Bonds (Neighbors) + Lone Pairs
        // Lone Pairs = (Valence - Bonds) / 2
        const electronsFree = valence - totalBondOrder;
        const lonePairs = Math.max(0, Math.floor(electronsFree / 2));
        
        // Use neighborCount (Sigma bonds) for domain sum to treat double bonds as 1 domain (sp2 geometry).
        const domains = neighborCount + lonePairs; 

        // Return cosine of ideal angle
        if (domains === 2) return -1.0; // Linear (180°)
        
        if (domains === 3) {
            return lonePairs === 0 ? -0.5 : -0.48; // Trigonal Planar (120°) vs Bent
        }
        
        if (domains === 4) {
            if (lonePairs === 0) return -0.333; // Tetrahedral (~109.5°)
            if (lonePairs === 1) return -0.29;  // Trigonal Pyramidal
            return -0.25;                       // Bent (Water)
        }
        
        if (domains >= 5) return 0; // Octahedral/Bi-pyramidal approx (90°)
        
        return -1.0 / (neighborCount - 1); // Fallback generic distribution
    }

    private static applyAngularForce(center: Atom, n1: Atom, n2: Atom, targetCosine: number): void {
        // Vectors from Center to Neighbors
        const v1x = n1.x - center.x;
        const v1y = n1.y - center.y;
        const v1z = n1.z - center.z;

        const v2x = n2.x - center.x;
        const v2y = n2.y - center.y;
        const v2z = n2.z - center.z;

        const d1Sq = v1x*v1x + v1y*v1y + v1z*v1z;
        const d2Sq = v2x*v2x + v2y*v2y + v2z*v2z;
        
        // Avoid singularity
        if (d1Sq < 0.01 || d2Sq < 0.01) return;

        const d1 = Math.sqrt(d1Sq);
        const d2 = Math.sqrt(d2Sq);

        // Normalized vectors
        const n1x = v1x / d1;
        const n1y = v1y / d1;
        const n1z = v1z / d1;

        const n2x = v2x / d2;
        const n2y = v2y / d2;
        const n2z = v2z / d2;

        // Current Cosine
        const dot = n1x*n2x + n1y*n2y + n1z*n2z;
        const diff = dot - targetCosine;

        // Graduated Stiffness during molecule formation
        let stiffnessMult = 1.0;
        if ((center.cooldown || 0) > 0) {
            // Linear Ramp: Cooldown 1.0 -> 0.5 stiffness
            // Boosted from 0.1 to 0.5 to enforce shape more aggressively during assembly
            stiffnessMult = 0.5 + (1.0 - (center.cooldown || 0)) * 0.5;
        }

        const strength = ANGULAR_STIFFNESS * stiffnessMult * diff;

        // Apply corrective force orthogonal to the bond vectors
        const fx = (n1x - n2x) * strength;
        const fy = (n1y - n2y) * strength;
        const fz = (n1z - n2z) * strength;

        n1.fx += fx;
        n1.fy += fy;
        n1.fz += fz;

        n2.fx -= fx;
        n2.fy -= fy;
        n2.fz -= fz;
    }

    private static applyDihedralForce(a: Atom, b: Atom, allAtoms: Atom[]) {
        // A and B are the central atoms (e.g. O-O).
        // Find a neighbor for A (C) and a neighbor for B (D) that are NOT the bond A-B.
        
        const cId = a.bonds.find(id => id !== b.id);
        const dId = b.bonds.find(id => id !== a.id);
        
        if (!cId || !dId) return;
        
        const c = allAtoms.find(at => at.id === cId);
        const d = allAtoms.find(at => at.id === dId);
        
        if (!c || !d) return;
        
        // We have chain C - A - B - D
        // Ideal dihedral is ~90 deg for O-O and N-N due to lone pair repulsion.
        
        // Vector Axis (A->B)
        const axisX = b.x - a.x;
        const axisY = b.y - a.y;
        const axisZ = b.z - a.z;
        const axisLenSq = axisX*axisX + axisY*axisY + axisZ*axisZ;
        if (axisLenSq < 0.001) return;
        const axisLen = Math.sqrt(axisLenSq);
        const uX = axisX / axisLen;
        const uY = axisY / axisLen;
        const uZ = axisZ / axisLen; // Unit axis
        
        // Vector AC
        const acX = c.x - a.x;
        const acY = c.y - a.y;
        const acZ = c.z - a.z;
        
        // Vector BD
        const bdX = d.x - b.x;
        const bdY = d.y - b.y;
        const bdZ = d.z - b.z;
        
        // Project AC onto plane normal to Axis
        const dotAC = acX*uX + acY*uY + acZ*uZ;
        const projAC_X = acX - uX * dotAC;
        const projAC_Y = acY - uY * dotAC;
        const projAC_Z = acZ - uZ * dotAC;
        
        // Project BD onto plane normal to Axis
        const dotBD = bdX*uX + bdY*uY + bdZ*uZ;
        const projBD_X = bdX - uX * dotBD;
        const projBD_Y = bdY - uY * dotBD;
        const projBD_Z = bdZ - uZ * dotBD;
        
        // Normalize Projections
        const lenAC = Math.sqrt(projAC_X*projAC_X + projAC_Y*projAC_Y + projAC_Z*projAC_Z);
        const lenBD = Math.sqrt(projBD_X*projBD_X + projBD_Y*projBD_Y + projBD_Z*projBD_Z);
        
        if (lenAC < 0.1 || lenBD < 0.1) return;
        
        const nAC_X = projAC_X / lenAC;
        const nAC_Y = projAC_Y / lenAC;
        const nAC_Z = projAC_Z / lenAC;
        
        const nBD_X = projBD_X / lenBD;
        const nBD_Y = projBD_Y / lenBD;
        const nBD_Z = projBD_Z / lenBD;
        
        // Dot product of projections determines angle (cis=1, trans=-1, 90deg=0)
        const alignment = nAC_X*nBD_X + nAC_Y*nBD_Y + nAC_Z*nBD_Z;
        
        // Apply torque if alignment is too high (too planar).
        // STRENGTH Tuned to be subtle but persistent.
        const STRENGTH = 0.08;
        
        // Force direction: Tangent to rotation around axis.
        // T = u x nBD
        const tX = uY*nBD_Z - uZ*nBD_Y;
        const tY = uZ*nBD_X - uX*nBD_Z;
        const tZ = uX*nBD_Y - uY*nBD_X;
        
        // Apply Force to D to twist it away from C's plane
        const fX = tX * alignment * STRENGTH;
        const fY = tY * alignment * STRENGTH;
        const fZ = tZ * alignment * STRENGTH;
        
        d.fx += fX; d.fy += fY; d.fz += fZ;
        
        // Apply Opposite Force to C to twist it opposite way
        // T_C = u x nAC
        const tcX = uY*nAC_Z - uZ*nAC_Y;
        const tcY = uZ*nAC_X - uX*nAC_Z;
        const tcZ = uX*nAC_Y - uY*nAC_X;
        
        const fcX = tcX * alignment * STRENGTH;
        const fcY = tcY * alignment * STRENGTH;
        const fcZ = tcZ * alignment * STRENGTH;
        
        c.fx -= fcX; c.fy -= fcY; c.fz -= fcZ;
        
        // Counter-forces on A/B to conserve momentum
        const netFx = fX - fcX;
        const netFy = fY - fcY;
        const netFz = fZ - fcZ;
        
        a.fx -= netFx * 0.5; a.fy -= netFy * 0.5; a.fz -= netFz * 0.5;
        b.fx -= netFx * 0.5; b.fy -= netFy * 0.5; b.fz -= netFz * 0.5;
    }

    private static getValenceElectrons(z: number): number | null {
        if (z === 1) return 1;
        if (z === 2) return 2; 
        if (z >= 3 && z <= 10) return z - 2; 
        if (z >= 11 && z <= 18) return z - 10;
        if (z >= 19 && z <= 20) return z - 18;
        if (z >= 31 && z <= 36) return z - 28;
        if (z >= 37 && z <= 38) return z - 36;
        if (z >= 49 && z <= 54) return z - 46;
        if (z >= 55 && z <= 56) return z - 54;
        return null;
    }
}
