
import { SimulationEngine } from '../engine/Core';
import { SM_PARTICLES, PROTON_ELEM, NEUTRON_ELEM, getParticleElementData, ELEMENTS } from '../data/elements';
import { MOLECULES } from '../data/molecules';
import { Atom } from '../types/core';
import { QuantumSystem } from '../engine/physics/nuclear/QuantumSystem';
import { resolveMolecularAssembly } from '../engine/physics/Assembly';
import { GraphAnalyzer } from '../engine/algorithms/topology/GraphAnalyzer';
import { identifyMoleculeData } from '../engine/utils/molecular';
import { AtomFactory } from '../engine/physics/Spawner';

export class SimulationTestRunner {
    engine: SimulationEngine;
    onStatus: (msg: string, type: 'success' | 'error' | 'info') => void;

    constructor(engine: SimulationEngine, onStatus: (msg: string, type: 'success' | 'error' | 'info') => void) {
        this.engine = engine;
        this.onStatus = onStatus;
    }

    private getCenter() {
        const { w, h } = this.engine.getWorldDimensions();
        return { cx: w / 2, cy: h / 2 };
    }

    private resetBoard() {
        this.engine.clear();
    }

    private async wait(frames: number) {
        return new Promise(resolve => {
            let count = 0;
            const check = () => {
                count++;
                if (count >= frames) resolve(true);
                else requestAnimationFrame(check);
            };
            check();
        });
    }

    private getCanvasState(): string {
        return JSON.stringify(this.engine.atoms.map(a => ({
            id: a.id,
            element: a.element.s,
            pos: { x: Math.round(a.x), y: Math.round(a.y), z: Math.round(a.z) },
            vel: { vx: Math.round(a.vx), vy: Math.round(a.vy), vz: Math.round(a.vz) },
            bonds: a.bonds,
            charge: a.charge,
            mass: a.mass.toFixed(3),
            radius: a.radius.toFixed(1)
        })), null, 2);
    }

    public async run() {
        try {
            this.onStatus("Running System Tests...", 'info');
            
            // 1. Quantum Vacuum
            await this.testAllPairProductions();
            await this.wait(10);

            // 2. Annihilation
            await this.testAnnihilation();
            await this.wait(10);
            
            // 3. Strong Force
            await this.testHadronization();
            await this.wait(10);
            
            // 4. Nuclear Physics
            await this.testNeutronCapture();
            await this.wait(10);
            
            // 5. Chemistry (Bonding) - Wait 2s
            await this.testWaterFormation();
            await this.wait(10);

            // 6. Complex Assembly (Algorithms) - Wait 2s
            await this.testBenzeneAssembly();
            await this.wait(10);

            // 7. Weak Force (Decay)
            await this.testDecayChain();
            await this.wait(10);

            // 8. Comprehensive Database Check (Run Last)
            await this.testAllMoleculeBlueprints();
            
            this.onStatus("ALL SYSTEMS NOMINAL. Physics Engine Verified.", 'success');
        } catch (e: any) {
            console.error("TEST FAILURE - CANVAS STATE DUMP:", this.getCanvasState());
            console.error(e);
            this.onStatus(e.message || "Test Failed", 'error');
        }
    }

    async testAllPairProductions() {
        console.log("TEST: 1. Pair Productions");
        const { cx, cy } = this.getCenter();

        const particlesWithThreshold = SM_PARTICLES.filter(p => 
            p.pairThreshold !== undefined && 
            p.type !== 'hadron'
        );

        for (const p of particlesWithThreshold) {
            this.resetBoard();
            this.engine.eventLog = [];
            const threshold = p.pairThreshold!;
            
            QuantumSystem.spawnPairProduction(
                this.engine.atoms, 
                this.engine.particles, 
                cx, cy, 
                threshold * 1.05, 
                undefined, 
                this.engine.eventLog
            );

            await this.wait(30); // Wait 0.5s per particle

            const events = this.engine.eventLog.filter(e => e.type === 'create' && e.reason === 'Pair Production');
            if (events.length !== 2) {
                throw new Error(`Failed to produce pair for ${p.name}`);
            }
        }
        this.onStatus("Pair Production Verified", 'info');
    }

    async testAnnihilation() {
        console.log("TEST: 2. Annihilation (e⁻ + e⁺ -> Energy)");
        this.resetBoard();
        const { cx, cy } = this.getCenter();
        
        // Spawn Electron
        const eElem = getParticleElementData('electron');
        this.engine.spawnAtom(cx - 30, cy, 0, eElem, 0, {vx: 100, vy: 0, vz: 0});
        
        // Spawn Positron
        const pElem = getParticleElementData('positron');
        this.engine.spawnAtom(cx + 30, cy, 0, pElem, 0, {vx: -100, vy: 0, vz: 0});
        
        await this.wait(40); // Wait for collision
        
        // Check if atoms are gone
        const remaining = this.engine.atoms.filter(a => a.element.z === -1 || a.element.z === -2);
        if (remaining.length > 0) {
             throw new Error(`Annihilation failed. ${remaining.length} particles remain.`);
        }
        this.onStatus("Annihilation Verified", 'info');
    }

    async testHadronization() {
        console.log("TEST: 3. Hadronization (uud -> p)");
        this.resetBoard();
        const { cx, cy } = this.getCenter();

        // Spawn 2 Up, 1 Down
        const uElem = getParticleElementData('up');
        const dElem = getParticleElementData('down');

        this.engine.spawnAtom(cx - 15, cy, 0, uElem, 0, {vx: 5, vy: 0, vz: 0});
        this.engine.spawnAtom(cx + 15, cy, 0, uElem, 0, {vx: -5, vy: 0, vz: 0});
        this.engine.spawnAtom(cx, cy + 15, 0, dElem, 0, {vx: 0, vy: -5, vz: 0});

        await this.wait(90); // Wait 1.5s for quarks to drift and bind

        const protons = this.engine.atoms.filter(a => a.element.s === 'p⁺');
        if (protons.length !== 1) {
            throw new Error(`Hadronization failed. Expected 1 Proton, found ${protons.length}`);
        }
        this.onStatus("Hadronization Verified", 'info');
    }

    async testNeutronCapture() {
        console.log("TEST: 4. Neutron Capture (H-1 + n -> H-2)");
        this.resetBoard();
        const { cx, cy } = this.getCenter();

        // Spawn Proton (H-1)
        this.engine.spawnAtom(cx, cy, 0, PROTON_ELEM, 0); 
        const p = this.engine.atoms[0];
        if (!p) throw new Error("Failed to spawn Proton");
        p.vx = 0; p.vy = 0; 

        // Spawn Neutron, aiming at Proton
        this.engine.spawnAtom(cx - 100, cy, 0, NEUTRON_ELEM, 0, {vx: 400, vy: 0, vz: 0}); 
        
        await this.wait(60);

        // Check if Proton mass increased (H-2 ~ 2.014u)
        const pCurrent = this.engine.atoms.find(a => a.id === p.id);
        if (!pCurrent || pCurrent.mass < 2.0) {
             throw new Error("Neutron Capture failed. Proton mass did not increase.");
        }
        this.onStatus("Neutron Capture Verified", 'info');
    }

    async testWaterFormation() {
        console.log("TEST: 5. Chemical Bonding (H2O)");
        this.resetBoard();
        const { cx, cy } = this.getCenter();

        // Spawn Oxygen (Using Stable Isotope O-16, Index 1)
        const ox = ELEMENTS.find(e => e.s === 'O')!;
        this.engine.spawnAtom(cx, cy, 0, ox, 1);
        const oAtom = this.engine.atoms[0];
        
        // Spawn 2 Hydrogens
        const hElem = ELEMENTS.find(e => e.s === 'H')!;
        this.engine.spawnAtom(cx - 120, cy, 0, hElem, 0, {vx: 60, vy: 0, vz: 0});
        this.engine.spawnAtom(cx + 120, cy, 0, hElem, 0, {vx: -60, vy: 0, vz: 0});

        // Wait 2s (120 frames) for stabilization
        await this.wait(120);

        // Check bonds on Oxygen
        if (oAtom.bonds.length !== 2) {
            throw new Error(`Water formation failed. Oxygen has ${oAtom.bonds.length} bonds, expected 2.`);
        }
        this.onStatus("Chemical Bonding Verified", 'info');
    }

    async testBenzeneAssembly() {
        console.log("TEST: 6. Molecular Assembly (Benzene C6H6)");
        this.resetBoard();
        const { cx, cy } = this.getCenter();

        const cElem = ELEMENTS.find(e => e.z === 6)!;
        const hElem = ELEMENTS.find(e => e.z === 1)!;

        // Spawn Ingredients
        for(let i=0; i<6; i++) this.engine.spawnAtom(cx + Math.random()*20, cy + Math.random()*20, 0, cElem, 2);
        for(let i=0; i<6; i++) this.engine.spawnAtom(cx + Math.random()*20, cy + Math.random()*20, 0, hElem, 0);

        const ids = new Set(this.engine.atoms.map(a => a.id));

        // Trigger Assembly
        resolveMolecularAssembly(
            this.engine.atoms,
            this.engine.mouse.floatingLabels,
            ids,
            this.engine.particles,
            undefined, 
            { x: cx, y: cy, z: 0 } 
        );

        // Wait 2s (120 frames) for stability
        await this.wait(120);

        // Verify Structure
        const carbons = this.engine.atoms.filter(a => a.element.z === 6);
        const bondedCarbons = carbons.filter(c => c.bonds.length === 4);

        if (bondedCarbons.length !== 6) {
            const bonds = carbons.map(c => c.bonds.length).join(',');
            throw new Error(`Benzene Assembly failed. Expected 6 Carbons with 4 bond-entries each, found ${bondedCarbons.length}. Bond Counts: [${bonds}]`);
        }
        
        this.onStatus("Molecular Assembly Verified", 'info');
    }

    private generateRawFormula(atoms: Atom[]): string {
        const counts = new Map<string, number>();
        atoms.forEach(a => {
            const s = a.element.s;
            counts.set(s, (counts.get(s) || 0) + 1);
        });
        
        const keys = Array.from(counts.keys()).sort();
        return keys.map(k => `${k}${counts.get(k)}`).join(' ') || "Empty";
    }

    async testAllMoleculeBlueprints() {
        console.log("TEST: 8. All Molecule Blueprints (Validation)");
        this.onStatus("Validating 50+ Molecular Recipes...", 'info');
        const { cx, cy } = this.getCenter();
        
        // INTERCEPT DISCOVERY CALLBACK
        // We need to verify that the game engine actually recognizes the molecule
        // and triggers the discovery event.
        const originalCallback = this.engine.callbacks.onDiscovery;
        const discoveredInThisStep = new Set<string>();
        
        this.engine.callbacks.onDiscovery = (d) => {
            if (d.molecules) d.molecules.forEach(m => discoveredInThisStep.add(m));
            originalCallback(d); // Forward to UI so user sees unlocks
        };

        let passed = 0;
        const failures: string[] = [];
        
        for (const mol of MOLECULES) {
            this.resetBoard();
            discoveredInThisStep.clear();
            
            // 1. Spawn Ingredients using AtomFactory to ensure correct sizes/physics
            const atomIds = new Set<string>();
            for (const ing of mol.ingredients) {
                const el = ELEMENTS.find(e => e.z === ing.z);
                if (!el) throw new Error(`Invalid element Z=${ing.z} in ${mol.name}`);
                
                const stableIsoIndex = el.iso.findIndex(iso => iso.hl === 'stable');
                const isoIndex = stableIsoIndex >= 0 ? stableIsoIndex : 0;

                for(let k=0; k<ing.count; k++) {
                    const x = cx + (Math.random()-0.5)*100;
                    const y = cy + (Math.random()-0.5)*100;
                    
                    // Use AtomFactory to create correct physics object
                    const atom = AtomFactory.create(x, y, 0, el, isoIndex);
                    
                    if (atom) {
                        this.engine.atoms.push(atom);
                        atomIds.add(atom.id);
                    }
                }
            }

            // 2. Trigger Assembly
            resolveMolecularAssembly(
                this.engine.atoms,
                this.engine.mouse.floatingLabels,
                atomIds,
                this.engine.particles,
                undefined, 
                { x: cx, y: cy, z: 0 },
                undefined,
                mol 
            );

            // 3. Wait for physics to settle AND for discovery tick (runs every 60 frames)
            // We wait 70 frames to be safe and ensure the periodic check runs.
            await this.wait(70);

            // 4. Validate Topology
            const { atomGroupMap } = GraphAnalyzer.analyze(this.engine.atoms);
            
            const groupedAtoms: Atom[][] = [];
            this.engine.atoms.forEach(a => {
                const gIdx = atomGroupMap.get(a.id);
                if (gIdx !== undefined) {
                    if (!groupedAtoms[gIdx]) groupedAtoms[gIdx] = [];
                    groupedAtoms[gIdx].push(a);
                }
            });
            
            // Find largest group
            groupedAtoms.sort((a, b) => b.length - a.length);
            const mainGroup = groupedAtoms[0] || [];
            
            const identified = identifyMoleculeData(mainGroup);
            let actualFormula = "Unknown";
            
            if (identified) {
                actualFormula = identified.formula;
            } else {
                actualFormula = this.generateRawFormula(mainGroup) + " (Unstable/Isomer)";
            }

            if (actualFormula !== mol.formula) {
                 const errMsg = `[SystemTest] ${mol.name} Mismatch. Expected: ${mol.formula}, Got: ${actualFormula}`;
                 console.error(errMsg);
                 failures.push(`${mol.name}: Structural Mismatch (${actualFormula})`);
            } 
            // 5. Validate Discovery Trigger
            else if (!discoveredInThisStep.has(mol.id)) {
                 const errMsg = `[SystemTest] ${mol.name} formed correctly but was NOT discovered by the engine. Check discovery loop.`;
                 console.error(errMsg);
                 failures.push(`${mol.name}: Not Discovered`);
            }
            else {
                 passed++;
            }
            
            // Yield briefly to keep UI responsive
            if (passed % 5 === 0) await this.wait(1);
        }
        
        // Restore callback
        this.engine.callbacks.onDiscovery = originalCallback;

        if (failures.length > 0) {
            this.onStatus(`Validation Complete. ${passed} passed. ${failures.length} failed. Check console.`, 'error');
        } else {
            this.onStatus(`Verified ${passed} Molecular Blueprints`, 'info');
        }
    }

    async testDecayChain() {
        console.log("TEST: 7. Radioactive Decay");
        this.resetBoard();
        const { cx, cy } = this.getCenter();

        // Spawn Helium-6 (Unstable, decays to Lithium)
        const he = ELEMENTS.find(e => e.s === 'He')!;
        this.engine.spawnAtom(cx, cy, 0, he, 0);
        const atom = this.engine.atoms[0];
        
        // Force custom unstable isotope for speed (50ms half-life)
        atom.customIsotope = { m: 6.0, hl: 0.05, mode: 'beta-', p: { z: 3, m: 6.0 } };
        
        // Bypass the 300ms grace period by backdating the creation time and last check
        atom.lastDecayCheck = Date.now() - 2000;

        // Wait longer to ensure probabilistic decay occurs (120 frames ~ 2s)
        await this.wait(120); 

        const currentAtom = this.engine.atoms.find(a => a.id === atom.id);
        if (!currentAtom) throw new Error("Atom disappeared");
        if (currentAtom.element.s !== 'Li') {
            throw new Error(`Decay failed. Expected Li, got ${currentAtom.element.s} (Mass: ${currentAtom.mass}, HL: ${atom.customIsotope?.hl})`);
        }
        
        this.onStatus("Radioactive Decay Verified", 'info');
    }
}

export const runSystemTest = (engine: SimulationEngine, onStatus: (msg: string, type: 'success' | 'error' | 'info') => void) => {
    const runner = new SimulationTestRunner(engine, onStatus);
    runner.run();
};
