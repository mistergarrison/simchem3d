import React, { useState, useRef, useEffect } from 'react';
import { PaletteItem, ToolType, GameMode, ColliderPhase, DiscoveryState } from '../../types/ui';
import { AddEntityButtons } from './AddEntityButtons';
import { SimulationOptions } from './SimulationOptions';
import { PaletteItemView, formatHalfLife } from './PaletteItemView';
import { ColliderStatus } from './ColliderStatus';
import { DiscoveryOverview } from '../modals/DiscoveryOverview';
import { LeaderboardModal } from '../modals/LeaderboardModal';

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
  onLayoutHeightChange?: (height: number) => void;
  debugMode: boolean;
  onToggleDebugMode: () => void;
  onClearStorage?: () => void;
  hasObjects: boolean;
  discoveryProgress: { current: number, total: number };
  discovered: DiscoveryState; // Added prop
  newHelpContent: boolean;
  colliderPhase: ColliderPhase;
}

interface TapState {
    id: string;
    startX: number;
    startY: number;
    ts: number;
    hasMoves: boolean;
    initialScrollLeft: number;
}

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
  newlyUnlocked,
  onLayoutHeightChange,
  debugMode,
  onToggleDebugMode,
  onClearStorage,
  hasObjects,
  discoveryProgress,
  discovered,
  newHelpContent,
  colliderPhase
}) => {
  const [editingItem, setEditingItem] = useState<PaletteItem | null>(null);
  const [dragGhost, setDragGhost] = useState<{ item: PaletteItem, x: number, y: number, startY: number } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isMobileOptionsOpen, setIsMobileOptionsOpen] = useState(false);
  const [isDiscoveryOverviewOpen, setIsDiscoveryOverviewOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  
  // Secret Dev Mode Unlock
  const [devMode, setDevMode] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

  const handleLogoClick = () => {
      const newCount = logoClicks + 1;
      setLogoClicks(newCount);
      if (newCount >= 5 && !devMode) {
          setDevMode(true);
          // Auto-open options when dev mode unlocks for immediate access to Test/Mode buttons
          setIsOptionsOpen(true);
          setIsMobileOptionsOpen(true);
          
          // Default Debug Mode to ON when developer tools are unlocked
          if (!debugMode) {
              onToggleDebugMode();
          }
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
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const tapRef = useRef<TapState | null>(null);
  const longPressTimer = useRef<number | null>(null);

  // Monitor Mobile Footer Height
  useEffect(() => {
      if (!mobileContainerRef.current || !onLayoutHeightChange) return;
      
      const updateHeight = () => {
          if (mobileContainerRef.current && onLayoutHeightChange) {
              onLayoutHeightChange(mobileContainerRef.current.offsetHeight);
          }
      };

      // Initial measurement
      updateHeight();

      const observer = new ResizeObserver(() => {
          updateHeight();
      });
      observer.observe(mobileContainerRef.current);

      return () => observer.disconnect();
  }, [onLayoutHeightChange, palette.length]); // Re-measure if palette items change count

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
               setDragGhost({ ...dragGhost, x: e.clientX, y: e.clientY });
               return;
          }

          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);

          if (absDy > absDx && absDy > 10) {
               setDragGhost({ item, x: e.clientX, y: e.clientY, startY: tapRef.current.startY });
               (e.target as Element).setPointerCapture(e.pointerId);
          } 
      }
  };

  const handlePointerUp = (e: React.PointerEvent, item: PaletteItem) => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }

      if (dragGhost || (tapRef.current && tapRef.current.hasMoves)) {
          if ((e.target as Element).hasPointerCapture(e.pointerId)) {
              (e.target as Element).releasePointerCapture(e.pointerId);
          }
          
          if (dragGhost) {
            const dy = e.clientY - dragGhost.startY;
            if (dy > 80) {
                onRemoveFromPalette(item.id);
            } 
            else if (dy < -20) {
                const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
                if (elemBelow && elemBelow.tagName === 'CANVAS') {
                    onSpawnItem(item, { x: e.clientX, y: e.clientY });
                }
            }
            setDragGhost(null);
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

  const isLassoLocked = gameMode === 'discovery' && !hasDiscoveredMolecules;
  const canOpenParticles = gameMode === 'sandbox' || hasDiscoveredParticles;
  const canOpenAtoms = gameMode === 'sandbox' || hasDiscoveredElements;
  const canOpenMolecules = gameMode === 'sandbox' || hasDiscoveredMolecules;

  const isDeleteDrag = dragGhost && (dragGhost.y - dragGhost.startY > 50);

  const discoveryPercent = Math.min(100, Math.round((discoveryProgress.current / Math.max(1, discoveryProgress.total)) * 100));

  return (
    <>
    <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `}</style>

    <DiscoveryOverview 
        isOpen={isDiscoveryOverviewOpen}
        onClose={() => setIsDiscoveryOverviewOpen(false)}
        discovery={discovered}
        onResetProgress={onClearStorage}
    />

    <LeaderboardModal 
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        score={discoveryProgress.current}
    />

    {/* Ghost Element for Drag */}
    {dragGhost && (
        <div 
            className={`fixed pointer-events-none z-[9999] flex items-center justify-center w-20 h-20 rounded-full shadow-2xl backdrop-blur-md border-2 transition-colors
                ${isDeleteDrag ? 'bg-red-900/90 border-red-500 scale-110' : 'bg-gray-900/90'}
            `}
            style={{ 
                left: dragGhost.x, top: dragGhost.y, transform: 'translate(-50%, -50%)',
                borderColor: isDeleteDrag ? '#ef4444' : (dragGhost.item.element?.c || dragGhost.item.particle?.color || '#fff')
            }}
        >
            {isDeleteDrag ? (
                <span className="text-3xl">🗑️</span>
            ) : (
                <span className="text-2xl font-bold text-white">
                    {dragGhost.item.element?.s || dragGhost.item.particle?.symbol || 'M'}
                </span>
            )}
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
      <div 
          ref={mobileContainerRef}
          className="lg:hidden absolute bottom-0 left-0 right-0 bg-gray-950/90 backdrop-blur-md border-t border-gray-800 flex flex-col pb-safe pointer-events-auto select-none"
      >
          {/* Mobile Toolbar */}
          <div className="flex items-center justify-between p-2 border-b border-white/10 gap-1">
              <div className="flex gap-1 shrink-0">
                <button 
                    onClick={onClear} 
                    disabled={!hasObjects}
                    className={`w-12 h-12 flex items-center justify-center rounded text-lg active:scale-90 transition-transform ${!hasObjects ? 'opacity-30 cursor-not-allowed bg-transparent text-gray-500' : 'text-red-400 bg-red-900/20'}`}
                >
                    🗑️
                </button>
                <button onClick={() => onSelectTool('energy')} className={`w-12 h-12 flex items-center justify-center rounded text-lg active:scale-90 transition-transform ${activeTool === 'energy' ? 'bg-yellow-500/20 text-yellow-300' : 'text-gray-400'}`}>⚡</button>
                <button 
                    onClick={() => !isLassoLocked && onSelectTool('lasso')} 
                    disabled={isLassoLocked}
                    className={`w-12 h-12 flex items-center justify-center rounded text-lg relative overflow-hidden active:scale-90 transition-transform ${isLassoLocked ? 'opacity-30' : activeTool === 'lasso' ? 'bg-white/20 text-white' : 'text-gray-400'} ${newlyUnlocked.lasso ? 'shimmer-halo' : ''}`}
                >
                    {isLassoLocked ? '🔒' : '𓎤/✋'}
                </button>
              </div>
              
              <div className="flex-1 mx-1 flex gap-1 items-center min-w-0">
                   {/* Compact Discoveries Bar (2/5ths) */}
                   <div 
                       onClick={() => setIsDiscoveryOverviewOpen(true)}
                       className="flex-[2] flex flex-col justify-center min-w-0 cursor-pointer active:scale-95 transition-transform" 
                       title={`${discoveryProgress.current}/${discoveryProgress.total} discovered`}
                   >
                       <div className="text-[9px] text-gray-500 text-center mb-1 font-bold uppercase truncate">Discoveries {discoveryProgress.current}/{discoveryProgress.total}</div>
                       <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden w-full">
                           <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500" style={{width: `${discoveryPercent}%`}}></div>
                       </div>
                   </div>
                   
                   {/* Collider Status - Expands to fill available space (3/5ths) */}
                   {gameMode !== 'sandbox' && (
                       <div className="flex-[3] min-w-0">
                           <ColliderStatus phase={colliderPhase} gameMode={gameMode} className="w-full p-1 h-10 min-h-[40px]" />
                       </div>
                   )}
              </div>

              <div className="flex gap-1 shrink-0">
                <div className="relative">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="w-12 h-12 flex items-center justify-center bg-blue-600 rounded text-white font-bold shadow-lg text-xl active:scale-90 transition-transform">
                        <span className="pb-1">+</span>
                    </button>
                    {isMobileMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsMobileMenuOpen(false)} />
                            <div className="absolute bottom-full right-0 mb-4 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 w-72 z-50">
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
                    <button onClick={() => setIsMobileOptionsOpen(!isMobileOptionsOpen)} className="w-12 h-12 flex items-center justify-center rounded text-gray-400 bg-gray-800/50 hover:bg-gray-800 text-lg active:scale-90 transition-transform">⚙️</button>
                    {isMobileOptionsOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsMobileOptionsOpen(false)} />
                            <div className="absolute bottom-full right-0 mb-4 z-50 w-72">
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
                                    debugMode={debugMode}
                                    onToggleDebugMode={onToggleDebugMode}
                                    onClearStorage={onClearStorage}
                                />
                            </div>
                        </>
                    )}
                </div>

                <button 
                    onClick={() => setIsLeaderboardOpen(true)}
                    className="w-12 h-12 flex items-center justify-center rounded text-yellow-400 bg-gray-800/50 hover:bg-gray-800 text-lg active:scale-90 transition-transform"
                >
                    🏆
                </button>

                <button 
                    onClick={onOpenHelp}
                    className={`w-12 h-12 flex items-center justify-center rounded text-gray-400 bg-gray-800/50 hover:bg-gray-800 text-lg active:scale-90 transition-transform relative overflow-hidden ${newHelpContent ? 'text-white border border-white/50 shimmer-halo' : ''}`}
                >
                    ?
                </button>
              </div>
          </div>

          <div ref={mobileScrollRef} className="flex overflow-x-auto gap-4 p-4 touch-pan-x no-scrollbar">
              {palette.map((item) => {
                  const isActive = activeTool === item.id;
                  let displayChar = '';
                  let color = '#fff';
                  let fontSizeClass = 'text-2xl';

                  if(item.type==='atom') { displayChar = item.element?.s || ''; color = item.element?.c || '#fff'; }
                  else if(item.type==='molecule') { 
                      displayChar = item.molecule?.formula || ''; 
                      color='#a855f7';
                      const len = displayChar.length;
                      fontSizeClass = len > 4 ? 'text-xs' : 'text-lg';
                  }
                  else { displayChar = item.particle?.symbol || 'P'; color = item.particle?.color || '#fff'; }

                  return (
                    <div
                        key={item.id}
                        onPointerDown={(e) => handlePointerDown(e, item, mobileScrollRef)}
                        onPointerMove={(e) => handlePointerMove(e, item, mobileScrollRef)}
                        onPointerUp={(e) => handlePointerUp(e, item)}
                        onPointerCancel={handlePointerCancel}
                        className={`flex-shrink-0 w-20 h-20 rounded-xl border flex flex-col items-center justify-center relative transition-all touch-pan-x
                            ${isActive ? 'bg-gray-800 border-white shadow-lg scale-105' : 'bg-gray-900 border-gray-700 opacity-80'}
                        `}
                        style={{ borderColor: isActive ? 'white' : color }}
                    >
                        <div className={`${fontSizeClass} font-bold px-1 text-center truncate w-full`} style={{color}}>{displayChar}</div>
                        {isActive && <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full"></div>}
                    </div>
                  );
              })}
              <div className="w-6 flex-shrink-0"></div>
          </div>
      </div>
      
      {/* ================= DESKTOP UI ================= */}
      <div className="hidden lg:flex flex-col w-[300px] h-full bg-gray-950 border-r border-gray-800 text-gray-200 shadow-2xl select-none pointer-events-auto">
          {/* Header */}
          <div className="p-4 border-b border-gray-800 bg-gray-900/50 relative">
            <div className="flex justify-between items-center mb-4">
                <div onClick={handleLogoClick} className="cursor-pointer select-none hover:opacity-80 transition-opacity">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">SimChem 3D</h1>
                </div>
                
                <div className="flex gap-2 items-center">
                    <button 
                        onClick={() => setIsLeaderboardOpen(true)}
                        className="w-8 h-8 rounded border border-gray-700 bg-gray-800 text-yellow-400 hover:bg-gray-700 hover:text-yellow-200 hover:border-gray-500 flex items-center justify-center font-bold transition-all"
                        title="Leaderboard"
                    >
                        🏆
                    </button>
                    <button 
                        onClick={onOpenHelp}
                        className={`w-8 h-8 rounded border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white hover:border-gray-500 flex items-center justify-center font-bold transition-all relative overflow-hidden ${newHelpContent ? 'text-white border-white/50 shimmer-halo' : ''}`}
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
            </div>

            <div 
                className="w-full cursor-pointer hover:bg-gray-800/50 rounded p-1 -m-1 transition-colors"
                onClick={() => setIsDiscoveryOverviewOpen(true)}
            >
                <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                    <span>Discoveries</span>
                    <span>{discoveryProgress.current}/{discoveryProgress.total}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500" style={{width: `${discoveryPercent}%`}}></div>
                </div>
            </div>

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
                        debugMode={debugMode}
                        onToggleDebugMode={onToggleDebugMode}
                        onClearStorage={onClearStorage}
                    />
                </div>
            )}
          </div>

          <div className="p-5 border-b border-gray-800 space-y-4 relative">
            
            <ColliderStatus phase={colliderPhase} gameMode={gameMode} />

            <div className="grid grid-cols-3 gap-2">
                <button 
                    onClick={onClear} 
                    disabled={!hasObjects}
                    className={`py-2 flex flex-col items-center justify-center gap-1 rounded-lg border transition-all 
                        ${!hasObjects 
                            ? 'border-gray-800 bg-gray-900/50 text-gray-600 cursor-not-allowed opacity-50' 
                            : 'border-red-900/30 bg-red-900/10 text-red-500 hover:bg-red-900/30'
                        }
                    `}
                >
                    <span className="text-xl">🗑️</span><span className="font-bold text-[10px]">Clear</span>
                </button>

                <button onClick={() => onSelectTool('energy')} className={`py-2 flex flex-col items-center justify-center gap-1 rounded-lg border transition-all ${activeTool === 'energy' ? 'bg-yellow-900/30 border-yellow-400 text-yellow-300' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}>
                    <span className="text-xl">⚡</span><span className="font-bold text-[10px]">Energy</span>
                </button>

                <button 
                    onClick={() => !isLassoLocked && onSelectTool('lasso')} 
                    disabled={isLassoLocked}
                    title={isLassoLocked ? "Unlock by forming a molecule" : "Lasso Select / Drag"}
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
                                <PaletteItemView 
                                    item={item} 
                                    isActive={isActive} 
                                    onEdit={(e) => { e.stopPropagation(); setEditingItem(item); }} 
                                />
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