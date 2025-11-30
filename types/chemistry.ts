
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
