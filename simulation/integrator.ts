

import { Atom, Particle } from '../types';
import { DRAG_COEFF, MAX_SPEED, Z_BOUNDS } from './constants';
import { getMoleculeGroup, debugWarn } from './utils';
import { createExplosion } from './effects';

/**
 * Handles the numerical integration of forces into motion.
 */
export class Integrator {
    
    /**
     * Integrates motion for a single atom, applying all constraints and damping.
     * Returns TRUE if the atom should be removed from the simulation (e.g. out of bounds Boson).
     */
    static updateAtom(
        a: Atom, 
        zForce: number, 
        worldW: number, 
        worldH: number, 
        safeAreaBottom: number,
        allAtoms: Atom[],
        particles: Particle[]
    ): boolean {
        // --- BOSON FLIGHT (Photons/Gluons) ---
        // They fly straight, ignore forces/damping, and disappear when out of bounds.
        if (a.element.s === 'γ' || a.element.s === 'g') {
            a.x += a.vx;
            a.y += a.vy;
            a.z += a.vz;
            
            const margin = 200; // Increased margin to ensure they are well off-screen before deletion
            if (a.x < -margin || a.x > worldW + margin || 
                a.y < -margin || a.y > worldH + margin ||
                a.z < -Z_BOUNDS * 2 || a.z > Z_BOUNDS * 2) {
                return true; // Signal for removal
            }
            return false;
        }

        // --- DYNAMIC PHYSICS-BASED FORMATION ---
        if (a.isAssembling) {
            // Check for initial assembly trigger log
            if (!a._debugReleaseLogged) {
                a._debugReleaseLogged = true;
                debugWarn(`[Assembly] Atom ${a.element.s} (${a.id.slice(0,4)}) starting assembly phase.`);
            }

            Integrator.handleAssembly(a, allAtoms, particles);

            // If still assembling (Held), pin velocity
            if (a.isAssembling) {
                a.vx = 0; 
                a.vy = 0; 
                a.vz = 0;
            }
        }

        const mass = a.mass || 1;
        
        if (isNaN(a.fx) || isNaN(a.fy) || isNaN(a.fz)) {
            a.fx = 0; a.fy = 0; a.fz = 0;
        }

        // --- ACCELERATION CLAMPING (Anti-Explosion) ---
        const MAX_ACCEL = 200.0;
        
        let ax = a.fx / mass;
        let ay = a.fy / mass;
        let az = a.fz / mass;

        if (Math.abs(ax) > MAX_ACCEL) ax = Math.sign(ax) * MAX_ACCEL;
        if (Math.abs(ay) > MAX_ACCEL) ay = Math.sign(ay) * MAX_ACCEL;
        if (Math.abs(az) > MAX_ACCEL) az = Math.sign(az) * MAX_ACCEL;

        // Apply Acceleration
        a.vx += ax; 
        a.vy += ay; 
        a.vz += az;
        
        if (isNaN(a.vx) || isNaN(a.vy) || isNaN(a.vz)) {
            a.vx = 0; a.vy = 0; a.vz = 0;
        }

        // Apply Damping / Cooldown
        Integrator.applyDamping(a);
        
        // --- WEAKENED Z-PLANE RESTORATION ---
        a.vz += zForce;
        a.vz *= 0.95; 

        // Update Position
        a.x += a.vx; 
        a.y += a.vy; 
        a.z += a.vz;
        
        if (isNaN(a.x) || isNaN(a.y) || isNaN(a.z)) {
             a.x = worldW / 2;
             a.y = worldH / 2;
             a.z = 0;
             a.vx = 0; a.vy = 0; a.vz = 0;
        }
        
        Integrator.applyBounds(a, worldW, worldH, safeAreaBottom);
        return false;
    }

    private static handleAssembly(a: Atom, allAtoms: Atom[], particles: Particle[]) {
        a.assemblyTimer = (a.assemblyTimer || 0) + 1;
        const MIN_HOLD_TICKS = 6; // 0.1s Hold @ 60fps

        // 1. Hold Phase
        if (a.assemblyTimer < MIN_HOLD_TICKS) return;

        // 2. Release Phase (Release the whole group at once)
        const groupIds = getMoleculeGroup(allAtoms, a.id);
        const group: Atom[] = [];
        let cx = 0, cy = 0, cz = 0;

        for(const id of groupIds) {
            const member = allAtoms.find(at => at.id === id);
            if(member) {
                group.push(member);
                cx += member.x; cy += member.y; cz += member.z;
            }
        }
        
        if (group.length > 0) {
            cx /= group.length; cy /= group.length; cz /= group.length;
            // Big Flash
            createExplosion(particles, cx, cy, cz, '#FFFFFF', 40);
        }

        // Release ALL atoms in the group simultaneously
        for(const atom of group) {
            atom.isAssembling = false;
            atom.assemblyGroupId = undefined;
            
            // Apply Ejection Impulse
            if (atom.destination) {
                atom.vx = atom.destination.x;
                atom.vy = atom.destination.y;
                atom.vz = atom.destination.z;
                atom.destination = undefined;
            }
            
            // High cooldown prevents immediate collision explosions (Pauli Repulsion)
            // allowing molecules to clear each other's space cleanly.
            atom.cooldown = 1.0; 
            atom.fx = 0; atom.fy = 0; atom.fz = 0;
        }
    }

    private static applyDamping(a: Atom) {
        if ((a.cooldown || 0) > 0) {
            // Hot atom damping
            const drag = 0.85; 
            a.vx *= drag; a.vy *= drag; a.vz *= drag;
            
            // Cooldown decay
            a.cooldown = Math.max(0, (a.cooldown || 0) - 0.02);
        } else {
            // Standard Air Resistance
            a.vx *= DRAG_COEFF; a.vy *= DRAG_COEFF; 
            
            const speedSq = a.vx*a.vx + a.vy*a.vy + a.vz*a.vz;
            if (speedSq > MAX_SPEED * MAX_SPEED) {
                const scale = MAX_SPEED / Math.sqrt(speedSq);
                a.vx *= scale; a.vy *= scale; a.vz *= scale;
            }
        }
    }

    private static applyBounds(a: Atom, worldW: number, worldH: number, safeAreaBottom: number) {
        // World Bounds X/Y
        if (a.x < a.radius) { a.x = a.radius; a.vx *= -0.8; }
        if (a.x > worldW - a.radius) { a.x = worldW - a.radius; a.vx *= -0.8; }
        if (a.y < a.radius) { a.y = a.radius; a.vy *= -0.8; }
        
        // Bottom Boundary with Safe Area
        const bottomLimit = worldH - safeAreaBottom - a.radius;
        if (a.y > bottomLimit) { a.y = bottomLimit; a.vy *= -0.8; }

        // --- HARD Z-CLAMPING ---
        if (a.z > Z_BOUNDS) { a.z = Z_BOUNDS; a.vz = 0; }
        if (a.z < -Z_BOUNDS) { a.z = -Z_BOUNDS; a.vz = 0; }
    }

    /**
     * Batch integration for all atoms in the world.
     */
    static integrateAll(
        atoms: Atom[], 
        zForceMap: Map<string, number>, 
        worldW: number, 
        worldH: number, 
        safeAreaBottom: number,
        particles: Particle[]
    ) {
        // Iterate backwards to allow safe removal of atoms
        for (let i = atoms.length - 1; i >= 0; i--) {
            const a = atoms[i];
            const zForce = zForceMap.get(a.id) || 0;
            
            // Pass the full atom list to allow group operations (like group release)
            const shouldRemove = Integrator.updateAtom(a, zForce, worldW, worldH, safeAreaBottom, atoms, particles);
            
            if (shouldRemove) {
                atoms.splice(i, 1);
            }
        }
    }
}
