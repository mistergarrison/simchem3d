
import { Atom, SimulationEvent } from '../types';
import { ELEMENTS } from '../elements';

/**
 * simulation/utils.ts
 * 
 * Pure utility functions for Geometry, Graph Traversal, and basic Bond management.
 */

// --- DEBUG LOGGING UTILITY ---
let isDebug = false;

export const setDebug = (enabled: boolean) => {
    isDebug = enabled;
};

export const debugLog = (msg: string, ...args: any[]) => {
    if (isDebug) console.log(msg, ...args);
};

export const debugWarn = (msg: string, ...args: any[]) => {
    if (isDebug) console.warn(msg, ...args);
};

// --- WORLD MANAGEMENT HELPERS ---

/**
 * Standardized way to add an atom to the simulation.
 * Ensures the event is logged for system tests.
 */
export const addAtomToWorld = (
    atoms: Atom[], 
    atom: Atom, 
    eventLog: SimulationEvent[] | undefined, 
    reason: string = 'Spawn'
) => {
    atoms.push(atom);
    if (eventLog) {
        eventLog.push({
            type: 'create',
            atomId: atom.id,
            label: atom.element.s,
            reason: reason,
            timestamp: Date.now()
        });
        // Keep log size manageable
        if (eventLog.length > 200) eventLog.shift();
    }
};

/**
 * Standardized way to remove an atom from the simulation.
 * Supports removal by Index (fast, inside loops) or Object (safer).
 */
export const removeAtomFromWorld = (
    atoms: Atom[], 
    atomOrIndex: Atom | number, 
    eventLog: SimulationEvent[] | undefined, 
    reason: string
) => {
    let atom: Atom | undefined;
    let index: number;

    if (typeof atomOrIndex === 'number') {
        index = atomOrIndex;
        atom = atoms[index];
    } else {
        atom = atomOrIndex;
        index = atoms.indexOf(atom);
    }

    if (index > -1 && atom) {
        atoms.splice(index, 1);
        if (eventLog) {
            eventLog.push({
                type: 'destroy',
                atomId: atom.id,
                label: atom.element.s,
                reason: reason,
                timestamp: Date.now()
            });
            if (eventLog.length > 200) eventLog.shift();
        }
    }
};

// --- GEOMETRY ---

/**
 * Calculates the optimal rotation to align a molecule's "Flattest Face" to the camera.
 */
export const calculateOptimalRotation = (atoms: Atom[], groupIds: Set<string>) => {
    const group = atoms.filter(a => groupIds.has(a.id));
    if (group.length < 3) return null; // Too simple to rotate

    // 1. Calculate Center of Mass
    let cx = 0, cy = 0, cz = 0;
    group.forEach(a => { cx += a.x; cy += a.y; cz += a.z; });
    cx /= group.length; cy /= group.length; cz /= group.length;

    // 2. Compute Covariance Matrix components
    let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0;
    group.forEach(a => {
        const dx = a.x - cx;
        const dy = a.y - cy;
        const dz = a.z - cz;
        xx += dx * dx;
        xy += dx * dy;
        xz += dx * dz;
        yy += dy * dy;
        yz += dy * dz;
        zz += dz * dz;
    });

    // Helper: Matrix-Vector Multiplication
    const mult = (v: {x: number, y: number, z: number}) => ({
        x: xx*v.x + xy*v.y + xz*v.z,
        y: xy*v.x + yy*v.y + yz*v.z,
        z: xz*v.x + yz*v.y + zz*v.z
    });

    // 3. Find Primary Axis (Largest Eigenvalue) via Power Iteration
    let v1 = { x: 1, y: 1, z: 1 };
    for(let i=0; i<8; i++) {
        v1 = mult(v1);
        const mag = Math.sqrt(v1.x*v1.x + v1.y*v1.y + v1.z*v1.z);
        if (mag < 1e-6) break;
        v1.x /= mag; v1.y /= mag; v1.z /= mag;
    }

    // 4. Find Secondary Axis (2nd Largest) 
    let v2 = { x: -v1.y, y: v1.z, z: v1.x }; 
    for(let i=0; i<8; i++) {
        const dot = v2.x*v1.x + v2.y*v1.y + v2.z*v1.z;
        v2.x -= dot*v1.x; v2.y -= dot*v1.y; v2.z -= dot*v1.z;
        
        v2 = mult(v2);
        const mag = Math.sqrt(v2.x*v2.x + v2.y*v2.y + v2.z*v2.z);
        if (mag < 1e-6) break;
        v2.x /= mag; v2.y /= mag; v2.z /= mag;
    }

    // 5. Calculate Normal Vector (V3) via Cross Product (V1 x V2)
    let normal = {
        x: v1.y*v2.z - v1.z*v2.y,
        y: v1.z*v2.x - v1.x*v2.z,
        z: v1.x*v2.y - v1.y*v2.x
    };
    let nMag = Math.sqrt(normal.x*normal.x + normal.y*normal.y + normal.z*normal.z);
    if (nMag < 1e-6) return null; 
    normal.x /= nMag; normal.y /= nMag; normal.z /= nMag;

    if (normal.z < 0) {
        normal.x = -normal.x; normal.y = -normal.y; normal.z = -normal.z;
    }

    const axis = {
        x: normal.y * 1 - normal.z * 0, 
        y: normal.z * 0 - normal.x * 1, 
        z: normal.x * 0 - normal.y * 0  
    };
    
    const axisMag = Math.sqrt(axis.x*axis.x + axis.y*axis.y + axis.z*axis.z);
    const dotZ = normal.z; 
    
    if (dotZ > 0.96 || axisMag < 1e-3) {
        return null; 
    }

    axis.x /= axisMag; axis.y /= axisMag; axis.z /= axisMag;
    
    const angle = Math.acos(Math.max(-1, Math.min(1, dotZ)));

    return {
        axis: axis,
        angle: angle
    };
};

/**
 * Ray Casting Algorithm for Point-in-Polygon testing.
 */
export const isPointInPolygon = (p: {x: number, y: number}, polygon: {x: number, y: number}[]) => {
    let isInside = false;
    let minX = polygon[0].x, maxX = polygon[0].x;
    let minY = polygon[0].y, maxY = polygon[0].y;
    
    for (let i = 1; i < polygon.length; i++) {
        const q = polygon[i];
        minX = Math.min(q.x, minX);
        maxX = Math.max(q.x, maxX);
        minY = Math.min(q.y, minY);
        maxY = Math.max(q.y, maxY);
    }
    if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) return false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        if (((polygon[i].y > p.y) !== (polygon[j].y > p.y)) &&
            (p.x < (polygon[j].x - polygon[i].x) * (p.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
            isInside = !isInside;
        }
    }
    return isInside;
};

/**
 * Breadth-First Search (BFS) to find all atoms connected to a starting atom.
 */
export const getMoleculeGroup = (allAtoms: Atom[], startId: string): Set<string> => {
    const group = new Set<string>();
    const queue = [startId];
    group.add(startId);

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const currentAtom = allAtoms.find(a => a.id === currentId);
        if (currentAtom) {
            for (const neighborId of currentAtom.bonds) {
                if (!group.has(neighborId)) {
                    group.add(neighborId);
                    queue.push(neighborId);
                }
            }
        }
    }
    return group;
};

/**
 * Distributes the total net charge of a molecule equally among its constituent atoms.
 * This mimics the delocalization of charge in covalent structures.
 */
export const redistributeCharge = (allAtoms: Atom[], startId: string) => {
    const groupIds = getMoleculeGroup(allAtoms, startId);
    if (groupIds.size === 0) return;

    let totalCharge = 0;
    const groupAtoms: Atom[] = [];

    // 1. Calculate Net Charge
    groupIds.forEach(id => {
        const a = allAtoms.find(at => at.id === id);
        if (a) {
            groupAtoms.push(a);
            totalCharge += (a.charge || 0);
        }
    });

    // 2. Redistribute & Stabilize
    let avgCharge = totalCharge / groupAtoms.length;

    // [CRITICAL DEBUG] Charge Sanity Check
    if (isNaN(avgCharge) || !isFinite(avgCharge)) {
        console.error(`[PHYSICS CRITICAL] Charge Redistribution Failed: Result is NaN/Infinite for group near ${startId}. Resetting to 0.`);
        avgCharge = 0;
    }

    // --- ERROR CORRECTION FOR ISOLATED ATOMS ---
    // If an atom is isolated (no bonds), it MUST have an integer charge.
    // Partial charges (e.g., 0.33) are only valid for delocalized molecular groups.
    if (groupAtoms.length === 1) {
        if (Math.abs(avgCharge - Math.round(avgCharge)) > 0.01) {
            console.error(`[PHYSICS ERROR] Isolated atom ${groupAtoms[0].element.s} has illegal partial charge: ${avgCharge}. Snapping to nearest integer.`);
            avgCharge = Math.round(avgCharge);
        }
    } else {
        // For molecules, round to 2 decimal places to prevent floating point drift (e.g., 0.3333333)
        avgCharge = Math.round(avgCharge * 100) / 100;
    }

    // 3. Apply & Update Properties
    let debugSum = 0;
    groupAtoms.forEach(a => {
        a.charge = avgCharge;
        debugSum += avgCharge;

        // DYNAMIC RADIUS UPDATE:
        if (a.element.z === 1) {
            // Hydrogen/Proton logic
            const isBareProton = (a.mass < 1.6 && (a.charge || 0) >= 1);
            if (isBareProton) {
                a.radius = 20;
            } else {
                // Neutral Hydrogen or Hydride -> Puff up
                a.radius = 30 + Math.pow(a.mass, 0.33) * 10;
            }
        } else if (a.element.z === 0) {
            // Neutron
            a.radius = 20;
        } else if (a.element.z === -1) {
            // Electron
            a.radius = 30;
        } else {
            // Standard Atoms
            a.radius = 30 + Math.pow(a.mass, 0.33) * 10;
        }
    });

    // Conservation Check
    if (Math.abs(debugSum - totalCharge) > 0.1) {
        console.warn(`[PHYSICS WARNING] Charge Conservation Drift: Start=${totalCharge}, End=${debugSum}`);
    }
};

// --- Bond Management Helpers ---

export const addBond = (a: Atom, b: Atom) => {
    // Convert Protons to Hydrogen context when they bond
    // This ensures they render as white Hydrogen atoms (H) instead of red Protons (p+)
    if (a.element.z === 1 && a.element.s === 'p⁺') {
        a.element = ELEMENTS[0]; // H
        // Re-calc radius immediately to prevent visual popping
        a.radius = 30 + Math.pow(a.mass, 0.33) * 10;
    }
    if (b.element.z === 1 && b.element.s === 'p⁺') {
        b.element = ELEMENTS[0]; // H
        b.radius = 30 + Math.pow(b.mass, 0.33) * 10;
    }

    a.bonds.push(b.id);
    b.bonds.push(a.id);
};

export const breakBond = (allAtoms: Atom[], a: Atom, bId: string): boolean => {
    const startLen = a.bonds.length;
    a.bonds = a.bonds.filter(id => id !== bId);
    
    let bChanged = false;
    const b = allAtoms.find(at => at.id === bId);
    if (b) {
        const bStartLen = b.bonds.length;
        b.bonds = b.bonds.filter(id => id !== a.id);
        bChanged = b.bonds.length !== bStartLen;
    }
    
    return a.bonds.length !== startLen || bChanged;
};

export const getBondOrder = (a: Atom, bId: string) => {
    let count = 0;
    for (const id of a.bonds) {
        if (id === bId) count++;
    }
    return count;
};

/**
 * Scans bonds on an atom and removes any that are physically impossible (Ghost Bonds).
 * This fixes bugs where atoms drift apart but remain logically bonded, sharing partial charges.
 */
export const pruneGhostBonds = (atoms: Atom[], a: Atom) => {
    let changed = false;
    // Iterate backwards so we can safely remove
    for (let i = a.bonds.length - 1; i >= 0; i--) {
        const bId = a.bonds[i];
        const b = atoms.find(x => x.id === bId);
        
        // 1. Partner missing?
        if (!b) {
            a.bonds.splice(i, 1);
            changed = true;
            continue;
        }

        // 2. Partner too far? (Ghost Bond)
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        const distSq = dx*dx + dy*dy + dz*dz;
        // Hard limit: 500px squared. Physical bonds snap at 5x rest (~250px), so 500 is a safe safety net.
        if (distSq > 500 * 500) {
            // Force Break
            breakBond(atoms, a, b.id);
            changed = true;
        }
    }
    
    if (changed) {
        redistributeCharge(atoms, a.id);
    }
};
