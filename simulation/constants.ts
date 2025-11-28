
import { ElementData, Molecule } from '../types';

export const SUBSTEPS = 1; 
export const MAX_SPEED = 1500; 

// --- PHYSICS CONSTANTS ---

/**
 * Global Air Resistance (Drag).
 * 0.98 allows momentum to carry atoms naturally.
 */
export const DRAG_COEFF = 0.98; 

/**
 * Bond Physics
 * Original Low Stiffness values.
 */
export const BOND_STIFFNESS = 0.2; 
export const BOND_DAMPING = 0.1;   

// --- VSEPR CONSTANTS ---

export const ANGULAR_STIFFNESS = 0.1; 
export const ANGULAR_DAMPING = 0.1;

// Z-Axis Constraints
export const Z_BOUNDS = 10000; 
export const Z_SPRING = 0.001; 

export const WORLD_SCALE = 3.3; 

// --- CAMERA CONSTANTS ---
export const FOV = 3500; 

// Mouse Interaction
export const MOUSE_SPRING_STIFFNESS = 0.2; 
export const MOUSE_SPRING_DAMPING = 0.8;   

// Collision Stiffness
export const PAULI_STIFFNESS = 0.5; 

export const COVALENT_Z = new Set([
    1, 2, // H, He
    5, 6, 7, 8, 9, 10, // B, C, N, O, F, Ne
    14, 15, 16, 17, 18, // Si, P, S, Cl, Ar
    33, 34, 35, 36, // As, Se, Br, Kr
    52, 53, 54, // Te, I, Xe
    85, 86 // At, Rn
]);
