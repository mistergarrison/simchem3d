
import { Atom } from '../types';
import { COVALENT_Z, ANGULAR_STIFFNESS, ANGULAR_DAMPING } from './constants';

/**
 * simulation/vsepr.ts
 * 
 * Implements 3D Valence Shell Electron Pair Repulsion (VSEPR) theory.
 */

const getValenceElectrons = (z: number): number | null => {
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
};

/**
 * Returns the target cosine of the angle between bonds.
 */
export const getTargetCosine = (bondCount: number, lp: number) => {
    const domains = bondCount + lp;
    if (domains === 2) return -1.0; 
    if (domains === 3) {
        if (lp === 0) return -0.5; 
        return -0.48; // ~118 degrees (Ozone, SO2)
    }
    if (domains === 4) {
        if (lp === 0) return -0.333;
        if (lp === 1) return -0.29; 
        return -0.25; // ~104.5 degrees (Water)
    }
    if (domains >= 5) return 0; 
    return -1.0 / (bondCount - 1);
};

export const applyVSEPR = (atoms: Atom[], dragGroup: Set<string> | null) => {
    const atomCount = atoms.length;

    for (let i = 0; i < atomCount; i++) {
        const center = atoms[i];
        
        // Skip VSEPR for atoms currently being dragged rigidly
        if (dragGroup && dragGroup.has(center.id)) continue;

        const uniqueBonds = [...new Set(center.bonds)];
        const bondCount = uniqueBonds.length;

        // Need at least 2 bonds to have an angle
        if (bondCount < 2 || !COVALENT_Z.has(center.element.z)) continue;

        const Ve = getValenceElectrons(center.element.z);
        if (Ve === null) continue;

        // Electron Counting Fix: 
        // VSEPR Domains = Neighbors (Sigma bonds) + Lone Pairs.
        // Lone Pairs = (ValenceElectrons - ElectronsUsedInBonding) / 2.
        // ElectronsUsedInBonding ~= Total Bond Count (including double/triple).
        // center.bonds contains duplicate IDs for double bonds, so center.bonds.length is the total bond order sum.
        const electronsUsed = center.bonds.length;
        const electronsFree = Ve - electronsUsed; 
        let lp = Math.max(0, Math.floor(electronsFree / 2));
        
        const targetCos = getTargetCosine(bondCount, lp);

        const neighbors = uniqueBonds.map(id => atoms.find(a => a.id === id)).filter(Boolean) as Atom[];

        // Iterate all unique pairs of neighbors
        for (let j = 0; j < neighbors.length; j++) {
            for (let k = j + 1; k < neighbors.length; k++) {
                const n1 = neighbors[j];
                const n2 = neighbors[k];

                // Vectors from Center to Neighbors
                const v1x = n1.x - center.x;
                const v1y = n1.y - center.y;
                const v1z = n1.z - center.z;

                const v2x = n2.x - center.x;
                const v2y = n2.y - center.y;
                const v2z = n2.z - center.z;

                const d1Sq = v1x*v1x + v1y*v1y + v1z*v1z;
                const d2Sq = v2x*v2x + v2y*v2y + v2z*v2z;
                
                const d1 = Math.sqrt(d1Sq);
                const d2 = Math.sqrt(d2Sq);

                if (d1 < 0.1 || d2 < 0.1) continue;

                // Normalized vectors
                const n1x = v1x / d1;
                const n1y = v1y / d1;
                const n1z = v1z / d1;

                const n2x = v2x / d2;
                const n2y = v2y / d2;
                const n2z = v2z / d2;

                // Current Dot Product (Cosine of angle)
                const dot = n1x*n2x + n1y*n2y + n1z*n2z;
                
                // Deviation from target
                const diff = dot - targetCos; 

                // Force Magnitude
                // If diff > 0, angle is too small (cos is too large), push apart.
                
                // GRADUATED STIFFNESS:
                // During formation (Cooling), we want the molecule to be "Floppy" so it can 
                // untangle itself without fighting rigid angular constraints.
                // As cooldown decays (1.0 -> 0.0), stiffness ramps up (0.1 -> 1.0).
                let stiffnessMult = 1.0;
                if ((center.cooldown || 0) > 0) {
                    // Linear Ramp: Cooldown 1.0 = 0.1 stiffness. Cooldown 0.0 = 1.0 stiffness.
                    stiffnessMult = 0.1 + (1.0 - (center.cooldown || 0)) * 0.9;
                }

                const strength = ANGULAR_STIFFNESS * stiffnessMult * diff;

                const fx = (n1x - n2x) * strength;
                const fy = (n1y - n2y) * strength;
                const fz = (n1z - n2z) * strength;

                // Apply forces directly to accumulator
                n1.fx += fx;
                n1.fy += fy;
                n1.fz += fz;

                n2.fx -= fx;
                n2.fy -= fy;
                n2.fz -= fz;
            }
        }
    }
};
