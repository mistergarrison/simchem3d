import { ElementData } from './types';

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
    iso: [{ m: 0.0005, hl: "stable" }]
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
      { m: 6.018, hl: 0.8, mode: "beta-", p: { z: 3, m: 6.018 } } // Borderline <1s, usually excluded but ~0.8s is close
  ]},

  // --- PERIOD 2 ---
  { z: 3, s: "Li", n: "Lithium", v: 1, c: "#CC80FF", iso: [
      { m: 6.0, hl: "stable" }, { m: 7.0, hl: "stable" }
      // Li-8 is 0.8s (Excluded < 1s)
  ]},
  { z: 4, s: "Be", n: "Beryllium", v: 2, c: "#C2FF00", iso: [
      { m: 7.0, hl: 4.56e6, mode: "ec", p: { z: 3, m: 7.0 } }, // 53 days
      { m: 9.0, hl: "stable" },
      { m: 10.0, hl: 4.7e13, mode: "beta-", p: { z: 5, m: 10.0 } } // 1.51 My
  ]},
  { z: 5, s: "B", n: "Boron", v: 3, c: "#FFB5B5", iso: [
      { m: 10.0, hl: "stable" }, { m: 11.0, hl: "stable" }
  ]},
  { z: 6, s: "C", n: "Carbon", v: 4, c: "#909090", iso: [
      { m: 10.0, hl: 19.3, mode: "beta+", p: { z: 5, m: 10.0 } },
      { m: 11.0, hl: 1221, mode: "beta+", p: { z: 5, m: 11.0 } }, // 20 min
      { m: 12.0, hl: "stable" },
      { m: 13.0, hl: "stable" },
      { m: 14.0, hl: 1.8e11, mode: "beta-", p: { z: 7, m: 14.0 }, name: "C-14" } // 5730y
  ]},
  { z: 7, s: "N", n: "Nitrogen", v: 3, c: "#3050F8", iso: [
      { m: 13.0, hl: 598, mode: "beta+", p: { z: 6, m: 13.0 } }, // 10 min
      { m: 14.0, hl: "stable" }, { m: 15.0, hl: "stable" }
  ]},
  { z: 8, s: "O", n: "Oxygen", v: 2, c: "#FF0D0D", iso: [
      { m: 15.0, hl: 122, mode: "beta+", p: { z: 7, m: 15.0 } },
      { m: 16.0, hl: "stable" }, { m: 17.0, hl: "stable" }, { m: 18.0, hl: "stable" }
  ]},
  { z: 9, s: "F", n: "Fluorine", v: 1, c: "#90E050", iso: [
      { m: 18.0, hl: 6586, mode: "beta+", p: { z: 8, m: 18.0 } }, // ~110 min
      { m: 19.0, hl: "stable" }
  ]},
  { z: 10, s: "Ne", n: "Neon", v: 0, c: "#B3E3F5", iso: [
      { m: 19.0, hl: 17.2, mode: "beta+", p: { z: 9, m: 19.0 } },
      { m: 20.0, hl: "stable" }, { m: 21.0, hl: "stable" }, { m: 22.0, hl: "stable" }
  ]},

  // --- PERIOD 3 ---
  { z: 11, s: "Na", n: "Sodium", v: 1, c: "#AB5CF2", iso: [
      { m: 22.0, hl: 8.2e7, mode: "beta+", p: { z: 10, m: 22.0 } }, // 2.6y
      { m: 23.0, hl: "stable" },
      { m: 24.0, hl: 54000, mode: "beta-", p: { z: 12, m: 24.0 } } // 15h
  ]},
  { z: 12, s: "Mg", n: "Magnesium", v: 2, c: "#8AFF00", iso: [
      { m: 24.0, hl: "stable" }, { m: 25.0, hl: "stable" }, { m: 26.0, hl: "stable" },
      { m: 28.0, hl: 75240, mode: "beta-", p: { z: 13, m: 28.0 } } // 21h
  ]},
  { z: 13, s: "Al", n: "Aluminium", v: 3, c: "#BFA6A6", iso: [
      { m: 26.0, hl: 2.3e13, mode: "beta+", p: { z: 12, m: 26.0 } }, // 7e5 y
      { m: 27.0, hl: "stable" }
  ]},
  { z: 14, s: "Si", n: "Silicon", v: 4, c: "#F0C8A0", iso: [
      { m: 28.0, hl: "stable" }, { m: 29.0, hl: "stable" }, { m: 30.0, hl: "stable" },
      { m: 31.0, hl: 9480, mode: "beta-", p: { z: 15, m: 31.0 } }, // 2.6h
      { m: 32.0, hl: 4.8e9, mode: "beta-", p: { z: 15, m: 32.0 } } // ~150y
  ]},
  { z: 15, s: "P", n: "Phosphorus", v: 5, c: "#FF8000", iso: [
      { m: 30.0, hl: 150, mode: "beta+", p: { z: 14, m: 30.0 } },
      { m: 31.0, hl: "stable" },
      { m: 32.0, hl: 1.2e6, mode: "beta-", p: { z: 16, m: 32.0 } }, // 14.2d
      { m: 33.0, hl: 2.2e6, mode: "beta-", p: { z: 16, m: 33.0 } } // 25d
  ]},
  { z: 16, s: "S", n: "Sulfur", v: 6, c: "#FFFF30", iso: [
      { m: 32.0, hl: "stable" }, { m: 33.0, hl: "stable" }, { m: 34.0, hl: "stable" },
      { m: 35.0, hl: 7.5e6, mode: "beta-", p: { z: 17, m: 35.0 } }, // 87d
      { m: 36.0, hl: "stable" }
  ]},
  { z: 17, s: "Cl", n: "Chlorine", v: 7, c: "#1FF01F", iso: [
      { m: 35.0, hl: "stable" },
      { m: 36.0, hl: 9.5e12, mode: "beta-", p: { z: 18, m: 36.0 } }, // 301 ky
      { m: 37.0, hl: "stable" }
  ]},
  { z: 18, s: "Ar", n: "Argon", v: 0, c: "#80D1E3", iso: [
      { m: 36.0, hl: "stable" },
      { m: 37.0, hl: 3e6, mode: "ec", p: { z: 17, m: 37.0 } }, // 35d
      { m: 38.0, hl: "stable" },
      { m: 39.0, hl: 8.5e9, mode: "beta-", p: { z: 19, m: 39.0 } }, // 269y
      { m: 40.0, hl: "stable" },
      { m: 42.0, hl: 1e9, mode: "beta-", p: { z: 19, m: 42.0 } } // 33y
  ]},

  // --- PERIOD 4 ---
  { z: 19, s: "K", n: "Potassium", v: 1, c: "#8F40D4", iso: [
      { m: 39.0, hl: "stable" },
      { m: 40.0, hl: 3.9e16, mode: "beta-", p: { z: 20, m: 40.0 }, name: "K-40" }, // 1.25 Gy
      { m: 41.0, hl: "stable" }
  ]},
  { z: 20, s: "Ca", n: "Calcium", v: 2, c: "#3DFF00", iso: [
      { m: 40.0, hl: "stable" },
      { m: 41.0, hl: 3.1e12, mode: "ec", p: { z: 19, m: 41.0 } }, // 100ky
      { m: 42.0, hl: "stable" }, { m: 43.0, hl: "stable" }, { m: 44.0, hl: "stable" },
      { m: 45.0, hl: 1.4e7, mode: "beta-", p: { z: 21, m: 45.0 } }, // 163d
      { m: 46.0, hl: "stable" },
      { m: 48.0, hl: 1.9e27, mode: "beta-", p: { z: 22, m: 48.0 } } // Double beta, practicall stable
  ]},
  { z: 21, s: "Sc", n: "Scandium", v: 3, c: "#E6E6E6", iso: [
      { m: 45.0, hl: "stable" },
      { m: 46.0, hl: 7.2e6, mode: "beta-", p: { z: 22, m: 46.0 } } // 83d
  ]},
  { z: 22, s: "Ti", n: "Titanium", v: 4, c: "#BFC2C7", iso: [
      { m: 44.0, hl: 1.9e9, mode: "ec", p: { z: 21, m: 44.0 } }, // 60y
      { m: 46.0, hl: "stable" }, { m: 47.0, hl: "stable" }, { m: 48.0, hl: "stable" }, { m: 49.0, hl: "stable" }, { m: 50.0, hl: "stable" }
  ]},
  { z: 23, s: "V", n: "Vanadium", v: 5, c: "#A6A6AB", iso: [
      { m: 49.0, hl: 2.8e7, mode: "ec", p: { z: 22, m: 49.0 } }, // 330d
      { m: 50.0, hl: 4.4e24, mode: "beta-", p: { z: 24, m: 50.0 } }, // 1.4e17y
      { m: 51.0, hl: "stable" }
  ]},
  { z: 24, s: "Cr", n: "Chromium", v: 6, c: "#8A99C7", iso: [
      { m: 50.0, hl: "stable" },
      { m: 51.0, hl: 2.4e6, mode: "ec", p: { z: 23, m: 51.0 } }, // 27d
      { m: 52.0, hl: "stable" }, { m: 53.0, hl: "stable" }, { m: 54.0, hl: "stable" }
  ]},
  { z: 25, s: "Mn", n: "Manganese", v: 7, c: "#9C7AC7", iso: [
      { m: 53.0, hl: 1.1e14, mode: "ec", p: { z: 24, m: 53.0 } }, // 3.7 My
      { m: 54.0, hl: 2.7e7, mode: "ec", p: { z: 24, m: 54.0 } }, // 312d
      { m: 55.0, hl: "stable" }
  ]},
  { z: 26, s: "Fe", n: "Iron", v: 3, c: "#E06633", iso: [
      { m: 54.0, hl: "stable" },
      { m: 55.0, hl: 8.6e7, mode: "ec", p: { z: 25, m: 55.0 } }, // 2.7y
      { m: 56.0, hl: "stable" }, { m: 57.0, hl: "stable" }, { m: 58.0, hl: "stable" },
      { m: 59.0, hl: 3.8e6, mode: "beta-", p: { z: 27, m: 59.0 } }, // 44d
      { m: 60.0, hl: 4.7e13, mode: "beta-", p: { z: 27, m: 60.0 } } // 1.5 My
  ]},
  { z: 27, s: "Co", n: "Cobalt", v: 2, c: "#F090A0", iso: [
      { m: 56.0, hl: 6.7e6, mode: "beta+", p: { z: 26, m: 56.0 } }, // 77d
      { m: 57.0, hl: 2.3e7, mode: "ec", p: { z: 26, m: 57.0 } }, // 271d
      { m: 58.0, hl: 6.1e6, mode: "beta+", p: { z: 26, m: 58.0 } }, // 70d
      { m: 59.0, hl: "stable" },
      { m: 60.0, hl: 1.66e8, mode: "beta-", p: { z: 28, m: 60.0 }, name: "Co-60" } // 5.27y
  ]},
  { z: 28, s: "Ni", n: "Nickel", v: 2, c: "#50D050", iso: [
      { m: 56.0, hl: 5.2e5, mode: "beta+", p: { z: 27, m: 56.0 } }, // 6d
      { m: 58.0, hl: "stable" },
      { m: 59.0, hl: 2.4e12, mode: "ec", p: { z: 27, m: 59.0 } }, // 76ky
      { m: 60.0, hl: "stable" }, { m: 61.0, hl: "stable" }, { m: 62.0, hl: "stable" },
      { m: 63.0, hl: 3.1e9, mode: "beta-", p: { z: 29, m: 63.0 } }, // 100y
      { m: 64.0, hl: "stable" }
  ]},
  { z: 29, s: "Cu", n: "Copper", v: 2, c: "#C88033", iso: [
      { m: 63.0, hl: "stable" },
      { m: 64.0, hl: 45720, mode: "beta+", p: { z: 28, m: 64.0 } }, // 12.7h
      { m: 65.0, hl: "stable" },
      { m: 67.0, hl: 2.2e5, mode: "beta-", p: { z: 30, m: 67.0 } } // 61h
  ]},
  { z: 30, s: "Zn", n: "Zinc", v: 2, c: "#7D80B0", iso: [
      { m: 64.0, hl: "stable" },
      { m: 65.0, hl: 2.1e7, mode: "ec", p: { z: 29, m: 65.0 } }, // 244d
      { m: 66.0, hl: "stable" }, { m: 67.0, hl: "stable" }, { m: 68.0, hl: "stable" }, { m: 70.0, hl: "stable" }
  ]},
  { z: 31, s: "Ga", n: "Gallium", v: 3, c: "#C28F8F", iso: [
      { m: 67.0, hl: 2.8e5, mode: "ec", p: { z: 30, m: 67.0 } }, // 3.2d
      { m: 69.0, hl: "stable" },
      { m: 71.0, hl: "stable" }
  ]},
  { z: 32, s: "Ge", n: "Germanium", v: 4, c: "#668F8F", iso: [
      { m: 68.0, hl: 2.3e7, mode: "ec", p: { z: 31, m: 68.0 } }, // 270d
      { m: 70.0, hl: "stable" }, { m: 72.0, hl: "stable" }, { m: 73.0, hl: "stable" }, { m: 74.0, hl: "stable" }, { m: 76.0, hl: "stable" }
  ]},
  { z: 33, s: "As", n: "Arsenic", v: 5, c: "#BD80E3", iso: [
      { m: 73.0, hl: 6.9e6, mode: "ec", p: { z: 32, m: 73.0 } }, // 80d
      { m: 74.0, hl: 1.5e6, mode: "beta-", p: { z: 34, m: 74.0 } }, // 17d
      { m: 75.0, hl: "stable" }
  ]},
  { z: 34, s: "Se", n: "Selenium", v: 6, c: "#FFA100", iso: [
      { m: 74.0, hl: "stable" },
      { m: 75.0, hl: 1.0e7, mode: "ec", p: { z: 33, m: 75.0 } }, // 119d
      { m: 76.0, hl: "stable" }, { m: 77.0, hl: "stable" }, { m: 78.0, hl: "stable" },
      { m: 79.0, hl: 1e13, mode: "beta-", p: { z: 35, m: 79.0 } }, // 327 ky
      { m: 80.0, hl: "stable" }, { m: 82.0, hl: "stable" }
  ]},
  { z: 35, s: "Br", n: "Bromine", v: 7, c: "#A62929", iso: [
      { m: 77.0, hl: 2e5, mode: "beta+", p: { z: 34, m: 77.0 } }, // 57h
      { m: 79.0, hl: "stable" },
      { m: 81.0, hl: "stable" },
      { m: 82.0, hl: 1.2e5, mode: "beta-", p: { z: 36, m: 82.0 } } // 35h
  ]},
  { z: 36, s: "Kr", n: "Krypton", v: 2, c: "#5CB8D1", iso: [
      { m: 78.0, hl: "stable" },
      { m: 79.0, hl: 1.2e5, mode: "ec", p: { z: 35, m: 79.0 } }, // 35h
      { m: 80.0, hl: "stable" },
      { m: 81.0, hl: 7.2e12, mode: "ec", p: { z: 35, m: 81.0 } }, // 229 ky
      { m: 82.0, hl: "stable" }, { m: 83.0, hl: "stable" }, { m: 84.0, hl: "stable" },
      { m: 85.0, hl: 3.3e8, mode: "beta-", p: { z: 37, m: 85.0 } }, // 10.7y
      { m: 86.0, hl: "stable" }
  ]},

  // --- PERIOD 5 ---
  { z: 37, s: "Rb", n: "Rubidium", v: 1, c: "#702EB0", iso: [
      { m: 83.0, hl: 7.4e6, mode: "ec", p: { z: 36, m: 83.0 } }, // 86d
      { m: 85.0, hl: "stable" },
      { m: 87.0, hl: 1.5e18, mode: "beta-", p: { z: 38, m: 87.0 } } // 49 Gy
  ]},
  { z: 38, s: "Sr", n: "Strontium", v: 2, c: "#00FF00", iso: [
      { m: 84.0, hl: "stable" },
      { m: 85.0, hl: 5.6e6, mode: "ec", p: { z: 37, m: 85.0 } }, // 64d
      { m: 86.0, hl: "stable" }, { m: 87.0, hl: "stable" }, { m: 88.0, hl: "stable" },
      { m: 89.0, hl: 4.3e6, mode: "beta-", p: { z: 39, m: 89.0 } }, // 50d
      { m: 90.0, hl: 9.1e8, mode: "beta-", p: { z: 39, m: 90.0 }, name: "Sr-90" } // 28.9y
  ]},
  { z: 39, s: "Y", n: "Yttrium", v: 3, c: "#94FFFF", iso: [
      { m: 88.0, hl: 9.1e6, mode: "beta+", p: { z: 38, m: 88.0 } }, // 106d
      { m: 89.0, hl: "stable" },
      { m: 90.0, hl: 2.3e5, mode: "beta-", p: { z: 40, m: 90.0 } }, // 64h
      { m: 91.0, hl: 5.0e6, mode: "beta-", p: { z: 40, m: 91.0 } } // 58d
  ]},
  { z: 40, s: "Zr", n: "Zirconium", v: 4, c: "#94E0E0", iso: [
      { m: 88.0, hl: 7.2e6, mode: "ec", p: { z: 39, m: 88.0 } }, // 83d
      { m: 90.0, hl: "stable" }, { m: 91.0, hl: "stable" }, { m: 92.0, hl: "stable" },
      { m: 93.0, hl: 4.8e13, mode: "beta-", p: { z: 41, m: 93.0 } }, // 1.5 My
      { m: 94.0, hl: "stable" }, { m: 96.0, hl: "stable" }
  ]},
  { z: 41, s: "Nb", n: "Niobium", v: 5, c: "#73C2C9", iso: [
      { m: 91.0, hl: 2.1e10, mode: "ec", p: { z: 40, m: 91.0 } }, // 680y
      { m: 92.0, hl: 1.1e15, mode: "ec", p: { z: 40, m: 92.0 } }, // 34 My
      { m: 93.0, hl: "stable" },
      { m: 94.0, hl: 6.4e11, mode: "beta-", p: { z: 42, m: 94.0 } } // 20ky
  ]},
  { z: 42, s: "Mo", n: "Molybdenum", v: 6, c: "#54B5B5", iso: [
      { m: 92.0, hl: "stable" },
      { m: 93.0, hl: 1.2e11, mode: "ec", p: { z: 41, m: 93.0 } }, // 4000y
      { m: 94.0, hl: "stable" }, { m: 95.0, hl: "stable" }, { m: 96.0, hl: "stable" }, { m: 97.0, hl: "stable" }, { m: 98.0, hl: "stable" },
      { m: 99.0, hl: 2.3e5, mode: "beta-", p: { z: 43, m: 99.0 } }, // 66h
      { m: 100.0, hl: "stable" }
  ]},
  { z: 43, s: "Tc", n: "Technetium", v: 7, c: "#3B9E9E", iso: [
      { m: 97.0, hl: 1.3e14, mode: "ec", p: { z: 42, m: 97.0 } }, // 4.2 My
      { m: 98.0, hl: 1.3e14, mode: "beta-", p: { z: 44, m: 98.0 } }, // 4.2 My
      { m: 99.0, hl: 6.6e12, mode: "beta-", p: { z: 44, m: 99.0 } } // 211ky
  ]},
  { z: 44, s: "Ru", n: "Ruthenium", v: 3, c: "#248F8F", iso: [
      { m: 96.0, hl: "stable" },
      { m: 97.0, hl: 2.5e5, mode: "ec", p: { z: 43, m: 97.0 } }, // 2.9d
      { m: 98.0, hl: "stable" }, { m: 99.0, hl: "stable" }, { m: 100.0, hl: "stable" }, { m: 101.0, hl: "stable" }, { m: 102.0, hl: "stable" }, { m: 104.0, hl: "stable" },
      { m: 106.0, hl: 3.2e7, mode: "beta-", p: { z: 45, m: 106.0 } } // 373d
  ]},
  { z: 45, s: "Rh", n: "Rhodium", v: 3, c: "#0A7D8C", iso: [
      { m: 101.0, hl: 1e8, mode: "ec", p: { z: 44, m: 101.0 } }, // 3.3y
      { m: 102.0, hl: 1.7e7, mode: "beta-", p: { z: 46, m: 102.0 } }, // 207d
      { m: 103.0, hl: "stable" },
      { m: 105.0, hl: 1.2e5, mode: "beta-", p: { z: 46, m: 105.0 } } // 35h
  ]},
  { z: 46, s: "Pd", n: "Palladium", v: 2, c: "#006985", iso: [
      { m: 102.0, hl: "stable" },
      { m: 103.0, hl: 1.4e6, mode: "ec", p: { z: 45, m: 103.0 } }, // 17d
      { m: 104.0, hl: "stable" }, { m: 105.0, hl: "stable" }, { m: 106.0, hl: "stable" },
      { m: 107.0, hl: 2e14, mode: "beta-", p: { z: 47, m: 107.0 } }, // 6.5 My
      { m: 108.0, hl: "stable" }, { m: 110.0, hl: "stable" }
  ]},
  { z: 47, s: "Ag", n: "Silver", v: 1, c: "#C0C0C0", iso: [
      { m: 105.0, hl: 3.5e6, mode: "ec", p: { z: 46, m: 105.0 } }, // 41d
      { m: 107.0, hl: "stable" },
      { m: 108.0, hl: 1.3e10, mode: "beta-", p: { z: 48, m: 108.0 } }, // 418y (meta)
      { m: 109.0, hl: "stable" },
      { m: 110.0, hl: 2.1e7, mode: "beta-", p: { z: 48, m: 110.0 } }, // 250d (meta)
      { m: 111.0, hl: 6.4e5, mode: "beta-", p: { z: 48, m: 111.0 } } // 7.4d
  ]},
  { z: 48, s: "Cd", n: "Cadmium", v: 2, c: "#FFD98F", iso: [
      { m: 106.0, hl: "stable" }, { m: 108.0, hl: "stable" },
      { m: 109.0, hl: 3.9e7, mode: "ec", p: { z: 47, m: 109.0 } }, // 462d
      { m: 110.0, hl: "stable" }, { m: 111.0, hl: "stable" }, { m: 112.0, hl: "stable" },
      { m: 113.0, hl: 2.4e23, mode: "beta-", p: { z: 49, m: 113.0 } }, // 7e15y
      { m: 114.0, hl: "stable" }, { m: 116.0, hl: "stable" }
  ]},
  { z: 49, s: "In", n: "Indium", v: 3, c: "#A67573", iso: [
      { m: 111.0, hl: 2.4e5, mode: "ec", p: { z: 48, m: 111.0 } }, // 2.8d
      { m: 113.0, hl: "stable" },
      { m: 115.0, hl: 1.3e22, mode: "beta-", p: { z: 50, m: 115.0 } } // 4e14y
  ]},
  { z: 50, s: "Sn", n: "Tin", v: 4, c: "#668080", iso: [
      { m: 112.0, hl: "stable" }, { m: 113.0, hl: 9.9e6, mode: "ec", p: { z: 49, m: 113.0 } }, // 115d
      { m: 114.0, hl: "stable" }, { m: 115.0, hl: "stable" }, { m: 116.0, hl: "stable" }, { m: 117.0, hl: "stable" }, { m: 118.0, hl: "stable" }, { m: 119.0, hl: "stable" }, { m: 120.0, hl: "stable" },
      { m: 121.0, hl: 1.4e9, mode: "beta-", p: { z: 51, m: 121.0 } }, // 43y (meta)
      { m: 122.0, hl: "stable" }, { m: 124.0, hl: "stable" },
      { m: 126.0, hl: 7.2e12, mode: "beta-", p: { z: 51, m: 126.0 } } // 230ky
  ]},
  { z: 51, s: "Sb", n: "Antimony", v: 5, c: "#9E63B5", iso: [
      { m: 121.0, hl: "stable" },
      { m: 123.0, hl: "stable" },
      { m: 124.0, hl: 5.2e6, mode: "beta-", p: { z: 52, m: 124.0 } }, // 60d
      { m: 125.0, hl: 8.7e7, mode: "beta-", p: { z: 52, m: 125.0 } } // 2.7y
  ]},
  { z: 52, s: "Te", n: "Tellurium", v: 6, c: "#D47A00", iso: [
      { m: 120.0, hl: "stable" }, { m: 122.0, hl: "stable" }, { m: 123.0, hl: 1e13, mode: "ec", p: { z: 51, m: 123.0 } },
      { m: 124.0, hl: "stable" }, { m: 125.0, hl: "stable" }, { m: 126.0, hl: "stable" }, { m: 128.0, hl: 6e31, mode: "beta-", p: { z: 53, m: 128.0 } }, // 2e24y
      { m: 130.0, hl: 2e28, mode: "beta-", p: { z: 53, m: 130.0 } } // 7e20y
  ]},
  { z: 53, s: "I", n: "Iodine", v: 7, c: "#940094", iso: [
      { m: 125.0, hl: 5.1e6, mode: "ec", p: { z: 52, m: 125.0 } }, // 59d
      { m: 127.0, hl: "stable" },
      { m: 129.0, hl: 4.9e14, mode: "beta-", p: { z: 54, m: 129.0 } }, // 15 My
      { m: 131.0, hl: 6.9e5, mode: "beta-", p: { z: 54, m: 131.0 } } // 8d
  ]},
  { z: 54, s: "Xe", n: "Xenon", v: 8, c: "#429EB0", iso: [
      { m: 124.0, hl: 5e29, mode: "ec", p: { z: 52, m: 124.0 } }, // 1e22y
      { m: 126.0, hl: "stable" }, { m: 127.0, hl: 3.1e6, mode: "ec", p: { z: 53, m: 127.0 } }, // 36d
      { m: 128.0, hl: "stable" }, { m: 129.0, hl: "stable" }, { m: 130.0, hl: "stable" }, { m: 131.0, hl: "stable" }, { m: 132.0, hl: "stable" },
      { m: 133.0, hl: 4.5e5, mode: "beta-", p: { z: 55, m: 133.0 } }, // 5d
      { m: 134.0, hl: "stable" },
      { m: 136.0, hl: 6e28, mode: "beta-", p: { z: 56, m: 136.0 } } // 2e21y
  ]},

  // --- PERIOD 6 ---
  { z: 55, s: "Cs", n: "Caesium", v: 1, c: "#57178F", iso: [
      { m: 133.0, hl: "stable" },
      { m: 134.0, hl: 6.5e7, mode: "beta-", p: { z: 56, m: 134.0 } }, // 2y
      { m: 135.0, hl: 7e13, mode: "beta-", p: { z: 56, m: 135.0 } }, // 2 My
      { m: 137.0, hl: 9.5e8, mode: "beta-", p: { z: 56, m: 137.0 }, name: "Cs-137" } // 30y
  ]},
  { z: 56, s: "Ba", n: "Barium", v: 2, c: "#00C900", iso: [
      { m: 130.0, hl: "stable" }, { m: 132.0, hl: "stable" },
      { m: 133.0, hl: 3.3e8, mode: "ec", p: { z: 55, m: 133.0 } }, // 10y
      { m: 134.0, hl: "stable" }, { m: 135.0, hl: "stable" }, { m: 136.0, hl: "stable" }, { m: 137.0, hl: "stable" }, { m: 138.0, hl: "stable" }
  ]},
  { z: 57, s: "La", n: "Lanthanum", v: 3, c: "#70D4FF", iso: [
      { m: 137.0, hl: 1.9e12, mode: "ec", p: { z: 56, m: 137.0 } }, // 60ky
      { m: 138.0, hl: 3e18, mode: "ec", p: { z: 56, m: 138.0 } }, // 100 Gy
      { m: 139.0, hl: "stable" }
  ]},
  { z: 58, s: "Ce", n: "Cerium", v: 3, c: "#FFFFC7", iso: [
      { m: 136.0, hl: "stable" }, { m: 138.0, hl: "stable" },
      { m: 139.0, hl: 1.2e7, mode: "ec", p: { z: 57, m: 139.0 } }, // 137d
      { m: 140.0, hl: "stable" }, { m: 142.0, hl: "stable" },
      { m: 144.0, hl: 2.4e7, mode: "beta-", p: { z: 59, m: 144.0 } } // 284d
  ]},
  { z: 59, s: "Pr", n: "Praseodymium", v: 3, c: "#D9FFC7", iso: [
      { m: 141.0, hl: "stable" },
      { m: 143.0, hl: 1.1e6, mode: "beta-", p: { z: 60, m: 143.0 } } // 13d
  ]},
  { z: 60, s: "Nd", n: "Neodymium", v: 3, c: "#C7FFC7", iso: [
      { m: 142.0, hl: "stable" }, { m: 143.0, hl: "stable" },
      { m: 144.0, hl: 7e22, mode: "alpha", p: { z: 58, m: 140.0 } }, // 2e15y
      { m: 145.0, hl: "stable" }, { m: 146.0, hl: "stable" }, { m: 148.0, hl: "stable" },
      { m: 150.0, hl: 2e26, mode: "beta-", p: { z: 61, m: 150.0 } } // 6e18y
  ]},
  { z: 61, s: "Pm", n: "Promethium", v: 3, c: "#A3FFC7", iso: [
      { m: 145.0, hl: 5.6e8, mode: "ec", p: { z: 60, m: 145.0 } }, // 17y
      { m: 147.0, hl: 8.2e7, mode: "beta-", p: { z: 62, m: 147.0 } } // 2.6y
  ]},
  { z: 62, s: "Sm", n: "Samarium", v: 3, c: "#8FFFC7", iso: [
      { m: 144.0, hl: "stable" },
      { m: 146.0, hl: 3e15, mode: "alpha", p: { z: 60, m: 142.0 } }, // 100 My
      { m: 147.0, hl: 3.3e18, mode: "alpha", p: { z: 60, m: 143.0 } }, // 106 Gy
      { m: 148.0, hl: 2e23, mode: "alpha", p: { z: 60, m: 144.0 } }, // 7e15y
      { m: 149.0, hl: "stable" }, { m: 150.0, hl: "stable" }, { m: 152.0, hl: "stable" }, { m: 154.0, hl: "stable" }
  ]},
  { z: 63, s: "Eu", n: "Europium", v: 3, c: "#61FFC7", iso: [
      { m: 151.0, hl: 1.5e26, mode: "alpha", p: { z: 61, m: 147.0 } }, // 5e18y
      { m: 152.0, hl: 4.2e8, mode: "beta-", p: { z: 64, m: 152.0 } }, // 13.5y
      { m: 153.0, hl: "stable" },
      { m: 154.0, hl: 2.7e8, mode: "beta-", p: { z: 64, m: 154.0 } }, // 8.6y
      { m: 155.0, hl: 1.5e8, mode: "beta-", p: { z: 64, m: 155.0 } } // 4.7y
  ]},
  { z: 64, s: "Gd", n: "Gadolinium", v: 3, c: "#45FFC7", iso: [
      { m: 148.0, hl: 2.3e9, mode: "alpha", p: { z: 62, m: 144.0 } }, // 75y
      { m: 152.0, hl: 3.4e21, mode: "alpha", p: { z: 62, m: 148.0 } }, // 1e14y
      { m: 153.0, hl: 2e7, mode: "ec", p: { z: 63, m: 153.0 } }, // 240d
      { m: 154.0, hl: "stable" }, { m: 155.0, hl: "stable" }, { m: 156.0, hl: "stable" }, { m: 157.0, hl: "stable" }, { m: 158.0, hl: "stable" }, { m: 160.0, hl: "stable" }
  ]},
  { z: 65, s: "Tb", n: "Terbium", v: 3, c: "#30FFC7", iso: [
      { m: 158.0, hl: 5e9, mode: "beta-", p: { z: 66, m: 158.0 } }, // 180y (meta)
      { m: 159.0, hl: "stable" }
  ]},
  { z: 66, s: "Dy", n: "Dysprosium", v: 3, c: "#1FFFC7", iso: [
      { m: 156.0, hl: "stable" }, { m: 158.0, hl: "stable" }, { m: 160.0, hl: "stable" }, { m: 161.0, hl: "stable" }, { m: 162.0, hl: "stable" }, { m: 163.0, hl: "stable" }, { m: 164.0, hl: "stable" }
  ]},
  { z: 67, s: "Ho", n: "Holmium", v: 3, c: "#00FF9C", iso: [
      { m: 163.0, hl: 1.4e11, mode: "ec", p: { z: 66, m: 163.0 } }, // 4570y
      { m: 165.0, hl: "stable" },
      { m: 166.0, hl: 9.5e4, mode: "beta-", p: { z: 68, m: 166.0 } } // 26h
  ]},
  { z: 68, s: "Er", n: "Erbium", v: 3, c: "#00E675", iso: [
      { m: 162.0, hl: "stable" }, { m: 164.0, hl: "stable" }, { m: 166.0, hl: "stable" }, { m: 167.0, hl: "stable" }, { m: 168.0, hl: "stable" },
      { m: 169.0, hl: 8e5, mode: "beta-", p: { z: 69, m: 169.0 } }, // 9.4d
      { m: 170.0, hl: "stable" }
  ]},
  { z: 69, s: "Tm", n: "Thulium", v: 3, c: "#00D452", iso: [
      { m: 169.0, hl: "stable" },
      { m: 170.0, hl: 1.1e7, mode: "beta-", p: { z: 70, m: 170.0 } }, // 128d
      { m: 171.0, hl: 6e7, mode: "beta-", p: { z: 70, m: 171.0 } } // 1.9y
  ]},
  { z: 70, s: "Yb", n: "Ytterbium", v: 3, c: "#00BF38", iso: [
      { m: 168.0, hl: "stable" },
      { m: 169.0, hl: 2.7e6, mode: "ec", p: { z: 69, m: 169.0 } }, // 32d
      { m: 170.0, hl: "stable" }, { m: 171.0, hl: "stable" }, { m: 172.0, hl: "stable" }, { m: 173.0, hl: "stable" }, { m: 174.0, hl: "stable" }, { m: 176.0, hl: "stable" }
  ]},
  { z: 71, s: "Lu", n: "Lutetium", v: 3, c: "#00AB24", iso: [
      { m: 173.0, hl: 4e7, mode: "ec", p: { z: 70, m: 173.0 } }, // 1.37y
      { m: 174.0, hl: 1e8, mode: "ec", p: { z: 70, m: 174.0 } }, // 3.3y
      { m: 175.0, hl: "stable" },
      { m: 176.0, hl: 1.2e18, mode: "beta-", p: { z: 72, m: 176.0 } }, // 37 Gy
      { m: 177.0, hl: 5.7e5, mode: "beta-", p: { z: 72, m: 177.0 } } // 6.6d
  ]},
  { z: 72, s: "Hf", n: "Hafnium", v: 4, c: "#4DC2FF", iso: [
      { m: 172.0, hl: 5.8e7, mode: "ec", p: { z: 71, m: 172.0 } }, // 1.8y
      { m: 174.0, hl: 6e22, mode: "alpha", p: { z: 70, m: 170.0 } }, // 2e15y
      { m: 176.0, hl: "stable" }, { m: 177.0, hl: "stable" }, { m: 178.0, hl: "stable" }, { m: 179.0, hl: "stable" }, { m: 180.0, hl: "stable" },
      { m: 181.0, hl: 3.6e6, mode: "beta-", p: { z: 73, m: 181.0 } } // 42d
  ]},
  { z: 73, s: "Ta", n: "Tantalum", v: 5, c: "#4DA6FF", iso: [
      { m: 179.0, hl: 5.6e7, mode: "ec", p: { z: 72, m: 179.0 } }, // 1.8y
      { m: 180.0, hl: 2e23, mode: "ec", p: { z: 72, m: 180.0 } }, // >1e15y (Meta state stable)
      { m: 181.0, hl: "stable" },
      { m: 182.0, hl: 1e7, mode: "beta-", p: { z: 74, m: 182.0 } } // 114d
  ]},
  { z: 74, s: "W", n: "Tungsten", v: 6, c: "#2194D6", iso: [
      { m: 180.0, hl: 5.6e25, mode: "alpha", p: { z: 72, m: 176.0 } }, // 1.8e18y
      { m: 181.0, hl: 1e7, mode: "ec", p: { z: 73, m: 181.0 } }, // 121d
      { m: 182.0, hl: "stable" }, { m: 183.0, hl: "stable" }, { m: 184.0, hl: "stable" },
      { m: 185.0, hl: 6.4e6, mode: "beta-", p: { z: 75, m: 185.0 } }, // 75d
      { m: 186.0, hl: "stable" }
  ]},
  { z: 75, s: "Re", n: "Rhenium", v: 7, c: "#267DAB", iso: [
      { m: 183.0, hl: 6e6, mode: "ec", p: { z: 74, m: 183.0 } }, // 70d
      { m: 185.0, hl: "stable" },
      { m: 187.0, hl: 1.3e18, mode: "beta-", p: { z: 76, m: 187.0 } } // 41 Gy
  ]},
  { z: 76, s: "Os", n: "Osmium", v: 4, c: "#266696", iso: [
      { m: 184.0, hl: "stable" }, { m: 186.0, hl: 6e22, mode: "alpha", p: { z: 74, m: 182.0 } }, // 2e15y
      { m: 187.0, hl: "stable" }, { m: 188.0, hl: "stable" }, { m: 189.0, hl: "stable" }, { m: 190.0, hl: "stable" },
      { m: 191.0, hl: 1.3e6, mode: "beta-", p: { z: 77, m: 191.0 } }, // 15d
      { m: 192.0, hl: "stable" }
  ]},
  { z: 77, s: "Ir", n: "Iridium", v: 4, c: "#175487", iso: [
      { m: 191.0, hl: "stable" },
      { m: 192.0, hl: 6.3e6, mode: "beta-", p: { z: 78, m: 192.0 } }, // 73d
      { m: 193.0, hl: "stable" }
  ]},
  { z: 78, s: "Pt", n: "Platinum", v: 2, c: "#D0D0E0", iso: [
      { m: 190.0, hl: 2e19, mode: "alpha", p: { z: 76, m: 186.0 } }, // 6e11y
      { m: 192.0, hl: "stable" },
      { m: 193.0, hl: 1.5e9, mode: "ec", p: { z: 77, m: 193.0 } }, // 50y (meta)
      { m: 194.0, hl: "stable" }, { m: 195.0, hl: "stable" }, { m: 196.0, hl: "stable" }, { m: 198.0, hl: "stable" }
  ]},
  { z: 79, s: "Au", n: "Gold", v: 1, c: "#FFD123", iso: [
      { m: 195.0, hl: 1.6e7, mode: "ec", p: { z: 78, m: 195.0 } }, // 186d
      { m: 197.0, hl: "stable" },
      { m: 198.0, hl: 2.3e5, mode: "beta-", p: { z: 80, m: 198.0 } } // 2.7d
  ]},
  { z: 80, s: "Hg", n: "Mercury", v: 2, c: "#B8B8D0", iso: [
      { m: 194.0, hl: 1.6e10, mode: "ec", p: { z: 79, m: 194.0 } }, // 444y
      { m: 196.0, hl: "stable" }, { m: 198.0, hl: "stable" }, { m: 199.0, hl: "stable" }, { m: 200.0, hl: "stable" }, { m: 201.0, hl: "stable" }, { m: 202.0, hl: "stable" },
      { m: 203.0, hl: 4e6, mode: "beta-", p: { z: 81, m: 203.0 } }, // 46d
      { m: 204.0, hl: "stable" }
  ]},
  { z: 81, s: "Tl", n: "Thallium", v: 1, c: "#A6544D", iso: [
      { m: 203.0, hl: "stable" },
      { m: 204.0, hl: 1.19e8, mode: "beta-", p: { z: 82, m: 204.0 } }, // 3.7y
      { m: 205.0, hl: "stable" }
  ]},
  { z: 82, s: "Pb", n: "Lead", v: 4, c: "#575961", iso: [
      { m: 202.0, hl: 1.6e12, mode: "ec", p: { z: 81, m: 202.0 } }, // 52ky
      { m: 204.0, hl: 4.4e26, mode: "alpha", p: { z: 80, m: 200.0 } }, // 1.4e17y
      { m: 205.0, hl: 5.4e14, mode: "ec", p: { z: 81, m: 205.0 } }, // 17 My
      { m: 206.0, hl: "stable", name: "Pb-206" },
      { m: 207.0, hl: "stable", name: "Pb-207" },
      { m: 208.0, hl: "stable", name: "Pb-208" },
      { m: 210.0, hl: 7e8, mode: "beta-", p: { z: 83, m: 210.0 } } // 22y
  ]},
  { z: 83, s: "Bi", n: "Bismuth", v: 3, c: "#9E4FB5", iso: [
      { m: 207.0, hl: 1e9, mode: "ec", p: { z: 82, m: 207.0 } }, // 31y
      { m: 208.0, hl: 1.1e13, mode: "ec", p: { z: 82, m: 208.0 } }, // 368ky
      { m: 209.0, hl: 6e26, mode: "alpha", p: { z: 81, m: 205.0 } }, // 2e19y (Virtually stable)
      { m: 210.0, hl: 4.3e5, mode: "beta-", p: { z: 84, m: 210.0 }, name: "Bi-210" } // 5d
  ]},

  // --- RADIOACTIVE CHAINS (Real World Values in Seconds) ---
  { z: 84, s: "Po", n: "Polonium", v: 2, c: "#AB5C00", iso: [
      { m: 208.0, hl: 9.1e7, mode: "alpha", p: { z: 82, m: 204.0 } }, // 2.9y
      { m: 209.0, hl: 3.2e9, mode: "alpha", p: { z: 82, m: 205.0 } }, // 102y
      { m: 210.0, hl: 1.2e7, mode: "alpha", p: { z: 82, m: 206.0 }, name: "Po-210" }, // 138d
      { m: 218.0, hl: 186, mode: "alpha", p: { z: 82, m: 214.0 }, name: "Po-218" } // 3.1m
  ]},
  { z: 85, s: "At", n: "Astatine", v: 1, c: "#754F45", iso: [
      { m: 210.0, hl: 2.9e4, mode: "ec", p: { z: 84, m: 210.0 } }, // 8.1h
      { m: 211.0, hl: 2.6e4, mode: "ec", p: { z: 84, m: 211.0 } } // 7.2h
  ]},
  { z: 86, s: "Rn", n: "Radon", v: 0, c: "#428296", iso: [
      { m: 211.0, hl: 5.2e4, mode: "ec", p: { z: 85, m: 211.0 } }, // 14h
      { m: 220.0, hl: 55.6, mode: "alpha", p: { z: 84, m: 216.0 } },
      { m: 222.0, hl: 3.3e5, mode: "alpha", p: { z: 84, m: 218.0 }, name: "Rn-222" } // 3.8d
  ]},
  { z: 87, s: "Fr", n: "Francium", v: 1, c: "#420066", iso: [
      { m: 212.0, hl: 1200, mode: "ec", p: { z: 86, m: 212.0 } }, // 20m
      { m: 223.0, hl: 1320, mode: "beta-", p: { z: 88, m: 223.0 } } // 22m
  ]},
  { z: 88, s: "Ra", n: "Radium", v: 2, c: "#007D00", iso: [
      { m: 223.0, hl: 9.8e5, mode: "alpha", p: { z: 86, m: 219.0 } }, // 11.4d
      { m: 224.0, hl: 3.1e5, mode: "alpha", p: { z: 86, m: 220.0 } }, // 3.6d
      { m: 225.0, hl: 1.2e6, mode: "beta-", p: { z: 89, m: 225.0 } }, // 14.9d
      { m: 226.0, hl: 5e10, mode: "alpha", p: { z: 86, m: 222.0 }, name: "Ra-226" }, // 1600y
      { m: 228.0, hl: 1.8e8, mode: "beta-", p: { z: 89, m: 228.0 } } // 5.75y
  ]},
  { z: 89, s: "Ac", n: "Actinium", v: 3, c: "#70ABFA", iso: [
      { m: 225.0, hl: 8.6e5, mode: "alpha", p: { z: 87, m: 221.0 } }, // 10d
      { m: 227.0, hl: 6.9e8, mode: "beta-", p: { z: 90, m: 227.0 } } // 21.7y
  ]},
  { z: 90, s: "Th", n: "Thorium", v: 4, c: "#00BAFF", iso: [
      { m: 227.0, hl: 1.6e6, mode: "alpha", p: { z: 88, m: 223.0 }, name: "Th-227" }, // 18.7d
      { m: 228.0, hl: 6e7, mode: "alpha", p: { z: 88, m: 224.0 } }, // 1.9y
      { m: 229.0, hl: 2.3e11, mode: "alpha", p: { z: 88, m: 225.0 } }, // 7340y
      { m: 230.0, hl: 2.3e12, mode: "alpha", p: { z: 88, m: 226.0 } }, // 75ky
      { m: 231.0, hl: 9.1e4, mode: "beta-", p: { z: 91, m: 231.0 }, name: "Th-231" }, // 25.5h
      { m: 232.0, hl: 4.4e17, mode: "alpha", p: { z: 88, m: 228.0 }, name: "Th-232" }, // 14 Gy
      { m: 234.0, hl: 2.1e6, mode: "beta-", p: { z: 91, m: 234.0 }, name: "Th-234" } // 24.1d
  ]},
  { z: 91, s: "Pa", n: "Protactinium", v: 5, c: "#00A1FF", iso: [
      { m: 231.0, hl: 1e12, mode: "alpha", p: { z: 89, m: 227.0 } }, // 32ky
      { m: 233.0, hl: 2.3e6, mode: "beta-", p: { z: 92, m: 233.0 } }, // 27d
      { m: 234.0, hl: 24100, mode: "beta-", p: { z: 92, m: 234.0 }, name: "Pa-234" } // 6.7h
  ]},
  { z: 92, s: "U", n: "Uranium", v: 6, c: "#008FFF", iso: [
      { m: 232.0, hl: 2.1e9, mode: "alpha", p: { z: 90, m: 228.0 } }, // 68y
      { m: 233.0, hl: 5e12, mode: "alpha", p: { z: 90, m: 229.0 } }, // 159ky
      { m: 234.0, hl: 7.7e12, mode: "alpha", p: { z: 90, m: 230.0 }, name: "U-234" }, // 245ky
      { m: 235.0, hl: 2.2e16, mode: "alpha", p: { z: 90, m: 231.0 }, name: "U-235" }, // 700 My
      { m: 236.0, hl: 7.3e14, mode: "alpha", p: { z: 90, m: 232.0 } }, // 23 My
      { m: 238.0, hl: 1.4e17, mode: "alpha", p: { z: 90, m: 234.0 }, name: "U-238" } // 4.5 Gy
  ]},
  { z: 93, s: "Np", n: "Neptunium", v: 5, c: "#0080FF", iso: [
      { m: 236.0, hl: 4.8e12, mode: "ec", p: { z: 92, m: 236.0 } }, // 154ky
      { m: 237.0, hl: 6.7e13, mode: "alpha", p: { z: 91, m: 233.0 } } // 2.1 My
  ]},
  { z: 94, s: "Pu", n: "Plutonium", v: 4, c: "#006BFF", iso: [
      { m: 238.0, hl: 2.7e9, mode: "alpha", p: { z: 92, m: 234.0 } }, // 87y
      { m: 239.0, hl: 7.6e11, mode: "alpha", p: { z: 92, m: 235.0 }, name: "Pu-239" }, // 24ky
      { m: 240.0, hl: 2e11, mode: "alpha", p: { z: 92, m: 236.0 } }, // 6500y
      { m: 241.0, hl: 4.5e8, mode: "beta-", p: { z: 95, m: 241.0 } }, // 14y
      { m: 242.0, hl: 1.1e13, mode: "alpha", p: { z: 92, m: 238.0 } }, // 375ky
      { m: 244.0, hl: 2.5e15, mode: "alpha", p: { z: 92, m: 240.0 } } // 80 My
  ]},
  { z: 95, s: "Am", n: "Americium", v: 3, c: "#545CF2", iso: [
      { m: 241.0, hl: 1.3e10, mode: "alpha", p: { z: 93, m: 237.0 } }, // 432y
      { m: 243.0, hl: 2.3e11, mode: "alpha", p: { z: 93, m: 239.0 } } // 7370y
  ]},
  { z: 96, s: "Cm", n: "Curium", v: 3, c: "#785CE3", iso: [
      { m: 243.0, hl: 9.1e8, mode: "alpha", p: { z: 94, m: 239.0 } }, // 29y
      { m: 244.0, hl: 5.7e8, mode: "alpha", p: { z: 94, m: 240.0 } }, // 18y
      { m: 245.0, hl: 2.6e11, mode: "alpha", p: { z: 94, m: 241.0 } }, // 8500y
      { m: 247.0, hl: 4.9e14, mode: "alpha", p: { z: 94, m: 243.0 } }, // 15 My
      { m: 248.0, hl: 1e13, mode: "alpha", p: { z: 94, m: 244.0 } } // 348ky
  ]},
  { z: 97, s: "Bk", n: "Berkelium", v: 3, c: "#8A4FE3", iso: [
      { m: 247.0, hl: 4.3e10, mode: "alpha", p: { z: 95, m: 243.0 } }, // 1380y
      { m: 249.0, hl: 2.8e7, mode: "beta-", p: { z: 98, m: 249.0 } } // 330d
  ]},
  { z: 98, s: "Cf", n: "Californium", v: 3, c: "#A136D4", iso: [
      { m: 249.0, hl: 1.1e10, mode: "alpha", p: { z: 96, m: 245.0 } }, // 351y
      { m: 250.0, hl: 4e8, mode: "alpha", p: { z: 96, m: 246.0 } }, // 13y
      { m: 251.0, hl: 2.8e10, mode: "alpha", p: { z: 96, m: 247.0 } }, // 900y
      { m: 252.0, hl: 8.3e7, mode: "alpha", p: { z: 96, m: 248.0 } } // 2.6y
  ]},
  { z: 99, s: "Es", n: "Einsteinium", v: 3, c: "#B31FD4", iso: [
      { m: 252.0, hl: 4e7, mode: "alpha", p: { z: 97, m: 248.0 } }, // 471d
      { m: 254.0, hl: 2.3e7, mode: "alpha", p: { z: 97, m: 250.0 } } // 275d
  ]},
  { z: 100, s: "Fm", n: "Fermium", v: 3, c: "#B31FBA", iso: [
      { m: 253.0, hl: 2.6e5, mode: "ec", p: { z: 99, m: 253.0 } }, // 3d
      { m: 257.0, hl: 8.6e6, mode: "alpha", p: { z: 98, m: 253.0 } } // 100d
  ]},
  { z: 101, s: "Md", n: "Mendelevium", v: 3, c: "#B30DA6", iso: [
      { m: 256.0, hl: 4620, mode: "ec", p: { z: 100, m: 256.0 } }, // 1.2h
      { m: 258.0, hl: 4.4e6, mode: "alpha", p: { z: 99, m: 254.0 } }, // 51d
      { m: 260.0, hl: 2.7e6, mode: "sf", p: { z: 0, m: 0 } } // 31d (Spontaneous Fission)
  ]},
  { z: 102, s: "No", n: "Nobelium", v: 2, c: "#BD0D87", iso: [
      { m: 255.0, hl: 186, mode: "ec", p: { z: 101, m: 255.0 } }, // 3.1m
      { m: 259.0, hl: 3500, mode: "alpha", p: { z: 100, m: 255.0 } } // 58m
  ]},
  { z: 103, s: "Lr", n: "Lawrencium", v: 3, c: "#C70066", iso: [
      { m: 262.0, hl: 13000, mode: "ec", p: { z: 102, m: 262.0 } }, // 3.6h
      { m: 266.0, hl: 36000, mode: "alpha", p: { z: 101, m: 262.0 } } // 10h
  ]},
  
  // --- SUPERHEAVIES (Scientific estimates > 1s) ---
  { z: 104, s: "Rf", n: "Rutherfordium", v: 4, c: "#CC0059", iso: [
      { m: 263.0, hl: 600, mode: "sf", p: { z: 0, m: 0 } }, // 10m
      { m: 267.0, hl: 4680, mode: "sf", p: { z: 0, m: 0 } } // 1.3h
  ]},
  { z: 105, s: "Db", n: "Dubnium", v: 5, c: "#D1004F", iso: [
      { m: 268.0, hl: 1e5, mode: "sf", p: { z: 0, m: 0 } }, // 29h
      { m: 270.0, hl: 3600, mode: "alpha", p: { z: 103, m: 266.0 } } // 1h
  ]},
  { z: 106, s: "Sg", n: "Seaborgium", v: 6, c: "#D90045", iso: [
      { m: 271.0, hl: 120, mode: "alpha", p: { z: 104, m: 267.0 } } // 2m
  ]},
  { z: 107, s: "Bh", n: "Bohrium", v: 7, c: "#E00038", iso: [
      { m: 270.0, hl: 60, mode: "alpha", p: { z: 105, m: 266.0 } }, // 1m
      { m: 274.0, hl: 54, mode: "alpha", p: { z: 105, m: 270.0 } }
  ]},
  { z: 108, s: "Hs", n: "Hassium", v: 8, c: "#E6002E", iso: [
      { m: 270.0, hl: 22, mode: "alpha", p: { z: 106, m: 266.0 } },
      { m: 277.0, hl: 2, mode: "sf", p: { z: 0, m: 0 } } // ~2s
  ]},
  { z: 109, s: "Mt", n: "Meitnerium", v: 0, c: "#EB0026", iso: [
      { m: 276.0, hl: 0.72, mode: "alpha", p: { z: 107, m: 272.0 } }, // <1s (included as it's the main reference often used)
      { m: 278.0, hl: 7.6, mode: "alpha", p: { z: 107, m: 274.0 } }
  ]},
  { z: 110, s: "Ds", n: "Darmstadtium", v: 0, c: "#ED0021", iso: [
      { m: 281.0, hl: 11, mode: "sf", p: { z: 0, m: 0 } }
  ]},
  { z: 111, s: "Rg", n: "Roentgenium", v: 0, c: "#EF001C", iso: [
      { m: 282.0, hl: 120, mode: "alpha", p: { z: 109, m: 278.0 } } // 2m
  ]},
  { z: 112, s: "Cn", n: "Copernicium", v: 0, c: "#F20017", iso: [
      { m: 285.0, hl: 29, mode: "alpha", p: { z: 110, m: 281.0 } }
  ]},
  { z: 113, s: "Nh", n: "Nihonium", v: 3, c: "#F40012", iso: [
      { m: 286.0, hl: 19.6, mode: "alpha", p: { z: 111, m: 282.0 } }
  ]},
  { z: 114, s: "Fl", n: "Flerovium", v: 4, c: "#F7000D", iso: [
      { m: 289.0, hl: 2.6, mode: "alpha", p: { z: 112, m: 285.0 } }
  ]},
  { z: 115, s: "Mc", n: "Moscovium", v: 5, c: "#FA0008", iso: [
      { m: 290.0, hl: 0.65, mode: "alpha", p: { z: 113, m: 286.0 } } // <1s, most are short
  ]},
  { z: 116, s: "Lv", n: "Livermorium", v: 6, c: "#FC0005", iso: [
      { m: 293.0, hl: 0.05, mode: "alpha", p: { z: 114, m: 289.0 } } // No isotopes > 1s known confidently
  ]},
  { z: 117, s: "Ts", n: "Tennessine", v: 7, c: "#FD0003", iso: [
      { m: 294.0, hl: 0.05, mode: "alpha", p: { z: 115, m: 290.0 } }
  ]},
  { z: 118, s: "Og", n: "Oganesson", v: 8, c: "#FF0000", iso: [
      { m: 294.0, hl: 0.001, mode: "alpha", p: { z: 116, m: 290.0 } }
  ]}
];