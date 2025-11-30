import React from 'react';
import { SM_PARTICLES } from '../../data/elements';
import { GameMode } from '../../types/ui';

interface StandardModelPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (particleId: string) => void;
  gameMode: GameMode;
  discoveredParticles: Set<string>;
}

const StandardModelPicker: React.FC<StandardModelPickerProps> = ({ isOpen, onClose, onSelect, gameMode, discoveredParticles }) => {
  if (!isOpen) return null;

  const formatMass = (massMeV: number) => {
      if (massMeV === 0) return null;
      if (massMeV < 0.001) return `${(massMeV * 1e6).toFixed(0)} eV`;
      if (massMeV < 1) return `${(massMeV * 1000).toFixed(0)} keV`;
      if (massMeV > 1000) return `${(massMeV / 1000).toFixed(1)} GeV`;
      return `${massMeV.toFixed(0)} MeV`;
  };

  const renderParticle = (id: string, labelOverride?: string) => {
    const p = SM_PARTICLES.find(x => x.id === id);
    if (!p) return <div className="w-full h-20 bg-gray-900/50 rounded-md border border-gray-800" />;

    const isUnlocked = gameMode === 'sandbox' || discoveredParticles.has(p.id);
    const massLabel = formatMass(p.massMeV);
    
    return (
      <button
        key={p.id}
        disabled={!isUnlocked}
        onClick={() => {
            if (isUnlocked) {
                onSelect(p.id);
                onClose();
            }
        }}
        className={`relative p-1 border rounded-md flex flex-col items-center justify-center h-20 w-full transition-all duration-200 group
            ${isUnlocked 
                ? 'bg-gray-800 border-gray-600 hover:border-white hover:bg-gray-700 cursor-pointer' 
                : 'bg-gray-900 border-gray-800 opacity-30 cursor-not-allowed grayscale'
            }
        `}
      >
        <div 
            className="absolute inset-0 opacity-10 rounded-md"
            style={{ backgroundColor: p.color }}
        />
        <div className="text-lg font-bold mb-0.5" style={{ color: isUnlocked ? p.color : '#666' }}>{p.symbol}</div>
        <div className="text-[9px] text-gray-400 font-bold leading-none text-center px-1">{labelOverride || p.name}</div>
        <div className="text-[8px] text-gray-500 font-mono mt-1 opacity-70">
            {massLabel}
        </div>
        
        {/* Lock Overlay */}
        {!isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md">
                <span className="text-xs">🔒</span>
            </div>
        )}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-950 border border-gray-700 rounded-xl shadow-2xl w-full max-w-5xl p-6 overflow-y-auto max-h-[95vh]">
        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">Standard Model {gameMode === 'discovery' && <span className="text-sm font-normal text-purple-400 ml-2">(Discovery Mode)</span>}</h2>
            <p className="text-gray-400 text-sm">Select elementary particles. Unlock them via Pair Production (Energy Tool).</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-5 gap-3 mb-6">
            {/* Headers */}
            <div className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider pb-2">Generation I</div>
            <div className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider pb-2">Generation II</div>
            <div className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider pb-2">Generation III</div>
            <div className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider pb-2">Gauge Bosons</div>
            <div className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider pb-2">Scalar Bosons</div>

            {/* Row 1: Up-Type Quarks + Gluon + Higgs */}
            {renderParticle('up')}
            {renderParticle('charm')}
            {renderParticle('top')}
            {renderParticle('gluon')}
            {renderParticle('higgs')}

            {/* Row 2: Down-Type Quarks + Photon */}
            {renderParticle('down')}
            {renderParticle('strange')}
            {renderParticle('bottom')}
            {renderParticle('photon')}
            <div className="w-full h-20" /> {/* Spacer */}

            {/* Row 3: Charged Leptons + W Boson */}
            {renderParticle('electron')}
            {renderParticle('muon')}
            {renderParticle('tau')}
            {renderParticle('w_boson')}
            <div className="w-full h-20" /> {/* Spacer */}

            {/* Row 4: Neutrinos + Z Boson */}
            {renderParticle('nu_e', 'e Neutrino')}
            {renderParticle('nu_mu', 'μ Neutrino')}
            {renderParticle('nu_tau', 'τ Neutrino')}
            {renderParticle('z_boson')}
            <div className="w-full h-20" /> {/* Spacer */}

            {/* Row 5: Composite Hadrons Header */}
            <div className="col-span-5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider pb-2 pt-4 border-t border-gray-800 mt-2">Composite Hadrons</div>
            
            {/* Row 6: Hadrons */}
            {renderParticle('proton')}
            {renderParticle('neutron')}
            {/* Fill rest of row with spacers if needed, or just let grid flow */}
            <div className="w-full h-20" />
            <div className="w-full h-20" />
            <div className="w-full h-20" />
        </div>
        
        <div className="text-[10px] text-gray-600 mt-4 border-t border-gray-800 pt-2">
            * Particle masses are approximate. Anti-particles are available via decay or pair production mechanics in the simulation.
        </div>
      </div>
    </div>
  );
};

export default StandardModelPicker;