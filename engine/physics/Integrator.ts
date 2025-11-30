
import { Atom, Particle } from '../../types/core';
import { DRAG_COEFF, MAX_SPEED, Z_BOUNDS } from '../config';
import { getMoleculeGroup, debugWarn } from '../utils/general';
import { createExplosion } from '../graphics/Effects';

/**
 * Handles the numerical integration of forces into motion.
 */
export class Integrator {
    
    /**
     * Integrates motion for a single atom, applying all constraints and damping.
     * Returns TRUE if the atom should be removed from the simulation (e.g. out of bounds Boson).
     * @param dt Delta Time scalar (1.0 = full frame, 0.125 = 1/8th frame)
     */
    static updateAtom(
        a: Atom, 
        zForce: number, 
        worldW: number, 
        worldH: number, 
        safeAreaBottom: number,
        allAtoms: Atom[],
        particles: Particle[],
        dt: number
    ): boolean {
        // --- BOSON FLIGHT (Photons/Gluons) ---
        // They fly straight, ignore forces/damping, and disappear when out of bounds.
        // Scaling flight by dt ensures constant speed regardless of substepping
        if (a.element.s === 'γ' || a.element.s === 'g') {
            a.x += a.vx * dt;
            a.y += a.vy * dt;
            a.z += a.vz * dt;
            
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

            // Scale assembly timer by dt to match real time (1.0 per frame)
            Integrator.handleAssembly(a, allAtoms, particles, dt);

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
        // Increased max accel to allow stiff spring corrections (5000 -> 100000)
        const MAX_ACCEL = 100000.0; 
        
        let ax = a.fx / mass;
        let ay = a.fy / mass;
        let az = a.fz / mass;

        if (Math.abs(ax) > MAX_ACCEL) ax = Math.sign(ax) * MAX_ACCEL;
        if (Math.abs(ay) > MAX_ACCEL) ay = Math.sign(ay) * MAX_ACCEL;
        if (Math.abs(az) > MAX_ACCEL) az = Math.sign(az) * MAX_ACCEL;

        // Apply Acceleration scaled by dt
        a.vx += ax * dt; 
        a.vy += ay * dt; 
        a.vz += az * dt;
        
        if (isNaN(a.vx) || isNaN(a.vy) || isNaN(a.vz)) {
            a.vx = 0; a.vy = 0; a.vz = 0;
        }

        // Apply Damping / Cooldown scaled by dt
        Integrator.applyDamping(a, dt);
        
        // --- WEAKENED Z-PLANE RESTORATION ---
        // STABILITY FIX: For very light particles (electrons/quarks, m < 0.01), the standard Z-spring 
        // creates a harmonic oscillator with frequency > 1/dt, causing immediate explosion to infinity.
        // We clamp the effective mass used for Z-restoration to 1.0 to ensure overdamped stability.
        // This makes light particles drift back to Z=0 kinematically rather than oscillating violently.
        const zMass = Math.max(mass, 1.0);
        a.vz += (zForce / zMass) * dt;
        
        a.vz *= Math.pow(0.95, dt); 

        // Update Position scaled by dt
        a.x += a.vx * dt; 
        a.y += a.vy * dt; 
        a.z += a.vz * dt;
        
        if (isNaN(a.x) || isNaN(a.y) || isNaN(a.z)) {
             a.x = worldW / 2;
             a.y = worldH / 2;
             a.z = 0;
             a.vx = 0; a.vy = 0; a.vz = 0;
        }
        
        Integrator.applyBounds(a, worldW, worldH, safeAreaBottom);
        return false;
    }

    private static handleAssembly(a: Atom, allAtoms: Atom[], particles: Particle[], dt: number) {
        a.assemblyTimer = (a.assemblyTimer || 0) + (1.0 * dt);
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
        
        if (group.length > 0 && a.id === group[0].id) {
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

    private static applyDamping(a: Atom, dt: number) {
        if ((a.cooldown || 0) > 0) {
            // Hot atom damping (Ejection Phase)
            // No drag (1.0) ensures momentum is perfectly preserved during the initial flight
            const drag = 1.0; 
            a.vx *= drag; a.vy *= drag; a.vz *= drag;
            
            // Cooldown decay
            a.cooldown = Math.max(0, (a.cooldown || 0) - (0.02 * dt));
        } else {
            // Standard Air Resistance
            const drag = Math.pow(DRAG_COEFF, dt);
            a.vx *= drag; a.vy *= drag; 
            
            const speedSq = a.vx*a.vx + a.vy*a.vy + a.vz*a.vz;
            if (speedSq > MAX_SPEED * MAX_SPEED) {
                const scale = MAX_SPEED / Math.sqrt(speedSq);
                a.vx *= scale; a.vy *= scale; a.vz *= scale;
            }
        }
    }

    private static applyBounds(a: Atom, worldW: number, worldH: number, safeAreaBottom: number) {
        // World Bounds X/Y
        if (a.x < a.radius) { a.x = a.radius; a.vx *= -0.5; }
        if (a.x > worldW - a.radius) { a.x = worldW - a.radius; a.vx *= -0.5; }
        if (a.y < a.radius) { a.y = a.radius; a.vy *= -0.5; }
        
        // Bottom Boundary with Safe Area
        const bottomLimit = worldH - safeAreaBottom - a.radius;
        if (a.y > bottomLimit) { a.y = bottomLimit; a.vy *= -0.5; }

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
        particles: Particle[],
        dt: number
    ) {
        // Iterate backwards to allow safe removal of atoms
        for (let i = atoms.length - 1; i >= 0; i--) {
            const a = atoms[i];
            const zForce = zForceMap.get(a.id) || 0;
            
            // Pass the full atom list to allow group operations (like group release)
            const shouldRemove = Integrator.updateAtom(a, zForce, worldW, worldH, safeAreaBottom, atoms, particles, dt);
            
            if (shouldRemove) {
                atoms.splice(i, 1);
            }
        }
    }
}
