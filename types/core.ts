
import { ElementData, Isotope } from './chemistry';

export interface Atom {
    id: string;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    fx: number; // Accumulated Force X
    fy: number; // Accumulated Force Y
    fz: number; // Accumulated Force Z
    element: ElementData;
    isotopeIndex: number;
    bonds: string[]; // IDs of bonded atoms
    mass: number;
    radius: number;
    createdAt: number; // Timestamp of creation for particle decay
    lastDecayCheck?: number;
    // New Props for Physics
    charge?: number; // -1, 0, +1, or fractional (quarks)
    customIsotope?: Isotope; // For transient nuclear states
    cooldown?: number; // 0.0 - 1.0. Used to stabilize newly formed molecules.
    
    // Assembly Animation State
    destination?: { x: number; y: number; z: number };
    isAssembling?: boolean; // True if in the high-damping formation phase
    assemblyGroupId?: number; // Unique ID to isolate this molecule from others during multi-assembly
    assemblyTimeOut?: number; // Safety counter to force release if tension never drops
    assemblyTimer?: number; // Counts up frames since assembly started. Used to enforce minimum hold time.

    // DEBUGGING
    _debugId?: number; // Ephemeral runtime ID to track object identity
    _debugReleaseLogged?: boolean; // Flag to ensure single log
}
  
export interface Particle {
    id: string;
    x: number;
    y: number;
    z: number; // 3D Depth
    vx: number;
    vy: number;
    vz: number; // 3D Velocity
    life: number;
    maxLife: number;
    color: string;
    size: number;
}
  
export interface SimulationState {
    atoms: Atom[];
    particles: Particle[];
    timeScale: number;
    isPlaying: boolean;
}
