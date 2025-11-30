
import { ElementData, SM_ParticleDef } from '../types/chemistry';

// Special Subatomic "Elements"
// Values updated to scientific standard (Seconds) where applicable.

export const PROTON_ELEM: ElementData = {
    z: 1, s: "p⁺", n: "Proton", v: 1, c: "#FF3333",
    iso: [{ m: 1.007, hl: "stable" }]
};

export const NEUTRON_ELEM: ElementData = {
    z: 0, s: "n", n: "Neutron", v: 0, c: "#3333FF",
    iso: [{ m: 1.008, hl: 879, mode: 'beta-', p: { z: 1, m: 1.008 } }] // ~14.6 minutes
};

export const ELECTRON_ELEM: ElementData = {
    z: -1, s: "e⁻", n: "Electron", v: 0, c: "#FFFFFF",
    // GAMEPLAY OVERRIDE: Mass set to 0.1 (approx 1/10th proton) instead of 0.0005.
    // Real electrons move too fast to see in the simulation due to F=ma.
    iso: [{ m: 0.1, hl: "stable" }]
};

// --- STANDARD MODEL PARTICLES ---

export const SM_PARTICLES: SM_ParticleDef[] = [
    // --- GENERATION 1 ---
    { id: 'up', name: 'Up Quark', symbol: 'u', massMeV: 2.2, charge: 0.66, type: 'quark', color: '#FF0000', antiParticleId: 'anti-up', pairThreshold: 4.4 },
    { id: 'down', name: 'Down Quark', symbol: 'd', massMeV: 4.7, charge: -0.33, type: 'quark', color: '#00FF00', antiParticleId: 'anti-down', pairThreshold: 9.4 },
    { id: 'electron', name: 'Electron', symbol: 'e⁻', massMeV: 0.511, charge: -1, type: 'lepton', color: '#FFFFFF', antiParticleId: 'positron', pairThreshold: 1.022 },
    { id: 'nu_e', name: 'Electron Neutrino', symbol: 'νe', massMeV: 1e-6, charge: 0, type: 'lepton', color: '#CCCCCC', antiParticleId: 'anti-nu_e', pairThreshold: 2e-6 },

    // --- GENERATION 2 ---
    { id: 'charm', name: 'Charm Quark', symbol: 'c', massMeV: 1275, charge: 0.66, type: 'quark', color: '#FF0088', antiParticleId: 'anti-charm', pairThreshold: 2550 },
    { id: 'strange', name: 'Strange Quark', symbol: 's', massMeV: 95, charge: -0.33, type: 'quark', color: '#00FF88', antiParticleId: 'anti-strange', pairThreshold: 190 },
    { id: 'muon', name: 'Muon', symbol: 'μ⁻', massMeV: 105.7, charge: -1, type: 'lepton', color: '#DDDDDD', antiParticleId: 'anti-muon', pairThreshold: 211.4 },
    { id: 'nu_mu', name: 'Muon Neutrino', symbol: 'νμ', massMeV: 1e-6, charge: 0, type: 'lepton', color: '#AAAAAA' },

    // --- GENERATION 3 ---
    { id: 'top', name: 'Top Quark', symbol: 't', massMeV: 173000, charge: 0.66, type: 'quark', color: '#FF00FF', antiParticleId: 'anti-top', pairThreshold: 346000 },
    { id: 'bottom', name: 'Bottom Quark', symbol: 'b', massMeV: 4180, charge: -0.33, type: 'quark', color: '#00FFFF', antiParticleId: 'anti-bottom', pairThreshold: 8360 },
    { id: 'tau', name: 'Tau', symbol: 'τ⁻', massMeV: 1776, charge: -1, type: 'lepton', color: '#BBBBBB', antiParticleId: 'anti-tau', pairThreshold: 3552 },
    { id: 'nu_tau', name: 'Tau Neutrino', symbol: 'ντ', massMeV: 1e-6, charge: 0, type: 'lepton', color: '#888888' },

    // --- BOSONS ---
    { id: 'gluon', name: 'Gluon', symbol: 'g', massMeV: 0, charge: 0, type: 'boson', color: '#FFD700' },
    { id: 'photon', name: 'Photon', symbol: 'γ', massMeV: 0, charge: 0, type: 'boson', color: '#FFFF00' },
    { id: 'z_boson', name: 'Z Boson', symbol: 'Z', massMeV: 91187, charge: 0, type: 'boson', color: '#FF8800' },
    { id: 'w_boson', name: 'W Boson', symbol: 'W', massMeV: 80379, charge: 1, type: 'boson', color: '#FF4400' },
    { id: 'higgs', name: 'Higgs Boson', symbol: 'H', massMeV: 125100, charge: 0, type: 'boson', color: '#FF00CC' },

    // --- HADRONS (Composite) ---
    { id: 'proton', name: 'Proton', symbol: 'p⁺', massMeV: 938.27, charge: 1, type: 'hadron', color: '#FF3333' },
    { id: 'neutron', name: 'Neutron', symbol: 'n', massMeV: 939.57, charge: 0, type: 'hadron', color: '#3333FF' },

    // --- ANTI-PARTICLES ---
    { id: 'positron', name: 'Positron', symbol: 'e⁺', massMeV: 0.511, charge: 1, type: 'lepton', color: '#FF9999', antiParticleId: 'electron' },
    { id: 'anti-up', name: 'Anti-Up Quark', symbol: 'ū', massMeV: 2.2, charge: -0.66, type: 'quark', color: '#FF8888', antiParticleId: 'up' },
    { id: 'anti-down', name: 'Anti-Down Quark', symbol: 'd̄', massMeV: 4.7, charge: 0.33, type: 'quark', color: '#88FF88', antiParticleId: 'down' },
    
    { id: 'anti-charm', name: 'Anti-Charm Quark', symbol: 'c̄', massMeV: 1275, charge: -0.66, type: 'quark', color: '#FF88CC', antiParticleId: 'charm' },
    { id: 'anti-strange', name: 'Anti-Strange Quark', symbol: 's̄', massMeV: 95, charge: 0.33, type: 'quark', color: '#88FFCC', antiParticleId: 'strange' },
    { id: 'anti-muon', name: 'Anti-Muon', symbol: 'μ⁺', massMeV: 105.7, charge: 1, type: 'lepton', color: '#EEEEEE', antiParticleId: 'muon' },
    { id: 'anti-nu_e', name: 'Anti-Electron Neutrino', symbol: 'ν̄e', massMeV: 1e-6, charge: 0, type: 'lepton', color: '#AAAAAA', antiParticleId: 'nu_e' },
    
    { id: 'anti-top', name: 'Anti-Top Quark', symbol: 't̄', massMeV: 173000, charge: -0.66, type: 'quark', color: '#FF88FF', antiParticleId: 'top' },
    { id: 'anti-bottom', name: 'Anti-Bottom Quark', symbol: 'b̄', massMeV: 4180, charge: 0.33, type: 'quark', color: '#88FFFF', antiParticleId: 'bottom' },
    { id: 'anti-tau', name: 'Anti-Tau', symbol: 'τ⁺', massMeV: 1776, charge: 1, type: 'lepton', color: '#DDDDDD', antiParticleId: 'tau' },
];

export const getParticleElementData = (pid: string): ElementData => {
    const p = SM_PARTICLES.find(x => x.id === pid);
    
    // Direct mapping for Hadrons to preserve specific properties (decay modes, etc)
    if (pid === 'proton') return PROTON_ELEM;
    if (pid === 'neutron') return NEUTRON_ELEM;

    if (!p) return PROTON_ELEM;

    // Determine pseudo-Z based on particle type to avoid collisions with Elements (Z 1..118)
    let z = 1000; // Default for Quarks/Bosons
    
    if (p.type === 'lepton') {
        if (p.charge < 0) z = -1;      // Electron, Muon, Tau
        else if (p.charge > 0) z = -2; // Positron, Anti-Muon
        else z = -3;                   // Neutrinos
    }

    return {
        z: z,
        s: p.symbol,
        n: p.name,
        v: 0,
        c: p.color,
        // Convert mass to AMU approx. For gameplay visibility, we might clamp smallest masses.
        // 0.511 MeV is approx 0.00055 u. 
        iso: [{ m: Math.max(0.0005, p.massMeV / 931.5), hl: "stable" }] 
    };
};


export const ELEMENTS: ElementData[] = [
  // --- PERIOD 1 ---
  { z: 1, s: "H", n: "Hydrogen", v: 1, c: "#FFFFFF", iso: [
      { m: 1.008, hl: "stable" },
      { m: 2.014, hl: "stable", name: "Deuterium" },
      { m: 3.016, hl: 3.88e8, mode: "beta-", p: { z: 2, m: 3.016 }, name: "Tritium" } // 12.3y
  ]},
  { z: 2, s: "He", n: "Helium", v: 0, c: "#D9FFFF", iso: [
      { m: 3.016, hl: "stable", name: "He-3" },
      { m: 4.002, hl: "stable" },
      { m: 6.018, hl: 0.8, mode: "beta-", p: { z: 3, m: 6.018 } } 
  ]},
  { z: 3, s: "Li", n: "Lithium", v: 1, c: "#CC80FF", iso: [
      { m: 6.0, hl: "stable" }, { m: 7.0, hl: "stable" }
  ]},
  { z: 4, s: "Be", n: "Beryllium", v: 2, c: "#C2FF00", iso: [
      { m: 7.0, hl: 4.56e6, mode: "ec", p: { z: 3, m: 7.0 } }, 
      { m: 9.0, hl: "stable" },
      { m: 10.0, hl: 4.7e13, mode: "beta-", p: { z: 5, m: 10.0 } } 
  ]},
  { z: 5, s: "B", n: "Boron", v: 3, c: "#FFB5B5", iso: [
      { m: 10.0, hl: "stable" }, { m: 11.0, hl: "stable" }
  ]},
  { z: 6, s: "C", n: "Carbon", v: 4, c: "#909090", iso: [
      { m: 10.0, hl: 19.3, mode: "beta+", p: { z: 5, m: 10.0 } },
      { m: 11.0, hl: 1221, mode: "beta+", p: { z: 5, m: 11.0 } }, 
      { m: 12.0, hl: "stable" },
      { m: 13.0, hl: "stable" },
      { m: 14.0, hl: 1.8e11, mode: "beta-", p: { z: 7, m: 14.0 }, name: "C-14" } 
  ]},
  { z: 7, s: "N", n: "Nitrogen", v: 3, c: "#3050F8", iso: [
      { m: 13.0, hl: 598, mode: "beta+", p: { z: 6, m: 13.0 } }, 
      { m: 14.0, hl: "stable" }, { m: 15.0, hl: "stable" }
  ]},
  { z: 8, s: "O", n: "Oxygen", v: 2, c: "#FF0D0D", iso: [
      { m: 15.0, hl: 122, mode: "beta+", p: { z: 7, m: 15.0 } },
      { m: 16.0, hl: "stable" }, { m: 17.0, hl: "stable" }, { m: 18.0, hl: "stable" }
  ]},
  { z: 9, s: "F", n: "Fluorine", v: 1, c: "#90E050", iso: [
      { m: 18.0, hl: 6586, mode: "beta+", p: { z: 8, m: 18.0 } }, 
      { m: 19.0, hl: "stable" }
  ]},
  { z: 10, s: "Ne", n: "Neon", v: 0, c: "#B3E3F5", iso: [
      { m: 19.0, hl: 17.2, mode: "beta+", p: { z: 9, m: 19.0 } },
      { m: 20.0, hl: "stable" }, { m: 21.0, hl: "stable" }, { m: 22.0, hl: "stable" }
  ]},
  { z: 11, s: "Na", n: "Sodium", v: 1, c: "#AB5CF2", iso: [
      { m: 22.0, hl: 8.2e7, mode: "beta+", p: { z: 10, m: 22.0 } }, 
      { m: 23.0, hl: "stable" },
      { m: 24.0, hl: 54000, mode: "beta-", p: { z: 12, m: 24.0 } } 
  ]},
  { z: 12, s: "Mg", n: "Magnesium", v: 2, c: "#8AFF00", iso: [
      { m: 24.0, hl: "stable" }, { m: 25.0, hl: "stable" }, { m: 26.0, hl: "stable" },
      { m: 28.0, hl: 75240, mode: "beta-", p: { z: 13, m: 28.0 } } 
  ]},
  { z: 13, s: "Al", n: "Aluminium", v: 3, c: "#BFA6A6", iso: [
      { m: 26.0, hl: 2.3e13, mode: "beta+", p: { z: 12, m: 26.0 } }, 
      { m: 27.0, hl: "stable" }
  ]},
  { z: 14, s: "Si", n: "Silicon", v: 4, c: "#F0C8A0", iso: [
      { m: 28.0, hl: "stable" }, { m: 29.0, hl: "stable" }, { m: 30.0, hl: "stable" },
      { m: 31.0, hl: 9480, mode: "beta-", p: { z: 15, m: 31.0 } }, 
      { m: 32.0, hl: 4.8e9, mode: "beta-", p: { z: 15, m: 32.0 } } 
  ]},
  { z: 15, s: "P", n: "Phosphorus", v: 5, c: "#FF8000", iso: [
      { m: 30.0, hl: 150, mode: "beta+", p: { z: 14, m: 30.0 } },
      { m: 31.0, hl: "stable" },
      { m: 32.0, hl: 1.2e6, mode: "beta-", p: { z: 16, m: 32.0 } }, 
      { m: 33.0, hl: 2.2e6, mode: "beta-", p: { z: 16, m: 33.0 } } 
  ]},
  { z: 16, s: "S", n: "Sulfur", v: 6, c: "#FFFF30", iso: [
      { m: 32.0, hl: "stable" }, { m: 33.0, hl: "stable" }, { m: 34.0, hl: "stable" },
      { m: 35.0, hl: 7.5e6, mode: "beta-", p: { z: 17, m: 35.0 } }, 
      { m: 36.0, hl: "stable" }
  ]},
  { z: 17, s: "Cl", n: "Chlorine", v: 7, c: "#1FF01F", iso: [
      { m: 35.0, hl: "stable" },
      { m: 36.0, hl: 9.5e12, mode: "beta-", p: { z: 18, m: 36.0 } }, 
      { m: 37.0, hl: "stable" }
  ]},
  { z: 18, s: "Ar", n: "Argon", v: 0, c: "#80D1E3", iso: [
      { m: 36.0, hl: "stable" },
      { m: 37.0, hl: 3e6, mode: "ec", p: { z: 17, m: 37.0 } }, 
      { m: 38.0, hl: "stable" },
      { m: 39.0, hl: 8.5e9, mode: "beta-", p: { z: 19, m: 39.0 } }, 
      { m: 40.0, hl: "stable" },
      { m: 42.0, hl: 1e9, mode: "beta-", p: { z: 19, m: 42.0 } } 
  ]},
  { z: 19, s: "K", n: "Potassium", v: 1, c: "#8F40D4", iso: [
      { m: 39.0, hl: "stable" },
      { m: 40.0, hl: 3.9e16, mode: "beta-", p: { z: 20, m: 40.0 }, name: "K-40" }, 
      { m: 41.0, hl: "stable" }
  ]},
  { z: 20, s: "Ca", n: "Calcium", v: 2, c: "#3DFF00", iso: [
      { m: 40.0, hl: "stable" },
      { m: 41.0, hl: 3.1e12, mode: "ec", p: { z: 19, m: 41.0 } }, 
      { m: 42.0, hl: "stable" }, { m: 43.0, hl: "stable" }, { m: 44.0, hl: "stable" },
      { m: 45.0, hl: 1.4e7, mode: "beta-", p: { z: 21, m: 45.0 } }, 
      { m: 46.0, hl: "stable" },
      { m: 48.0, hl: 1.9e27, mode: "beta-", p: { z: 22, m: 48.0 } } 
  ]},
  { z: 21, s: "Sc", n: "Scandium", v: 3, c: "#E6E6E6", iso: [
      { m: 45.0, hl: "stable" },
      { m: 46.0, hl: 7.2e6, mode: "beta-", p: { z: 22, m: 46.0 } } 
  ]},
  { z: 22, s: "Ti", n: "Titanium", v: 4, c: "#BFA6A6", iso: [
      { m: 44.0, hl: 1.9e9, mode: "ec", p: { z: 21, m: 44.0 } }, 
      { m: 46.0, hl: "stable" }, { m: 47.0, hl: "stable" }, { m: 48.0, hl: "stable" }, { m: 49.0, hl: "stable" }, { m: 50.0, hl: "stable" }
  ]},
  { z: 23, s: "V", n: "Vanadium", v: 5, c: "#A6A6AB", iso: [
      { m: 49.0, hl: 2.8e7, mode: "ec", p: { z: 22, m: 49.0 } }, 
      { m: 50.0, hl: 4.4e24, mode: "beta-", p: { z: 24, m: 50.0 } }, 
      { m: 51.0, hl: "stable" }
  ]},
  { z: 24, s: "Cr", n: "Chromium", v: 6, c: "#8A99C7", iso: [
      { m: 50.0, hl: "stable" },
      { m: 51.0, hl: 2.4e6, mode: "ec", p: { z: 23, m: 51.0 } }, 
      { m: 52.0, hl: "stable" }, { m: 53.0, hl: "stable" }, { m: 54.0, hl: "stable" }
  ]},
  { z: 25, s: "Mn", n: "Manganese", v: 7, c: "#9C7AC7", iso: [
      { m: 53.0, hl: 1.1e14, mode: "ec", p: { z: 24, m: 53.0 } }, 
      { m: 54.0, hl: 2.7e7, mode: "ec", p: { z: 24, m: 54.0 } }, 
      { m: 55.0, hl: "stable" }
  ]},
  { z: 26, s: "Fe", n: "Iron", v: 3, c: "#E06633", iso: [
      { m: 54.0, hl: "stable" },
      { m: 55.0, hl: 8.6e7, mode: "ec", p: { z: 25, m: 55.0 } }, 
      { m: 56.0, hl: "stable" }, { m: 57.0, hl: "stable" }, { m: 58.0, hl: "stable" },
      { m: 59.0, hl: 3.8e6, mode: "beta-", p: { z: 27, m: 59.0 } }, 
      { m: 60.0, hl: 4.7e13, mode: "beta-", p: { z: 27, m: 60.0 } } 
  ]},
  { z: 27, s: "Co", n: "Cobalt", v: 2, c: "#F090A0", iso: [
      { m: 56.0, hl: 6.7e6, mode: "beta+", p: { z: 26, m: 56.0 } }, 
      { m: 57.0, hl: 2.3e7, mode: "ec", p: { z: 26, m: 57.0 } }, 
      { m: 58.0, hl: 6.1e6, mode: "beta+", p: { z: 26, m: 58.0 } }, 
      { m: 59.0, hl: "stable" },
      { m: 60.0, hl: 1.66e8, mode: "beta-", p: { z: 28, m: 60.0 }, name: "Co-60" } 
  ]},
  { z: 28, s: "Ni", n: "Nickel", v: 2, c: "#50D050", iso: [
      { m: 56.0, hl: 5.2e5, mode: "beta+", p: { z: 27, m: 56.0 } }, 
      { m: 58.0, hl: "stable" },
      { m: 59.0, hl: 2.4e12, mode: "ec", p: { z: 27, m: 59.0 } }, 
      { m: 60.0, hl: "stable" }, { m: 61.0, hl: "stable" }, { m: 62.0, hl: "stable" },
      { m: 63.0, hl: 3.1e9, mode: "beta-", p: { z: 29, m: 63.0 } }, 
      { m: 64.0, hl: "stable" }
  ]},
  { z: 29, s: "Cu", n: "Copper", v: 2, c: "#C88033", iso: [
      { m: 63.0, hl: "stable" },
      { m: 64.0, hl: 45720, mode: "beta+", p: { z: 28, m: 64.0 } }, 
      { m: 65.0, hl: "stable" },
      { m: 67.0, hl: 2.2e5, mode: "beta-", p: { z: 30, m: 67.0 } } 
  ]},
  { z: 30, s: "Zn", n: "Zinc", v: 2, c: "#7D80B0", iso: [
      { m: 64.0, hl: "stable" },
      { m: 65.0, hl: 2.1e7, mode: "ec", p: { z: 29, m: 65.0 } }, 
      { m: 66.0, hl: "stable" }, { m: 67.0, hl: "stable" }, { m: 68.0, hl: "stable" }, { m: 70.0, hl: "stable" }
  ]},
  { z: 31, s: "Ga", n: "Gallium", v: 3, c: "#C28F8F", iso: [
      { m: 67.0, hl: 2.8e5, mode: "ec", p: { z: 30, m: 67.0 } }, 
      { m: 69.0, hl: "stable" },
      { m: 71.0, hl: "stable" }
  ]},
  { z: 32, s: "Ge", n: "Germanium", v: 4, c: "#668F8F", iso: [
      { m: 68.0, hl: 2.3e7, mode: "ec", p: { z: 31, m: 68.0 } }, 
      { m: 70.0, hl: "stable" }, { m: 72.0, hl: "stable" }, { m: 73.0, hl: "stable" }, { m: 74.0, hl: "stable" }, { m: 76.0, hl: "stable" }
  ]},
  { z: 33, s: "As", n: "Arsenic", v: 5, c: "#BD80E3", iso: [
      { m: 73.0, hl: 6.9e6, mode: "ec", p: { z: 32, m: 73.0 } }, 
      { m: 74.0, hl: 1.5e6, mode: "beta-", p: { z: 34, m: 74.0 } }, 
      { m: 75.0, hl: "stable" }
  ]},
  { z: 34, s: "Se", n: "Selenium", v: 6, c: "#FFA100", iso: [
      { m: 74.0, hl: "stable" },
      { m: 75.0, hl: 1.0e7, mode: "ec", p: { z: 33, m: 75.0 } }, 
      { m: 76.0, hl: "stable" }, { m: 77.0, hl: "stable" }, { m: 78.0, hl: "stable" },
      { m: 79.0, hl: 1e13, mode: "beta-", p: { z: 35, m: 79.0 } }, 
      { m: 80.0, hl: "stable" }, { m: 82.0, hl: "stable" }
  ]},
  { z: 35, s: "Br", n: "Bromine", v: 7, c: "#A62929", iso: [
      { m: 77.0, hl: 2e5, mode: "beta+", p: { z: 34, m: 77.0 } }, 
      { m: 79.0, hl: "stable" },
      { m: 81.0, hl: "stable" },
      { m: 82.0, hl: 1.2e5, mode: "beta-", p: { z: 36, m: 82.0 } } 
  ]},
  { z: 36, s: "Kr", n: "Krypton", v: 2, c: "#5CB8D1", iso: [
      { m: 78.0, hl: "stable" },
      { m: 79.0, hl: 1.2e5, mode: "ec", p: { z: 35, m: 79.0 } }, 
      { m: 80.0, hl: "stable" },
      { m: 81.0, hl: 7.2e12, mode: "ec", p: { z: 35, m: 81.0 } }, 
      { m: 82.0, hl: "stable" }, { m: 83.0, hl: "stable" }, { m: 84.0, hl: "stable" },
      { m: 85.0, hl: 3.3e8, mode: "beta-", p: { z: 37, m: 85.0 } }, 
      { m: 86.0, hl: "stable" }
  ]},
  // --- PERIOD 5 ---
  { z: 37, s: "Rb", n: "Rubidium", v: 1, c: "#702EB0", iso: [{ m: 85.0, hl: "stable" }] },
  { z: 38, s: "Sr", n: "Strontium", v: 2, c: "#00FF00", iso: [{ m: 88.0, hl: "stable" }] },
  { z: 39, s: "Y", n: "Yttrium", v: 3, c: "#94FFFF", iso: [{ m: 89.0, hl: "stable" }] },
  { z: 40, s: "Zr", n: "Zirconium", v: 4, c: "#94E0E0", iso: [{ m: 91.0, hl: "stable" }] },
  { z: 41, s: "Nb", n: "Niobium", v: 5, c: "#73C2C9", iso: [{ m: 93.0, hl: "stable" }] },
  { z: 42, s: "Mo", n: "Molybdenum", v: 6, c: "#54B5B5", iso: [{ m: 96.0, hl: "stable" }] },
  { z: 43, s: "Tc", n: "Technetium", v: 7, c: "#3B9E9E", iso: [{ m: 98.0, hl: 4.2e6 }] },
  { z: 44, s: "Ru", n: "Ruthenium", v: 8, c: "#248F8F", iso: [{ m: 101.0, hl: "stable" }] },
  { z: 45, s: "Rh", n: "Rhodium", v: 3, c: "#0A7D8C", iso: [{ m: 103.0, hl: "stable" }] },
  { z: 46, s: "Pd", n: "Palladium", v: 2, c: "#006985", iso: [{ m: 106.0, hl: "stable" }] },
  { z: 47, s: "Ag", n: "Silver", v: 1, c: "#C0C0C0", iso: [{ m: 108.0, hl: "stable" }] },
  { z: 48, s: "Cd", n: "Cadmium", v: 2, c: "#FFD98F", iso: [{ m: 112.0, hl: "stable" }] },
  { z: 49, s: "In", n: "Indium", v: 3, c: "#A67573", iso: [{ m: 115.0, hl: "stable" }] },
  { z: 50, s: "Sn", n: "Tin", v: 4, c: "#668080", iso: [{ m: 119.0, hl: "stable" }] },
  { z: 51, s: "Sb", n: "Antimony", v: 5, c: "#9E63B5", iso: [{ m: 122.0, hl: "stable" }] },
  { z: 52, s: "Te", n: "Tellurium", v: 6, c: "#D47A00", iso: [{ m: 128.0, hl: "stable" }] },
  { z: 53, s: "I", n: "Iodine", v: 7, c: "#940094", iso: [{ m: 127.0, hl: "stable" }] },
  { z: 54, s: "Xe", n: "Xenon", v: 0, c: "#429EB0", iso: [{ m: 131.0, hl: "stable" }] },
  
  // --- PERIOD 6 ---
  { z: 55, s: "Cs", n: "Cesium", v: 1, c: "#57178F", iso: [{ m: 133.0, hl: "stable" }] },
  { z: 56, s: "Ba", n: "Barium", v: 2, c: "#00C900", iso: [{ m: 137.0, hl: "stable" }] },
  // Lanthanides
  { z: 57, s: "La", n: "Lanthanum", v: 3, c: "#70D4FF", iso: [{ m: 139.0, hl: "stable" }] },
  { z: 58, s: "Ce", n: "Cerium", v: 3, c: "#FFFFC7", iso: [{ m: 140.0, hl: "stable" }] },
  { z: 59, s: "Pr", n: "Praseodymium", v: 3, c: "#D9FFC7", iso: [{ m: 141.0, hl: "stable" }] },
  { z: 60, s: "Nd", n: "Neodymium", v: 3, c: "#C7FFC7", iso: [{ m: 144.0, hl: "stable" }] },
  { z: 61, s: "Pm", n: "Promethium", v: 3, c: "#A3FFC7", iso: [{ m: 145.0, hl: 17.7 }] },
  { z: 62, s: "Sm", n: "Samarium", v: 3, c: "#8FFFC7", iso: [{ m: 150.0, hl: "stable" }] },
  { z: 63, s: "Eu", n: "Europium", v: 2, c: "#61FFC7", iso: [{ m: 152.0, hl: "stable" }] },
  { z: 64, s: "Gd", n: "Gadolinium", v: 3, c: "#45FFC7", iso: [{ m: 157.0, hl: "stable" }] },
  { z: 65, s: "Tb", n: "Terbium", v: 3, c: "#30FFC7", iso: [{ m: 159.0, hl: "stable" }] },
  { z: 66, s: "Dy", n: "Dysprosium", v: 3, c: "#1FFFC7", iso: [{ m: 162.0, hl: "stable" }] },
  { z: 67, s: "Ho", n: "Holmium", v: 3, c: "#00FF9C", iso: [{ m: 165.0, hl: "stable" }] },
  { z: 68, s: "Er", n: "Erbium", v: 3, c: "#00E675", iso: [{ m: 167.0, hl: "stable" }] },
  { z: 69, s: "Tm", n: "Thulium", v: 3, c: "#00D452", iso: [{ m: 169.0, hl: "stable" }] },
  { z: 70, s: "Yb", n: "Ytterbium", v: 2, c: "#00BF38", iso: [{ m: 173.0, hl: "stable" }] },
  { z: 71, s: "Lu", n: "Lutetium", v: 3, c: "#00AB24", iso: [{ m: 175.0, hl: "stable" }] },
  
  // Period 6 Continued
  { z: 72, s: "Hf", n: "Hafnium", v: 4, c: "#4DC2FF", iso: [{ m: 178.0, hl: "stable" }] },
  { z: 73, s: "Ta", n: "Tantalum", v: 5, c: "#4DA6FF", iso: [{ m: 181.0, hl: "stable" }] },
  { z: 74, s: "W", n: "Tungsten", v: 6, c: "#2194D6", iso: [{ m: 184.0, hl: "stable" }] },
  { z: 75, s: "Re", n: "Rhenium", v: 7, c: "#267DAB", iso: [{ m: 186.0, hl: "stable" }] },
  { z: 76, s: "Os", n: "Osmium", v: 8, c: "#266696", iso: [{ m: 190.0, hl: "stable" }] },
  { z: 77, s: "Ir", n: "Iodine", v: 4, c: "#175487", iso: [{ m: 192.0, hl: "stable" }] },
  { z: 78, s: "Pt", n: "Platinum", v: 4, c: "#D0D0E0", iso: [{ m: 195.0, hl: "stable" }] },
  { z: 79, s: "Au", n: "Gold", v: 3, c: "#FFD123", iso: [{ m: 197.0, hl: "stable" }] },
  { z: 80, s: "Hg", n: "Mercury", v: 2, c: "#B8B8D0", iso: [{ m: 200.0, hl: "stable" }] },
  { z: 81, s: "Tl", n: "Thallium", v: 1, c: "#A6544D", iso: [{ m: 204.0, hl: "stable" }] },
  { z: 82, s: "Pb", n: "Lead", v: 4, c: "#575961", iso: [{ m: 207.0, hl: "stable" }] },
  { z: 83, s: "Bi", n: "Bismuth", v: 3, c: "#9E4FB5", iso: [{ m: 209.0, hl: "stable" }] },
  { z: 84, s: "Po", n: "Polonium", v: 2, c: "#AB5C00", iso: [{ m: 209.0, hl: 100 }] },
  { z: 85, s: "At", n: "Astatine", v: 1, c: "#754F45", iso: [{ m: 210.0, hl: 8.1 }] },
  { z: 86, s: "Rn", n: "Radon", v: 0, c: "#428296", iso: [{ m: 222.0, hl: 3.8 }] },

  // --- PERIOD 7 ---
  { z: 87, s: "Fr", n: "Francium", v: 1, c: "#420066", iso: [{ m: 223.0, hl: 0.01 }] },
  { z: 88, s: "Ra", n: "Radium", v: 2, c: "#007D00", iso: [{ m: 226.0, hl: 1600 }] },
  // Actinides
  { z: 89, s: "Ac", n: "Actinium", v: 3, c: "#70ABFA", iso: [{ m: 227.0, hl: 21.7 }] },
  
  // Thorium
  { z: 90, s: "Th", n: "Thorium", v: 4, c: "#00BAFF", iso: [
      { m: 232.0, hl: 4.43e17, mode: "sf" }, // Th-232
      { m: 230.0, hl: 2.38e12, mode: "sf" }  // Th-230
  ]},
  
  // Protactinium
  { z: 91, s: "Pa", n: "Protactinium", v: 5, c: "#00A1FF", iso: [
      { m: 231.0, hl: 1.03e12, mode: "sf" }
  ]},
  
  // Uranium
  { z: 92, s: "U", n: "Uranium", v: 6, c: "#008FFF", iso: [
      { m: 238.0, hl: 1.41e17, mode: "sf" }, 
      { m: 235.0, hl: 2.22e16, mode: "sf" },
      { m: 233.0, hl: 5.02e12, mode: "sf" },
      { m: 234.0, hl: 7.75e12, mode: "sf" },
      { m: 236.0, hl: 7.39e14, mode: "sf" },
      { m: 232.0, hl: 2.17e9, mode: "sf" }
  ]},
  
  // Neptunium
  { z: 93, s: "Np", n: "Neptunium", v: 6, c: "#0080FF", iso: [
      { m: 237.0, hl: 6.77e13, mode: "sf" }
  ]},
  
  // Plutonium
  { z: 94, s: "Pu", n: "Plutonium", v: 6, c: "#006BFF", iso: [
      { m: 244.0, hl: 2.52e15, mode: "sf" },
      { m: 239.0, hl: 7.61e11, mode: "sf" },
      { m: 240.0, hl: 2.07e11, mode: "sf" },
      { m: 238.0, hl: 2.77e9, mode: "sf" },
      { m: 242.0, hl: 1.18e13, mode: "sf" },
      { m: 241.0, hl: 4.51e8, mode: "sf" }
  ]},
  
  // Americium
  { z: 95, s: "Am", n: "Americium", v: 3, c: "#545CF2", iso: [
      { m: 243.0, hl: 2.33e11, mode: "sf" },
      { m: 241.0, hl: 1.37e10, mode: "sf" }
  ]},
  
  // Curium
  { z: 96, s: "Cm", n: "Curium", v: 3, c: "#785CE3", iso: [
      { m: 247.0, hl: 1.5e7 }, // Existing
      { m: 248.0, hl: 1.10e13, mode: "sf" },
      { m: 250.0, hl: 2.62e11, mode: "sf" },
      { m: 245.0, hl: 2.68e11, mode: "sf" },
      { m: 246.0, hl: 1.49e11, mode: "sf" },
      { m: 243.0, hl: 9.18e8, mode: "sf" },
      { m: 244.0, hl: 5.71e8, mode: "sf" },
      { m: 242.0, hl: 1.41e7, mode: "sf" }
  ]},
  
  // Berkelium
  { z: 97, s: "Bk", n: "Berkelium", v: 3, c: "#8A4FE3", iso: [
      { m: 247.0, hl: 1380 }, // Existing
      { m: 249.0, hl: 2.85e7, mode: "sf" }
  ]},
  
  // Californium
  { z: 98, s: "Cf", n: "Californium", v: 3, c: "#A136D4", iso: [
      { m: 251.0, hl: 900 }, // Existing
      { m: 249.0, hl: 1.11e10, mode: "sf" },
      { m: 250.0, hl: 4.13e8, mode: "sf" },
      { m: 252.0, hl: 8.35e7, mode: "sf" },
      { m: 248.0, hl: 2.88e7, mode: "sf" },
      { m: 254.0, hl: 5.23e6, mode: "sf" },
      { m: 246.0, hl: 1.29e5, mode: "sf" },
      { m: 256.0, hl: 738, mode: "sf" }
  ]},
  
  // Einsteinium
  { z: 99, s: "Es", n: "Einsteinium", v: 3, c: "#B31FD4", iso: [
      { m: 252.0, hl: 1.2 }, // Existing
      { m: 254.0, hl: 2.38e7, mode: "sf" },
      { m: 255.0, hl: 3.44e6, mode: "sf" },
      { m: 253.0, hl: 1.77e6, mode: "sf" }
  ]},
  
  // Fermium
  { z: 100, s: "Fm", n: "Fermium", v: 3, c: "#B31FBA", iso: [
      { m: 257.0, hl: 8.68e6, mode: "sf" },
      { m: 252.0, hl: 9.14e4, mode: "sf" },
      { m: 255.0, hl: 7.24e4, mode: "sf" },
      { m: 254.0, hl: 1.17e4, mode: "sf" },
      { m: 256.0, hl: 9252, mode: "sf" },
      { m: 259.0, hl: 1.5, mode: "sf" },
      { m: 260.0, hl: 0.004, mode: "sf" },
      { m: 242.0, hl: 0.0008, mode: "sf" },
      { m: 258.0, hl: 0.00037, mode: "sf" }
  ]},
  
  // Mendelevium
  { z: 101, s: "Md", n: "Mendelevium", v: 3, c: "#B30DA6", iso: [
      { m: 258.0, hl: 4.45e6, mode: "sf" }
  ]},
  
  // Nobelium
  { z: 102, s: "No", n: "Nobelium", v: 2, c: "#BD0D87", iso: [
      { m: 259.0, hl: 0.9, mode: "alpha", p: { z: 100, m: 255.0 } }, // Existing
      { m: 254.0, hl: 51, mode: "sf" },
      { m: 256.0, hl: 2.9, mode: "sf" },
      { m: 252.0, hl: 2.4, mode: "sf" },
      { m: 258.0, hl: 0.0012, mode: "sf" }
  ]},
  
  // Lawrencium
  { z: 103, s: "Lr", n: "Lawrencium", v: 3, c: "#C70066", iso: [
      { m: 262.0, hl: 12960, mode: "sf" },
      { m: 261.0, hl: 2340, mode: "sf" },
      { m: 260.0, hl: 180, mode: "sf" },
      { m: 256.0, hl: 27, mode: "sf" },
      { m: 255.0, hl: 22, mode: "sf" },
      { m: 254.0, hl: 13, mode: "sf" },
      { m: 259.0, hl: 6.2, mode: "sf" },
      { m: 258.0, hl: 3.9, mode: "sf" },
      { m: 257.0, hl: 0.6, mode: "sf" },
      { m: 253.0, hl: 0.57, mode: "sf" }
  ]},
  
  // Period 7 Continued (Transactinides)
  
  // Rutherfordium (104)
  { z: 104, s: "Rf", n: "Rutherfordium", v: 4, c: "#CC0059", iso: [
      { m: 263.0, hl: 900, mode: "sf" },
      { m: 261.0, hl: 78, mode: "sf" },
      { m: 262.0, hl: 2.1, mode: "sf" },
      { m: 255.0, hl: 1.64, mode: "sf" },
      { m: 260.0, hl: 0.021, mode: "sf" },
      { m: 253.0, hl: 0.013, mode: "sf" },
      { m: 258.0, hl: 0.012, mode: "sf" },
      { m: 256.0, hl: 0.0064, mode: "sf" },
      { m: 254.0, hl: 0.000023, mode: "sf" }
  ]},
  
  // Dubnium (105)
  { z: 105, s: "Db", n: "Dubnium", v: 5, c: "#D1004F", iso: [
      { m: 268.0, hl: 108000 }, // Existing (30h?)
      { m: 267.0, hl: 4320, mode: "sf" },
      { m: 263.0, hl: 27, mode: "sf" }
  ]},
  
  // Seaborgium (106)
  { z: 106, s: "Sg", n: "Seaborgium", v: 6, c: "#D90045", iso: [
      { m: 271.0, hl: 144, mode: "sf" },
      { m: 261.0, hl: 0.23, mode: "sf" },
      { m: 258.0, hl: 0.0029, mode: "sf" }
  ]},
  
  // Bohrium (107)
  { z: 107, s: "Bh", n: "Bohrium", v: 7, c: "#E00038", iso: [
      { m: 270.0, hl: 61, mode: "sf" },
      { m: 274.0, hl: 54, mode: "sf" },
      { m: 267.0, hl: 17, mode: "sf" },
      { m: 272.0, hl: 9.8, mode: "sf" }
  ]},
  
  // Hassium (108)
  { z: 108, s: "Hs", n: "Hassium", v: 8, c: "#E6002E", iso: [
      { m: 269.0, hl: 9.7, mode: "sf" },
      { m: 270.0, hl: 3.6, mode: "sf" },
      { m: 271.0, hl: 40, mode: "sf" },
      { m: 273.0, hl: 76, mode: "sf" },
      { m: 277.0, hl: 240, mode: "sf" }
  ]},
  
  // Meitnerium (109)
  { z: 109, s: "Mt", n: "Meitnerium", v: 0, c: "#EB0026", iso: [
      { m: 278.0, hl: 4.5, mode: "sf" },
      { m: 276.0, hl: 0.7, mode: "sf" },
      { m: 274.0, hl: 0.4, mode: "sf" }
  ]},
  
  // Darmstadtium (110)
  { z: 110, s: "Ds", n: "Darmstadtium", v: 0, c: "#EB0026", iso: [
      { m: 281.0, hl: 13, mode: "sf" },
      { m: 279.0, hl: 0.18, mode: "sf" }
  ]},
  
  // Roentgenium (111)
  { z: 111, s: "Rg", n: "Roentgenium", v: 0, c: "#EB0026", iso: [
      { m: 281.0, hl: 26, mode: "sf" },
      { m: 280.0, hl: 3.6, mode: "sf" },
      { m: 282.0, hl: 0.5, mode: "sf" }
  ]},
  
  // Copernicium (112)
  { z: 112, s: "Cn", n: "Copernicium", v: 2, c: "#EB0026", iso: [
      { m: 285.0, hl: 29, mode: "sf" },
      { m: 283.0, hl: 4, mode: "sf" }
  ]},
  
  // Nihonium (113)
  { z: 113, s: "Nh", n: "Nihonium", v: 3, c: "#EB0026", iso: [
      { m: 286.0, hl: 19.6, mode: "sf" },
      { m: 285.0, hl: 5.5, mode: "sf" }
  ]},
  
  // Flerovium (114)
  { z: 114, s: "Fl", n: "Flerovium", v: 4, c: "#EB0026", iso: [
      { m: 289.0, hl: 2.6, mode: "sf" },
      { m: 288.0, hl: 0.8, mode: "sf" },
      { m: 286.0, hl: 0.1, mode: "sf" }
  ]},
  
  // Moscovium (115)
  { z: 115, s: "Mc", n: "Moscovium", v: 5, c: "#EB0026", iso: [
      { m: 290.0, hl: 0.6, mode: "sf" },
      { m: 289.0, hl: 0.22, mode: "sf" },
      { m: 288.0, hl: 0.16, mode: "sf" }
  ]},
  
  // Livermorium (116)
  { z: 116, s: "Lv", n: "Livermorium", v: 6, c: "#EB0026", iso: [
      { m: 293.0, hl: 0.053, mode: "sf" },
      { m: 292.0, hl: 0.018, mode: "sf" }
  ]},
  
  // Tennessine (117)
  { z: 117, s: "Ts", n: "Tennessine", v: 7, c: "#EB0026", iso: [
      { m: 294.0, hl: 0.07, mode: "sf" },
      { m: 293.0, hl: 0.022, mode: "sf" }
  ]},
  
  // Oganesson (118)
  { z: 118, s: "Og", n: "Oganesson", v: 8, c: "#FF0000", iso: [
      { m: 294.0, hl: 0.0007, mode: "sf" }
  ]}
];
