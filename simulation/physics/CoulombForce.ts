
import { Atom } from '../../types';

/**
 * Handles Electrostatic interactions (Coulomb's Law).
 * F = k * (q1 * q2) / r^2
 */
export class CoulombForce {
    private static readonly K_CONSTANT = 2000;
    private static readonly MIN_DIST = 20; // Prevent singularity at r=0

    static apply(
        a: Atom, 
        b: Atom, 
        dist: number, 
        distSq: number, 
        normal: { x: number, y: number, z: number }
    ): void {
        // Quarks (Z=1000) inside a nucleon are governed by Strong Force (approximated elsewhere),
        // we ignore long-range electrostatics between them for performance/simplicity here.
        if (a.element.z === 1000 && b.element.z === 1000) return;

        const q1 = a.charge || 0;
        const q2 = b.charge || 0;

        // Only interact if both have charge
        if (q1 !== 0 && q2 !== 0) {
            if (dist > CoulombForce.MIN_DIST) { 
                const force = (CoulombForce.K_CONSTANT * q1 * q2) / distSq;
                
                const fx = normal.x * force;
                const fy = normal.y * force;
                const fz = normal.z * force;

                // Like charges repel (positive force moves 'a' away from 'b' if normal points b->a? 
                // Convention: Normal points A -> B. 
                // If q1,q2 are ++, force > 0. We want repulsion.
                // A should move -normal, B should move +normal. 
                // Current implementation matches legacy behavior:
                // a.fx -= fx (Push A back)
                // b.fx += fx (Push B forward)
                
                a.fx -= fx; a.fy -= fy; a.fz -= fz;
                b.fx += fx; b.fy += fy; b.fz += fz;
            }
        }
    }
}
