
import { Atom } from '../../../types/core';
import { MouseState } from '../../../types/ui';
import { BOND_STIFFNESS, BOND_DAMPING } from '../../config';
import { getBondOrder, breakBond, redistributeCharge } from '../../utils/general';
import { killRelatedLabels } from '../../utils/molecular';

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
        
        // --- CHARGE CONSERVATION FIX ---
        // If atoms have fractional charges (e.g. 0.5 from H2+), we must decide who keeps the electron(s)
        // to ensure that when redistributeCharge runs on the fragments, the sum is conserved integers.
        const qA = a.charge || 0;
        const qB = b.charge || 0;
        const total = qA + qB;
        
        // Only intervene if we have non-integers that sum to an integer (splitting a delocalized ion)
        if (Math.abs(total % 1) < 0.05 && (Math.abs(qA % 1) > 0.05 || Math.abs(qB % 1) > 0.05)) {
            const enA = BondForce.getElectronegativity(a.element.z);
            const enB = BondForce.getElectronegativity(b.element.z);
            
            // Higher Electronegativity means more affinity for electrons -> Lower Charge
            // If EN is equal, randomize.
            const favorsA = enA > enB || (enA === enB && Math.random() > 0.5);
            
            // Split 'total' into two integers.
            // Example: Total=1 (e.g. 0.5, 0.5). Split into 0 and 1.
            // Winner (High EN) gets lower charge (0). Loser gets higher charge (1).
            
            let newQA = Math.floor(qA);
            let newQB = Math.ceil(qB);
            
            // Ensure sum matches
            if (newQA + newQB !== Math.round(total)) {
                newQA = Math.ceil(qA);
                newQB = Math.floor(qB);
            }
            
            const low = Math.min(newQA, newQB);
            const high = Math.max(newQA, newQB);
            
            if (favorsA) {
                a.charge = low;
                b.charge = high;
            } else {
                a.charge = high;
                b.charge = low;
            }
        }

        redistributeCharge(atoms, a.id);
        redistributeCharge(atoms, b.id);
    }

    private static getElectronegativity(z: number): number {
        // Simplified Pauling scale for common elements
        switch(z) {
            case 1: return 2.20; // H
            case 6: return 2.55; // C
            case 7: return 3.04; // N
            case 8: return 3.44; // O
            case 9: return 3.98; // F
            case 15: return 2.19; // P
            case 16: return 2.58; // S
            case 17: return 3.16; // Cl
            case 35: return 2.96; // Br
            case 53: return 2.66; // I
            default: return 2.0; // Generic
        }
    }
}