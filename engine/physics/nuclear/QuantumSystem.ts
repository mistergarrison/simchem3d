
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
        // MATCHING LOGIC: Strict Resonance (+/- 15%)
        // The user must release the tool while the energy is close to a particle's pair threshold.
        // If they miss the window (too low OR too high), the energy fizzles.
        
        const TOLERANCE = 0.15; // 15% window

        let bestCandidate = null;
        let minError = Infinity;

        for (const p of SM_PARTICLES) {
            if (p.pairThreshold === undefined) continue;
            
            // Calculate relative error
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
        const threshold = def1.pairThreshold || 0;
        
        // --- KINETIC INJECTION ---
        // Excess energy becomes velocity (limited by tolerance window)
        // Base spawn speed is 50.
        let speed = 50; 
        if (energy > threshold) {
            const excess = energy - threshold;
            const restEnergy = threshold; 
            
            // Simple physics scaling: v ~ sqrt(E_kinetic / mass)
            const ratio = excess / restEnergy; 
            const boost = 100 * Math.sqrt(ratio);
            
            speed += boost;
        }

        const spawnedAtoms: Atom[] = [];
        const now = Date.now();
        const offsetDist = 40; 

        // SINGLE PARTICLE INJECTION (Protons/Neutrons via Energy Tool)
        // If no anti-particle is defined, or if the particle is a Hadron where we use single-injection mechanics
        if (!def1.antiParticleId || def1.type === 'hadron') {
            const el1 = getParticleElementData(def1.id);
            const mass1 = el1.iso[0].m;
            let r1 = 30;
            if (def1.type === 'hadron') r1 = 20;

            const theta = Math.random() * Math.PI * 2;
            const p1: Atom = {
                id: Math.random().toString(36),
                x: x, 
                y: y, 
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
            addAtomToWorld(atoms, p1, eventLog, 'Particle Injection');
            spawnedAtoms.push(p1);
            createExplosion(particles, x, y, 0, def1.color, 20);
            if (onUnlock) onUnlock(def1.id);

        } else {
            // PAIR PRODUCTION (Leptons/Quarks)
            const def2 = SM_PARTICLES.find(p => p.id === def1.antiParticleId);
            if (!def2) return []; // Should not happen based on check above, but safe

            const el1 = getParticleElementData(def1.id);
            const el2 = getParticleElementData(def2.id);
            
            const mass1 = el1.iso[0].m; 
            const mass2 = el2.iso[0].m;
            
            let r1 = 30; 
            let r2 = 30;
            
            if (def1.type === 'quark') { 
                r1 = 15; r2 = 15; 
            } else if (def1.type === 'lepton' && def1.charge === 0) { 
                r1 = 12; r2 = 12; 
            }
        
            const theta = Math.random() * Math.PI * 2;
            
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
            spawnedAtoms.push(p1, p2);
        
            createExplosion(particles, x, y, 0, '#FFFFFF', 15);
            if (onUnlock) {
                onUnlock(def1.id);
                onUnlock(def2.id);
            }
        }
    
        return spawnedAtoms;
    }
}