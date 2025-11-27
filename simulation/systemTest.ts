
import { MutableRefObject, RefObject } from 'react';
import { Atom, Particle, SimulationEvent } from '../types';
import { MouseState } from './types';
import { ELEMENTS, PROTON_ELEM, NEUTRON_ELEM, ELECTRON_ELEM, getParticleElementData } from '../elements';
import { MOLECULES } from '../molecules';
import { identifyMolecule } from './molecular_utils';
import { getMoleculeGroup, addAtomToWorld } from './utils';
import { WORLD_SCALE } from './constants';
import { startClearance, CLEARANCE_FRAMES } from './clearance';
import { spawnPairProduction } from './nuclear';
import { runUnitTests } from './unitTests';

class SystemSuite {
    atoms: MutableRefObject<Atom[]>;
    particles: MutableRefObject<Particle[]>;
    mouse: MutableRefObject<MouseState>;
    canvas: RefObject<HTMLCanvasElement | null>;
    eventLog: MutableRefObject<SimulationEvent[]>;
    onStatus: (msg: string, type: 'success' | 'error' | 'info') => void;
    
    private recording: boolean = false;
    private creationLog: {label: string, id: string}[] = [];
    
    constructor(
        atomsRef: MutableRefObject<Atom[]>,
        particlesRef: MutableRefObject<Particle[]>,
        mouseRef: MutableRefObject<MouseState>,
        canvasRef: RefObject<HTMLCanvasElement | null>,
        eventLogRef: MutableRefObject<SimulationEvent[]>,
        onStatus: (msg: string, type: 'success' | 'error' | 'info') => void
    ) {
        this.atoms = atomsRef;
        this.particles = particlesRef;
        this.mouse = mouseRef;
        this.canvas = canvasRef;
        this.eventLog = eventLogRef;
        this.onStatus = onStatus;
    }

    private waitFrames = (frames: number) => new Promise(resolve => setTimeout(resolve, frames * 16));

    private dumpState = () => {
        if (this.atoms.current.length === 0) return "Board Empty";
        return "\n--- FAILED STATE SNAPSHOT ---\n" + this.atoms.current.map(a => {
             const iso = a.element.iso[a.isotopeIndex];
             const mass = Math.round(iso.m);
             const charge = a.charge !== undefined ? a.charge : 0;
             const chargeStr = charge > 0 ? `+${charge}` : `${charge}`;
             return `ID:${a.id.slice(0,8).padEnd(9)} | ${a.element.s}-${mass} (${chargeStr}) | Pos: (${a.x.toFixed(1)}, ${a.y.toFixed(1)}, ${a.z.toFixed(1)}) | Vel: (${a.vx.toFixed(2)}, ${a.vy.toFixed(2)}, ${a.vz.toFixed(2)})`;
        }).join('\n') + "\n-----------------------------";
    };

    private getCenter = () => {
        const dpr = window.devicePixelRatio || 1;
        const width = this.canvas.current ? this.canvas.current.width / dpr : 800;
        const height = this.canvas.current ? this.canvas.current.height / dpr : 600;
        return {
            cx: (width * WORLD_SCALE) / 2,
            cy: (height * WORLD_SCALE) / 2
        };
    };

    private resetBoard = () => {
        this.atoms.current = [];
        this.particles.current = [];
        this.mouse.current.floatingLabels = [];
        this.mouse.current.moleculeTarget = null;
        this.mouse.current.moleculeHaloLife = 0;
        this.mouse.current.clearance = null;
    };

    // --- LOGGING UTILS ---
    private startRecording() {
        this.recording = true;
        this.creationLog = [];
    }

    private stopRecording() {
        this.recording = false;
    }

    // Helper to scan recent event log for creations
    private scanEventLogForCreations(since: number): {label: string, id: string}[] {
        return this.eventLog.current
            .filter(e => e.type === 'create' && e.timestamp > since)
            .map(e => ({label: e.label, id: e.atomId}));
    }

    private shootProjectile = (type: 'neutron'|'electron', speed: number) => {
        const target = this.atoms.current.find(a => a.element.z >= 1);
        if (!target) return;

        const { cx, cy } = this.getCenter();
        const startX = cx;
        const startY = cy;

        this.particles.current.push({
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
                mass: 0.1, // Updated to new "Heavy Electron" physics (0.1u)
                radius: 30, 
                charge: -1,
                createdAt: Date.now(),
                lastDecayCheck: Date.now()
            };
        }
        addAtomToWorld(this.atoms.current, atom, this.eventLog.current, 'Projectile Test');
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

    /**
     * TEST 1: PAIR PRODUCTION & ANNIHILATION
     * Validates that particle pairs are created and destroyed correctly,
     * checking the event log for verification instead of polling board state.
     */
    async testPairProduction() {
        this.resetBoard();
        this.eventLog.current = []; // Reset Log
        
        console.log("TEST: 1. Pair Production & Annihilation");
        
        const { cx, cy } = this.getCenter();
        const ppX = cx; 
        const ppY = cy;
        
        // 1. Trigger Creation
        spawnPairProduction(this.atoms.current, this.particles.current, ppX, ppY, 1.022, undefined, this.eventLog.current);
        
        // Verify Creation Events
        const creationEvents = this.eventLog.current.filter(e => e.type === 'create' && e.reason === 'Pair Production');
        
        if (creationEvents.length !== 2) {
            throw new Error(`Expected 2 Creation Events, found ${creationEvents.length}`);
        }
        
        const ePosId = creationEvents.find(e => e.label === 'e⁺' || e.label === 'Positron')?.atomId;
        const eNegId = creationEvents.find(e => e.label === 'e⁻' || e.label === 'Electron')?.atomId;
        
        if (!ePosId || !eNegId) throw new Error("Could not identify Electron/Positron pair in logs");
        
        const ePos = this.atoms.current.find(a => a.id === ePosId);
        const eNeg = this.atoms.current.find(a => a.id === eNegId);
        
        if (!ePos || !eNeg) throw new Error("Particles logged but not found in world state");
        
        this.onStatus("Pair Production Verified via Log", 'success');
        
        // 2. Annihilation
        // Force collision by setting positions and velocities manually
        ePos.x = cx - 10; ePos.y = cy; 
        eNeg.x = cx + 10; eNeg.y = cy;
        ePos.vx = 20; eNeg.vx = -20; // Move toward each other
        
        // Mark log position to check new events
        const logIndex = this.eventLog.current.length;
        
        await this.waitFrames(20); // Allow physics collision to resolve
        
        // Verify Destruction Events
        const newEvents = this.eventLog.current.slice(logIndex);
        const destructionEvents = newEvents.filter(e => e.type === 'destroy' && e.reason === 'Annihilation');
        
        if (destructionEvents.length !== 2) {
            throw new Error(`Expected 2 Annihilation Events, found ${destructionEvents.length}`);
        }
        
        this.onStatus("Annihilation Verified via Log!", 'success');
    }

    /**
     * TEST 2: NUCLEAR DECAY CHAIN
     * Proton -> Deuterium -> Tritium -> Helium
     */
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
        addAtomToWorld(this.atoms.current, p, this.eventLog.current, 'Test Setup');
        await this.waitFrames(30);

        this.shootProjectile('neutron', 40);
        await this.waitFrames(40);

        if (this.atoms.current.length !== 1) throw new Error(`Neutron Capture Failed. Count: ${this.atoms.current.length}`);
        const deuteron = this.atoms.current[0];
        if (deuteron.mass < 1.9) throw new Error(`Mass too low for Deuteron: ${deuteron.mass}`);
        if (deuteron.charge !== 1) throw new Error(`Expected Charge +1, got ${deuteron.charge}`);
        if (deuteron.radius < 30) throw new Error(`Radius Check Failed. Deuteron should be ~40, got ${deuteron.radius}`);
        
        this.onStatus("Nuclear: Deuterium Nucleus Formed!", 'success');

        this.shootProjectile('electron', 1); 
        await this.waitFrames(40);

        const deuterium = this.atoms.current[0];
        if (deuterium.charge !== 0) throw new Error(`Electron Capture Failed. Expected Charge 0, got ${deuterium.charge}`);
        
        this.onStatus("Nuclear: Neutral Atom Formed!", 'success');

        for(let i=0; i<2; i++) {
             this.shootProjectile('neutron', 40); 
             await this.waitFrames(30);
        }
        await this.waitFrames(120); 

        const helium = this.atoms.current[0];
        if (helium.element.s !== 'He') throw new Error(`Beta Decay Failed. Expected He, got ${helium.element.s}`);
        
        this.onStatus("Nuclear: Beta Decay Chain Verified!", 'success');
    }

    /**
     * TEST 3: HADRONIZATION
     * Quarks -> Protons/Neutrons
     */
    async testHadronization() {
        this.resetBoard();
        const { cx, cy } = this.getCenter();
        console.log("TEST: 3. Hadronization");

        // Proton (uud)
        const qU1 = this.createQuark('up', cx - 20, cy - 150);
        const qU2 = this.createQuark('up', cx + 20, cy - 150);
        const qD1 = this.createQuark('down', cx, cy - 130); 
        
        addAtomToWorld(this.atoms.current, qU1, this.eventLog.current, 'Test Quark');
        addAtomToWorld(this.atoms.current, qU2, this.eventLog.current, 'Test Quark');
        addAtomToWorld(this.atoms.current, qD1, this.eventLog.current, 'Test Quark');
        
        await this.waitFrames(60); 
        
        const proton = this.atoms.current.find(a => a.element.z === 1 && a.element.s === 'p⁺');
        if (!proton) throw new Error("Proton Hadronization failed");
        this.onStatus("Proton Creation Verified!", 'success');

        // Neutron (udd)
        const qU3 = this.createQuark('up', cx - 20, cy + 150);
        const qD2 = this.createQuark('down', cx + 20, cy + 150);
        const qD3 = this.createQuark('down', cx, cy + 130);
        
        addAtomToWorld(this.atoms.current, qU3, this.eventLog.current, 'Test Quark');
        addAtomToWorld(this.atoms.current, qD2, this.eventLog.current, 'Test Quark');
        addAtomToWorld(this.atoms.current, qD3, this.eventLog.current, 'Test Quark');
        
        await this.waitFrames(60);
        
        const neutron = this.atoms.current.find(a => a.element.z === 0 && a.element.s === 'n');
        if (!neutron) throw new Error("Neutron Hadronization failed");
        this.onStatus("Neutron Creation Verified!", 'success');
    }

    /**
     * TEST 4: IONIC BONDING
     * H+ + H+ + O-2 -> H2O
     */
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
        
        addAtomToWorld(this.atoms.current, p1, this.eventLog.current, 'Ion Setup');
        addAtomToWorld(this.atoms.current, p2, this.eventLog.current, 'Ion Setup');
        addAtomToWorld(this.atoms.current, oxygen, this.eventLog.current, 'Ion Setup');
        
        await this.waitFrames(120);

        const oCheck = this.atoms.current.find(a => a.id === 'ion-o');
        if (!oCheck) throw new Error("Ionic Oxygen missing");
        
        const group = getMoleculeGroup(this.atoms.current, oCheck.id);
        if (group.size !== 3) throw new Error(`Ionic H2O failed formation. Group size: ${group.size} (Expected 3)`);
        
        const groupAtoms = this.atoms.current.filter(a => group.has(a.id));
        const molName = identifyMolecule(groupAtoms);
        if (molName !== 'Water') throw new Error(`Ionic H2O identification failed. Got: ${molName}`);
        
        this.onStatus("Chemistry: Ionic H₂O Formed!", 'success');
    }

    /**
     * TEST 5: MOLECULAR SYNTHESIS
     * Push logic and recipe spawning.
     */
    async testMolecularSynthesis() {
        // Keep the board state from Test 4 to verify persistence/pushing
        const { cx, cy } = this.getCenter();
        console.log("TEST: 5. Molecular Synthesis");

        const runSynthesis = async (name: string, tx: number, ty: number) => {
            const recipe = MOLECULES.find(m => m.name === name);
            if (!recipe) throw new Error(`Recipe ${name} not found`);

            startClearance(this.mouse.current, tx, ty, recipe);
            await this.waitFrames(CLEARANCE_FRAMES + 90 + 200);

            const label = this.mouse.current.floatingLabels.find(l => l.text === name);
            let physicalMatch = false;
            const processed = new Set<string>();

            this.atoms.current.forEach(a => {
                if (processed.has(a.id)) return;
                const groupIds = getMoleculeGroup(this.atoms.current, a.id);
                groupIds.forEach(id => processed.add(id));
                const gAtoms = this.atoms.current.filter(at => groupIds.has(at.id));
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

    /**
     * TEST 6: SUPERHEAVY DECAY CHAIN
     * Og -> Lv -> Fl -> ...
     * Verifies that high Z elements decay instead of disappearing.
     */
    async testDecayChain() {
        this.resetBoard();
        const { cx, cy } = this.getCenter();
        console.log("TEST: 6. Oganesson Decay Chain");

        const ogElem = ELEMENTS.find(e => e.z === 118);
        if (!ogElem) throw new Error("Oganesson not found in database");

        // Manually spawn Og
        const og: Atom = {
            id: 'test-og',
            x: cx, y: cy, z: 0,
            vx: 0, vy: 0, vz: 0, fx: 0, fy: 0, fz: 0,
            element: ogElem,
            isotopeIndex: 0,
            bonds: [],
            mass: 294,
            radius: 50,
            charge: 0,
            createdAt: Date.now(),
            lastDecayCheck: Date.now() // Start clock
        };
        addAtomToWorld(this.atoms.current, og, this.eventLog.current, 'Test Setup');

        // Record events
        const startTime = Date.now();
        
        // Wait for potential decay (Og HL is 0.001s, clamped to 0.3s)
        // Chain length ~5 steps. Each step ~0.3s-1s
        // We wait ~10 seconds (600 frames) to ensure probabilistic chain proceeds
        await this.waitFrames(600);

        // Check Event Log
        const creations = this.scanEventLogForCreations(startTime);
        
        // We expect Og to be gone (transmuted)
        if (this.atoms.current.some(a => a.id === 'test-og' && a.element.z === 118)) {
             throw new Error("Oganesson failed to decay (Persistence Error)");
        }

        // We expect to see children in the log.
        // Expected chain: Og(118) -> Lv(116) -> Fl(114) -> Cn(112) ...
        const hasLv = creations.some(c => c.label === 'Lv');
        const hasFl = creations.some(c => c.label === 'Fl');
        
        if (!hasLv) throw new Error("Decay Chain Broken: No Livermorium (Lv) created.");
        
        this.onStatus(`Decay Chain Verified! Observed: Og -> ${hasLv ? 'Lv' : '?'} -> ${hasFl ? 'Fl' : '...' }`, 'success');
    }

    public async run() {
        try {
            // STEP 0: Static Data Validation
            this.onStatus("Running Data Integrity Unit Tests...", 'info');
            await runUnitTests();
            this.onStatus("Unit Tests Passed. Starting System Simulation...", 'success');
            await this.waitFrames(30); // Brief pause to see success message

            // STEP 1-6: System Simulation Tests
            await this.testPairProduction();
            await this.testHadronization();
            await this.testDeuteriumChain();
            await this.testIonicWater();
            await this.testMolecularSynthesis();
            await this.testDecayChain();
            
            this.onStatus("All Systems Operational!", 'success');
        } catch (e: any) {
            console.error(e);
            console.error(this.dumpState());
            this.onStatus(`System Test Failed: ${e.message}`, 'error');
        }
    }
}

export const runSystemTest = async (
    atomsRef: MutableRefObject<Atom[]>,
    particlesRef: MutableRefObject<Particle[]>,
    mouseRef: MutableRefObject<MouseState>,
    canvasRef: RefObject<HTMLCanvasElement | null>,
    eventLogRef: MutableRefObject<SimulationEvent[]>,
    onStatus: (msg: string, type: 'success' | 'error' | 'info') => void
) => {
    const suite = new SystemSuite(atomsRef, particlesRef, mouseRef, canvasRef, eventLogRef, onStatus);
    await suite.run();
};
