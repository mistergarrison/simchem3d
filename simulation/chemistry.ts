
import { Atom, Particle, SimulationEvent } from '../types';
import { MouseState } from './types';
import { AnnealingLogic } from './annealing';
import { InteractionLogic } from './interactions';
import { Z_SPRING, DRAG_COEFF, MAX_SPEED, Z_BOUNDS } from './constants';
import { pruneGhostBonds } from './utils';

/**
 * simulation/chemistry.ts
 * 
 * The Physics & Chemistry Solver.
 * Responsible for:
 * 1. Topology Management (Annealing)
 * 2. Interactions (Forces, Collisions)
 * 3. Physics Integration (Kinematics, Z-Plane Constraints)
 */

/**
 * Runs the annealing passes to clean up molecular structure.
 */
export const annealAtoms = (
    atoms: Atom[], 
    mouse: MouseState, 
    protectionSet: Set<string> | null = null
) => {
    const atomCount = atoms.length;
    for (let i = 0; i < atomCount; i++) {
        const a = atoms[i];
        if (!a) continue;
        
        // Pre-Pass: Clean up Ghost Bonds
        pruneGhostBonds(atoms, a);
        
        AnnealingLogic.enforceValency(atoms, a, mouse, protectionSet);
    }
    for (let i = 0; i < atomCount; i++) {
        const a = atoms[i];
        if (!a) continue;
        AnnealingLogic.optimizeStructure(atoms, a, mouse, protectionSet);
    }
};

/**
 * Runs the main interaction loop (O(N^2)) to solving forces, collisions, and reactions.
 */
export const resolveInteractions = (
    atoms: Atom[], 
    particles: Particle[], 
    mouse: MouseState, 
    protectionSet: Set<string> | null = null,
    eventLog?: SimulationEvent[]
) => {
    const atomCount = atoms.length;

    for (let i = atomCount - 1; i >= 0; i--) {
        const a = atoms[i];
        if (!a) continue; 
        
        for (let j = i - 1; j >= 0; j--) {
            const b = atoms[j];
            if (!b) continue;

            if (mouse.dragGroup.has(a.id) && mouse.dragGroup.has(b.id)) continue;

            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let dz = b.z - a.z;
            
            // [CRITICAL DEBUG] Check for NaN coordinates
            if (isNaN(dx) || isNaN(dy) || isNaN(dz)) {
                console.error(`[PHYSICS ERROR] NaN Distance detected between Atom ${a.id} and ${b.id}.`, { a, b });
                continue;
            }

            let distSq = dx*dx + dy*dy + dz*dz;
            let dist = Math.sqrt(distSq);
            
            let nx: number, ny: number, nz: number;

            // SINGULARITY CHECK:
            if (dist < 0.001) {
                // Simple string hash
                let hash = 0;
                const str = a.id + b.id;
                for (let k = 0; k < str.length; k++) {
                    hash = ((hash << 5) - hash) + str.charCodeAt(k);
                    hash |= 0;
                }
                
                const theta = (Math.abs(hash) % 360) * (Math.PI / 180);
                const phi = ((Math.abs(hash >> 8) % 180)) * (Math.PI / 180);
                
                nx = Math.sin(phi) * Math.cos(theta);
                ny = Math.sin(phi) * Math.sin(theta);
                nz = Math.cos(phi);
                
                dist = 0.001; // Prevent division by zero later
            } else {
                nx = dx / dist;
                ny = dy / dist;
                nz = dz / dist;
            }

            // --- CONTINUOUS COLLISION DETECTION (CCD) ---
            // If relative speed is high, we might tunnel through. 
            // Check Ray-Sphere intersection if static check fails.
            const rvx = a.vx - b.vx;
            const rvy = a.vy - b.vy;
            const rvz = a.vz - b.vz;
            const vSq = rvx*rvx + rvy*rvy + rvz*rvz;
            const touchDist = a.radius + b.radius;
            
            // If moving fast (>20u per substep) and currently separated
            if (vSq > 400 && dist > touchDist) {
                // Ray: Origin = A, Dir = RelV
                // Sphere: Center = B, Radius = touchDist
                // We solve: ||(A + RelV*t) - B||^2 = R^2
                // Let O = A - B = (-dx, -dy, -dz).
                const ox = -dx;
                const oy = -dy;
                const oz = -dz;
                
                const A_coeff = vSq;
                const B_coeff = 2 * (ox*rvx + oy*rvy + oz*rvz);
                const C_coeff = distSq - touchDist*touchDist;
                
                const det = B_coeff*B_coeff - 4*A_coeff*C_coeff;
                
                if (det >= 0) {
                    const sqrtDet = Math.sqrt(det);
                    const t_entry = (-B_coeff - sqrtDet) / (2 * A_coeff);
                    
                    // If collision occurs within this timestep (0 <= t_entry <= 1)
                    if (t_entry >= 0 && t_entry <= 1.0) {
                        // Calculate Point of Closest Approach (t_mid)
                        // This is the midpoint of the chord inside the sphere.
                        // t_mid = -B / 2A
                        const t_mid = -B_coeff / (2 * A_coeff);
                        
                        // We want to move the atom DEEP into the target to ensure 
                        // capture logic triggers (which often checks dist < radius * 0.9).
                        // However, we cannot exceed t=1 (end of frame).
                        // So we target the closest approach, clamped to the current frame.
                        
                        // If t_mid is > 1, it means we are heading towards the center but won't reach it this frame.
                        // In that case, we go to t=1 (max travel).
                        // If t_mid is < t_entry (impossible if det > 0 and t_entry is real entry), ignore.
                        
                        const t_target = Math.max(t_entry, Math.min(1.0, t_mid));

                        a.x += rvx * t_target;
                        a.y += rvy * t_target;
                        a.z += rvz * t_target;
                        
                        // Re-calculate metrics for the interaction logic below
                        // We assume B didn't move significantly during the sub-frame for this pair
                        dx = b.x - a.x;
                        dy = b.y - a.y;
                        dz = b.z - a.z;
                        distSq = dx*dx + dy*dy + dz*dz;
                        dist = Math.sqrt(distSq); 
                        
                        // Update normals (collision normal)
                        if (dist > 0.001) {
                            nx = dx / dist;
                            ny = dy / dist;
                            nz = dz / dist;
                        } else {
                            // Center hit
                            dist = 0.001;
                        }
                    }
                }
            }
            
            const bondExists = a.bonds.includes(b.id);

            if (bondExists) {
                InteractionLogic.applyBondForces(atoms, a, b, dist, nx, ny, nz, mouse);
            } else {
                // Electrostatics
                InteractionLogic.applyElectrostatics(a, b, dist, distSq, nx, ny, nz);

                // ANNIHILATION CHECK (Matter + Antimatter)
                const annihilation = InteractionLogic.attemptAnnihilation(atoms, particles, a, b, i, j, distSq, eventLog);
                if (annihilation.annihilated) {
                    // Both particles destroyed.
                    // Remove 'i' first (the larger index)
                    atoms.splice(i, 1);
                    // Remove 'j' (the smaller index)
                    atoms.splice(j, 1);
                    // Break outer loop since 'a' (atoms[i]) is gone
                    break;
                }

                // POSITRON-ATOM ANNIHILATION (Bound Electron Capture)
                const posResult = InteractionLogic.attemptPositronAnnihilation(atoms, particles, a, b, i, j, distSq, eventLog);
                if (posResult.annihilated) {
                    // If 'i' (outer loop) was the positron, we stop processing it
                    if (posResult.removedIndex === i) break;
                    // If 'j' was the positron, we continue to j-1
                    continue;
                }

                // Electron Capture
                const eCap = InteractionLogic.attemptElectronCapture(atoms, particles, a, b, i, j, distSq, eventLog); 
                if (eCap.captured) {
                    // If 'i' (outer loop) was removed, we must stop processing 'i'
                    if (eCap.removedIndex === i) break; 
                    // If 'j' (inner loop) was removed, we continue to j-1
                    continue; 
                }

                // Neutron Capture
                const nCap = InteractionLogic.attemptNeutronCapture(atoms, particles, a, b, i, j, distSq, eventLog);
                if (nCap.captured) {
                    if (nCap.removedIndex === i) break;
                    continue;
                }

                // Pauli Repulsion & Bonding
                InteractionLogic.resolveCollisionAndBonding(atoms, particles, a, b, dist, distSq, nx, ny, nz, mouse);
            }
        }
    }
};

/**
 * Calculates Z-Plane rigid body forces to keep molecules planar without crushing them.
 */
export const calculateZPlaneForces = (atoms: Atom[]): Map<string, number> => {
    const atomMap = new Map<string, Atom>();
    for (const a of atoms) atomMap.set(a.id, a);

    const zForceMap = new Map<string, number>();
    const zProcessed = new Set<string>();

    for (const atom of atoms) {
        if (zProcessed.has(atom.id)) continue;
        
        // BFS for Connected Component
        const componentIds: string[] = [];
        const queue = [atom.id];
        zProcessed.add(atom.id);
        
        let sumZ = 0;
        
        while (queue.length > 0) {
            const currId = queue.shift()!;
            componentIds.push(currId);
            const curr = atomMap.get(currId);
            
            if (curr) {
                sumZ += curr.z;
                for(const bondId of curr.bonds) {
                        if (!zProcessed.has(bondId)) {
                            zProcessed.add(bondId);
                            queue.push(bondId);
                        }
                }
            }
        }
        
        // Calculate Group Force
        const count = componentIds.length;
        const avgZ = count > 0 ? sumZ / count : 0;
        const force = -avgZ * Z_SPRING;
        
        for(const id of componentIds) {
            zForceMap.set(id, force);
        }
    }
    return zForceMap;
};

/**
 * Performs Symplectic Euler Integration, Boundary Clamping, and Thermal Stabilization.
 */
export const integrateMotion = (atoms: Atom[], zForceMap: Map<string, number>, worldW: number, worldH: number, safeAreaBottom: number = 0) => {
    atoms.forEach(a => {
        // --- DYNAMIC TENSION-BASED FORMATION ---
        if (a.isAssembling) {
            // 2. Apply Heavy Damping (Viscosity)
            a.vx *= 0.1;
            a.vy *= 0.1;
            a.vz *= 0.1;

            // 3. Check Tension (Force Magnitude)
            const tension = Math.sqrt(a.fx*a.fx + a.fy*a.fy + a.fz*a.fz);
            
            // 4. Release Condition: Low Tension OR Time Out
            let shouldRelease = false;
            if (tension < 0.25) {
                shouldRelease = true;
            } else if (a.assemblyTimeOut !== undefined) {
                a.assemblyTimeOut--;
                if (a.assemblyTimeOut <= 0) {
                    shouldRelease = true;
                }
            }

            if (shouldRelease) {
                a.isAssembling = false;
                // RESET COOLDOWN TO 1.0 (Full Duration)
                // This ensures the full 3.5s settling period runs AFTER the layout solver
                // finishes its job. Starting at 0.5 was skipping the gentle "floppy" phase.
                a.cooldown = 1.0; 
                a.vx = 0; a.vy = 0; a.vz = 0;
            }
        }

        // [CRITICAL DEBUG] Mass Sanity Check
        if (a.mass <= 0) {
            console.error(`[PHYSICS CRITICAL] Atom ${a.id} (${a.element.s}) has invalid mass: ${a.mass}. Resetting to 1.0.`);
            a.mass = 1.0;
        }

        const mass = a.mass || 1;
        
        // [CRITICAL DEBUG] Force Sanity Check
        if (isNaN(a.fx) || isNaN(a.fy) || isNaN(a.fz)) {
            console.error(`[PHYSICS CRITICAL] Atom ${a.id} has NaN forces. Resetting forces.`, { fx: a.fx, fy: a.fy, fz: a.fz });
            a.fx = 0; a.fy = 0; a.fz = 0;
        }

        const ax = a.fx / mass;
        const ay = a.fy / mass;
        const az = a.fz / mass;

        a.vx += ax; a.vy += ay; a.vz += az;
        
        // [CRITICAL DEBUG] Velocity Sanity Check
        if (isNaN(a.vx) || isNaN(a.vy) || isNaN(a.vz)) {
            console.error(`[PHYSICS CRITICAL] Atom ${a.id} Velocity Explosion (NaN). Resetting velocity.`, { vx: a.vx, vy: a.vy, vz: a.vz });
            a.vx = 0; a.vy = 0; a.vz = 0;
        }

        // INCREASED DAMPING FOR COOLDOWN (SHOCK ABSORBER)
        if ((a.cooldown || 0) > 0) {
            const drag = 0.5; 
            a.vx *= drag; a.vy *= drag; a.vz *= drag;
            // SLOWER DECAY (0.008 -> 0.005) prevents physics snapping in too early
            a.cooldown = Math.max(0, (a.cooldown || 0) - 0.005);
        } else {
            a.vx *= DRAG_COEFF; a.vy *= DRAG_COEFF; 
            
            const speedSq = a.vx*a.vx + a.vy*a.vy + a.vz*a.vz;
            if (speedSq > MAX_SPEED * MAX_SPEED) {
                const scale = MAX_SPEED / Math.sqrt(speedSq);
                a.vx *= scale; a.vy *= scale; a.vz *= scale;
            }
        }
        
        // --- WEAKENED Z-PLANE RESTORATION ---
        const zForce = zForceMap.get(a.id) || 0;
        a.vz += zForce;
        a.vz *= 0.95; // Reduced damping (was 0.5) to maintain 3D structure without flattening

        a.x += a.vx; a.y += a.vy; a.z += a.vz;
        
        // [CRITICAL DEBUG] Position Sanity Check
        if (isNaN(a.x) || isNaN(a.y) || isNaN(a.z)) {
             console.error(`[PHYSICS CRITICAL] Atom ${a.id} Position NaN. Rescuing to center.`, { x: a.x, y: a.y, z: a.z });
             a.x = worldW / 2;
             a.y = worldH / 2;
             a.z = 0;
             a.vx = 0; a.vy = 0; a.vz = 0;
        }
        
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
    });
};