import { Atom, Particle, SimulationEvent } from '../../../types';
import { PROTON_ELEM, NEUTRON_ELEM } from '../../../elements';
import { createExplosion } from '../../effects';
import { addAtomToWorld, removeAtomFromWorld } from '../../utils';

export class HadronSystem {
    /**
     * Checks for groups of 3 quarks (uud or udd) and combines them into Nucleons.
     */
    static resolveHadronization(atoms: Atom[], particles: Particle[], eventLog: SimulationEvent[]) {
        // 1. Identify Quarks
        const quarks = atoms.filter(a => a.element.z === 1000 && (['u','d'].includes(a.element.s)));
        if (quarks.length < 3) return;

        const usedIds = new Set<string>();
        const MAX_DIST_SQ = 40 * 40; // Interaction range

        for (let i = 0; i < quarks.length; i++) {
            if (usedIds.has(quarks[i].id)) continue;
            const q1 = quarks[i];
            
            // Find closest neighbors
            const neighbors = quarks.filter((q, idx) => {
                if (q.id === q1.id || usedIds.has(q.id)) return false;
                const dx = q.x - q1.x;
                const dy = q.y - q1.y;
                const dz = q.z - q1.z;
                return (dx*dx + dy*dy + dz*dz) < MAX_DIST_SQ;
            });

            if (neighbors.length >= 2) {
                // Sort by distance to find the 2 closest
                neighbors.sort((a, b) => {
                    const d2a = (a.x-q1.x)**2 + (a.y-q1.y)**2;
                    const d2b = (b.x-q1.x)**2 + (b.y-q1.y)**2;
                    return d2a - d2b;
                });
                
                const q2 = neighbors[0];
                const q3 = neighbors[1];
                
                // Determine Identity
                const combo = [q1.element.s, q2.element.s, q3.element.s].sort().join('');
                
                let resultElem = null;
                if (combo === 'duu') resultElem = PROTON_ELEM; // uud (Proton)
                if (combo === 'ddu') resultElem = NEUTRON_ELEM; // udd (Neutron)
                
                if (resultElem) {
                    usedIds.add(q1.id);
                    usedIds.add(q2.id);
                    usedIds.add(q3.id);
                    
                    // Conservation of Momentum & Position
                    const cx = (q1.x + q2.x + q3.x) / 3;
                    const cy = (q1.y + q2.y + q3.y) / 3;
                    const cz = (q1.z + q2.z + q3.z) / 3;
                    const cvx = (q1.vx + q2.vx + q3.vx) / 3;
                    const cvy = (q1.vy + q2.vy + q3.vy) / 3;
                    const cvz = (q1.vz + q2.vz + q3.vz) / 3;

                    createExplosion(particles, cx, cy, cz, resultElem.c, 15);
                    
                    const nucleon: Atom = {
                        id: Math.random().toString(36),
                        x: cx, y: cy, z: cz,
                        vx: cvx, vy: cvy, vz: cvz,
                        fx:0, fy:0, fz:0,
                        element: resultElem,
                        isotopeIndex: 0,
                        mass: resultElem.iso[0].m,
                        radius: 20,
                        charge: resultElem.z === 1 ? 1 : 0,
                        bonds: [],
                        createdAt: Date.now(),
                        lastDecayCheck: Date.now()
                    };
                    addAtomToWorld(atoms, nucleon, eventLog, 'Hadronization');
                }
            }
        }
        
        // Remove consumed Quarks
        if (usedIds.size > 0) {
            for (let i = atoms.length - 1; i >= 0; i--) {
                if (usedIds.has(atoms[i].id)) {
                    removeAtomFromWorld(atoms, i, eventLog, 'Hadronization');
                }
            }
        }
    }
}