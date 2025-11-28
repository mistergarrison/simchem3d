
import { Atom } from '../../types';
import { PAULI_STIFFNESS } from '../constants';

/**
 * Handles physical collisions between atoms (Pauli Exclusion Principle).
 * Prevents atoms from occupying the same space using a stiff spring force.
 */
export class PauliForce {
    
    static apply(
        a: Atom, 
        b: Atom, 
        overlap: number, 
        normal: { x: number, y: number, z: number }
    ): void {
        const isQuarkPair = a.element.z === 1000 && b.element.z === 1000;
        
        // Quarks have their own confinement logic, standard Pauli doesn't apply the same way
        if (isQuarkPair) return;

        if (overlap > 0) {
            // Soften collision during molecule assembly ("Cooling")
            // to allow atoms to slide past each other into correct geometry.
            const ramp = PauliForce.calculateStiffnessRamp(a, b);
            
            if (ramp > 0.001) {
                const springK = PAULI_STIFFNESS * ramp; 
                
                // Cap the overlap force to prevent extreme ejection velocities
                const cappedOverlap = Math.min(overlap, 10.0);
                const force = springK * cappedOverlap;
                
                const fx = normal.x * force;
                const fy = normal.y * force;
                const fz = normal.z * force;

                // Push apart
                a.fx -= fx; a.fy -= fy; a.fz -= fz;
                b.fx += fx; b.fy += fy; b.fz += fz;
            }
        }
    }

    private static calculateStiffnessRamp(a: Atom, b: Atom): number {
        const isCooling = (a.cooldown || 0) > 0 || (b.cooldown || 0) > 0;
        if (!isCooling) return 1.0;

        const c = Math.max(a.cooldown || 0, b.cooldown || 0);
        
        // If very hot (just spawned), zero stiffness to prevent explosion
        if (c > 0.8) return 0.0;
        
        // Ramp up stiffness as it cools
        const progress = (0.8 - c) / 0.8; 
        return progress * progress; 
    }
}
