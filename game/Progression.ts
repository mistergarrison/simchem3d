
import { DiscoveryState, GameMode } from '../types/ui';

export interface DiscoveryResult {
    updatedDiscovery: DiscoveryState;
    hasChanges: boolean;
    newlyUnlocked: {
        particles: boolean;
        elements: boolean;
        molecules: boolean;
        lasso: boolean;
    };
    newHelpSections: string[];
}

/**
 * logic/Progression.ts
 * 
 * Encapsulates the rules for unlocking content in Discovery Mode.
 * Determines "Halo" effects and "Help" unlocks based on new findings.
 */
export const processDiscovery = (
    current: DiscoveryState,
    findings: Partial<DiscoveryState>,
    gameMode: GameMode
): DiscoveryResult => {
    const next: DiscoveryState = {
        elements: new Set(current.elements),
        molecules: new Set(current.molecules),
        particles: new Set(current.particles)
    };

    let hasChanges = false;
    const newHelpSections: string[] = [];
    const newlyUnlocked = {
        particles: false,
        elements: false,
        molecules: false,
        lasso: false
    };

    // 1. Process Particles
    const prevParticleCount = next.particles.size;
    const hadProtonsOrNeutrons = next.particles.has('proton') || next.particles.has('neutron');
    
    if (findings.particles) {
        findings.particles.forEach(p => {
            if (!next.particles.has(p)) {
                next.particles.add(p);
                hasChanges = true;
            }
        });
    }

    const hasParticlesNow = next.particles.size > 0;
    const hasProtonsOrNeutronsNow = next.particles.has('proton') || next.particles.has('neutron');

    // Unlock Condition: First Particle
    if (prevParticleCount === 0 && hasParticlesNow && gameMode === 'discovery') {
        newlyUnlocked.particles = true;
        newHelpSections.push('particles'); // Unlock "Quantum Vacuum"
    }

    // Unlock Condition: First Nucleon (Hadrons)
    if (!hadProtonsOrNeutrons && hasProtonsOrNeutronsNow) {
        newHelpSections.push('hadrons');
    }

    // 2. Process Elements
    const prevElementCount = next.elements.size;
    if (findings.elements) {
        findings.elements.forEach(e => {
            if (!next.elements.has(e)) {
                next.elements.add(e);
                hasChanges = true;
            }
        });
    }

    // Unlock Condition: First Heavy Element (Z > 1) -> Nuclear Physics
    // Assuming Z=1 (H) is given or easily found, getting Helium/Deuterium is the step.
    const wasOnlyHydrogen = prevElementCount <= 1;
    const hasHeavyElements = next.elements.size > 1;

    if (wasOnlyHydrogen && hasHeavyElements && gameMode === 'discovery') {
        newlyUnlocked.elements = true;
        newHelpSections.push('nuclear');
    }

    // 3. Process Molecules
    const prevMoleculeCount = next.molecules.size;
    if (findings.molecules) {
        findings.molecules.forEach(m => {
            if (!next.molecules.has(m)) {
                next.molecules.add(m);
                hasChanges = true;
            }
        });
    }

    // Unlock Condition: First Molecule -> Chemistry + Lasso
    if (prevMoleculeCount === 0 && next.molecules.size > 0 && gameMode === 'discovery') {
        newlyUnlocked.molecules = true;
        newlyUnlocked.lasso = true;
        newHelpSections.push('chemistry');
    }

    return {
        updatedDiscovery: next,
        hasChanges,
        newlyUnlocked,
        newHelpSections
    };
};
