
import { ElementData, Molecule } from '../types';

export const SUBSTEPS = 8; 
export const MAX_SPEED = 1500; // Increased to 1500 to allow for Super-Charged shots (10x base speed)

// --- PHYSICS CONSTANTS ---

/**
 * Global Air Resistance (Drag).
 * Applied every physics substep.
 */
export const DRAG_COEFF = 0.990; 

/**
 * Increased Stiffness (1.0) makes bonds harder to stretch.
 * Increased Damping (0.8) allows molecules to absorb impact shock without oscillating wildly.
 */
export const BOND_STIFFNESS = 0.5; 
export const BOND_DAMPING = 0.05;   

// --- VSEPR CONSTANTS ---

export const ANGULAR_STIFFNESS = 0.5; 
export const ANGULAR_DAMPING = 0.1;

// Z-Axis Constraints (Strict Planar Enforcement)
// Increased to 10000 to allow free rotation of massive molecules without clipping/clamping.
export const Z_BOUNDS = 10000; 
// CRITICAL FIX: Lowered Z_SPRING to 0.001 to allow 3D structures to exist deep in Z-space.
// High values crush 3D molecules into 2D.
export const Z_SPRING = 0.001; 

export const WORLD_SCALE = 3.3; // Zoomed in ~50% (was 5). Lower scale = High Zoom.

// --- CAMERA CONSTANTS ---
export const FOV = 3500; // Increased to accommodate larger Z-depth

// Mouse Interaction
export const MOUSE_SPRING_STIFFNESS = 0.2; // How tight the cursor grip is
export const MOUSE_SPRING_DAMPING = 0.8;   // Drag reduction while holding

// Collision Stiffness (New)
export const PAULI_STIFFNESS = 3.0; // Lowered to 3.0 to soften materialization shock

export const COVALENT_Z = new Set([
    1, 2, // H, He
    5, 6, 7, 8, 9, 10, // B, C, N, O, F, Ne
    14, 15, 16, 17, 18, // Si, P, S, Cl, Ar
    33, 34, 35, 36, // As, Se, Br, Kr
    52, 53, 54, // Te, I, Xe
    85, 86 // At, Rn
]);
