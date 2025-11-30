
import { DiscoveryState, GameMode, ColliderPhase } from '../types/ui';

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

export const COLLIDER_TECH_TREE: ColliderPhase[] = [
    { id: 0, name: "Vacuum Calibration", capMeV: 0.00001, description: "Output too low for matter generation.", nextUnlock: "Electron Neutrino (νe)" }, // 10 eV
    { id: 1, name: "Pulse Testing", capMeV: 0.5, description: "Insufficient for charged leptons.", nextUnlock: "Muon Neutrino (νμ)" }, // 500 keV (Allowed 200keV -> 500keV fix)
    { id: 2, name: "The Baryon Barrier", capMeV: 10, description: "Quark-Gluon plasma reachable.", nextUnlock: "Proton or Neutron" }, // 10 MeV
    { id: 3, name: "Beam Pipe Upgrade", capMeV: 200, description: "High-velocity particle injection active.", nextUnlock: "Beryllium (Be)" }, // 200 MeV
    { id: 4, name: "Thermal Wall", capMeV: 1500, description: "Direct Proton spawning enabled.", nextUnlock: "Water (H₂O)" }, // 1.5 GeV
    { id: 5, name: "Liquid Cooling", capMeV: 20000, description: "Heavy flavor physics unlocked.", nextUnlock: "Nitrogen Gas (N₂)" }, // 20 GeV
    { id: 6, name: "Superconductivity", capMeV: 100000, description: "Electroweak scale reachable.", nextUnlock: "Benzene + Silane" }, // 100 GeV
    { id: 7, name: "Detector Upgrade", capMeV: 200000, description: "Higgs field excitation possible.", nextUnlock: "Lead + Gold" }, // 200 GeV
    { id: 8, name: "High Luminosity", capMeV: 14000000, description: "LHC Maximum Output.", nextUnlock: "Endgame" } // 14 TeV
];

export const getColliderPhase = (discovery: DiscoveryState): ColliderPhase => {
    let phaseIndex = 0;

    // Phase 0 -> 1: Discover Electron Neutrino
    if (discovery.particles.has('nu_e')) phaseIndex = 1;
    else return COLLIDER_TECH_TREE[0];

    // Phase 1 -> 2: Discover Muon Neutrino
    if (discovery.particles.has('nu_mu')) phaseIndex = 2;
    else return COLLIDER_TECH_TREE[1];

    // Phase 2 -> 3: Discover Proton OR Neutron (Hadronization)
    if (discovery.particles.has('proton') || discovery.particles.has('neutron')) phaseIndex = 3;
    else return COLLIDER_TECH_TREE[2];

    // Phase 3 -> 4: Discover Beryllium (Z=4)
    if (discovery.elements.has(4)) phaseIndex = 4;
    else return COLLIDER_TECH_TREE[3];

    // Phase 4 -> 5: Discover Water (h2o)
    if (discovery.molecules.has('h2o')) phaseIndex = 5;
    else return COLLIDER_TECH_TREE[4];

    // Phase 5 -> 6: Discover Nitrogen Gas (n2)
    if (discovery.molecules.has('n2')) phaseIndex = 6;
    else return COLLIDER_TECH_TREE[5];

    // Phase 6 -> 7: Discover Benzene (c6h6) AND Silane (sih4)
    if (discovery.molecules.has('c6h6') && discovery.molecules.has('sih4')) phaseIndex = 7;
    else return COLLIDER_TECH_TREE[6];

    // Phase 7 -> 8: Discover Lead (82) AND Gold (79)
    if (discovery.elements.has(82) && discovery.elements.has(79)) phaseIndex = 8;
    else return COLLIDER_TECH_TREE[7];

    return COLLIDER_TECH_TREE[8];
};

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