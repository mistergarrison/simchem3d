
import { Atom, Particle } from '../../../types/core';
import { SimulationEvent } from '../../../types/ui';
import { SM_PARTICLES, getParticleElementData } from '../../../data/elements';
import { createExplosion } from '../../graphics/Effects';
import { addAtomToWorld } from '../../utils/general';

export class QuantumSystem {
    public static spawnPairProduction(
        atoms: Atom[],
        particles: Particle[],
        x: number,
        y: number,
        energy: number,
        onUnlock?: (id: string) => void,
        eventLog?: SimulationEvent[]
    ): Atom[] {
        // MATCHING LOGIC:
        // The user must release the tool while the energy is close to a particle's pair threshold (Resonance).
        // We use a +/- 20% window. 
        // This prevents high-energy releases (e.g. 5eV or 60eV) from spawning low-energy particles (e.g. 2eV Neutrinos)
        // just because the energy is "sufficient". It acts as a tuner.
        
        const TOLERANCE = 0.2; // 20% window matching roughly with the visual "Green" gauge (15%)

        let bestCandidate = null;
        let minError = Infinity;

        for (const p of SM_PARTICLES) {
            if (p.pairThreshold === undefined) continue;
            
            const diff = Math.abs(energy - p.pairThreshold);
            const error = diff / p.pairThreshold;

            // Must be within tolerance to resonate
            if (error <= TOLERANCE && error < minError) {
                minError = error;
                bestCandidate = p;
            }
        }
        
        if (!bestCandidate) return [];

        const def1 = bestCandidate;
        
        // Ensure antiparticle exists
        if (!def1.antiParticleId) return [];
        const def2 = SM_PARTICLES.find(p => p.id === def1.antiParticleId);
        if (!def2) return [];

        const el1 = getParticleElementData(def1.id);
        const el2 = getParticleElementData(def2.id);
        
        // Use pre-calculated safe mass from ElementData to avoid 0 mass errors
        const mass1 = el1.iso[0].m; 
        const mass2 = el2.iso[0].m;
        
        // Determine Visual Radius based on particle type
        let r1 = 30; 
        let r2 = 30;
        
        if (def1.type === 'quark') { 
            r1 = 15; r2 = 15; 
        } else if (def1.type === 'lepton' && def1.charge === 0) { 
            // Neutrinos are small
            r1 = 12; r2 = 12; 
        }
    
        const theta = Math.random() * Math.PI * 2;
        const speed = 50; 
        const offsetDist = 40; 
        const now = Date.now();
    
        const p1: Atom = {
                id: Math.random().toString(36),
                x: x + Math.cos(theta) * offsetDist, 
                y: y + Math.sin(theta) * offsetDist, 
                z: 0,
                vx: Math.cos(theta) * speed, vy: Math.sin(theta) * speed, vz: 0,
                fx: 0, fy: 0, fz: 0,
                element: el1,
                isotopeIndex: 0,
                bonds: [],
                mass: mass1,
                radius: r1,
                charge: def1.charge,
                createdAt: now,
                lastDecayCheck: now
        };
        const p2: Atom = {
                id: Math.random().toString(36),
                x: x - Math.cos(theta) * offsetDist, 
                y: y - Math.sin(theta) * offsetDist, 
                z: 0,
                vx: -Math.cos(theta) * speed, vy: -Math.sin(theta) * speed, vz: 0,
                fx: 0, fy: 0, fz: 0,
                element: el2,
                isotopeIndex: 0,
                bonds: [],
                mass: mass2,
                radius: r2,
                charge: def2.charge,
                createdAt: now,
                lastDecayCheck: now
        };
        
        addAtomToWorld(atoms, p1, eventLog, 'Pair Production');
        addAtomToWorld(atoms, p2, eventLog, 'Pair Production');
    
        createExplosion(particles, x, y, 0, '#FFFFFF', 15);
        if (onUnlock) {
            onUnlock(def1.id);
            onUnlock(def2.id);
        }
    
        return [p1, p2];
    }
}
