
import { Atom, Particle, SimulationEvent } from '../types';
import { ELEMENTS, NEUTRON_ELEM, ELECTRON_ELEM, getParticleElementData, SM_PARTICLES } from '../elements';
import { MOLECULES } from '../molecules';
import { identifyMolecule } from './molecular_utils';
import { getMoleculeGroup, addAtomToWorld } from './utils';
import { WORLD_SCALE } from './constants';
import { startClearance, CLEARANCE_FRAMES } from './clearance';
import { QuantumSystem } from './physics/nuclear/QuantumSystem';
import { runUnitTests } from './unitTests';
import { SimulationEngine } from './Engine';

class SystemSuite {
    engine: SimulationEngine;
    onStatus: (msg: string, type: 'success' | 'error' | 'info') => void;
    
    constructor(
        engine: SimulationEngine,
        onStatus: (msg: string, type: 'success' | 'error' | 'info') => void
    ) {
        this.engine = engine;
        this.onStatus = onStatus;
    }

    private waitFrames = (frames: number) => new Promise(resolve => setTimeout(resolve, frames * 16));

    private dumpState = () => {
        if (this.engine.atoms.length === 0) return "Board Empty";
        return "\n--- FAILED STATE SNAPSHOT ---\n" + this.engine.atoms.map(a => {
             const iso = a.element.iso[a.isotopeIndex];
             const mass = Math.round(iso.m);
             const charge = a.charge !== undefined ? a.charge : 0;
             const chargeStr = charge > 0 ? `+${charge}` : `${charge}`;
             return `ID:${a.id.slice(0,8).padEnd(9)} | ${a.element.s}-${mass} (${chargeStr}) | Pos: (${a.x.toFixed(1)}, ${a.y.toFixed(1)}, ${a.z.toFixed(1)}) | Vel: (${a.vx.toFixed(2)}, ${a.vy.toFixed(2)}, ${a.vz.toFixed(2)})`;
        }).join('\n') + "\n-----------------------------";
    };

    private getCenter = () => {
        // Use the actual world dimensions calculated by the engine's viewport
        const { w, h } = this.engine.getWorldDimensions();
        return {
            cx: w / 2,
            cy: h / 2
        };
    };

    private resetBoard = () => {
        this.engine.clear();
    };

    // Helper to scan recent event log for creations
    private scanEventLogForCreations(since: number): {label: string, id: string}[] {
        return this.engine.eventLog
            .filter(e => e.type === 'create' && e.timestamp > since)
            .map(e => ({label: e.label, id: e.atomId}));
    }

    private shootProjectile = (type: 'neutron'|'electron', speed: number) => {
        const target = this.engine.atoms.find(a => a.element.z >= 1);
        if (!target) return;

        const { cx, cy } = this.getCenter();
        const startX = cx;
        const startY = cy;

        this.engine.particles.push({
            id: `marker-${Date.now()}`,
            x: cx, y: cy, z: 0,
            vx: 0, vy: 0, vz: 0,
            life: 1.0, maxLife: 1.0,
            color: '#FFFFFF', size: 5
        });

        const dxRaw = target.x - startX;
        const dyRaw = target.y - startY;
        const dist = Math.sqrt(dxRaw*dxRaw + dyRaw*dyRaw);
        
        const timeToImpact = dist / speed;
        const aimX = target.x + target.vx * timeToImpact;
        const aimY = target.y + target.vy * timeToImpact;

        const dx = aimX - startX;
        const dy = aimY - startY;
        const angle = Math.atan2(dy, dx);
        
        let atom: Atom;
        if (type === 'neutron') {
            atom = {
                id: `test-n-${Date.now()}`,
                x: startX, y: startY, z: 0,
                vx: Math.cos(angle) * speed, 
                vy: Math.sin(angle) * speed, 
                vz: 0,
                fx: 0, fy: 0, fz: 0,
                element: NEUTRON_ELEM,
                isotopeIndex: 0,
                bonds: [],
                mass: 1.008,
                radius: 20,
                charge: 0,
                createdAt: Date.now(),
                lastDecayCheck: Date.now()
            };
        } else {
             atom = {
                id: `test-e-${Date.now()}`,
                x: startX, y: startY, z: 0,
                vx: Math.cos(angle) * speed, 
                vy: Math.sin(angle) * speed, 
                vz: 0,
                fx: 0, fy: 0, fz: 0,
                element: ELECTRON_ELEM,
                isotopeIndex: 0,
                bonds: [],
                mass: 0.1, 
                radius: 30, 
                charge: -1,
                createdAt: Date.now(),
                lastDecayCheck: Date.now()
            };
        }
        addAtomToWorld(this.engine.atoms, atom, this.engine.eventLog, 'Projectile Test');
    };

    private createQuark = (type: string, x: number, y: number): Atom => ({
        id: `quark-${type}-${Date.now()}-${Math.random()}`,
        x, y, z: 0,
        vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2, vz: 0,
        fx: 0, fy: 0, fz: 0,
        element: getParticleElementData(type),
        isotopeIndex: 0,
        mass: 0.01, 
        radius: 10,
        charge: type === 'up' ? 0.66 : -0.33,
        bonds: [],
        createdAt: Date.now(),
        lastDecayCheck: Date.now()
    });

    async testPairProduction() {
        this.resetBoard();
        this.engine.eventLog = []; 
        
        console.log("TEST: 1. Pair Production & Annihilation");
        
        const { cx, cy } = this.getCenter();
        const ppX = cx; 
        const ppY = cy;
        
        QuantumSystem.spawnPairProduction(this.engine.atoms, this.engine.particles, ppX, ppY, 1.022, undefined, this.engine.eventLog);
        
        const creationEvents = this.engine.eventLog.filter(e => e.type === 'create' && e.reason === 'Pair Production');
        
        if (creationEvents.length !== 2) {
            throw new Error(`Expected 2 Creation Events, found ${creationEvents.length}`);
        }
        
        const ePosId = creationEvents.find(e => e.label === 'e⁺' || e.label === 'Positron')?.atomId;
        const eNegId = creationEvents.find(e => e.label === 'e⁻' || e.label === 'Electron')?.atomId;
        
        if (!ePosId || !eNegId) throw new Error("Could not identify Electron/Positron pair in logs");
        
        const ePos = this.engine.atoms.find(a => a.id === ePosId);
        const eNeg = this.engine.atoms.find(a => a.id === eNegId);
        
        if (!ePos || !eNeg) throw new Error("Particles logged but not found in world state");
        
        this.onStatus("Pair Production Verified via Log", 'success');
        
        ePos.x = cx - 10; ePos.y = cy; 
        eNeg.x = cx + 10; eNeg.y = cy;
        ePos.vx = 20; eNeg.vx = -20; 
        
        const logIndex = this.engine.eventLog.length;
        
        await this.waitFrames(20); 
        
        const newEvents = this.engine.eventLog.slice(logIndex);
        const destructionEvents = newEvents.filter(e => e.type === 'destroy' && e.reason === 'Annihilation');
        
        if (destructionEvents.length !== 2) {
            throw new Error(`Expected 2 Annihilation Events, found ${destructionEvents.length}`);
        }
        
        this.onStatus("Annihilation Verified via Log!", 'success');
    }

    async testDeuteriumChain() {
        this.resetBoard();
        const { cx, cy } = this.getCenter();
        console.log("TEST: 2. Deuterium Chain");

        const p: Atom = {
            id: 'test-proton',
            x: cx + 50, y: cy, z: 0,
            vx: 0, vy: 0, vz: 0, fx: 0, fy: 0, fz: 0,
            element: ELEMENTS[0],
            isotopeIndex: 0,
            bonds: [],
            mass: 1.007,
            radius: 20, 
            charge: 1,
            createdAt: Date.now(),
            lastDecayCheck: Date.now()
        };
        addAtomToWorld(this.engine.atoms, p, this.engine.eventLog, 'Test Setup');
        await this.waitFrames(30);

        this.shootProjectile('neutron', 40);
        await this.waitFrames(40);

        if (this.engine.atoms.length !== 1) throw new Error(`Neutron Capture Failed. Count: ${this.engine.atoms.length}`);
        const deuteron = this.engine.atoms[0];
        if (deuteron.mass < 1.9) throw new Error(`Mass too low for Deuteron: ${deuteron.mass}`);
        if (deuteron.charge !== 1) throw new Error(`Expected Charge +1, got ${deuteron.charge}`);
        if (deuteron.radius < 30) throw new Error(`Radius Check Failed. Deuteron should be ~40, got ${deuteron.radius}`);
        
        this.onStatus("Nuclear: Deuterium Nucleus Formed!", 'success');

        deuteron.x = cx + 50;
        deuteron.y = cy;
        deuteron.vx = 0;
        deuteron.vy = 0;

        this.shootProjectile('electron', 1); 
        await this.waitFrames(60); 

        if (this.engine.atoms.length !== 1) {
             throw new Error(`Electron Capture Failed. Expected 1 Atom, got ${this.engine.atoms.length}.`);
        }

        const deuterium = this.engine.atoms[0];
        if (deuterium.charge !== 0) throw new Error(`Electron Capture Failed. Expected Charge 0, got ${deuterium.charge}`);
        
        this.onStatus("Nuclear: Neutral Atom Formed!", 'success');

        for(let i=0; i<2; i++) {
             this.shootProjectile('neutron', 40); 
             await this.waitFrames(30);
        }
        await this.waitFrames(120); 

        const helium = this.engine.atoms[0];
        if (helium.element.s !== 'He') throw new Error(`Beta Decay Failed. Expected He, got ${helium.element.s}`);
        
        this.onStatus("Nuclear: Beta Decay Chain Verified!", 'success');
    }

    async testHadronization() {
        this.resetBoard();
        const { cx, cy } = this.getCenter();
        console.log("TEST: 3. Hadronization");

        const qU1 = this.createQuark('up', cx - 20, cy - 150);
        const qU2 = this.createQuark('up', cx + 20, cy - 150);
        const qD1 = this.createQuark('down', cx, cy - 130); 
        
        addAtomToWorld(this.engine.atoms, qU1, this.engine.eventLog, 'Test Quark');
        addAtomToWorld(this.engine.atoms, qU2, this.engine.eventLog, 'Test Quark');
        addAtomToWorld(this.engine.atoms, qD1, this.engine.eventLog, 'Test Quark');
        
        await this.waitFrames(60); 
        
        const proton = this.engine.atoms.find(a => a.element.z === 1 && a.element.s === 'p⁺');
        if (!proton) throw new Error("Proton Hadronization failed");
        this.onStatus("Proton Creation Verified!", 'success');

        this.resetBoard();

        const qU3 = this.createQuark('up', cx - 20, cy + 150);
        const qD2 = this.createQuark('down', cx + 20, cy + 150);
        const qD3 = this.createQuark('down', cx, cy + 130);
        
        addAtomToWorld(this.engine.atoms, qU3, this.engine.eventLog, 'Test Quark');
        addAtomToWorld(this.engine.atoms, qD2, this.engine.eventLog, 'Test Quark');
        addAtomToWorld(this.engine.atoms, qD3, this.engine.eventLog, 'Test Quark');
        
        await this.waitFrames(60);
        
        const neutron = this.engine.atoms.find(a => a.element.z === 0 && a.element.s === 'n');
        if (!neutron) throw new Error("Neutron Hadronization failed");
        this.onStatus("Neutron Creation Verified!", 'success');
    }

    async testIonicWater() {
        this.resetBoard();
        const { cx, cy } = this.getCenter();
        console.log("TEST: 4. Ionic Formation of H2O");

        const p1: Atom = {
            id: 'ion-h1', x: cx - 120, y: cy - 60, z: 0,
            vx: 0, vy: 0, vz: 0, fx: 0, fy: 0, fz: 0,
            element: ELEMENTS[0], isotopeIndex: 0, bonds: [], mass: 1.007, radius: 20, charge: 1, createdAt: Date.now(), lastDecayCheck: Date.now()
        };
        const p2: Atom = {
            id: 'ion-h2', x: cx + 120, y: cy - 60, z: 0,
            vx: 0, vy: 0, vz: 0, fx: 0, fy: 0, fz: 0,
            element: ELEMENTS[0], isotopeIndex: 0, bonds: [], mass: 1.007, radius: 20, charge: 1, createdAt: Date.now(), lastDecayCheck: Date.now()
        };
        const oxygen: Atom = {
             id: 'ion-o', x: cx, y: cy, z: 0,
             vx: 0, vy: 0, vz: 0, fx: 0, fy: 0, fz: 0,
             element: ELEMENTS[7], isotopeIndex: 1, bonds: [], mass: 15.995, radius: 30 + Math.pow(15.995, 0.33) * 10, charge: -2, createdAt: Date.now(), lastDecayCheck: Date.now()
        };
        
        addAtomToWorld(this.engine.atoms, p1, this.engine.eventLog, 'Ion Setup');
        addAtomToWorld(this.engine.atoms, p2, this.engine.eventLog, 'Ion Setup');
        addAtomToWorld(this.engine.atoms, oxygen, this.engine.eventLog, 'Ion Setup');
        
        await this.waitFrames(120);

        const oCheck = this.engine.atoms.find(a => a.id === 'ion-o');
        if (!oCheck) throw new Error("Ionic Oxygen missing");
        
        const group = getMoleculeGroup(this.engine.atoms, oCheck.id);
        if (group.size !== 3) throw new Error(`Ionic H2O failed formation. Group size: ${group.size} (Expected 3)`);
        
        const groupAtoms = this.engine.atoms.filter(a => group.has(a.id));
        const molName = identifyMolecule(groupAtoms);
        if (molName !== 'Water') throw new Error(`Ionic H2O identification failed. Got: ${molName}`);
        
        this.onStatus("Chemistry: Ionic H₂O Formed!", 'success');
    }

    async testMolecularSynthesis() {
        const { cx, cy } = this.getCenter();
        console.log("TEST: 5. Molecular Synthesis");

        const runSynthesis = async (name: string, tx: number, ty: number) => {
            const recipe = MOLECULES.find(m => m.name === name);
            if (!recipe) throw new Error(`Recipe ${name} not found`);

            startClearance(this.engine.mouse, tx, ty, recipe);
            await this.waitFrames(CLEARANCE_FRAMES + 90);

            const label = this.engine.mouse.floatingLabels.find(l => l.text === name);
            let physicalMatch = false;
            const processed = new Set<string>();

            this.engine.atoms.forEach(a => {
                if (processed.has(a.id)) return;
                const groupIds = getMoleculeGroup(this.engine.atoms, a.id);
                groupIds.forEach(id => processed.add(id));
                const gAtoms = this.engine.atoms.filter(at => groupIds.has(at.id));
                const idName = identifyMolecule(gAtoms);
                
                let gx=0, gy=0;
                gAtoms.forEach(ga => { gx+=ga.x; gy+=ga.y; });
                gx /= gAtoms.length; gy /= gAtoms.length;
                const dist = Math.sqrt((gx-tx)**2 + (gy-ty)**2);
                
                if (idName === name && dist < 300) physicalMatch = true;
            });

            if (!label && !physicalMatch) throw new Error(`Synthesis of ${name} Failed.`);
            this.onStatus(`Synthesis: ${name} Created!`, 'success');
        };

        await runSynthesis('Water', cx, cy);
        await runSynthesis('Benzene', cx, cy);
        await runSynthesis('Cyclohexane', cx, cy);
    }

    async testDecayChain() {
        this.resetBoard();
        const { cx, cy } = this.getCenter();
        console.log("TEST: 6. Alpha Decay Chain (Po -> Pb)");

        const poElem = ELEMENTS.find(e => e.z === 84);
        if (!poElem) throw new Error("Polonium not found in database");

        // Force an alpha decay scenario using a custom isotope
        // This ensures the test validates the mechanic (Alpha Decay)
        // regardless of whether the default isotope for the element is set to SF or Alpha.
        const atom: Atom = {
            id: 'test-alpha',
            x: cx, y: cy, z: 0,
            vx: 0, vy: 0, vz: 0, fx: 0, fy: 0, fz: 0,
            element: poElem,
            isotopeIndex: 0,
            bonds: [],
            mass: 212,
            radius: 90,
            charge: 0,
            createdAt: Date.now(),
            lastDecayCheck: Date.now(),
            customIsotope: {
                m: 212,
                hl: 0.1, // Very fast
                mode: 'alpha',
                p: { z: 82, m: 208 } // Target Lead
            }
        };
        addAtomToWorld(this.engine.atoms, atom, this.engine.eventLog, 'Test Setup');

        const startTime = Date.now();
        await this.waitFrames(120);

        const creations = this.scanEventLogForCreations(startTime);
        
        // Check if atom converted to Pb
        const pb = this.engine.atoms.find(a => a.id === 'test-alpha');
        
        if (!pb) throw new Error("Atom disappeared unexpectedly (Possible SF or Error)");
        if (pb.element.z !== 82) throw new Error(`Alpha Decay Failed. Expected Z=82 (Pb), got ${pb.element.s} (Z=${pb.element.z})`);
        
        const hasPbLog = creations.some(c => c.label === 'Pb');
        
        if (!hasPbLog) throw new Error("Creation log for Pb missing");
        
        this.onStatus(`Alpha Decay Verified! Observed: Po -> Pb`, 'success');
    }

    async testAllPairProductions() {
        console.log("TEST: 7. All Pair Productions");
        const { cx, cy } = this.getCenter();

        const particlesWithThreshold = SM_PARTICLES.filter(p => p.pairThreshold !== undefined);

        for (const p of particlesWithThreshold) {
            this.resetBoard();
            this.engine.eventLog = [];
            const threshold = p.pairThreshold!;
            
            // Spawn with 5% buffer over threshold to guarantee creation
            QuantumSystem.spawnPairProduction(
                this.engine.atoms, 
                this.engine.particles, 
                cx, cy, 
                threshold * 1.05, 
                undefined, 
                this.engine.eventLog
            );

            // Verify
            const events = this.engine.eventLog.filter(e => e.type === 'create' && e.reason === 'Pair Production');
            if (events.length !== 2) {
                throw new Error(`Failed to produce pair for ${p.name} at ${threshold} MeV. Events: ${events.length}`);
            }
            
            // Verify Particle ID matches expected
            const spawnedId = events[0].atomId;
            const atom = this.engine.atoms.find(a => a.id === spawnedId);
            
            if (!atom) throw new Error("Spawned atom not found in world");
            // Check if symbol matches particle or antiparticle
            // Note: Since we don't know if event[0] is the particle or antiparticle, check if symbol matches either
            const isMatch = (atom.element.s === p.symbol) || 
                            (p.antiParticleId && SM_PARTICLES.find(ap => ap.id === p.antiParticleId)?.symbol === atom.element.s);
                            
            if (!isMatch) throw new Error(`Spawned particle ${atom.element.s} does not match expected ${p.symbol} pair.`);
        }
        this.onStatus("All Standard Model Pair Productions Verified", 'success');
    }

    async testSpontaneousFission() {
        this.resetBoard();
        const { cx, cy } = this.getCenter();
        console.log("TEST: 8. Spontaneous Fission (Cf-252)");

        // Create Californium-252 (Custom Isotope for speed)
        const cfElem = ELEMENTS.find(e => e.z === 98); // Cf
        if (!cfElem) throw new Error("Californium not found");

        const atom: Atom = {
            id: 'test-sf',
            x: cx, y: cy, z: 0,
            vx: 0, vy: 0, vz: 0, fx: 0, fy: 0, fz: 0,
            element: cfElem,
            isotopeIndex: 0,
            bonds: [],
            mass: 252,
            radius: 90, 
            charge: 0,
            createdAt: Date.now(),
            lastDecayCheck: Date.now(),
            customIsotope: {
                m: 252,
                hl: 0.1, // Very fast decay
                mode: 'sf'
            }
        };
        
        addAtomToWorld(this.engine.atoms, atom, this.engine.eventLog, 'SF Test Setup');
        
        // Wait for decay (0.1s is very fast, 120 frames = 2s should be plenty)
        await this.waitFrames(120);
        
        // Check results
        // Should have 0 atoms of ID 'test-sf'
        // Should have > 2 atoms total (2 daughters + neutrons)
        
        if (this.engine.atoms.some(a => a.id === 'test-sf')) {
            throw new Error("SF Atom failed to decay");
        }
        
        if (this.engine.atoms.length < 3) {
            throw new Error(`SF Decay produced insufficient particles. Count: ${this.engine.atoms.length}`);
        }
        
        this.onStatus("Spontaneous Fission Verified!", 'success');
    }

    public async run() {
        try {
            this.onStatus("Running Data Integrity Unit Tests...", 'info');
            await runUnitTests();
            this.onStatus("Unit Tests Passed. Starting System Simulation...", 'success');
            await this.waitFrames(30); 

            await this.testPairProduction();
            await this.testHadronization();
            await this.testDeuteriumChain();
            await this.testIonicWater();
            await this.testMolecularSynthesis();
            await this.testDecayChain();
            await this.testSpontaneousFission();
            await this.testAllPairProductions();
            
            this.onStatus("All Systems Operational!", 'success');
        } catch (e: any) {
            console.error(e);
            console.error(this.dumpState());
            this.onStatus(`System Test Failed: ${e.message}`, 'error');
        }
    }
}

export const runSystemTest = async (
    engine: SimulationEngine,
    onStatus: (msg: string, type: 'success' | 'error' | 'info') => void
) => {
    const suite = new SystemSuite(engine, onStatus);
    await suite.run();
};
