

import React, { useState, useRef } from 'react';
import { PaletteItem, ToolType } from '../types';

interface SidebarProps {
  palette: PaletteItem[];
  onAddAtom: () => void;
  onRemoveFromPalette: (id: string) => void;
  onUpdateIsotope: (id: string, newIndex: number) => void;
  sliderValue: number;
  setSliderValue: (v: number) => void;
  onClear: () => void;
  onSpawnAtom: (item: PaletteItem, pos?: {x: number, y: number}) => void;
  onOpenMolecules: () => void;
  showBonds: boolean;
  onToggleBonds: () => void;
  viewMode: 'solid' | 'glass';
  onToggleViewMode: () => void;
  activeTool: ToolType;
  onSelectTool: (t: ToolType) => void;
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

    // Sub-second
    if (val < 1e-6) return `${(val * 1e9).toFixed(0)} ns`;
    if (val < 1e-3) return `${(val * 1e6).toFixed(0)} µs`;
    if (val < 1) return `${(val * 1000).toFixed(0)} ms`;
    
    // Seconds
    if (val < 60) return `${parseFloat(val.toFixed(2))} s`;
    
    // Minutes
    const min = val / 60;
    if (min < 60) return `${parseFloat(min.toFixed(1))} m`;
    
    // Hours
    const h = min / 60;
    if (h < 24) return `${parseFloat(h.toFixed(1))} h`;
    
    // Days
    const d = h / 24;
    if (d < 365.25) return `${parseFloat(d.toFixed(1))} d`;
    
    // Years
    const y = d / 365.25;
    if (y < 1000) return `${parseFloat(y.toFixed(1))} y`;
    if (y < 1e6) return `${parseFloat((y / 1000).toFixed(2))} ky`;
    if (y < 1e9) return `${parseFloat((y / 1e6).toFixed(2))} My`;
    
    return `${parseFloat((y / 1e9).toFixed(2))} Gy`;
};

/**
 * Sidebar Component
 * 
 * Controls the User Interface for managing available atoms, time scale, and global actions.
 */
const Sidebar: React.FC<SidebarProps> = ({
  palette,
  onAddAtom,
  onRemoveFromPalette,
  onUpdateIsotope,
  sliderValue,
  setSliderValue,
  onClear,
  onSpawnAtom,
  onOpenMolecules,
  showBonds,
  onToggleBonds,
  viewMode,
  onToggleViewMode,
  activeTool,
  onSelectTool
}) => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PaletteItem | null>(null);
  const [dragGhost, setDragGhost] = useState<{ item: PaletteItem, x: number, y: number } | null>(null);
  
  // Refs for gesture handling
  const paletteScrollRef = useRef<HTMLDivElement>(null);
  const tapRef = useRef<TapState | null>(null);
  const longPressTimer = useRef<number | null>(null);

  const getScaleText = (val: number) => {
      if (val === 0) return "Paused";
      if (val <= 50) return `${(val / 50).toFixed(2)}x`;
      const power = (val - 50) / 12.5; 
      return `${Math.pow(10, power).toFixed(0)}x`;
  };

  const handleDragStart = (e: React.DragEvent, item: PaletteItem) => {
      // Standard HTML5 Drag (Desktop fallback)
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
      const data = {
          z: item.element.z,
          isoIndex: item.isotopeIndex
      };
      e.dataTransfer.setData('application/json', JSON.stringify(data));
      e.dataTransfer.effectAllowed = "copy";
      
      // Select tool on drag start as well
      onSelectTool(item.id);
  };

  // --- Robust Pointer Logic (Mobile-First & Desktop Compatible) ---
  
  const handlePointerDown = (e: React.PointerEvent, item: PaletteItem) => {
      if (e.button !== 0) return;
      
      tapRef.current = {
          id: item.id,
          startX: e.clientX,
          startY: e.clientY,
          ts: Date.now(),
          hasMoves: false,
          initialScrollLeft: paletteScrollRef.current?.scrollLeft || 0
      };

      // Start Long Press Timer (500ms) for Isotope Selection
      longPressTimer.current = window.setTimeout(() => {
          if (tapRef.current) {
              setEditingItem(item);
              // Invalidate the tap so lifting finger doesn't spawn
              tapRef.current = null; 
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                  navigator.vibrate(50);
              }
          }
      }, 500);
  };

  const handlePointerMove = (e: React.PointerEvent, item: PaletteItem) => {
      if (!tapRef.current) return;
      
      const dx = e.clientX - tapRef.current.startX;
      const dy = e.clientY - tapRef.current.startY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // Tolerance: 10px (Lowered slightly to feel responsive on desktop mouse drag)
      if (dist > 10) {
          tapRef.current.hasMoves = true;

          // Cancel Long Press if moving significantly
          if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
          }
          
          // If we are already dragging the ghost, just update it
          if (dragGhost) {
               setDragGhost({ item, x: e.clientX, y: e.clientY });
               return;
          }

          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);

          // --- GESTURE INTENT DETECTION ---
          // Crucial for Touch UX: Distinguishes between dragging an atom OUT 
          // vs scrolling the list SIDEWAYS.
          
          // Case 1: Vertical Drag -> Spawn Atom (Ghost Drag)
          // IF vertical movement > horizontal movement, user intends to pick up the atom.
          if (absDy > absDx && absDy > 10) {
               setDragGhost({ item, x: e.clientX, y: e.clientY });
               (e.target as Element).setPointerCapture(e.pointerId);
          } 
          // Case 2: Horizontal Drag with MOUSE -> Manual Scroll
          // IF horizontal > vertical, user intends to scroll the palette.
          // Note: Touch devices handle this natively via overflow-x, but mice need help.
          else if (e.pointerType === 'mouse' && absDx > absDy) {
               if (paletteScrollRef.current) {
                   paletteScrollRef.current.scrollLeft = tapRef.current.initialScrollLeft - dx;
                   (e.target as Element).setPointerCapture(e.pointerId);
               }
          }
      }
  };

  const handlePointerUp = (e: React.PointerEvent, item: PaletteItem) => {
      // Clean up timer
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }

      // Handle Drop / End Drag
      if (dragGhost || (tapRef.current && tapRef.current.hasMoves)) {
          (e.target as Element).releasePointerCapture(e.pointerId);
          
          // Only spawn if it was a Ghost Drag (Vertical), not a Scroll (Horizontal)
          if (dragGhost) {
            setDragGhost(null);
            // Check if dropped on Canvas
            const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
            if (elemBelow && elemBelow.tagName === 'CANVAS') {
                onSpawnAtom(item, { x: e.clientX, y: e.clientY });
            }
          }
          
          tapRef.current = null;
          return;
      }

      // Handle Tap -> SELECT (Instead of Spawn)
      // This changes the cursor to placement mode.
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

  const particles = [
      { id: 'electron', label: 'Electron', icon: 'e⁻', color: 'border-cyan-400 text-cyan-400', bg: 'bg-cyan-900/20' },
      { id: 'proton', label: 'Proton', icon: 'p⁺', color: 'border-red-500 text-red-500', bg: 'bg-red-900/20' },
      { id: 'neutron', label: 'Neutron', icon: 'n⁰', color: 'border-gray-400 text-gray-400', bg: 'bg-gray-800/20' }
  ];

  return (
    <>
    {/* Utility Styles for Scrollbar Hiding */}
    <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
    `}</style>

    {/* Ghost Element for Mobile Drag */}
    {dragGhost && (
        <div 
            className="fixed pointer-events-none z-[9999] flex items-center justify-center w-16 h-16 rounded-full shadow-2xl bg-gray-900/90 border-2 border-white"
            style={{ 
                left: dragGhost.x, 
                top: dragGhost.y,
                transform: 'translate(-50%, -50%)',
                borderColor: dragGhost.item.element.c
            }}
        >
            <span className="text-xl font-bold text-white">{dragGhost.item.element.s}</span>
        </div>
    )}

    {/* Global Isotope Picker Modal */}
    {editingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setEditingItem(null)}>
           <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl scale-100" onClick={e => e.stopPropagation()}>
               <div className="p-4 border-b border-gray-800 bg-gray-800/50 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white flex items-center gap-3">
                     <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm border"
                        style={{ backgroundColor: `${editingItem.element.c}20`, borderColor: editingItem.element.c, color: editingItem.element.c }}
                     >
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
                         onClick={() => {
                             onUpdateIsotope(editingItem.id, idx);
                             setEditingItem(null);
                         }}
                         className={`w-full text-left p-3 rounded-lg mb-1 flex justify-between items-center transition-colors ${
                             idx === editingItem.isotopeIndex 
                                ? 'bg-blue-600/20 border border-blue-500 text-blue-200' 
                                : 'hover:bg-gray-800 text-gray-300 border border-transparent'
                         }`}
                      >
                         <span className="font-bold">{iso.name || `${editingItem.element.s}-${Math.round(iso.m)}`}</span>
                         <div className="text-xs opacity-70 flex flex-col items-end">
                            <span>Mass: {iso.m}</span>
                            <span>HL: {formatHalfLife(iso.hl)}</span>
                         </div>
                      </button>
                  ))}
               </div>
           </div>
        </div>
    )}

    {/* Using lg: (1024px) instead of md: to ensure landscape phones stay in Mobile/Overlay mode */}
    <div className="flex flex-col h-full z-20 absolute inset-0 lg:relative lg:inset-auto lg:w-[300px] pointer-events-none lg:pointer-events-auto">
      
      {/* ================= MOBILE UI ================= */}
      
      {/* Menu Drawer (Anchored to Bottom-Left, opens UP) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden pointer-events-auto absolute bottom-28 left-4 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-xl p-5 shadow-2xl flex flex-col gap-5 z-40 origin-bottom-left animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200 max-h-[70vh] overflow-y-auto">
            <div className="border-b border-gray-700 pb-2">
                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">SimChem Controls</h2>
            </div>
            
            {/* Tool Selector Mobile - JUST LASSO/HAND */}
            <div className="grid grid-cols-1 gap-2">
                 <button
                    onClick={() => { onSelectTool('lasso'); setMobileMenuOpen(false); }}
                    className={`flex items-center justify-center p-3 rounded-lg border transition-all gap-3 ${activeTool === 'lasso' ? 'bg-gray-800 border-white text-white' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}
                >
                    <span className="text-xl">✋</span>
                    <span className="font-bold">Hand / Lasso</span>
                </button>
            </div>
            
            <div>
                <div className="flex justify-between items-end mb-2">
                    <label className="text-xs uppercase text-gray-500 font-bold">Time Scale</label>
                    <span className="text-xs font-mono text-blue-400">{getScaleText(sliderValue)}</span>
                </div>
                <input 
                    type="range" 
                    min="0" max="100" step="1"
                    value={sliderValue}
                    onChange={(e) => setSliderValue(Number(e.target.value))}
                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>

            {/* Mobile Visual Toggles */}
            <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between bg-gray-800/50 p-2 rounded-lg border border-gray-700">
                    <span className="text-lg font-bold text-gray-400">🔗</span>
                    <button 
                        onClick={onToggleBonds}
                        className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${showBonds ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 shadow ${showBonds ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                </div>
                <div className="flex items-center justify-between bg-gray-800/50 p-2 rounded-lg border border-gray-700">
                    <span className="text-lg font-bold text-gray-400">🔮</span>
                    <button 
                        onClick={onToggleViewMode}
                        className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${viewMode === 'glass' ? 'bg-purple-600' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 shadow ${viewMode === 'glass' ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { onOpenMolecules(); setMobileMenuOpen(false); }} className="py-3 bg-purple-600/20 border border-purple-500/50 hover:bg-purple-600/30 text-purple-300 font-bold rounded-lg text-xs flex flex-col items-center gap-1 transition-colors">
                    <span className="text-2xl">⚗️</span>
                </button>
                <button onClick={() => { onClear(); setMobileMenuOpen(false); }} className="py-3 bg-red-600/20 border border-red-900/50 hover:bg-red-600/30 text-red-400 font-bold rounded-lg text-xs flex flex-col items-center gap-1 transition-colors">
                    <span className="text-2xl">🗑️</span>
                </button>
            </div>
            <button onClick={() => { onAddAtom(); setMobileMenuOpen(false); }} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg text-sm transition-colors">
                + New Atom
            </button>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div className="lg:hidden pointer-events-auto absolute bottom-6 left-4 right-4 z-30 flex items-center gap-3">
           {/* 1. Menu Toggle Button */}
           <button 
                onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gray-900/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
           >
                {isMobileMenuOpen ? (
                    <span className="text-xl leading-none">&times;</span>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
           </button>

           {/* 2. Palette List (With Particles Prepended) */}
           <div 
                ref={paletteScrollRef}
                className="flex-grow h-20 bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-2xl flex items-center px-4 gap-3 overflow-x-auto shadow-2xl touch-pan-x no-scrollbar"
           >
                {/* Particles First (Mobile View) */}
                {particles.map(p => (
                    <button
                        key={p.id}
                        onClick={() => onSelectTool(p.id)}
                        className={`flex-shrink-0 w-14 h-14 rounded-lg flex flex-col items-center justify-center border transition-all relative ${activeTool === p.id ? `bg-gray-800 ${p.color} scale-105 ring-2 ring-white/20` : 'bg-gray-800/50 border-gray-700 text-gray-500'}`}
                    >
                         <span className="text-lg font-bold leading-none">{p.icon}</span>
                         <span className="text-[9px] uppercase mt-1 opacity-70">{p.label.substring(0,1)}</span>
                    </button>
                ))}

                {/* Separator */}
                <div className="w-px h-10 bg-gray-700 mx-1 flex-shrink-0"></div>

                {/* Atoms */}
                {palette.map((item) => {
                    const iso = item.element.iso[item.isotopeIndex];
                    const isoName = iso.name || `${Math.round(iso.m)}`;
                    const isActive = activeTool === item.id;
                    
                    return (
                        <div 
                            key={item.id}
                            /* Pointer events for selection vs drag */
                            onPointerDown={(e) => handlePointerDown(e, item)}
                            onPointerMove={(e) => handlePointerMove(e, item)}
                            onPointerUp={(e) => handlePointerUp(e, item)}
                            onPointerCancel={handlePointerCancel}
                            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            className={`flex-shrink-0 w-14 h-14 bg-gray-800/90 border rounded-lg flex flex-col items-center justify-between relative active:scale-95 transition-all overflow-hidden select-none touch-pan-x group
                                ${isActive ? 'ring-2 ring-white border-transparent' : 'border-gray-600'}
                            `}
                            style={{ borderColor: isActive ? undefined : item.element.c }}
                        >
                            <div className="flex-grow w-full flex items-center justify-center pt-1 pointer-events-none">
                                <span className="text-lg font-bold leading-none" style={{color: item.element.c}}>{item.element.s}</span>
                            </div>
                            <div className={`w-full h-[20px] flex items-center justify-center border-t border-white/5 ${isActive ? 'bg-white/20' : 'bg-gray-900/60'}`}>
                                <span className={`text-[9px] font-mono pointer-events-none truncate px-1 ${isActive ? 'text-white font-bold' : 'text-gray-300'}`}>
                                    {isoName}
                                </span>
                            </div>
                        </div>
                    );
                })}
                {palette.length === 0 && <span className="text-gray-500 text-xs w-full text-center">Empty Palette</span>}
           </div>
      </div>

      {/* ================= DESKTOP UI (Standard Sidebar) ================= */}
      <div className="hidden lg:flex flex-col w-[300px] h-full bg-gray-950 border-r border-gray-800 text-gray-200 shadow-2xl select-none pointer-events-auto">
          {/* --- Branding & Header --- */}
          <div className="p-4 border-b border-gray-800 bg-gray-900/50">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              SimChem
            </h1>
            <p className="text-xs text-gray-500">The Chemistry Simulator</p>
          </div>

          {/* --- Global Controls Section --- */}
          <div className="p-5 border-b border-gray-800 space-y-4">
            
            {/* Main Cursor Tool */}
            <button
                onClick={() => onSelectTool('lasso')}
                className={`w-full py-2 flex items-center justify-center gap-3 rounded-lg border transition-all ${activeTool === 'lasso' ? 'bg-gray-800 border-white text-white' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}
            >
                <span className="text-xl">✋</span>
                <span className="font-bold text-sm">Hand / Lasso Tool</span>
            </button>

            {/* Time Scale Slider */}
            <div>
                <div className="flex justify-between items-end mb-2">
                    <label className="text-xs uppercase text-gray-500 font-bold">Time Scale</label>
                    <span className="text-xs font-mono text-blue-400">{getScaleText(sliderValue)}</span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="1"
                    value={sliderValue}
                    onChange={(e) => setSliderValue(Number(e.target.value))}
                    className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-colors"
                />
                <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                    <span>Paused</span>
                    <span>1x</span>
                    <span>Max</span>
                </div>
            </div>

            {/* Visual Controls */}
            <div className="flex gap-2">
                <button 
                    onClick={onToggleBonds}
                    title="Toggle Bonds"
                    className={`flex-1 py-2 px-3 rounded flex items-center justify-center gap-2 border transition-all ${showBonds ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-gray-900 border-gray-700 text-gray-400'}`}
                >
                    <span className="text-xl">🔗</span>
                </button>
                <button 
                    onClick={onToggleViewMode}
                    title="Toggle View Mode"
                    className={`flex-1 py-2 px-3 rounded flex items-center justify-center gap-2 border transition-all ${viewMode === 'glass' ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-gray-900 border-gray-700 text-gray-400'}`}
                >
                    <span className="text-xl">{viewMode === 'glass' ? '🔮' : '🌑'}</span>
                </button>
            </div>

            {/* Action Buttons: Molecules & Trash */}
            <div className="flex gap-2">
                <button
                    onClick={onOpenMolecules}
                    title="Molecules Recipes"
                    className="flex-grow py-2 bg-purple-600/20 border border-purple-500 hover:bg-purple-600/30 text-purple-400 font-bold rounded transition-all flex items-center justify-center gap-2"
                >
                    <span className="text-xl">⚗️</span>
                </button>
                <button
                    onClick={onClear}
                    title="Clear Board"
                    className="w-12 py-2 bg-red-600/10 border border-red-900 hover:bg-red-600/30 text-red-500 font-bold rounded transition-all flex items-center justify-center group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
          </div>

          {/* --- Atom Palette Header & Particles --- */}
          <div className="p-4 bg-gray-900/30 space-y-3 border-b border-gray-800">
             {/* Particles Row */}
             <div className="grid grid-cols-3 gap-2">
                {particles.map(p => (
                    <button
                        key={p.id}
                        title={p.label}
                        onClick={() => onSelectTool(p.id)}
                        className={`py-2 rounded-md border flex flex-col items-center justify-center transition-all ${activeTool === p.id ? `bg-gray-800 ${p.color} shadow-lg ring-1 ring-white/20` : 'border-gray-800 hover:bg-gray-800 text-gray-500'}`}
                    >
                         <span className="text-lg font-bold">{p.icon}</span>
                         <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">{p.label}</span>
                    </button>
                ))}
             </div>

             <div className="flex justify-between items-center pt-2">
                <span className="text-xs uppercase font-bold text-gray-400">Atom Palette</span>
                <button 
                    onClick={onAddAtom}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow-lg shadow-blue-900/20 transition-colors"
                >
                    + New
                </button>
             </div>
          </div>

          {/* --- Active Palette List --- */}
          <div className="flex-grow overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {palette.length === 0 && (
                <div className="text-center text-gray-600 text-sm mt-10 italic">
                    Click "+ New" to add elements to your palette.
                </div>
            )}
            
            {palette.map((item) => {
                const isActive = activeTool === item.id;
                return (
                    <div 
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        /* Click to SELECT Tool, not spawn immediately */
                        onClick={() => onSelectTool(item.id)}
                        className={`border rounded-lg p-3 cursor-pointer transition-all group relative
                            ${isActive ? 'bg-gray-800 border-white ring-1 ring-white/20 shadow-lg' : 'bg-gray-900 border-gray-700 hover:border-gray-500 hover:bg-gray-800'}
                        `}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            {/* Visual Atom Representation */}
                            <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-inner"
                                style={{ backgroundColor: `${item.element.c}20`, color: item.element.c, border: `1px solid ${item.element.c}40` }}
                            >
                                {item.element.s}
                            </div>
                            <div>
                                <div className={`font-bold text-sm ${isActive ? 'text-white' : 'text-gray-300'}`}>{item.element.n}</div>
                                <div className="flex gap-2 text-xs text-gray-500">
                                <span>Mass: {item.element.iso[item.isotopeIndex].m.toFixed(1)}</span>
                                <span className="text-gray-400 border-l border-gray-700 pl-2">V: {item.element.v}</span>
                                </div>
                            </div>
                            {/* Remove Button */}
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onRemoveFromPalette(item.id); 
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                className="absolute top-1 right-1 p-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                                &times;
                            </button>
                        </div>

                        <select 
                            value={item.isotopeIndex}
                            onChange={(e) => onUpdateIsotope(item.id, Number(e.target.value))}
                            className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1 text-xs text-gray-300 focus:border-blue-500 outline-none"
                            onClick={(e) => { e.stopPropagation(); }} 
                            onMouseDown={(e) => { e.stopPropagation(); }}
                            onPointerDown={(e) => { e.stopPropagation(); }}
                            draggable={false}
                        >
                            {item.element.iso.map((iso, idx) => (
                                <option key={idx} value={idx}>
                                    {iso.name || `${item.element.s}-${Math.round(iso.m)}`} ({formatHalfLife(iso.hl)})
                                </option>
                            ))}
                        </select>
                    </div>
                );
            })}
          </div>

          {/* Footer Instructions */}
          <div className="p-3 border-t border-gray-800 bg-gray-900/50 text-[10px] text-gray-500 text-center">
              Select an Atom or Particle to place.<br/>
              Click to place, Drag to shoot.<br/>
              Use Hand tool to move atoms.
          </div>
      </div>
    </div>
    </>
  );
};

export default Sidebar;