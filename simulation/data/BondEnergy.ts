
/**
 * simulation/data/BondEnergy.ts
 * 
 * Comprehensive Bond Dissociation Energy (BDE) Lookup Table.
 * Values in kJ/mol.
 */

export const BOND_ENERGIES: Record<string, number> = {
    // --- Tier 1: Triple Bonds (Order 3) ---
    "6-8-3": 1076, // C≡O (Carbon Monoxide)
    "7-7-3": 945,  // N≡N (Nitrogen Gas)
    "6-7-3": 891,  // C≡N (Cyanides)
    "6-6-3": 839,  // C≡C (Acetylene)

    // --- Tier 2: Double Bonds (Order 2) ---
    "6-8-2": 799,  // C=O (CO2)
    "8-14-2": 640, // Si=O (Silicon Oxide)
    "6-7-2": 615,  // C=N (Imines)
    "6-6-2": 614,  // C=C (Alkenes)
    "8-15-2": 597, // P=O (Phosphates)
    "8-16-2": 523, // S=O (Sulfur Dioxide)
    "8-8-2": 498,  // O=O (Oxygen Gas)
    "7-7-2": 418,  // N=N (Azo)

    // --- Tier 3: Single Bonds - High Stability (>400) ---
    "1-9-1": 567,  // H-F
    "6-9-1": 485,  // C-F
    "9-14-1": 540, // Si-F
    "8-14-1": 452, // Si-O
    "1-8-1": 463,  // O-H (Water)
    "1-1-1": 436,  // H-H (Hydrogen Gas)
    "1-17-1": 431, // H-Cl
    "1-6-1": 413,  // C-H (Hydrocarbons)

    // --- Tier 4: Single Bonds - Structural (250 - 400) ---
    "1-7-1": 391,  // N-H
    "14-17-1": 381,// Si-Cl
    "1-35-1": 366, // H-Br
    "6-8-1": 358,  // C-O
    "6-6-1": 348,  // C-C
    "8-15-1": 335, // P-O
    "1-16-1": 339, // H-S
    "6-17-1": 328, // C-Cl
    "1-14-1": 318, // H-Si
    "6-7-1": 305,  // C-N
    "1-53-1": 299, // H-I
    "6-35-1": 276, // C-Br
    "6-16-1": 272, // C-S

    // --- Tier 5: Weak/Reactive Bonds (<250) ---
    "17-17-1": 242,// Cl-Cl
    "14-14-1": 226,// Si-Si
    "7-8-1": 201,  // N-O
    "35-35-1": 193,// Br-Br
    "7-7-1": 160,  // N-N
    "9-9-1": 155,  // F-F
    "53-53-1": 151,// I-I
    "8-8-1": 146,  // O-O
};

export const VALENCY_CAPS: Record<number, number> = {
    1: 1, // H
    6: 4, // C
    14: 4,// Si
    7: 3, // N
    15: 3,// P
    8: 2, // O
    16: 2,// S
    9: 1, // F
    17: 1,// Cl
    35: 1,// Br
    53: 1 // I
};

/**
 * Retrieves the bond energy for a pair of elements and bond order.
 * Key format is "minZ-maxZ-order".
 */
export const getBondEnergy = (z1: number, z2: number, order: number): number => {
    const minZ = Math.min(z1, z2);
    const maxZ = Math.max(z1, z2);
    const key = `${minZ}-${maxZ}-${order}`;
    return BOND_ENERGIES[key] || 0;
};
