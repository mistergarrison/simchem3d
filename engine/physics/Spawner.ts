import { Atom } from '../../types/core';
import { SimulationEvent } from '../../types/ui';
import { ElementData } from '../../types/chemistry';
import { ELEMENTS, NEUTRON_ELEM, ELECTRON_ELEM } from '../../data/elements';
import { MAX_SPEED } from '../config';

/**
 * Encapsulates the logic for creating Atom entities with correct physics properties.
 */
export class AtomFactory {
    /**
     * Creates a raw Atom object with physics properties derived from its element/isotope.
     */
    static create(
        x: number, 
        y: number, 
        z: number, 
        zInput: number | ElementData, 
        isoIdx: number, 
        velocity?: {vx: number, vy: number, vz: number}, 
        chargeOverride?: number
    ): Atom | null {
        let elem: ElementData | undefined;
    
        // Resolve Element Data
        if (typeof zInput === 'object') {
            elem = zInput;
        } else {
            if (zInput === 0) elem = NEUTRON_ELEM;
            else if (zInput === -1) elem = ELECTRON_ELEM;
            else elem = ELEMENTS.find(e => e.z === zInput);
        }

        if (!elem) return null;
        const iso = elem.iso[isoIdx] || elem.iso[0];
        
        // Determine Physics Properties (Radius, Charge, Mass)
        let radius = 30 + Math.pow(iso.m, 0.33) * 10;
        let charge = 0;
        let mass = iso.m;

        // SPECIAL HANDLING: Subatomic Particles
        if (elem.z === -1) { // Electron
            charge = -1;
            radius = 30; // Consistent electron cloud size
        } else if (elem.z === 0) { // Neutron
            charge = 0;
            radius = 20;
        } else if (elem.z === 1 && elem.s === 'p⁺') { // Proton
            charge = 1;
            radius = 20;
        } else if (elem.z === -3) { // Neutrinos
            charge = 0;
            radius = 12; // Small, ghostly
        } else if (elem.z === 1000) { // Quarks
            radius = 15;
            if (elem.s === 'u' || elem.s === 'c' || elem.s === 't') charge = 0.66;
            else charge = -0.33;
        }

        // Apply explicit charge override if provided (critical for P+ acting as ion vs neutral H)
        if (chargeOverride !== undefined) {
            charge = chargeOverride;
            // If it's H-1 and we forced Charge +1, it's a Proton, so shrink it
            if (elem.z === 1 && charge === 1 && mass < 1.6) {
                radius = 20;
            }
        }

        // Add Jitter to prevent stacking
        // Increased from 2.0 to 10.0 to prevent Coulomb singularities (explosive ejection) when clicking same spot
        const jitterX = (Math.random() - 0.5) * 10.0;
        const jitterY = (Math.random() - 0.5) * 10.0;
        const jitterZ = (Math.random() - 0.5) * 10.0;

        let vx = velocity ? velocity.vx : (Math.random() - 0.5) * 0.5;
        let vy = velocity ? velocity.vy : (Math.random() - 0.5) * 0.5;
        let vz = velocity ? velocity.vz : (Math.random() - 0.5) * 0.5;

        // BOSON OVERRIDE: Photons and Gluons shoot off at max speed in RANDOM direction
        // This overrides any drag/throw velocity to ensure they behave like light/energy.
        if (elem.s === 'γ' || elem.s === 'g') {
             const theta = Math.random() * Math.PI * 2;
             const phi = Math.acos(2 * Math.random() - 1);
             // MAX_SPEED is high (1500), essentially instant traversal or ray-like behavior
             vx = Math.sin(phi) * Math.cos(theta) * MAX_SPEED;
             vy = Math.sin(phi) * Math.sin(theta) * MAX_SPEED;
             vz = Math.cos(phi) * MAX_SPEED;
        }

        const finalZ = z + jitterZ;
        
        // DEBUG LOGGING for Spawn Position
        if (Math.abs(finalZ) > 100) {
            console.warn(`[AtomFactory] Spawning ${elem.s} at extreme Z: ${finalZ.toFixed(1)} (Input Z: ${z.toFixed(1)})`);
        }

        return {
            id: Math.random().toString(36).substr(2, 9),
            x: x + jitterX,
            y: y + jitterY,
            z: finalZ,
            vx, vy, vz,
            fx: 0, fy: 0, fz: 0,
            element: elem,
            isotopeIndex: isoIdx,
            bonds: [],
            mass: mass,
            radius: radius,
            charge: charge,
            createdAt: Date.now(),
            lastDecayCheck: Date.now()
        };
    }
}

/**
 * Creates an atom and adds it to the simulation world (arrays and logs).
 */
export const spawnAtomInWorld = (
    atoms: Atom[],
    eventLog: SimulationEvent[],
    x: number, 
    y: number, 
    z: number, 
    zInput: number | ElementData, 
    isoIdx: number, 
    velocity?: {vx: number, vy: number, vz: number}, 
    chargeOverride?: number
): Atom | null => {
    const newAtom = AtomFactory.create(x, y, z, zInput, isoIdx, velocity, chargeOverride);
    
    if (newAtom) {
        atoms.push(newAtom);
        eventLog.push({
            type: 'create',
            atomId: newAtom.id,
            label: newAtom.element.s,
            reason: 'Manual Spawn',
            timestamp: Date.now()
        });
    }
    
    return newAtom;
};