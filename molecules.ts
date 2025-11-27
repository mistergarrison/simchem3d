
import { Molecule } from './types';

export const MOLECULES: Molecule[] = [
    // --- BASIC & COMMON (1-7) ---
    { 
        id: 'h2o', name: 'Water', formula: 'H₂O', ingredients: [{z:1, count:2}, {z:8, count:1}],
        structure: { atoms: [8, 1, 1], bonds: [[0, 1, 1], [0, 2, 1]] }
    },
    { 
        id: 'co2', name: 'Carbon Dioxide', formula: 'CO₂', ingredients: [{z:6, count:1}, {z:8, count:2}],
        structure: { atoms: [6, 8, 8], bonds: [[0, 1, 2], [0, 2, 2]] }
    },
    { 
        id: 'ch4', name: 'Methane', formula: 'CH₄', ingredients: [{z:6, count:1}, {z:1, count:4}],
        structure: { atoms: [6, 1, 1, 1, 1], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] }
    },
    { 
        id: 'nh3', name: 'Ammonia', formula: 'NH₃', ingredients: [{z:7, count:1}, {z:1, count:3}],
        structure: { atoms: [7, 1, 1, 1], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] }
    },
    { 
        id: 'so2', name: 'Sulfur Dioxide', formula: 'SO₂', ingredients: [{z:16, count:1}, {z:8, count:2}],
        structure: { atoms: [16, 8, 8], bonds: [[0, 1, 2], [0, 2, 2]] }
    },
    { 
        id: 'o3', name: 'Ozone', formula: 'O₃', ingredients: [{z:8, count:3}],
        structure: { atoms: [8, 8, 8], bonds: [[0, 1, 2], [1, 2, 1]] }
    },
    { 
        id: 'h2o2', name: 'Hydrogen Peroxide', formula: 'H₂O₂', ingredients: [{z:1, count:2}, {z:8, count:2}],
        structure: { atoms: [8, 8, 1, 1], bonds: [[0, 1, 1], [0, 2, 1], [1, 3, 1]] }
    },

    // --- ACIDS (8-14) ---
    { 
        id: 'h2so4', name: 'Sulfuric Acid', formula: 'H₂SO₄', ingredients: [{z:1, count:2}, {z:16, count:1}, {z:8, count:4}],
        structure: { 
            atoms: [16, 8, 8, 8, 8, 1, 1], 
            bonds: [[0,1,2], [0,2,2], [0,3,1], [0,4,1], [3,5,1], [4,6,1]] 
        }
    },
    { 
        id: 'hno3', name: 'Nitric Acid', formula: 'HNO₃', ingredients: [{z:1, count:1}, {z:7, count:1}, {z:8, count:3}],
        structure: { atoms: [7, 8, 8, 8, 1], bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [2, 4, 1]] }
    },
    { 
        id: 'h3po4', name: 'Phosphoric Acid', formula: 'H₃PO₄', ingredients: [{z:1, count:3}, {z:15, count:1}, {z:8, count:4}],
        structure: { 
            atoms: [15, 8, 8, 8, 8, 1, 1, 1], 
            bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [0, 4, 1], [2, 5, 1], [3, 6, 1], [4, 7, 1]] 
        }
    },
    { 
        id: 'ch3cooh', name: 'Acetic Acid', formula: 'CH₃COOH', ingredients: [{z:6, count:2}, {z:1, count:4}, {z:8, count:2}],
        structure: { 
            atoms: [6, 6, 8, 8, 1, 1, 1, 1], 
            bonds: [[0, 1, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1], [1, 2, 2], [1, 3, 1], [3, 7, 1]] 
        }
    },
    { 
        id: 'ch2o2', name: 'Formic Acid', formula: 'CH₂O₂', ingredients: [{z:6, count:1}, {z:1, count:2}, {z:8, count:2}],
        structure: { atoms: [6, 8, 8, 1, 1], bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [2, 4, 1]] }
    },
    { 
        id: 'hcn', name: 'Hydrogen Cyanide', formula: 'HCN', ingredients: [{z:1, count:1}, {z:6, count:1}, {z:7, count:1}],
        structure: { atoms: [6, 7, 1], bonds: [[0, 1, 3], [0, 2, 1]] }
    },
    { 
        id: 'h2s', name: 'Hydrogen Sulfide', formula: 'H₂S', ingredients: [{z:1, count:2}, {z:16, count:1}],
        structure: { atoms: [16, 1, 1], bonds: [[0, 1, 1], [0, 2, 1]] }
    },

    // --- ALKANES & HYDROCARBONS (15-21) ---
    { 
        id: 'c2h6', name: 'Ethane', formula: 'C₂H₆', ingredients: [{z:6, count:2}, {z:1, count:6}],
        structure: { 
            atoms: [6, 6, 1, 1, 1, 1, 1, 1], 
            bonds: [[0,1,1], [0,2,1], [0,3,1], [0,4,1], [1,5,1], [1,6,1], [1,7,1]] 
        }
    },
    { 
        id: 'c3h8', name: 'Propane', formula: 'C₃H₈', ingredients: [{z:6, count:3}, {z:1, count:8}],
        structure: {
            atoms: [6, 6, 6, 1, 1, 1, 1, 1, 1, 1, 1],
            bonds: [[0,1,1], [1,2,1], [0,3,1], [0,4,1], [0,5,1], [1,6,1], [1,7,1], [2,8,1], [2,9,1], [2,10,1]]
        }
    },
    { 
        id: 'c4h10', name: 'Butane', formula: 'C₄H₁₀', ingredients: [{z:6, count:4}, {z:1, count:10}],
        structure: {
            atoms: [6, 6, 6, 6, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            bonds: [
                [0,1,1], [1,2,1], [2,3,1], 
                [0,4,1], [0,5,1], [0,6,1], 
                [1,7,1], [1,8,1], 
                [2,9,1], [2,10,1], 
                [3,11,1], [3,12,1], [3,13,1]
            ]
        }
    },
    { 
        id: 'c2h4', name: 'Ethylene', formula: 'C₂H₄', ingredients: [{z:6, count:2}, {z:1, count:4}],
        structure: { atoms: [6, 6, 1, 1, 1, 1], bonds: [[0,1,2], [0,2,1], [0,3,1], [1,4,1], [1,5,1]] }
    },
    { 
        id: 'c2h2', name: 'Acetylene', formula: 'C₂H₂', ingredients: [{z:6, count:2}, {z:1, count:2}],
        structure: { atoms: [6, 6, 1, 1], bonds: [[0,1,3], [0,2,1], [1,3,1]] }
    },
    { 
        id: 'c3h4', name: 'Propyne', formula: 'C₃H₄', ingredients: [{z:6, count:3}, {z:1, count:4}],
        structure: { atoms: [6, 6, 6, 1, 1, 1, 1], bonds: [[0,1,1], [1,2,3], [0,3,1], [0,4,1], [0,5,1], [2,6,1]] }
    },
    { 
        id: 'c4h6', name: 'Butadiene', formula: 'C₄H₆', ingredients: [{z:6, count:4}, {z:1, count:6}],
        structure: { 
            atoms: [6, 6, 6, 6, 1, 1, 1, 1, 1, 1], 
            bonds: [[0,1,2], [1,2,1], [2,3,2], [0,4,1], [0,5,1], [1,6,1], [2,7,1], [3,8,1], [3,9,1]]
        }
    },

    // --- ALCOHOLS & SOLVENTS (22-28) ---
    { 
        id: 'ch3oh', name: 'Methanol', formula: 'CH₃OH', ingredients: [{z:6, count:1}, {z:1, count:4}, {z:8, count:1}],
        structure: { atoms: [6, 8, 1, 1, 1, 1], bonds: [[0,1,1], [0,2,1], [0,3,1], [0,4,1], [1,5,1]] }
    },
    { 
        id: 'c2h5oh', name: 'Ethanol', formula: 'C₂H₅OH', ingredients: [{z:6, count:2}, {z:1, count:6}, {z:8, count:1}],
        structure: { 
            atoms: [6, 6, 8, 1, 1, 1, 1, 1, 1], 
            bonds: [[0,1,1], [1,2,1], [2,8,1], [0,3,1], [0,4,1], [0,5,1], [1,6,1], [1,7,1]]
        }
    },
    { 
        id: 'c3h6o', name: 'Acetone', formula: 'C₃H₆O', ingredients: [{z:6, count:3}, {z:1, count:6}, {z:8, count:1}],
        structure: {
            atoms: [6, 6, 6, 8, 1, 1, 1, 1, 1, 1],
            bonds: [[0,1,1], [0,2,1], [0,3,2], [1,4,1], [1,5,1], [1,6,1], [2,7,1], [2,8,1], [2,9,1]]
        }
    },
    { 
        id: 'ch2o', name: 'Formaldehyde', formula: 'CH₂O', ingredients: [{z:6, count:1}, {z:1, count:2}, {z:8, count:1}],
        structure: { atoms: [6, 8, 1, 1], bonds: [[0,1,2], [0,2,1], [0,3,1]] }
    },
    { 
        id: 'ccl4', name: 'Carbon Tetrachloride', formula: 'CCl₄', ingredients: [{z:6, count:1}, {z:17, count:4}],
        structure: { atoms: [6, 17, 17, 17, 17], bonds: [[0,1,1], [0,2,1], [0,3,1], [0,4,1]] }
    },
    { 
        id: 'chcl3', name: 'Chloroform', formula: 'CHCl₃', ingredients: [{z:6, count:1}, {z:1, count:1}, {z:17, count:3}],
        structure: { atoms: [6, 1, 17, 17, 17], bonds: [[0,1,1], [0,2,1], [0,3,1], [0,4,1]] }
    },
    { 
        id: 'c6h6', name: 'Benzene', formula: 'C₆H₆', ingredients: [{z:6, count:6}, {z:1, count:6}],
        structure: {
            atoms: [6, 6, 6, 6, 6, 6, 1, 1, 1, 1, 1, 1],
            bonds: [
                [0,1,2], [1,2,1], [2,3,2], [3,4,1], [4,5,2], [5,0,1], 
                [0,6,1], [1,7,1], [2,8,1], [3,9,1], [4,10,1], [5,11,1]
            ]
        }
    },

    // --- NITROGEN COMPOUNDS (29-35) ---
    { 
        id: 'n2h4', name: 'Hydrazine', formula: 'N₂H₄', ingredients: [{z:7, count:2}, {z:1, count:4}],
        structure: { atoms: [7, 7, 1, 1, 1, 1], bonds: [[0,1,1], [0,2,1], [0,3,1], [1,4,1], [1,5,1]] }
    },
    { 
        id: 'no2', name: 'Nitrogen Dioxide', formula: 'NO₂', ingredients: [{z:7, count:1}, {z:8, count:2}],
        structure: { atoms: [7, 8, 8], bonds: [[0,1,2], [0,2,1]] }
    },
    { 
        id: 'n2o', name: 'Nitrous Oxide', formula: 'N₂O', ingredients: [{z:7, count:2}, {z:8, count:1}],
        structure: { atoms: [7, 7, 8], bonds: [[0,1,3], [1,2,1]] }
    },
    { 
        id: 'ch4n2o', name: 'Urea', formula: 'CH₄N₂O', ingredients: [{z:6, count:1}, {z:1, count:4}, {z:7, count:2}, {z:8, count:1}],
        structure: { 
            atoms: [6, 8, 7, 7, 1, 1, 1, 1],
            bonds: [[0,1,2], [0,2,1], [0,3,1], [2,4,1], [2,5,1], [3,6,1], [3,7,1]]
        }
    },
    { 
        id: 'c2h5no2', name: 'Glycine', formula: 'C₂H₅NO₂', ingredients: [{z:6, count:2}, {z:1, count:5}, {z:7, count:1}, {z:8, count:2}],
        structure: {
            atoms: [6, 6, 7, 8, 8, 1, 1, 1, 1, 1],
            bonds: [[0,1,1], [0,2,1], [1,3,2], [1,4,1], [4,9,1], [2,5,1], [2,6,1], [0,7,1], [0,8,1]]
        }
    },
    { 
        id: 'c2n2', name: 'Cyanogen', formula: 'C₂N₂', ingredients: [{z:6, count:2}, {z:7, count:2}],
        structure: { atoms: [6, 6, 7, 7], bonds: [[0,1,1], [0,2,3], [1,3,3]] }
    },
    { 
        id: 'ncl3', name: 'Nitrogen Trichloride', formula: 'NCl₃', ingredients: [{z:7, count:1}, {z:17, count:3}],
        structure: { atoms: [7, 17, 17, 17], bonds: [[0,1,1], [0,2,1], [0,3,1]] }
    },

    // --- EXOTIC & INDUSTRIAL (36-42) ---
    { 
        id: 'sf6', name: 'Sulfur Hexafluoride', formula: 'SF₆', ingredients: [{z:16, count:1}, {z:9, count:6}],
        structure: { 
            atoms: [16, 9, 9, 9, 9, 9, 9], 
            bonds: [[0,1,1], [0,2,1], [0,3,1], [0,4,1], [0,5,1], [0,6,1]] 
        }
    },
    { 
        id: 'xef4', name: 'Xenon Tetrafluoride', formula: 'XeF₄', ingredients: [{z:54, count:1}, {z:9, count:4}],
        structure: { atoms: [54, 9, 9, 9, 9], bonds: [[0,1,1], [0,2,1], [0,3,1], [0,4,1]] }
    },
    { 
        id: 'pcl5', name: 'Phosphorus Pentachloride', formula: 'PCl₅', ingredients: [{z:15, count:1}, {z:17, count:5}],
        structure: { 
            atoms: [15, 17, 17, 17, 17, 17], 
            bonds: [[0,1,1], [0,2,1], [0,3,1], [0,4,1], [0,5,1]] 
        }
    },
    { 
        id: 'clf3', name: 'Chlorine Trifluoride', formula: 'ClF₃', ingredients: [{z:17, count:1}, {z:9, count:3}],
        structure: { atoms: [17, 9, 9, 9], bonds: [[0,1,1], [0,2,1], [0,3,1]] }
    },
    { 
        id: 'cocl2', name: 'Phosgene', formula: 'COCl₂', ingredients: [{z:6, count:1}, {z:8, count:1}, {z:17, count:2}],
        structure: { atoms: [6, 8, 17, 17], bonds: [[0,1,2], [0,2,1], [0,3,1]] }
    },
    { 
        id: 'c6h12', name: 'Cyclohexane', formula: 'C₆H₁₂', ingredients: [{z:6, count:6}, {z:1, count:12}],
        structure: {
            atoms: [6, 6, 6, 6, 6, 6, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            bonds: [
                [0,1,1], [1,2,1], [2,3,1], [3,4,1], [4,5,1], [5,0,1],
                [0,6,1], [0,7,1], [1,8,1], [1,9,1], [2,10,1], [2,11,1],
                [3,12,1], [3,13,1], [4,14,1], [4,15,1], [5,16,1], [5,17,1]
            ]
        }
    },
    { 
        id: 'c5h5n', name: 'Pyridine', formula: 'C₅H₅N', ingredients: [{z:6, count:5}, {z:1, count:5}, {z:7, count:1}],
        structure: {
            atoms: [7, 6, 6, 6, 6, 6, 1, 1, 1, 1, 1],
            bonds: [
                [0,1,2], [1,2,1], [2,3,2], [3,4,1], [4,5,2], [5,0,1],
                [1,6,1], [2,7,1], [3,8,1], [4,9,1], [5,10,1]
            ]
        }
    },
    
    // --- ELEMENTAL & DIATOMIC GASES (43-48) ---
    { 
        id: 'h2', name: 'Hydrogen Gas', formula: 'H₂', ingredients: [{z:1, count:2}],
        structure: { atoms: [1, 1], bonds: [[0, 1, 1]] },
        isHidden: true
    },
    { 
        id: 'n2', name: 'Nitrogen Gas', formula: 'N₂', ingredients: [{z:7, count:2}],
        structure: { atoms: [7, 7], bonds: [[0, 1, 3]] },
        isHidden: true
    },
    { 
        id: 'o2', name: 'Oxygen Gas', formula: 'O₂', ingredients: [{z:8, count:2}],
        structure: { atoms: [8, 8], bonds: [[0, 1, 2]] },
        isHidden: true
    },
    { 
        id: 'f2', name: 'Fluorine Gas', formula: 'F₂', ingredients: [{z:9, count:2}],
        structure: { atoms: [9, 9], bonds: [[0, 1, 1]] },
        isHidden: true
    },
    { 
        id: 'cl2', name: 'Chlorine Gas', formula: 'Cl₂', ingredients: [{z:17, count:2}],
        structure: { atoms: [17, 17], bonds: [[0, 1, 1]] },
        isHidden: true
    },
    { 
        id: 'co', name: 'Carbon Monoxide', formula: 'CO', ingredients: [{z:6, count:1}, {z:8, count:1}],
        structure: { atoms: [6, 8], bonds: [[0, 1, 3]] },
        isHidden: true
    },

    // --- SIMPLE INORGANICS & HALIDES (49-53) ---
    { 
        id: 'hcl', name: 'Hydrochloric Acid', formula: 'HCl', ingredients: [{z:1, count:1}, {z:17, count:1}],
        structure: { atoms: [1, 17], bonds: [[0, 1, 1]] },
        isHidden: true
    },
    { 
        id: 'cs2', name: 'Carbon Disulfide', formula: 'CS₂', ingredients: [{z:6, count:1}, {z:16, count:2}],
        structure: { atoms: [6, 16, 16], bonds: [[0, 1, 2], [0, 2, 2]] },
        isHidden: true
    },
    { 
        id: 'bf3', name: 'Boron Trifluoride', formula: 'BF₃', ingredients: [{z:5, count:1}, {z:9, count:3}],
        structure: { atoms: [5, 9, 9, 9], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
        isHidden: true
    },
    { 
        id: 'so3', name: 'Sulfur Trioxide', formula: 'SO₃', ingredients: [{z:16, count:1}, {z:8, count:3}],
        structure: { atoms: [16, 8, 8, 8], bonds: [[0, 1, 2], [0, 2, 2], [0, 3, 2]] },
        isHidden: true
    },
    { 
        id: 'sih4', name: 'Silane', formula: 'SiH₄', ingredients: [{z:14, count:1}, {z:1, count:4}],
        structure: { atoms: [14, 1, 1, 1, 1], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
        isHidden: true
    },

    // --- ORGANIC HALIDES & ETHERS (54-58) ---
    { 
        id: 'ch2cl2', name: 'Dichloromethane', formula: 'CH₂Cl₂', ingredients: [{z:6, count:1}, {z:1, count:2}, {z:17, count:2}],
        structure: { atoms: [6, 17, 17, 1, 1], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
        isHidden: true
    },
    { 
        id: 'c2h3cl', name: 'Vinyl Chloride', formula: 'C₂H₃Cl', ingredients: [{z:6, count:2}, {z:1, count:3}, {z:17, count:1}],
        structure: { 
            atoms: [6, 6, 17, 1, 1, 1], 
            bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]] 
        },
        isHidden: true
    },
    { 
        id: 'c2h6o_ether', name: 'Dimethyl Ether', formula: 'C₂H₆O', ingredients: [{z:6, count:2}, {z:1, count:6}, {z:8, count:1}],
        structure: { 
            atoms: [8, 6, 6, 1, 1, 1, 1, 1, 1], // O center
            bonds: [[0, 1, 1], [0, 2, 1], [1, 3, 1], [1, 4, 1], [1, 5, 1], [2, 6, 1], [2, 7, 1], [2, 8, 1]]
        },
        isHidden: true
    },
    { 
        id: 'c4h10o', name: 'Diethyl Ether', formula: '(C₂H₅)₂O', ingredients: [{z:6, count:4}, {z:1, count:10}, {z:8, count:1}],
        structure: {
            // Chain: C(0)-C(1)-O(2)-C(3)-C(4)
            atoms: [6, 6, 8, 6, 6, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Corrected to 15 atoms
            bonds: [
                [0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], // Backbone
                [0, 5, 1], [0, 6, 1], [0, 7, 1], // C0 Methyl H
                [1, 8, 1], [1, 9, 1],            // C1 Methylene H
                [3, 10, 1], [3, 11, 1],          // C3 Methylene H
                [4, 12, 1], [4, 13, 1], [4, 14, 1] // C4 Methyl H
            ]
        },
        isHidden: true
    },
    { 
        id: 'c3h8o_iso', name: 'Isopropyl Alcohol', formula: 'C₃H₈O', ingredients: [{z:6, count:3}, {z:1, count:8}, {z:8, count:1}],
        structure: { 
            // C(0) is central CH, attached to C(1)H3, C(2)H3, and O(3)H
            atoms: [6, 6, 6, 8, 1, 1, 1, 1, 1, 1, 1, 1], 
            bonds: [
                [0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], // Central bonds
                [1, 5, 1], [1, 6, 1], [1, 7, 1],            // Left Methyl
                [2, 8, 1], [2, 9, 1], [2, 10, 1],           // Right Methyl
                [3, 11, 1]                                  // Hydroxyl H
            ]
        },
        isHidden: true
    },

    // --- AROMATICS (59-62) ---
    { 
        id: 'c7h8', name: 'Toluene', formula: 'C₇H₈', ingredients: [{z:6, count:7}, {z:1, count:8}],
        structure: {
            // Ring 0-5, Methyl C is 6
            atoms: [6, 6, 6, 6, 6, 6, 6, 1, 1, 1, 1, 1, 1, 1, 1],
            bonds: [
                [0,1,2], [1,2,1], [2,3,2], [3,4,1], [4,5,2], [5,0,1], // Ring
                [0,6,1], // Methyl attach
                [1,7,1], [2,8,1], [3,9,1], [4,10,1], [5,11,1], // Ring H
                [6,12,1], [6,13,1], [6,14,1] // Methyl H
            ]
        },
        isHidden: true
    },
    { 
        id: 'c6h6o_phenol', name: 'Phenol', formula: 'C₆H₅OH', ingredients: [{z:6, count:6}, {z:8, count:1}, {z:1, count:6}],
        structure: {
            atoms: [6, 6, 6, 6, 6, 6, 8, 1, 1, 1, 1, 1, 1],
            bonds: [
                [0,1,2], [1,2,1], [2,3,2], [3,4,1], [4,5,2], [5,0,1], // Ring
                [0,6,1], [6,12,1], // C-O-H
                [1,7,1], [2,8,1], [3,9,1], [4,10,1], [5,11,1] // Ring H
            ]
        },
        isHidden: true
    },
    { 
        id: 'c6h7n', name: 'Aniline', formula: 'C₆H₅NH₂', ingredients: [{z:6, count:6}, {z:7, count:1}, {z:1, count:7}],
        structure: {
            atoms: [6, 6, 6, 6, 6, 6, 7, 1, 1, 1, 1, 1, 1, 1],
            bonds: [
                [0,1,2], [1,2,1], [2,3,2], [3,4,1], [4,5,2], [5,0,1], // Ring
                [0,6,1], // C-N
                [6,12,1], [6,13,1], // N-H2
                [1,7,1], [2,8,1], [3,9,1], [4,10,1], [5,11,1] // Ring H
            ]
        },
        isHidden: true
    },
    { 
        id: 'c8h8', name: 'Styrene', formula: 'C₈H₈', ingredients: [{z:6, count:8}, {z:1, count:8}],
        structure: {
            // Ring 0-5, Vinyl 6-7
            atoms: [6, 6, 6, 6, 6, 6, 6, 6, 1, 1, 1, 1, 1, 1, 1, 1],
            bonds: [
                [0,1,2], [1,2,1], [2,3,2], [3,4,1], [4,5,2], [5,0,1], // Ring
                [0,6,1], [6,7,2], // C-CH=CH2
                [1,8,1], [2,9,1], [3,10,1], [4,11,1], [5,12,1], // Ring H
                [6,13,1], [7,14,1], [7,15,1] // Vinyl H
            ]
        },
        isHidden: true
    },

    // --- BIOLOGICAL & COMPLEX ESTERS (63-66) ---
    { 
        id: 'c2h6o2', name: 'Ethylene Glycol', formula: 'C₂H₆O₂', ingredients: [{z:6, count:2}, {z:1, count:6}, {z:8, count:2}],
        structure: {
            atoms: [6, 6, 8, 8, 1, 1, 1, 1, 1, 1],
            bonds: [
                [0, 1, 1], // C-C
                [0, 2, 1], [0, 4, 1], [0, 5, 1], // C1 bonds (O, H, H)
                [1, 3, 1], [1, 6, 1], [1, 7, 1], // C2 bonds (O, H, H)
                [2, 8, 1], [3, 9, 1]             // O-H bonds
            ]
        },
        isHidden: true
    },
    { 
        id: 'c3h8o3', name: 'Glycerol', formula: 'C₃H₈O₃', ingredients: [{z:6, count:3}, {z:1, count:8}, {z:8, count:3}],
        structure: {
            atoms: [6, 6, 6, 8, 8, 8, 1, 1, 1, 1, 1, 1, 1, 1],
            bonds: [
                [0, 1, 1], [1, 2, 1], // C-C Backbone
                [0, 3, 1], [1, 4, 1], [2, 5, 1], // C-O bonds
                [3, 6, 1], [4, 7, 1], [5, 8, 1], // O-H bonds
                [0, 9, 1], [0, 10, 1], // C1 Hs
                [1, 11, 1],            // C2 H
                [2, 12, 1], [2, 13, 1] // C3 Hs
            ]
        },
        isHidden: true
    },
    { 
        id: 'c3h6o3', name: 'Lactic Acid', formula: 'C₃H₆O₃', ingredients: [{z:6, count:3}, {z:1, count:6}, {z:8, count:3}],
        structure: {
            // C0(Carboxyl)-C1(Alpha)-C2(Methyl)
            atoms: [6, 6, 6, 8, 8, 8, 1, 1, 1, 1, 1, 1],
            bonds: [
                [0, 1, 1], [0, 3, 1], [0, 4, 2], // C0 bonds: C1, -OH, =O
                [1, 2, 1], [1, 5, 1], [1, 9, 1], // C1 bonds: C2, -OH, H
                [2, 6, 1], [2, 7, 1], [2, 8, 1], // C2 bonds: H, H, H
                [3, 10, 1], // Acidic H (on O3)
                [5, 11, 1]  // Alcohol H (on O5)
            ]
        },
        isHidden: true
    },
    { 
        id: 'c4h8o2_ea', name: 'Ethyl Acetate', formula: 'C₄H₈O₂', ingredients: [{z:6, count:4}, {z:1, count:8}, {z:8, count:2}],
        structure: { 
            // CH3-C(=O)-O-CH2-CH3
            atoms: [6, 6, 8, 8, 6, 6, 1, 1, 1, 1, 1, 1, 1, 1], 
            bonds: [
                [0, 1, 1], [0, 6, 1], [0, 7, 1], [0, 8, 1], // Acetyl Methyl
                [1, 2, 2], [1, 3, 1],                       // Carbonyl (=O, -O-)
                [3, 4, 1],                                  // -O- to Ethyl
                [4, 5, 1], [4, 9, 1], [4, 10, 1],           // Ethyl CH2
                [5, 11, 1], [5, 12, 1], [5, 13, 1]          // Ethyl CH3
            ]
        },
        isHidden: true
    },

    // --- NOBLE GASES (Monatomic Identification) ---
    { id: 'he', name: 'Helium', formula: 'He', ingredients: [{z:2, count:1}], structure: { atoms: [2], bonds: [] }, isHidden: true },
    { id: 'ne', name: 'Neon', formula: 'Ne', ingredients: [{z:10, count:1}], structure: { atoms: [10], bonds: [] }, isHidden: true },
    { id: 'ar', name: 'Argon', formula: 'Ar', ingredients: [{z:18, count:1}], structure: { atoms: [18], bonds: [] }, isHidden: true },
    { id: 'kr', name: 'Krypton', formula: 'Kr', ingredients: [{z:36, count:1}], structure: { atoms: [36], bonds: [] }, isHidden: true },
    { id: 'xe', name: 'Xenon', formula: 'Xe', ingredients: [{z:54, count:1}], structure: { atoms: [54], bonds: [] }, isHidden: true },

    // --- ADDITIONAL HIDDEN COMPOUNDS (Identification Only) ---
    { id: 'br2', name: 'Bromine', formula: 'Br₂', ingredients: [{z:35, count:2}], structure: { atoms: [35, 35], bonds: [[0, 1, 1]] }, isHidden: true },
    { id: 'i2', name: 'Iodine', formula: 'I₂', ingredients: [{z:53, count:2}], structure: { atoms: [53, 53], bonds: [[0, 1, 1]] }, isHidden: true },
    { id: 'no', name: 'Nitric Oxide', formula: 'NO', ingredients: [{z:7, count:1}, {z:8, count:1}], structure: { atoms: [7, 8], bonds: [[0, 1, 2]] }, isHidden: true },
    { id: 'hf', name: 'Hydrogen Fluoride', formula: 'HF', ingredients: [{z:1, count:1}, {z:9, count:1}], structure: { atoms: [9, 1], bonds: [[0, 1, 1]] }, isHidden: true },
    { id: 'bcl3', name: 'Boron Trichloride', formula: 'BCl₃', ingredients: [{z:5, count:1}, {z:17, count:3}], structure: { atoms: [5, 17, 17, 17], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] }, isHidden: true },
    { id: 'ph3', name: 'Phosphine', formula: 'PH₃', ingredients: [{z:15, count:1}, {z:1, count:3}], structure: { atoms: [15, 1, 1, 1], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] }, isHidden: true },
    { id: 'n2o4', name: 'Dinitrogen Tetroxide', formula: 'N₂O₄', ingredients: [{z:7, count:2}, {z:8, count:4}], structure: { atoms: [7, 7, 8, 8, 8, 8], bonds: [[0,1,1], [0,2,2], [0,3,1], [1,4,2], [1,5,1]] }, isHidden: true },
    { id: 'c5h12', name: 'Pentane', formula: 'C₅H₁₂', ingredients: [{z:6, count:5}, {z:1, count:12}], structure: { atoms: [6, 6, 6, 6, 6, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], bonds: [[0,1,1],[1,2,1],[2,3,1],[3,4,1], [0,5,1],[0,6,1],[0,7,1], [1,8,1],[1,9,1], [2,10,1],[2,11,1], [3,12,1],[3,13,1], [4,14,1],[4,15,1],[4,16,1]] }, isHidden: true },
    { id: 'c6h14', name: 'Hexane', formula: 'C₆H₁₄', ingredients: [{z:6, count:6}, {z:1, count:14}], structure: { atoms: [6,6,6,6,6,6, 1,1,1,1,1,1,1,1,1,1,1,1,1,1], bonds: [[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,5,1], [0,6,1],[0,7,1],[0,8,1], [1,9,1],[1,10,1], [2,11,1],[2,12,1], [3,13,1],[3,14,1], [4,15,1],[4,16,1], [5,17,1],[5,18,1],[5,19,1]] }, isHidden: true },
    { id: 'c7h16', name: 'Heptane', formula: 'C₇H₁₆', ingredients: [{z:6, count:7}, {z:1, count:16}], structure: { atoms: [6,6,6,6,6,6,6, 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], bonds: [[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,6,1], [0,7,1],[0,8,1],[0,9,1], [6,20,1],[6,21,1],[6,22,1], [1,10,1],[1,11,1], [2,12,1],[2,13,1], [3,14,1],[3,15,1], [4,16,1],[4,17,1], [5,18,1],[5,19,1]] }, isHidden: true },
    { id: 'c8h18', name: 'Octane', formula: 'C₈H₁₈', ingredients: [{z:6, count:8}, {z:1, count:18}], structure: { atoms: Array(8).fill(6).concat(Array(18).fill(1)), bonds: [[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,6,1],[6,7,1], [0,8,1],[0,9,1],[0,10,1], [7,23,1],[7,24,1],[7,25,1], [1,11,1],[1,12,1], [2,13,1],[2,14,1], [3,15,1],[3,16,1], [4,17,1],[4,18,1], [5,19,1],[5,20,1], [6,21,1],[6,22,1]] }, isHidden: true },
    { id: 'c10h22', name: 'Decane', formula: 'C₁₀H₂₂', ingredients: [{z:6, count:10}, {z:1, count:22}], structure: { atoms: Array(10).fill(6).concat(Array(22).fill(1)), bonds: [[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,6,1],[6,7,1],[7,8,1],[8,9,1],[0,10,1],[0,11,1],[0,12,1],[1,13,1],[1,14,1],[2,15,1],[2,16,1],[3,17,1],[3,18,1],[4,19,1],[4,20,1],[5,21,1],[5,22,1],[6,23,1],[6,24,1],[7,25,1],[7,26,1],[8,27,1],[8,28,1],[9,29,1],[9,30,1],[9,31,1]] }, isHidden: true },
    { id: 'c4h10_iso', name: 'Isobutane', formula: 'C₄H₁₀', ingredients: [{z:6, count:4}, {z:1, count:10}], structure: { atoms: [6, 6, 6, 6, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], bonds: [[0,1,1], [0,2,1], [0,3,1], [0,4,1], [1,5,1],[1,6,1],[1,7,1], [2,8,1],[2,9,1],[2,10,1], [3,11,1],[3,12,1],[3,13,1]] }, isHidden: true },
    { id: 'c5h12_neo', name: 'Neopentane', formula: 'C₅H₁₂', ingredients: [{z:6, count:5}, {z:1, count:12}], structure: { atoms: [6, 6, 6, 6, 6, 1,1,1, 1,1,1, 1,1,1, 1,1,1], bonds: [[0,1,1],[0,2,1],[0,3,1],[0,4,1], [1,5,1],[1,6,1],[1,7,1], [2,8,1],[2,9,1],[2,10,1], [3,11,1],[3,12,1],[3,13,1], [4,14,1],[4,15,1],[4,16,1]] }, isHidden: true },
    { id: 'c3h6_cyc', name: 'Cyclopropane', formula: 'C₃H₆', ingredients: [{z:6, count:3}, {z:1, count:6}], structure: { atoms: [6,6,6, 1,1,1,1,1,1], bonds: [[0,1,1],[1,2,1],[2,0,1], [0,3,1],[0,4,1], [1,5,1],[1,6,1], [2,7,1],[2,8,1]] }, isHidden: true },
    { id: 'c4h8_cyc', name: 'Cyclobutane', formula: 'C₄H₈', ingredients: [{z:6, count:4}, {z:1, count:8}], structure: { atoms: [6,6,6,6, 1,1,1,1,1,1,1,1], bonds: [[0,1,1],[1,2,1],[2,3,1],[3,0,1], [0,4,1],[0,5,1], [1,6,1],[1,7,1], [2,8,1],[2,9,1], [3,10,1],[3,11,1]] }, isHidden: true },
    { id: 'c5h10_cyc', name: 'Cyclopentane', formula: 'C₅H₁₀', ingredients: [{z:6, count:5}, {z:1, count:10}], structure: { atoms: [6,6,6,6,6, 1,1,1,1,1,1,1,1,1,1], bonds: [[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,0,1], [0,5,1],[0,6,1], [1,7,1],[1,8,1], [2,9,1],[2,10,1], [3,11,1],[3,12,1], [4,13,1],[4,14,1]] }, isHidden: true },
    { id: 'c3h6_propene', name: 'Propene', formula: 'C₃H₆', ingredients: [{z:6, count:3}, {z:1, count:6}], structure: { atoms: [6,6,6, 1,1,1,1,1,1], bonds: [[0,1,2],[1,2,1], [0,3,1],[0,4,1], [1,5,1], [2,6,1],[2,7,1],[2,8,1]] }, isHidden: true },
    { id: 'c4h8_butene', name: '1-Butene', formula: 'C₄H₈', ingredients: [{z:6, count:4}, {z:1, count:8}], structure: { atoms: [6,6,6,6, 1,1,1,1,1,1,1,1], bonds: [[0,1,2],[1,2,1],[2,3,1], [0,4,1],[0,5,1], [1,6,1], [2,7,1],[2,8,1], [3,9,1],[3,10,1],[3,11,1]] }, isHidden: true },
    { id: 'c4h8_iso', name: 'Isobutylene', formula: 'C₄H₈', ingredients: [{z:6, count:4}, {z:1, count:8}], structure: { atoms: [6,6,6,6, 1,1,1,1,1,1,1,1], bonds: [[0,1,2],[1,2,1],[1,3,1], [0,4,1],[0,5,1], [2,6,1],[2,7,1],[2,8,1], [3,9,1],[3,10,1],[3,11,1]] }, isHidden: true },
    { id: 'c5h8_iso', name: 'Isoprene', formula: 'C₅H₈', ingredients: [{z:6, count:5}, {z:1, count:8}], structure: { atoms: [6, 6, 6, 6, 6, 1, 1, 1, 1, 1, 1, 1, 1], bonds: [[0,1,2],[1,2,1],[2,3,2], [1,4,1], [0,5,1],[0,6,1], [2,7,1], [3,8,1],[3,9,1], [4,10,1],[4,11,1],[4,12,1]] }, isHidden: true },
    { id: 'c3h7oh', name: '1-Propanol', formula: 'C₃H₈O', ingredients: [{z:6, count:3}, {z:1, count:8}, {z:8, count:1}], structure: { atoms: [6,6,6,8, 1,1,1,1,1,1,1,1], bonds: [[0,1,1],[1,2,1],[2,3,1],[0,4,1],[0,5,1],[0,6,1],[1,7,1],[1,8,1],[2,9,1],[2,10,1],[3,11,1]] }, isHidden: true },
    { id: 'c4h9oh', name: '1-Butanol', formula: 'C₄H₁₀O', ingredients: [{z:6, count:4}, {z:1, count:10}, {z:8, count:1}], structure: { atoms: [6,6,6,6,8, 1,1,1,1,1,1,1,1,1,1], bonds: [[0,1,1],[1,2,1],[2,3,1],[3,4,1], [0,5,1],[0,6,1],[0,7,1], [1,8,1],[1,9,1], [2,10,1],[2,11,1], [3,12,1],[3,13,1], [4,14,1]] }, isHidden: true },
    { id: 'c4h9oh_t', name: 'tert-Butanol', formula: 'C₄H₁₀O', ingredients: [{z:6, count:4}, {z:1, count:10}, {z:8, count:1}], structure: { atoms: [6,6,6,6,8, 1,1,1,1,1,1,1,1,1,1], bonds: [[0,1,1],[0,2,1],[0,3,1],[0,4,1], [1,5,1],[1,6,1],[1,7,1], [2,8,1],[2,9,1],[2,10,1], [3,11,1],[3,12,1],[3,13,1], [4,14,1]] }, isHidden: true },
    { id: 'c7h8o_benz', name: 'Benzyl Alcohol', formula: 'C₇H₈O', ingredients: [{z:6, count:7}, {z:1, count:8}, {z:8, count:1}], structure: { atoms: [6, 6, 6, 6, 6, 6, 6, 8, 1, 1, 1, 1, 1, 1, 1, 1], bonds: [[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1], [0,6,1], [6,7,1], [6,13,1],[6,14,1], [7,15,1], [1,8,1],[2,9,1],[3,10,1],[4,11,1],[5,12,1]] }, isHidden: true },
    { id: 'c2h4o_epox', name: 'Ethylene Oxide', formula: 'C₂H₄O', ingredients: [{z:6, count:2}, {z:1, count:4}, {z:8, count:1}], structure: { atoms: [6,6,8, 1,1,1,1], bonds: [[0,1,1],[1,2,1],[2,0,1], [0,3,1],[0,4,1], [1,5,1],[1,6,1]] }, isHidden: true },
    { id: 'c5h12o_mtbe', name: 'MTBE', formula: 'C₅H₁₂O', ingredients: [{z:6, count:5}, {z:1, count:12}, {z:8, count:1}], structure: { atoms: [6, 8, 6, 6, 6, 6, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], bonds: [[0,1,1], [1,2,1], [2,3,1], [2,4,1], [2,5,1], [0,6,1],[0,7,1],[0,8,1], [3,9,1],[3,10,1],[3,11,1], [4,12,1],[4,13,1],[4,14,1], [5,15,1],[5,16,1],[5,17,1]] }, isHidden: true },
    { id: 'c2h4o_ald', name: 'Acetaldehyde', formula: 'CH₃CHO', ingredients: [{z:6, count:2}, {z:1, count:4}, {z:8, count:1}], structure: { atoms: [6,6,8, 1,1,1,1], bonds: [[0,1,1],[1,2,2], [0,3,1],[0,4,1],[0,5,1], [1,6,1]] }, isHidden: true },
    { id: 'c3h6o_ald', name: 'Propanal', formula: 'C₃H₆O', ingredients: [{z:6, count:3}, {z:1, count:6}, {z:8, count:1}], structure: { atoms: [6,6,6,8, 1,1,1,1,1,1], bonds: [[0,1,1],[1,2,1],[2,3,2], [0,4,1],[0,5,1],[0,6,1], [1,7,1],[1,8,1], [2,9,1]] }, isHidden: true },
    { id: 'c4h8o_mek', name: 'Butanone', formula: 'C₄H₈O', ingredients: [{z:6, count:4}, {z:1, count:8}, {z:8, count:1}], structure: { atoms: [6,6,6,6,8, 1,1,1,1,1,1,1,1], bonds: [[0,1,1],[1,2,1],[2,3,1],[1,4,2], [0,5,1],[0,6,1],[0,7,1], [2,8,1],[2,9,1], [3,10,1],[3,11,1],[3,12,1]] }, isHidden: true },
    { id: 'c6h10o', name: 'Cyclohexanone', formula: 'C₆H₁₀O', ingredients: [{z:6, count:6}, {z:1, count:10}, {z:8, count:1}], structure: { atoms: [6, 6, 6, 6, 6, 6, 8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], bonds: [[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,5,1],[5,0,1], [0,6,2], [1,7,1],[1,8,1],[2,9,1],[2,10,1],[3,11,1],[3,12,1],[4,13,1],[4,14,1],[5,15,1],[5,16,1]] }, isHidden: true },
    { id: 'c7h6o', name: 'Benzaldehyde', formula: 'C₇H₆O', ingredients: [{z:6, count:7}, {z:1, count:6}, {z:8, count:1}], structure: { atoms: [6,6,6,6,6,6, 6,8, 1,1,1,1,1,1], bonds: [[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1], [0,6,1], [6,7,2], [6,13,1], [1,8,1],[2,9,1],[3,10,1],[4,11,1],[5,12,1]] }, isHidden: true },
    { id: 'c3h6o2_prop', name: 'Propionic Acid', formula: 'C₃H₆O₂', ingredients: [{z:6, count:3}, {z:1, count:6}, {z:8, count:2}], structure: { atoms: [6,6,6,8,8, 1,1,1,1,1,1], bonds: [[0,1,1],[1,2,1], [2,3,2],[2,4,1], [0,5,1],[0,6,1],[0,7,1], [1,8,1],[1,9,1], [4,10,1]] }, isHidden: true },
    { id: 'c4h8o2_but', name: 'Butyric Acid', formula: 'C₄H₈O₂', ingredients: [{z:6, count:4}, {z:1, count:8}, {z:8, count:2}], structure: { atoms: [6,6,6,6,8,8, 1,1,1,1,1,1,1,1], bonds: [[0,1,1],[1,2,1],[2,3,1], [3,4,2],[3,5,1], [0,6,1],[0,7,1],[0,8,1], [1,9,1],[1,10,1], [2,11,1],[2,12,1], [5,13,1]] }, isHidden: true },
    { id: 'c7h6o2_benz', name: 'Benzoic Acid', formula: 'C₇H₆O₂', ingredients: [{z:6, count:7}, {z:1, count:6}, {z:8, count:2}], structure: { atoms: [6,6,6,6,6,6, 6,8,8, 1,1,1,1,1,1], bonds: [[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1], [0,6,1], [6,7,2],[6,8,1], [8,14,1], [1,9,1],[2,10,1],[3,11,1],[4,12,1],[5,13,1]] }, isHidden: true },
    { id: 'c2h4o2_meform', name: 'Methyl Formate', formula: 'C₂H₄O₂', ingredients: [{z:6, count:2}, {z:1, count:4}, {z:8, count:2}], structure: { atoms: [6,8,8,6, 1,1,1,1], bonds: [[0,1,2],[0,2,1],[2,3,1], [0,4,1], [3,5,1],[3,6,1],[3,7,1]] }, isHidden: true },
    { id: 'c3h6o2_meac', name: 'Methyl Acetate', formula: 'C₃H₆O₂', ingredients: [{z:6, count:3}, {z:1, count:6}, {z:8, count:2}], structure: { atoms: [6,6,8,8,6, 1,1,1,1,1,1], bonds: [[0,1,1],[1,2,2],[1,3,1],[3,4,1], [0,5,1],[0,6,1],[0,7,1], [4,8,1],[4,9,1],[4,10,1]] }, isHidden: true },
    { id: 'ch5n', name: 'Methylamine', formula: 'CH₃NH₂', ingredients: [{z:6, count:1}, {z:1, count:5}, {z:7, count:1}], structure: { atoms: [6,7, 1,1,1, 1,1], bonds: [[0,1,1], [0,2,1],[0,3,1],[0,4,1], [1,5,1],[1,6,1]] }, isHidden: true },
    { id: 'c2h7n_di', name: 'Dimethylamine', formula: '(CH₃)₂NH', ingredients: [{z:6, count:2}, {z:1, count:7}, {z:7, count:1}], structure: { atoms: [7,6,6, 1,1,1,1,1,1,1], bonds: [[0,1,1],[0,2,1],[0,3,1], [1,4,1],[1,5,1],[1,6,1], [2,7,1],[2,8,1],[2,9,1]] }, isHidden: true },
    { id: 'c2h3n', name: 'Acetonitrile', formula: 'CH₃CN', ingredients: [{z:6, count:2}, {z:1, count:3}, {z:7, count:1}], structure: { atoms: [6,6,7, 1,1,1], bonds: [[0,1,1],[1,2,3], [0,3,1],[0,4,1],[0,5,1]] }, isHidden: true },
    { id: 'c2h5no', name: 'Acetamide', formula: 'C₂H₅NO', ingredients: [{z:6, count:2}, {z:1, count:5}, {z:7, count:1}, {z:8, count:1}], structure: { atoms: [6,6,8,7, 1,1,1,1,1], bonds: [[0,1,1], [1,2,2],[1,3,1], [0,4,1],[0,5,1],[0,6,1], [3,7,1],[3,8,1]] }, isHidden: true },
    { id: 'ch4s', name: 'Methanethiol', formula: 'CH₃SH', ingredients: [{z:6, count:1}, {z:1, count:4}, {z:16, count:1}], structure: { atoms: [6,16, 1,1,1,1], bonds: [[0,1,1], [0,2,1],[0,3,1],[0,4,1], [1,5,1]] }, isHidden: true },
    { id: 'c2h6os', name: 'Dimethyl Sulfoxide', formula: 'C₂H₆OS', ingredients: [{z:6, count:2}, {z:1, count:6}, {z:16, count:1}, {z:8, count:1}], structure: { atoms: [16,8,6,6, 1,1,1,1,1,1], bonds: [[0,1,2], [0,2,1],[0,3,1], [2,4,1],[2,5,1],[2,6,1], [3,7,1],[3,8,1],[3,9,1]] }, isHidden: true },
    { id: 'ch3cl', name: 'Chloromethane', formula: 'CH₃Cl', ingredients: [{z:6, count:1}, {z:1, count:3}, {z:17, count:1}], structure: { atoms: [6,17, 1,1,1], bonds: [[0,1,1], [0,2,1],[0,3,1],[0,4,1]] }, isHidden: true },
    { id: 'c2h5cl', name: 'Chloroethane', formula: 'C₂H₅Cl', ingredients: [{z:6, count:2}, {z:1, count:5}, {z:17, count:1}], structure: { atoms: [6,6,17, 1,1,1,1,1], bonds: [[0,1,1],[1,2,1], [0,3,1],[0,4,1],[0,5,1], [1,6,1],[1,7,1]] }, isHidden: true },
    { id: 'c2f4', name: 'Tetrafluoroethylene', formula: 'C₂F₄', ingredients: [{z:6, count:2}, {z:9, count:4}], structure: { atoms: [6,6, 9,9,9,9], bonds: [[0,1,2], [0,2,1],[0,3,1], [1,4,1],[1,5,1]] }, isHidden: true },
    { id: 'c6h5cl', name: 'Chlorobenzene', formula: 'C₆H₅Cl', ingredients: [{z:6, count:6}, {z:1, count:5}, {z:17, count:1}], structure: { atoms: [6,6,6,6,6,6, 17, 1,1,1,1,1], bonds: [[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1], [0,6,1], [1,7,1],[2,8,1],[3,9,1],[4,10,1],[5,11,1]] }, isHidden: true },
    { id: 'c10h8', name: 'Naphthalene', formula: 'C₁₀H₈', ingredients: [{z:6, count:10}, {z:1, count:8}], structure: { atoms: [6,6,6,6,6,6,6,6,6,6, 1,1,1,1,1,1,1,1], bonds: [[0,1,1],[1,2,2],[2,3,1],[3,4,2],[4,5,1],[5,0,2], [0,6,1],[6,7,2],[7,8,1],[8,9,2],[9,5,1], [1,10,1],[2,11,1],[3,12,1],[4,13,1],[6,14,1],[7,15,1],[8,16,1],[9,17,1]] }, isHidden: true },
    { id: 'c7h5n3o6', name: 'TNT', formula: 'C₇H₅N₃O₆', ingredients: [{z:6, count:7}, {z:1, count:5}, {z:7, count:3}, {z:8, count:6}], structure: { atoms: [6,6,6,6,6,6, 6, 7,7,7, 8,8,8,8,8,8, 1,1,1,1,1], bonds: [[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1], [0,6,1], [6,18,1],[6,19,1],[6,20,1], [1,7,1], [7,10,2], [7,11,1], [3,8,1], [8,12,2], [8,13,1], [5,9,1], [9,14,2], [9,15,1], [2,16,1], [4,17,1]] }, isHidden: true },
    { id: 'c8h9no2_apap', name: 'Acetaminophen', formula: 'C₈H₉NO₂', ingredients: [{z:6, count:8}, {z:1, count:9}, {z:7, count:1}, {z:8, count:2}], structure: { atoms: [6, 6, 6, 6, 6, 6, 8, 7, 6, 6, 8, 1, 1, 1, 1, 1, 1, 1, 1, 1], bonds: [[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1], [0,6,1], [6,11,1], [3,7,1], [7,12,1], [7,8,1], [8,10,2], [8,9,1], [9,13,1],[9,14,1],[9,15,1], [1,16,1],[2,17,1],[4,18,1],[5,19,1]] }, isHidden: true },
    { id: 'c9h8o4_asp', name: 'Aspirin', formula: 'C₉H₈O₄', ingredients: [{z:6, count:9}, {z:1, count:8}, {z:8, count:4}], structure: { atoms: [6, 6, 6, 6, 6, 6, 6, 8, 8, 8, 6, 6, 8, 1, 1, 1, 1, 1, 1, 1, 1], bonds: [[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1], [0,6,1], [6,7,2], [6,8,1], [8,13,1], [1,9,1], [9,10,1], [10,12,2], [10,11,1], [11,14,1],[11,15,1],[11,16,1], [2,17,1],[3,18,1],[4,19,1],[5,20,1]] }, isHidden: true },
    { id: 'c8h10n4o2_caff', name: 'Caffeine', formula: 'C₈H₁₀N₄O₂', ingredients: [{z:6,count:8},{z:1,count:10},{z:7,count:4},{z:8,count:2}], structure: { atoms: [7,6,7,6,6,6, 7,6,7, 8,8, 6,6,6, 1,1,1,1,1,1,1,1,1,1], bonds: [[0,1,1],[1,2,1],[2,3,1],[3,4,1],[4,5,2],[5,0,1], [1,9,2], [3,10,2], [4,6,1],[6,7,1],[7,8,2],[8,5,1], [0,11,1], [2,12,1], [8,13,1], [7,14,1], [11,15,1],[11,16,1],[11,17,1], [12,18,1],[12,19,1],[12,20,1], [13,21,1],[13,22,1],[13,23,1]] }, isHidden: true }
];
