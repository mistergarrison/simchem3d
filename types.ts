

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
    lastDecayCheck?: number;
    // New Props for Physics
    charge?: number; // -1, 0, +1
    customIsotope?: Isotope; // For transient nuclear states
    cooldown?: number; // 0.0 - 1.0. Used to stabilize newly formed molecules.
  }
  
  export interface Particle {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
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

  export interface PaletteItem {
    id: string;
    element: ElementData;
    isotopeIndex: number;
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
    isHidden?: boolean;
  }

  // Updated to allow string (Atom IDs)
  export type ToolType = 'lasso' | 'electron' | 'proton' | 'neutron' | string;