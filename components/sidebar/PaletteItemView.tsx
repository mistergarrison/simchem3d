
import React from 'react';
import { PaletteItem } from '../../types/ui';

interface PaletteItemViewProps {
    item: PaletteItem;
    isActive: boolean;
    onEdit?: (e: React.MouseEvent) => void;
}

const formatHalfLife = (val: number | "stable") => {
    if (val === 'stable') return 'Stable';
    if (val <= 0) return '0 s';
    if (val < 1e-6) return `${(val * 1e9).toFixed(0)} ns`;
    if (val < 1e-3) return `${(val * 1e6).toFixed(0)} µs`;
    if (val < 1) return `${(val * 1000).toFixed(0)} ms`;
    if (val < 60) return `${parseFloat(val.toFixed(2))} s`;
    const min = val / 60;
    if (min < 60) return `${parseFloat(min.toFixed(1))} m`;
    const h = min / 60;
    if (h < 24) return `${parseFloat(h.toFixed(1))} h`;
    const d = h / 24;
    if (d < 365.25) return `${parseFloat(d.toFixed(1))} d`;
    const y = d / 365.25;
    if (y < 1000) return `${parseFloat(y.toFixed(1))} y`;
    if (y < 1e6) return `${parseFloat((y / 1000).toFixed(2))} ky`;
    if (y < 1e9) return `${parseFloat((y / 1e6).toFixed(2))} My`;
    return `${parseFloat((y / 1e9).toFixed(2))} Gy`;
};

export const PaletteItemView: React.FC<PaletteItemViewProps> = ({ item, isActive, onEdit }) => {
    if (item.type === 'atom' && item.element) {
        const iso = item.element.iso[item.isotopeIndex || 0];
        const mass = Math.round(iso.m);
        const isNucleon = item.element.s === 'p⁺' || item.element.s === 'n';

        return (
          <div className="flex items-center gap-2 min-w-0 flex-1">
              <div 
                  className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-md shadow-inner relative"
                  style={{ backgroundColor: `${item.element.c}20`, color: item.element.c, border: `1px solid ${item.element.c}40` }}
              >
                  <span className="text-[7px] absolute top-0.5 left-1 leading-none opacity-80">{mass}</span>
                  {item.element.s}
              </div>
              <div className="min-w-0 overflow-hidden flex flex-col justify-center w-full pr-1">
                  <div className={`font-bold text-xs truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>{item.element.n}</div>
                  
                  {isNucleon ? (
                      <div className="text-[10px] text-gray-500 font-mono">{iso.m}u</div>
                  ) : (
                      <button
                          onClick={onEdit}
                          onMouseDown={(e) => e.stopPropagation()} 
                          className="flex items-center justify-between gap-1 text-[10px] font-medium text-gray-200 bg-gray-900 hover:bg-gray-800 border border-gray-600 hover:border-gray-400 rounded px-2 py-1 transition-all mt-1 w-full shadow-sm group/btn"
                          title="Change Isotope"
                      >
                          <span className="font-mono flex items-center gap-1">
                              {iso.m}u
                              {iso.hl !== 'stable' && <span className="text-yellow-500 text-[9px]">☢</span>}
                          </span>
                          <div className="border-l border-gray-700 pl-1.5 ml-1 h-3 flex items-center">
                             <svg className="w-2.5 h-2.5 text-gray-500 group-hover/btn:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                      </button>
                  )}
              </div>
          </div>
        );
    } else if (item.type === 'molecule' && item.molecule) {
        return (
          <div className="flex items-center gap-2 min-w-0 flex-1 relative group/molecule-card">
              
              {/* Default View (Truncated) */}
              <div className="flex items-center gap-2 min-w-0 w-full">
                  <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-purple-900/30 border border-purple-500/50 flex items-center justify-center font-bold text-[10px] text-purple-300 shadow-inner overflow-hidden">
                      {item.molecule.formula}
                  </div>
                  <div className="flex-1 min-w-0">
                      <div 
                        className={`font-bold text-xs truncate ${isActive ? 'text-white' : 'text-gray-300'}`}
                      >
                        {item.molecule.name}
                      </div>
                      <div className="text-[9px] text-gray-500 truncate">Molecule</div>
                  </div>
              </div>

              {/* Hover Expanded View (Overlay) */}
              <div className="hidden lg:group-hover/molecule-card:flex absolute left-[-4px] top-[-4px] bottom-[-4px] right-auto min-w-[calc(100%+8px)] w-max z-[60] bg-gray-800 border border-gray-500 rounded-lg shadow-2xl items-center gap-2 p-1.5 pl-2 pr-4 animate-in fade-in duration-75">
                   <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-purple-900/30 border border-purple-500/50 flex items-center justify-center font-bold text-[10px] text-purple-300 shadow-inner">
                      {item.molecule.formula}
                   </div>
                   <div className="flex flex-col">
                       <div className="font-bold text-xs text-white whitespace-nowrap">{item.molecule.name}</div>
                       <div className="text-[9px] text-purple-400 font-mono whitespace-nowrap">{item.molecule.formula}</div>
                   </div>
              </div>
          </div>
        );
    } else if (item.type === 'particle' && item.particle) {
        return (
          <div className="flex items-center gap-2 min-w-0 flex-1">
              <div 
                  className="w-8 h-8 flex-shrink-0 rounded-full border flex items-center justify-center"
                  style={{ backgroundColor: `${item.particle.color}20`, borderColor: item.particle.color, color: item.particle.color }}
              >
                  <span className="text-md font-bold">{item.particle.symbol}</span>
              </div>
              <div className="min-w-0">
                  <div className={`font-bold text-xs truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>{item.particle.name}</div>
                  <div className="text-[9px] text-gray-500">Particle</div>
              </div>
          </div>
        );
    }
    return null;
};

export { formatHalfLife };
