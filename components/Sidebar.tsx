
import React, { useState, useRef, useEffect } from 'react';
import { PaletteItem, ToolType, GameMode } from '../types';

interface SidebarProps {
  palette: PaletteItem[];
  onOpenTable: () => void;
  onOpenMolecules: () => void;
  onOpenStandardModel: () => void;
  onOpenHelp: () => void;
  onRemoveFromPalette: (id: string) => void;
  onUpdateIsotope: (id: string, newIndex: number) => void;
  sliderValue: number;
  setSliderValue: (v: number) => void;
  onClear: () => void;
  onSpawnItem: (item: PaletteItem, pos?: {x: number, y: number}) => void;
  showBonds: boolean;
  onToggleBonds: () => void;
  viewMode: 'solid' | 'glass';
  onToggleViewMode: () => void;
  activeTool: ToolType;
  onSelectTool: (t: ToolType) => void;
  onRunTest: () => void;
  gameMode: GameMode;
  onToggleGameMode: () => void;
  hasDiscoveredMolecules: boolean;
  hasDiscoveredElements: boolean;
  hasDiscoveredParticles: boolean;
  newlyUnlocked: {
      particles: boolean;
      elements: boolean;
      molecules: boolean;
      lasso: boolean;
  };
}

interface TapState {
    id: string;
    startX: number;
    startY: number;
    ts: number;
    hasMoves: boolean;
    initialScrollLeft: number;
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

// Reusable Add Toolbar Component
const AddEntityButtons: React.FC<{
    onOpenStandardModel: () => void;
    onOpenTable: () => void;
    onOpenMolecules: () => void;
    onClose?: () => void;
    canOpenParticles: boolean;
    canOpenAtoms: boolean;
    canOpenMolecules: boolean;
    newlyUnlocked: { particles: boolean, elements: boolean, molecules: boolean };
}> = ({ onOpenStandardModel, onOpenTable, onOpenMolecules, onClose, canOpenParticles, canOpenAtoms, canOpenMolecules, newlyUnlocked }) => {
    const handle = (fn: () => void) => {
        fn();
        if (onClose) onClose();
    };

    return (
        <div className="grid grid-cols-3 gap-1">
            <button 
                onClick={() => canOpenParticles && handle(onOpenStandardModel)} 
                disabled={!canOpenParticles}
                className={`relative py-2 border rounded text-xs flex flex-col items-center gap-1 group transition-colors overflow-hidden
                    ${canOpenParticles 
                        ? 'bg-gray-900 hover:bg-gray-800 border-gray-700' 
                        : 'bg-gray-900/50 border-gray-800 opacity-50 cursor-not-allowed'}
                    ${newlyUnlocked.particles ? 'shimmer-halo' : ''}
                `}
            >
                <span className={`text-lg transition-transform ${canOpenParticles ? 'text-pink-400 group-hover:scale-110' : 'text-gray-600'}`}>
                    {canOpenParticles ? '✨' : '🔒'}
                </span> 
                <span className="font-semibold text-gray-300">Part</span>
            </button>

            <button 
                onClick={() => canOpenAtoms && handle(onOpenTable)}
                disabled={!canOpenAtoms} 
                className={`relative py-2 border rounded text-xs flex flex-col items-center gap-1 group transition-colors overflow-hidden
                    ${canOpenAtoms 
                        ? 'bg-gray-900 hover:bg-gray-800 border-gray-700' 
                        : 'bg-gray-900/50 border-gray-800 opacity-50 cursor-not-allowed'}
                    ${newlyUnlocked.elements ? 'shimmer-halo' : ''}
                `}
            >
                <span className={`text-lg transition-transform ${canOpenAtoms ? 'text-blue-400 group-hover:scale-110' : 'text-gray-600'}`}>
                    {canOpenAtoms ? '⚛️' : '🔒'}
                </span> 
                <span className="font-semibold text-gray-300">Atom</span>
            </button>

            <button 
                onClick={() => canOpenMolecules && handle(onOpenMolecules)}
                disabled={!canOpenMolecules} 
                className={`relative py-2 border rounded text-xs flex flex-col items-center gap-1 group transition-colors overflow-hidden
                    ${canOpenMolecules 
                        ? 'bg-gray-900 hover:bg-gray-800 border-gray-700' 
                        : 'bg-gray-900/50 border-gray-800 opacity-50 cursor-not-allowed'}
                    ${newlyUnlocked.molecules ? 'shimmer-halo' : ''}
                `}
            >
                <span className={`text-lg transition-transform ${canOpenMolecules ? 'text-purple-400 group-hover:scale-110' : 'text-gray-600'}`}>
                    {canOpenMolecules ? '⚗️' : '🔒'}
                </span> 
                <span className="font-semibold text-gray-300">Mol</span>
            </button>
        </div>
    );
};

// Reusable Simulation Options Component
const SimulationOptions: React.FC<{
    sliderValue: number;
    setSliderValue: (v: number) => void;
    getScaleText: (v: number) => string;
    showBonds: boolean;
    onToggleBonds: () => void;
    viewMode: 'solid' | 'glass';
    onToggleViewMode: () => void;
    gameMode: GameMode;
    onToggleGameMode: () => void;
    onRunTest: () => void;
    showDevTools: boolean;
    className?: string;
    showLogo?: boolean;
    onLogoClick?: () => void;
    onOpenHelp: () => void;
}> = ({ sliderValue, setSliderValue, getScaleText, showBonds, onToggleBonds, viewMode, onToggleViewMode, gameMode, onToggleGameMode, onRunTest, showDevTools, className, showLogo, onLogoClick, onOpenHelp }) => {
    return (
        <div className={`p-3 bg-gray-900 border border-gray-700 rounded-lg space-y-4 shadow-xl ${className || ''}`}>
            {showLogo && (
                 <div className="mb-2 pb-2 border-b border-gray-700 flex justify-between items-center">
                    <div onClick={onLogoClick} className="cursor-pointer select-none">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">SimChem 3D</h1>
                        <p className="text-xs text-gray-500">Physics Sandbox</p>
                    </div>
                    <button onClick={onOpenHelp} className="w-7 h-7 rounded border border-gray-600 bg-gray-800 text-gray-400 text-sm hover:bg-gray-700 hover:text-white flex items-center justify-center font-bold">?</button>
                </div>
            )}
            {showDevTools && (
                <div className="flex gap-2 border-b border-gray-700 pb-3 animate-in fade-in slide-in-from-top-2">
                    <button onClick={onRunTest} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-[10px] text-green-400 font-mono">TEST</button>
                    <button 
                        onClick={onToggleGameMode}
                        className={`flex-1 py-2 text-[10px] font-bold font-mono rounded border transition-colors ${gameMode === 'sandbox' ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-purple-900/30 border-purple-500 text-purple-400'}`}
                    >
                        {gameMode === 'sandbox' ? 'MODE: SANDBOX' : 'MODE: DISCOVERY'}
                    </button>
                </div>
            )}

            <div>
                <div className="flex justify-between items-end mb-2">
                    <label className="text-[10px] uppercase font-bold text-gray-400">Time Scale</label>
                    <span className="text-[10px] font-mono text-blue-400">{getScaleText(sliderValue)}</span>
                </div>
                <input type="range" min="0" max="100" step="1" value={sliderValue} onChange={(e) => setSliderValue(Number(e.target.value))} className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>

            <div className="flex gap-2">
                <button onClick={onToggleBonds} className={`flex-1 py-2 rounded border flex items-center justify-center gap-2 text-xs font-bold transition-colors ${showBonds ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}>
                    <span>🔗</span> Bonds
                </button>
                <button onClick={onToggleViewMode} className={`flex-1 py-2 rounded border flex items-center justify-center gap-2 text-xs font-bold transition-colors ${viewMode === 'glass' ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}>
                    <span>{viewMode === 'glass' ? '🔮' : '🌑'}</span> {viewMode === 'glass' ? 'Glass' : 'Solid'}
                </button>
            </div>
        </div>
    );
};

const Sidebar: React.FC<SidebarProps> = ({
  palette,
  onOpenTable,
  onOpenMolecules,
  onOpenStandardModel,
  onOpenHelp,
  onRemoveFromPalette,
  onUpdateIsotope,
  sliderValue,
  setSliderValue,
  onClear,
  onSpawnItem,
  showBonds,
  onToggleBonds,
  viewMode,
  onToggleViewMode,
  activeTool,
  onSelectTool,
  onRunTest,
  gameMode,
  onToggleGameMode,
  hasDiscoveredMolecules,
  hasDiscoveredElements,
  hasDiscoveredParticles,
  newlyUnlocked
}) => {
  const [editingItem, setEditingItem] = useState<PaletteItem | null>(null);
  const [dragGhost, setDragGhost] = useState<{ item: PaletteItem, x: number, y: number } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isMobileOptionsOpen, setIsMobileOptionsOpen] = useState(false);
  
  // Secret Dev Mode Unlock
  const [devMode, setDevMode] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [devToast, setDevToast] = useState(false);

  const handleLogoClick = () => {
      const newCount = logoClicks + 1;
      setLogoClicks(newCount);
      if (newCount >= 5 && !devMode) {
          setDevMode(true);
          setDevToast(true);
          // Auto-open options when dev mode unlocks for immediate access to Test/Mode buttons
          setIsOptionsOpen(true);
          setIsMobileOptionsOpen(true);
          setTimeout(() => setDevToast(false), 3000);
      }
  };

  const handleRunTest = () => {
      onRunTest();
      setIsOptionsOpen(false);
      setIsMobileOptionsOpen(false);
  };
  
  // Refs for gesture handling
  const paletteScrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const tapRef = useRef<TapState | null>(null);
  const longPressTimer = useRef<number | null>(null);

  const getScaleText = (val: number) => {
      if (val === 0) return "Paused";
      if (val <= 50) return `${(val / 50).toFixed(2)}x`;
      const power = (val - 50) / 12.5; 
      return `${Math.pow(10, power).toFixed(0)}x`;
  };

  const handleDragStart = (e: React.DragEvent, item: PaletteItem) => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
      const data = { id: item.id };
      e.dataTransfer.setData('application/json', JSON.stringify(data));
      e.dataTransfer.effectAllowed = "copy";
      onSelectTool(item.id);
  };

  // --- Pointer Logic (Mobile-First & Desktop Compatible) ---
  
  const handlePointerDown = (e: React.PointerEvent, item: PaletteItem, scrollContainerRef: React.RefObject<HTMLDivElement | null>) => {
      if (e.button !== 0) return;
      
      tapRef.current = {
          id: item.id,
          startX: e.clientX,
          startY: e.clientY,
          ts: Date.now(),
          hasMoves: false,
          initialScrollLeft: scrollContainerRef.current?.scrollLeft || 0
      };

      if (item.type === 'atom') {
        if (item.element?.s === 'p⁺' || item.element?.s === 'n') return;

        longPressTimer.current = window.setTimeout(() => {
            if (tapRef.current) {
                setEditingItem(item);
                tapRef.current = null; 
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }
        }, 500);
      }
  };

  const handlePointerMove = (e: React.PointerEvent, item: PaletteItem, scrollContainerRef: React.RefObject<HTMLDivElement | null>) => {
      if (!tapRef.current) return;
      
      const dx = e.clientX - tapRef.current.startX;
      const dy = e.clientY - tapRef.current.startY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist > 10) {
          tapRef.current.hasMoves = true;
          if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
          }
          
          if (dragGhost) {
               setDragGhost({ item, x: e.clientX, y: e.clientY });
               return;
          }

          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);

          if (absDy > absDx && absDy > 10) {
               setDragGhost({ item, x: e.clientX, y: e.clientY });
               (e.target as Element).setPointerCapture(e.pointerId);
          } else if (e.pointerType === 'mouse' && absDx > absDy) {
               if (scrollContainerRef.current) {
                   scrollContainerRef.current.scrollLeft = tapRef.current.initialScrollLeft - dx;
                   (e.target as Element).setPointerCapture(e.pointerId);
               }
          }
      }
  };

  const handlePointerUp = (e: React.PointerEvent, item: PaletteItem) => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }

      if (dragGhost || (tapRef.current && tapRef.current.hasMoves)) {
          (e.target as Element).releasePointerCapture(e.pointerId);
          
          if (dragGhost) {
            setDragGhost(null);
            const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
            if (elemBelow && elemBelow.tagName === 'CANVAS') {
                onSpawnItem(item, { x: e.clientX, y: e.clientY });
            }
          }
          tapRef.current = null;
          return;
      }

      if (tapRef.current && tapRef.current.id === item.id && !tapRef.current.hasMoves) {
           onSelectTool(item.id);
      }
      
      tapRef.current = null;
  };

  const handlePointerCancel = () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      tapRef.current = null;
      setDragGhost(null);
  };

  // --- Render Helpers ---

  const renderItemVisual = (item: PaletteItem, isActive: boolean) => {
      if (item.type === 'atom' && item.element) {
          const iso = item.element.iso[item.isotopeIndex || 0];
          const mass = Math.round(iso.m);
          const isNucleon = item.element.s === 'p⁺' || item.element.s === 'n';

          return (
            <div className="flex items-center gap-2">
                <div 
                    className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-md shadow-inner relative"
                    style={{ backgroundColor: `${item.element.c}20`, color: item.element.c, border: `1px solid ${item.element.c}40` }}
                >
                    <span className="text-[7px] absolute top-0.5 left-1 leading-none opacity-80">{mass}</span>
                    {item.element.s}
                </div>
                <div className="min-w-0 overflow-hidden">
                    <div className={`font-bold text-xs truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>{item.element.n}</div>
                    
                    {isNucleon ? (
                        <div className="text-[10px] text-gray-500 font-mono">{iso.m}u</div>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                            onMouseDown={(e) => e.stopPropagation()} 
                            className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-blue-400 transition-colors group/btn"
                        >
                            <span className="font-mono text-gray-400 group-hover/btn:text-blue-400">{iso.m}u</span>
                            {iso.hl !== 'stable' && <span className="text-yellow-600 border-l border-gray-800 pl-1">Rad</span>}
                        </button>
                    )}
                </div>
            </div>
          );
      } else if (item.type === 'molecule' && item.molecule) {
          return (
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-purple-900/30 border border-purple-500/50 flex items-center justify-center font-bold text-[10px] text-purple-300 shadow-inner overflow-hidden">
                    {item.molecule.formula}
                </div>
                <div className="flex-1 min-w-0">
                    <div className={`font-bold text-xs truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>{item.molecule.name}</div>
                    <div className="text-[9px] text-gray-500 truncate">Molecule</div>
                </div>
            </div>
          );
      } else if (item.type === 'particle' && item.particle) {
          return (
            <div className="flex items-center gap-2">
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

  const isLassoLocked = gameMode === 'discovery' && !hasDiscoveredMolecules;
  const canOpenParticles = gameMode === 'sandbox' || hasDiscoveredParticles;
  const canOpenAtoms = gameMode === 'sandbox' || hasDiscoveredElements;
  const canOpenMolecules = gameMode === 'sandbox' || hasDiscoveredMolecules;

  return (
    <>
    <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes shimmer {
          0% { box-shadow: 0 0 5px rgba(255, 255, 0, 0.5); border-color: rgba(255, 255, 0, 0.8); }
          50% { box-shadow: 0 0 15px rgba(255, 255, 0, 0.8); border-color: #ffffff; }
          100% { box-shadow: 0 0 5px rgba(255, 255, 0, 0.5); border-color: rgba(255, 255, 0, 0.8); }
        }
        .shimmer-halo { animation: shimmer 2s infinite; }
    `}</style>

    {/* Dev Mode Toast - Centered and ~1/3 down */}
    {devToast && (
        <div className="fixed top-[30%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] bg-purple-600/90 backdrop-blur border border-purple-400 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-in fade-in slide-in-from-top-4">
            🚀 Dev Mode Unlocked!
        </div>
    )}

    {/* Ghost Element for Drag */}
    {dragGhost && (
        <div 
            className="fixed pointer-events-none z-[9999] flex items-center justify-center w-16 h-16 rounded-full shadow-2xl bg-gray-900/90 border-2 border-white backdrop-blur-md"
            style={{ 
                left: dragGhost.x, top: dragGhost.y, transform: 'translate(-50%, -50%)',
                borderColor: dragGhost.item.element?.c || dragGhost.item.particle?.color || '#fff'
            }}
        >
            <span className="text-xl font-bold text-white">
                {dragGhost.item.element?.s || dragGhost.item.particle?.symbol || 'M'}
            </span>
        </div>
    )}

    {/* Isotope Picker Modal */}
    {editingItem && editingItem.type === 'atom' && editingItem.element && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setEditingItem(null)}>
           <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
               <div className="p-4 border-b border-gray-800 bg-gray-800/50 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm border" style={{ backgroundColor: `${editingItem.element.c}20`, borderColor: editingItem.element.c, color: editingItem.element.c }}>
                        {editingItem.element.s}
                     </div>
                     Select Isotope
                  </h3>
                  <button onClick={() => setEditingItem(null)} className="text-gray-400 p-2">&times;</button>
               </div>
               <div className="max-h-[60vh] overflow-y-auto p-2">
                  {editingItem.element.iso.map((iso, idx) => (
                      <button 
                         key={idx}
                         onClick={() => { onUpdateIsotope(editingItem.id, idx); setEditingItem(null); }}
                         className={`w-full text-left p-3 rounded-lg mb-1 flex justify-between items-center transition-colors ${idx === editingItem.isotopeIndex ? 'bg-blue-600/20 border border-blue-500 text-blue-200' : 'hover:bg-gray-800 text-gray-300 border border-transparent'}`}
                      >
                         <span className="font-bold text-lg flex items-start gap-1">
                             <span className="text-[10px] mt-1 opacity-60">{Math.round(iso.m)}</span>
                             {editingItem.element.s}
                         </span>
                         <div className="text-xs opacity-70 flex flex-col items-end">
                            <span className="font-mono">{iso.m} u</span>
                            <span className={`font-bold ${iso.hl === 'stable' ? 'text-green-400' : 'text-yellow-400'}`}>{formatHalfLife(iso.hl)}</span>
                         </div>
                      </button>
                  ))}
               </div>
           </div>
        </div>
    )}

    <div className="flex flex-col h-full z-20 absolute inset-0 lg:relative lg:inset-auto lg:w-[300px] pointer-events-none lg:pointer-events-auto">
      
      {/* ================= MOBILE UI ================= */}
      <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-gray-950/90 backdrop-blur-md border-t border-gray-800 flex flex-col pb-safe pointer-events-auto select-none">
          {/* Mobile Toolbar */}
          <div className="flex items-center justify-between p-2 border-b border-white/10 gap-2">
              <div className="flex gap-2">
                <button onClick={onClear} className="p-2 rounded text-red-400 bg-red-900/20 text-lg">🗑️</button>
                <button onClick={() => onSelectTool('energy')} className={`p-2 rounded text-xl ${activeTool === 'energy' ? 'bg-yellow-500/20 text-yellow-300' : 'text-gray-400'}`}>⚡</button>
                <button 
                    onClick={() => !isLassoLocked && onSelectTool('lasso')} 
                    disabled={isLassoLocked}
                    className={`p-2 rounded text-xl relative overflow-hidden ${isLassoLocked ? 'opacity-30' : activeTool === 'lasso' ? 'bg-white/20 text-white' : 'text-gray-400'} ${newlyUnlocked.lasso ? 'shimmer-halo' : ''}`}
                >
                    {isLassoLocked ? '🔒' : '𓎤/✋'}
                </button>
              </div>
              <div className="h-6 w-px bg-gray-700 mx-1"></div>
              <div className="flex gap-2">
                <div className="relative">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="px-3 py-2 bg-blue-600 rounded text-white font-bold flex items-center gap-1 shadow-lg">
                        <span>+</span>
                    </button>
                    {/* Mobile Add Menu - Reusing AddEntityButtons */}
                    {isMobileMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsMobileMenuOpen(false)} />
                            <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-2 w-64 z-50">
                                <AddEntityButtons 
                                    onOpenStandardModel={onOpenStandardModel}
                                    onOpenTable={onOpenTable}
                                    onOpenMolecules={onOpenMolecules}
                                    onClose={() => setIsMobileMenuOpen(false)}
                                    canOpenParticles={canOpenParticles}
                                    canOpenAtoms={canOpenAtoms}
                                    canOpenMolecules={canOpenMolecules}
                                    newlyUnlocked={newlyUnlocked}
                                />
                            </div>
                        </>
                    )}
                </div>
                
                <div className="relative">
                    <button onClick={() => setIsMobileOptionsOpen(!isMobileOptionsOpen)} className="p-2 rounded text-gray-400 bg-gray-800/50 hover:bg-gray-800 text-lg">⚙️</button>
                    {/* Mobile Options Popover */}
                    {isMobileOptionsOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsMobileOptionsOpen(false)} />
                            <div className="absolute bottom-full right-0 mb-2 z-50 w-64">
                                <SimulationOptions
                                    sliderValue={sliderValue}
                                    setSliderValue={setSliderValue}
                                    getScaleText={getScaleText}
                                    showBonds={showBonds}
                                    onToggleBonds={onToggleBonds}
                                    viewMode={viewMode}
                                    onToggleViewMode={onToggleViewMode}
                                    gameMode={gameMode}
                                    onToggleGameMode={onToggleGameMode}
                                    onRunTest={handleRunTest}
                                    showDevTools={devMode}
                                    showLogo={true}
                                    onLogoClick={handleLogoClick}
                                    onOpenHelp={onOpenHelp}
                                />
                            </div>
                        </>
                    )}
                </div>
              </div>
          </div>

          {/* Mobile Palette Scroller */}
          <div ref={mobileScrollRef} className="flex overflow-x-auto gap-3 p-3 touch-pan-x no-scrollbar">
              {palette.map((item) => {
                  const isActive = activeTool === item.id;
                  let displayChar = '';
                  let color = '#fff';
                  if(item.type==='atom') { displayChar = item.element?.s || ''; color = item.element?.c || '#fff'; }
                  else if(item.type==='molecule') { displayChar = '⚗️'; color='#a855f7'; }
                  else { displayChar = item.particle?.symbol || 'P'; color = item.particle?.color || '#fff'; }

                  return (
                    <div
                        key={item.id}
                        onPointerDown={(e) => handlePointerDown(e, item, mobileScrollRef)}
                        onPointerMove={(e) => handlePointerMove(e, item, mobileScrollRef)}
                        onPointerUp={(e) => handlePointerUp(e, item)}
                        onPointerCancel={handlePointerCancel}
                        className={`flex-shrink-0 w-14 h-14 rounded-lg border flex flex-col items-center justify-center relative transition-all touch-none
                            ${isActive ? 'bg-gray-800 border-white shadow-lg scale-105' : 'bg-gray-900 border-gray-700 opacity-80'}
                        `}
                        style={{ borderColor: isActive ? 'white' : color }}
                    >
                        <div className="text-lg font-bold" style={{color}}>{displayChar}</div>
                        {isActive && <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"></div>}
                    </div>
                  );
              })}
              <div className="w-4 flex-shrink-0"></div>
          </div>
      </div>
      
      {/* ================= DESKTOP UI ================= */}
      <div className="hidden lg:flex flex-col w-[300px] h-full bg-gray-950 border-r border-gray-800 text-gray-200 shadow-2xl select-none pointer-events-auto">
          {/* Header with Options Button */}
          <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center relative">
            <div onClick={handleLogoClick} className="cursor-pointer select-none hover:opacity-80 transition-opacity">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">SimChem 3D</h1>
                <p className="text-xs text-gray-500">Physics Sandbox</p>
            </div>
            
            <div className="flex gap-2 items-center">
                <button 
                    onClick={onOpenHelp}
                    className="w-8 h-8 rounded border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white hover:border-gray-500 flex items-center justify-center font-bold transition-all"
                    title="Help"
                >
                    ?
                </button>
                <button 
                    onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                    className={`w-8 h-8 rounded border flex items-center justify-center transition-colors ${isOptionsOpen ? 'bg-gray-700 border-gray-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    title="Simulation Options"
                >
                    ⚙️
                </button>
            </div>

            {/* Desktop Pop-out Menu */}
            {isOptionsOpen && (
                <div className="absolute left-full top-0 ml-2 w-72 z-50 animate-in fade-in slide-in-from-left-2 duration-200">
                    <SimulationOptions
                        sliderValue={sliderValue}
                        setSliderValue={setSliderValue}
                        getScaleText={getScaleText}
                        showBonds={showBonds}
                        onToggleBonds={onToggleBonds}
                        viewMode={viewMode}
                        onToggleViewMode={onToggleViewMode}
                        gameMode={gameMode}
                        onToggleGameMode={onToggleGameMode}
                        onRunTest={handleRunTest}
                        showDevTools={devMode}
                        className="bg-gray-950 border-gray-700 shadow-2xl"
                        onOpenHelp={onOpenHelp}
                    />
                </div>
            )}
          </div>

          <div className="p-5 border-b border-gray-800 space-y-4 relative">
            {/* Top Tools: Energy, Lasso, Trash */}
            <div className="grid grid-cols-3 gap-2">
                <button onClick={onClear} className="py-2 flex flex-col items-center justify-center gap-1 rounded-lg border border-red-900/30 bg-red-900/10 text-red-500 hover:bg-red-900/30 transition-all">
                    <span className="text-xl">🗑️</span><span className="font-bold text-[10px]">Clear</span>
                </button>

                <button onClick={() => onSelectTool('energy')} className={`py-2 flex flex-col items-center justify-center gap-1 rounded-lg border transition-all ${activeTool === 'energy' ? 'bg-yellow-900/30 border-yellow-400 text-yellow-300' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}>
                    <span className="text-xl">⚡</span><span className="font-bold text-[10px]">Energy</span>
                </button>

                <button 
                    onClick={() => !isLassoLocked && onSelectTool('lasso')} 
                    disabled={isLassoLocked}
                    title={isLassoLocked ? "Unlock by forming a molecule" : "Lasso Select"}
                    className={`relative overflow-hidden py-2 flex flex-col items-center justify-center gap-1 rounded-lg border transition-all 
                        ${isLassoLocked 
                            ? 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed opacity-50' 
                            : activeTool === 'lasso' 
                                ? 'bg-gray-800 border-white text-white' 
                                : 'border-gray-700 text-gray-400 hover:bg-gray-800'
                        }
                        ${newlyUnlocked.lasso ? 'shimmer-halo' : ''}
                    `}
                >
                    <span className="text-xl">{isLassoLocked ? '🔒' : '𓎤/✋'}</span>
                    <span className="font-bold text-[10px]">Lasso</span>
                </button>
            </div>

            {/* Unified Add Toolbar */}
            <div>
                <label className="text-xs uppercase text-gray-500 font-bold mb-2 block">Add New</label>
                <AddEntityButtons 
                    onOpenStandardModel={onOpenStandardModel}
                    onOpenTable={onOpenTable}
                    onOpenMolecules={onOpenMolecules}
                    canOpenParticles={canOpenParticles}
                    canOpenAtoms={canOpenAtoms}
                    canOpenMolecules={canOpenMolecules}
                    newlyUnlocked={newlyUnlocked}
                />
            </div>
          </div>

          <div ref={paletteScrollRef} className="flex-grow overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-700">
            <div className="grid grid-cols-2 gap-2 content-start">
                {palette.map((item) => {
                    const isActive = activeTool === item.id;
                    return (
                        <div 
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item)}
                            onPointerDown={(e) => handlePointerDown(e, item, paletteScrollRef)}
                            onPointerMove={(e) => handlePointerMove(e, item, paletteScrollRef)}
                            onPointerUp={(e) => handlePointerUp(e, item)}
                            onPointerCancel={handlePointerCancel}
                            className={`border rounded-lg p-1.5 cursor-pointer transition-all group relative select-none touch-none
                                ${isActive ? 'bg-gray-800 border-white ring-1 ring-white/20 shadow-lg' : 'bg-gray-900 border-gray-700 hover:border-gray-500 hover:bg-gray-800'}
                            `}
                        >
                            <div className="flex justify-between items-center w-full">
                                {renderItemVisual(item, isActive)}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onRemoveFromPalette(item.id); }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="p-1 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
      </div>
    </div>
    </>
  );
};

export default Sidebar;