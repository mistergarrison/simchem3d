
import { Atom } from '../../types';
import { MouseState } from '../types';
import { BOND_STIFFNESS, BOND_DAMPING } from '../constants';
import { getBondOrder, breakBond, redistributeCharge } from '../utils';
import { killRelatedLabels } from '../molecular_utils';

/**
 * Handles the physics of Covalent Bonds.
 * Models bonds as a damped spring system.
 */
export class BondForce {
    // Increased Thresholds to prevent accidental snapping during collisions
    // 20.0 = Bonds essentially never break from impact, only extreme manual stretching
    private static readonly BREAK_THRESHOLD = 20.0; 
    
    // CRITICAL FIX: Increased MAX_FORCE massively (5000 -> 100000).
    // This ensures the bond can exert enough force to keep atoms together 
    // even when smashed by a fast-moving object.
    private static readonly MAX_FORCE = 100000.0; 

    /**
     * Applies spring and damping forces to bonded atoms.
     */
    static apply(
        atoms: Atom[], 
        a: Atom, 
        b: Atom, 
        dist: number, 
        normal: { x: number, y: number, z: number }, 
        mouse: MouseState
    ): void {
        const order = getBondOrder(a, b.id);
        
        // Calculate equilibrium distance based on bond order
        const restScale = 0.9 - ((order - 1) * 0.12);
        const idealDist = (a.radius + b.radius) * restScale;
        
        const isCooling = (a.cooldown || 0) > 0 || (b.cooldown || 0) > 0;

        // 1. Bond Breaking Logic (Elastic Limit)
        if (dist > idealDist * BondForce.BREAK_THRESHOLD) {
             if (!isCooling) {
                 BondForce.snapBond(atoms, a, b, mouse);
                 return; 
             }
        }

        // 2. Spring Force (Hooke's Law: F = -kx)
        let displacement = dist - idealDist;
        
        // Relaxed displacement clamp (1000 -> 2000) to allow full strength of the stiffer spring
        if (displacement > 2000) displacement = 2000;
        if (displacement < -2000) displacement = -2000;

        const springForce = BOND_STIFFNESS * displacement;
        
        // 3. Damping Force (F = -cv)
        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const rvz = b.vz - a.vz;
        const vRelProj = rvx * normal.x + rvy * normal.y + rvz * normal.z;
        
        const dampingForce = BOND_DAMPING * vRelProj;

        let totalForce = springForce + dampingForce;

        // 4. Force Safety Cap (Anti-Explosion)
        if (Math.abs(totalForce) > BondForce.MAX_FORCE) {
            totalForce = Math.sign(totalForce) * BondForce.MAX_FORCE;
        }

        // 5. Apply to Accumulators
        const fx = normal.x * totalForce;
        const fy = normal.y * totalForce;
        const fz = normal.z * totalForce;

        a.fx += fx; a.fy += fy; a.fz += fz;
        b.fx -= fx; b.fy -= fy; b.fz -= fz;
    }

    private static snapBond(atoms: Atom[], a: Atom, b: Atom, mouse: MouseState) {
        breakBond(atoms, a, b.id);
        killRelatedLabels(mouse.floatingLabels, a.id, b.id);
        redistributeCharge(atoms, a.id);
        redistributeCharge(atoms, b.id);
    }
}
