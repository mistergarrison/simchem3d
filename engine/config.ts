
// --- SYSTEM CONSTANTS ---
// CRITICAL FIX: Run physics 10x per frame. This allows stiff bonds to be stable.
export const SUBSTEPS = 10; 
export const WORLD_SCALE = 3.3; 

// --- PHYSICS CONSTANTS ---
export const MAX_SPEED = 1500; 

/**
 * Global Air Resistance (Drag).
 * 0.98 allows momentum to carry atoms naturally.
 */
export const DRAG_COEFF = 0.98; 

/**
 * Bond Physics
 * Increased Stiffness (3.0 -> 15.0) creates very rigid molecular structures.
 * Increased Damping (3.0 -> 6.0) to rapidly kill internal oscillation energy (wobble).
 */
export const BOND_STIFFNESS = 15.0; 
export const BOND_DAMPING = 6.0;   

// --- VSEPR CONSTANTS ---

export const ANGULAR_STIFFNESS = 5.0; 
export const ANGULAR_DAMPING = 1.0;

// Z-Axis Constraints
export const Z_BOUNDS = 10000; 
export const Z_SPRING = 0.5; // Increased from 0.001 to prevent Z-drift ghosting

// --- CAMERA CONSTANTS ---
export const FOV = 3500; 

// Mouse Interaction
export const MOUSE_SPRING_STIFFNESS = 0.2; 
export const MOUSE_SPRING_DAMPING = 0.8;   

// Collision Stiffness
// Increased (1.0 -> 5.0) to make atoms feel "hard" and prevent squishy overlaps
export const PAULI_STIFFNESS = 5.0; 

// Elements considered "Strict Covalent" for annealing logic.
// Noble Gases (2, 10, 18, 36, 54, 86) REMOVED to allow hypervalent compounds (XeF4) 
// without the annealing logic treating them as Valency 0 and cutting bonds.
export const COVALENT_Z = new Set([
    1, // H
    5, 6, 7, 8, 9, // B, C, N, O, F
    14, 15, 16, 17, // Si, P, S, Cl
    33, 34, 35, // As, Se, Br
    52, 53, // Te, I
    85 // At
]);
