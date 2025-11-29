



export interface Isotope {
    m: number;
    hl: number | "stable";
    mode?: "alpha" | "beta" | "beta-" | "beta+" | "ec" | "sf";
    p?: { z: number; m: number };
    name?: string;
  }
  
  export interface ElementData {
    z: number;
    s: string;
    n: string;
    v: number;
    c: string;
    iso: Isotope[];
  }
  
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

  export interface Molecule {
    id: string;
    name: string;
    formula: string;
    ingredients: { z: number; count: number }[];
    structure?: {
        atoms: number[]; // List of Z numbers representing the atoms in the molecule
        bonds: [number, number, number][]; // [AtomIndexA, AtomIndexB, BondOrder]
    };
  }

  export interface SM_ParticleDef {
    id: string;
    name: string;
    symbol: string;
    massMeV: number;
    charge: number;
    type: 'lepton' | 'quark' | 'boson' | 'hadron';
    color: string;
    antiParticleId?: string; // ID of the anti-particle
    pairThreshold?: number; // MeV required to spawn pair
  }

  export type PaletteItemType = 'atom' | 'molecule' | 'particle';

  export interface PaletteItem {
    id: string;
    type: PaletteItemType;
    // Data payloads
    element?: ElementData;      // For atoms
    isotopeIndex?: number;      // For atoms
    molecule?: Molecule;        // For molecules
    particle?: SM_ParticleDef;  // For particles
  }

  // Updated to allow string (Atom IDs)
  export type ToolType = 'lasso' | 'energy' | string;

  export interface FloatingLabel {
    id: string;          // Unique ID (typically sorted joined atom IDs)
    text: string;        // Display text
    targetId: string;    // Anchor atom ID
    atomIds: Set<string>; // Atoms involved (used for validity checking)
    life: number;        // Frames remaining
    maxLife: number;     // Total frames
    fadeDuration: number; // Number of frames at the end of life to fade out
}

export interface ClearanceState {
    active: boolean;
    cx: number;
    cy: number;
    maxRadius: number;
    life: number;
    maxLife: number;
    molecule: Molecule | null;
    velocity?: { vx: number, vy: number, vz: number };
}

export type GameMode = 'sandbox' | 'discovery';

export interface DiscoveryState {
    elements: Set<number>;   // Atomic Numbers (Z)
    molecules: Set<string>;  // Molecule IDs
    particles: Set<string>;  // Particle IDs
}

export interface SimulationEvent {
    type: 'create' | 'destroy';
    atomId: string;
    label: string;
    reason: string;
    timestamp: number;
}

/**
 * Tracks the comprehensive state of user interaction with the Canvas.
 * This acts as the bridge between React events and the physics loop.
 */
export interface MouseState {
    // Current pointer position in Canvas coordinates
    x: number;
    y: number;
    
    // Position in the previous frame (used to calculate pointer velocity)
    lastX: number;
    lastY: number;
    
    // Smoothed velocity of the pointer (for throwing atoms)
    vx: number;
    vy: number;
    
    // Interaction flags
    isDown: boolean;
    dragId: string | null;     // ID of the atom currently being dragged
    hoverId: string | null;    // ID of the atom currently under the cursor
    hoverGroup: Set<string> | null; // IDs of the molecule under the cursor
    dragName: string | null;   // Name of the molecule currently being dragged (if recognized)
    
    // Energy Tool State
    energyActive: boolean;
    energyValue: number;       // Current MeV accumulated
    energyTarget: number | null; // Nearest target (visual feedback)
    
    // --- DRAG ANCHOR ---
    // Stores the offset between the mouse position and the atom's center at the moment of click.
    // Normalized to Screen Pixels (Logical).
    dragAnchor: { x: number, y: number } | null;

    // Set of IDs belonging to the molecule currently being dragged.
    // We track the whole group so visual effects (like halos) apply to the whole molecule.
    dragGroup: Set<string>;

    // Rigid Body State
    // Stores the initial relative offsets (dx, dy, dz) of group members from the dragId atom.
    // Used to enforce rigid geometry during drag.
    dragOffsets: Map<string, {x: number, y: number, z: number}>;
    
    // Lasso Selection State
    isLassoing: boolean;
    lassoPoints: {x: number, y: number}[]; // Polygon path drawn by the user
    
    // Molecule "Gravity Well" State
    // Used to animate the "Super Crunch" effect when spawning molecules or using the Lasso.
    moleculeHaloLife: number;    // Remaining duration of the effect (in frames)
    moleculeHaloMaxLife: number; // Total duration (for calculating opacity/progress)
    moleculeTarget: { 
        ids: string[],         // Atoms affected by the gravity well
        cx: number,            // Center X of the well
        cy: number,            // Center Y of the well
        startRadius?: number,  // Initial radius of the visual halo
        visualOnly?: boolean   // If true, draws the halo but applies no physics force
    } | null;

    // Clearance Phase State (Pushing atoms away before spawn)
    clearance: ClearanceState | null;

    // Compression Phase (Pulling atoms together before bonding)
    compression: {
        active: boolean;
        atomIds: Set<string>;
        cx: number;
        cy: number;
        currentRadius: number;
        minRadius: number;
    } | null;

    // --- AUTO ROTATION ---
    // Animation state for rotating the molecule to the best viewing angle
    autoRotate: {
        active: boolean;
        axis: { x: number, y: number, z: number }; // Axis to rotate around
        totalAngle: number;    // Target angle to rotate
        currentFrame: number;  // Current animation frame
        duration: number;      // Total frames (e.g., 60)
    } | null;

    // --- FLOATING LABELS ---
    // Transient text labels for formed molecules or released drags
    floatingLabels: FloatingLabel[];
}
