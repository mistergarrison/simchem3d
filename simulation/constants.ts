
import { ElementData, Molecule } from '../types';

export const SUBSTEPS = 8; 
export const MAX_SPEED = 50; // Increased for larger world

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
export const BOND_STIFFNESS = 0.3; 
export const BOND_DAMPING = 0.05;   

// --- VSEPR CONSTANTS ---

export const ANGULAR_STIFFNESS = 0.5; 
export const ANGULAR_DAMPING = 0.1;

// Z-Axis Constraints (Relaxed for 3D)
export const Z_BOUNDS = 2000; // Increased for larger world
export const Z_SPRING = 0.005; // Force to keep atoms within Z bounds

export const WORLD_SCALE = 3.3; // Zoomed in ~50% (was 5). Lower scale = High Zoom.

// Mouse Interaction
export const MOUSE_SPRING_STIFFNESS = 0.2; // How tight the cursor grip is
export const MOUSE_SPRING_DAMPING = 0.8;   // Drag reduction while holding

export const COVALENT_Z = new Set([
    1, 2, // H, He
    5, 6, 7, 8, 9, 10, // B, C, N, O, F, Ne
    14, 15, 16, 17, 18, // Si, P, S, Cl, Ar
    33, 34, 35, 36, // As, Se, Br, Kr
    52, 53, 54, // Te, I, Xe
    85, 86 // At, Rn
]);
