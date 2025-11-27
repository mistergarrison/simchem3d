
import { Atom } from '../types';
import { MouseState } from './types';
import { COVALENT_Z } from './constants';
import { breakBond, getBondOrder, redistributeCharge } from './utils';
import { killRelatedLabels } from './molecular_utils';

/**
 * Helper Object: Annealing Logic
 * Handles structural error correction, valency enforcement, and optimization.
 */
export const AnnealingLogic = {
    /**
     * Pass 1: Enforces maximum valency by shedding the weakest bonds.
     */
    enforceValency: (atoms: Atom[], a: Atom, mouse: MouseState, protectionSet: Set<string> | null) => {
        if ((a.cooldown || 0) > 0) return;
        
        // Skip if protected by drag or clearance
        if (mouse.dragGroup.has(a.id)) return;
        if (protectionSet && protectionSet.has(a.id)) return;

        let maxValency = COVALENT_Z.has(a.element.z) ? a.element.v : 8; 

        if (a.bonds.length > maxValency) {
            // Score all bonds to find the weakest candidate
            const bondScores = a.bonds.map(bid => {
                const b = atoms.find(x => x.id === bid);
                if (!b) return { id: bid, score: 1000 };

                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dz = b.z - a.z;
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
                
                const order = getBondOrder(a, bid);
                const restScale = 0.9 - ((order - 1) * 0.12);
                const ideal = (a.radius + b.radius) * restScale;
                const ratio = dist / ideal;
                const strain = Math.abs(ratio - 1);

                let score = strain;
                if (ratio < 1.0) score *= 1.5; // Penalize compression
                if (strain < 0.35) score *= 0.1; // Protect stable bonds

                return { id: bid, score };
            });

            // Keep only the best bonds
            bondScores.sort((x, y) => x.score - y.score);
            const bondsToKeep = new Set(bondScores.slice(0, maxValency).map(b => b.id));
            
            const currentBonds = [...a.bonds]; 
            for (const bid of currentBonds) {
                if (!bondsToKeep.has(bid)) {
                    // Break the bond
                    if (breakBond(atoms, a, bid)) {
                        killRelatedLabels(mouse.floatingLabels, a.id, bid);
                        redistributeCharge(atoms, a.id);
                        redistributeCharge(atoms, bid);
                    }
                    
                    // Apply Separation Force
                    const b = atoms.find(x => x.id === bid);
                    if (b) {
                        const dx = b.x - a.x;
                        const dy = b.y - a.y;
                        const dz = b.z - a.z;
                        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
                        const push = 5.0; 
                        const totalMass = a.mass + b.mass;
                        
                        a.vx += (dx/dist) * push * (a.mass / totalMass);
                        a.vy += (dy/dist) * push * (a.mass / totalMass);
                        a.vz += (dz/dist) * push * (a.mass / totalMass);

                        a.vx -= (dx/dist) * push * (b.mass / totalMass);
                        a.vy -= (dy/dist) * push * (b.mass / totalMass);
                        a.vz -= (dz/dist) * push * (b.mass / totalMass);
                    }
                }
            }
        }
    },

    /**
     * Pass 2: Optimizes structure by cleaning up homonuclear bonds (e.g. O-O)
     * if a better partner is nearby.
     */
    optimizeStructure: (atoms: Atom[], a: Atom, mouse: MouseState, protectionSet: Set<string> | null) => {
        if ((a.cooldown || 0) > 0) return;
        if (a.bonds.length === 0) return;
        if (mouse.dragGroup.has(a.id)) return;
        if (protectionSet && protectionSet.has(a.id)) return;

        const homonuclearBondId = a.bonds.find(bid => {
            const b = atoms.find(x => x.id === bid);
            return b && b.element.z === a.element.z;
        });

        if (homonuclearBondId) {
            const myValency = COVALENT_Z.has(a.element.z) ? a.element.v : 6;
            
            // Only optimize if valency is low (like Oxygen/Sulfur chains)
            if (myValency <= 2) { 
                const betterHub = atoms.find(c => {
                    if (c.id === a.id || c.id === homonuclearBondId || a.bonds.includes(c.id)) return false;
                    const cMax = COVALENT_Z.has(c.element.z) ? c.element.v : 6;
                    if (cMax <= myValency) return false; 
                    if (c.bonds.length >= cMax) return false; 

                    const dx = c.x - a.x;
                    const dy = c.y - a.y;
                    const dz = c.z - a.z;
                    return (dx*dx + dy*dy + dz*dz < (a.radius * 4.5) ** 2);
                });

                if (betterHub) {
                    // Swap Partners
                    if (breakBond(atoms, a, homonuclearBondId)) {
                        killRelatedLabels(mouse.floatingLabels, a.id, homonuclearBondId);
                        redistributeCharge(atoms, a.id);
                        redistributeCharge(atoms, homonuclearBondId);
                    }
                    
                    // Apply Impulse toward new hub
                    const dx = betterHub.x - a.x;
                    const dy = betterHub.y - a.y;
                    const dz = betterHub.z - a.z;
                    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
                    
                    const impulse = 10.0;
                    const totalMass = a.mass + betterHub.mass;
                    
                    a.vx += (dx/dist) * impulse * (betterHub.mass / totalMass);
                    a.vy += (dy/dist) * impulse * (betterHub.mass / totalMass);
                    a.vz += (dz/dist) * impulse * (betterHub.mass / totalMass);
                    
                    betterHub.vx -= (dx/dist) * impulse * (a.mass / totalMass);
                    betterHub.vy -= (dy/dist) * impulse * (a.mass / totalMass);
                    betterHub.vz -= (dz/dist) * impulse * (a.mass / totalMass);
                }
            }
        }
    }
};
