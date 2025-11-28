
import React from 'react';
import { Molecule, GameMode } from '../types';
import { MOLECULES } from '../molecules';
import { ELEMENTS } from '../elements';

interface MoleculePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (molecule: Molecule) => void;
  gameMode: GameMode;
  discoveredMolecules: Set<string>;
}

/**
 * MoleculePicker Component
 * 
 * Displays a visual catalog of predefined molecular molecules.
 * 
 * Visual Logic:
 * - Renders a grid of cards, each representing a chemical compound.
 * - Dynamically generates visual previews using colored dots based on the 
 *   molecule's stoichiometry (e.g., Water = 2 White Dots [H], 1 Red Dot [O]).
 * - Clicking a molecule triggers the "Super Crunch" gravity well effect in the Canvas.
 */
const MoleculePicker: React.FC<MoleculePickerProps> = ({ isOpen, onClose, onSelect, gameMode, discoveredMolecules }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <div>
              <h2 className="text-2xl font-bold text-white">Molecule Recipes {gameMode === 'discovery' && <span className="text-sm font-normal text-purple-400 ml-2">(Discovery Mode)</span>}</h2>
              <p className="text-gray-400 text-sm mt-1">Select a molecule to synthesize. Ingredients will spawn in a reaction cloud.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {MOLECULES.map((molecule) => {
            const isLocked = gameMode === 'discovery' && !discoveredMolecules.has(molecule.id);
            return (
            <button
              key={molecule.id}
              disabled={isLocked}
              onClick={() => { if (!isLocked) { onSelect(molecule); onClose(); } }}
              className={`relative border p-3 rounded-lg flex flex-col items-center justify-between group transition-all h-28
                 ${isLocked 
                    ? 'bg-gray-900 border-gray-800 cursor-not-allowed opacity-50' 
                    : 'bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-750 cursor-pointer'
                 }
              `}
            >
              {isLocked ? (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">🔒</div>
              ) : (
                  <div className="flex items-center justify-center gap-1 mb-2 flex-grow">
                     {/* Visual representation of ingredients as dots */}
                     <div className="flex flex-wrap justify-center gap-1 max-w-[80%]">
                        {molecule.ingredients.map((ing, i) => {
                             const el = ELEMENTS.find(e => e.z === ing.z);
                             return Array.from({length: ing.count}).map((_, j) => (
                                 <div 
                                    key={`${i}-${j}`} 
                                    className="w-1.5 h-1.5 rounded-full shadow-sm"
                                    style={{ backgroundColor: el?.c || '#fff' }}
                                 />
                             ));
                        })}
                     </div>
                  </div>
              )}
              
              <div className="text-center w-full">
                  <div className="font-bold text-white text-sm truncate w-full px-1" style={{ opacity: isLocked ? 0.3 : 1 }}>{isLocked ? '???' : molecule.formula}</div>
                  <div className="text-[10px] text-gray-400 group-hover:text-blue-300 truncate w-full px-1">{isLocked ? 'Locked' : molecule.name}</div>
              </div>
            </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MoleculePicker;
