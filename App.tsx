
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import PeriodicTable from './components/PeriodicTable';
import MoleculePicker from './components/RecipePicker'; // Note: File name retained, component renamed
import StandardModelPicker from './components/StandardModelPicker';
import HelpModal from './components/HelpModal';
import { ELEMENTS, ELECTRON_ELEM, PROTON_ELEM, NEUTRON_ELEM, getParticleElementData, SM_PARTICLES } from './elements';
import { ElementData, PaletteItem, Molecule, ToolType, SM_ParticleDef, GameMode, DiscoveryState } from './types';

// Define the default set of items for Sandbox mode
const DEFAULT_PALETTE: PaletteItem[] = [
    { id: 'electron', type: 'particle', particle: SM_PARTICLES.find(p => p.id === 'electron')! },
    { id: 'proton', type: 'atom', element: PROTON_ELEM, isotopeIndex: 0 },
    { id: 'neutron', type: 'atom', element: NEUTRON_ELEM, isotopeIndex: 0 },
    { id: 'init-h', type: 'atom', element: ELEMENTS[0], isotopeIndex: 0 },   // H-1
    { id: 'init-c', type: 'atom', element: ELEMENTS[5], isotopeIndex: 2 },   // C-12
    { id: 'init-o', type: 'atom', element: ELEMENTS[7], isotopeIndex: 1 },   // O-16
];

/**
 * App.tsx
 * 
 * The Root Container and State Orchestrator.
 */
const App: React.FC = () => {
  // Initialize palette with a unified mix of Particles, Atoms, and defaults
  // In Discovery Mode, we start empty to force experimentation via the Energy Tool.
  const [palette, setPalette] = useState<PaletteItem[]>([]);
  
  const [isTableOpen, setIsTableOpen] = useState(false);
  const [isMoleculeOpen, setIsMoleculeOpen] = useState(false);
  const [isStandardModelOpen, setIsStandardModelOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // --- Game Mode & Discovery ---
  const [gameMode, setGameMode] = useState<GameMode>('discovery');
  const [discovered, setDiscovered] = useState<DiscoveryState>({
      elements: new Set<number>(), 
      molecules: new Set<string>(),
      particles: new Set<string>() 
  });

  // Track newly unlocked categories for the "Halo" effect
  const [newlyUnlocked, setNewlyUnlocked] = useState({
      particles: false,
      elements: false,
      molecules: false,
      lasso: false
  });
  
  const unlockTimerRef = useRef<{[key: string]: ReturnType<typeof setTimeout>}>({});

  // Slider value 0-100. 50 = 1x real-time speed.
  const [sliderValue, setSliderValue] = useState(50);
  
  // Visual Settings
  const [showBonds, setShowBonds] = useState(false);
  const [viewMode, setViewMode] = useState<'solid' | 'glass'>('glass');
  
  // Tools
  const [activeTool, setActiveTool] = useState<ToolType>('lasso');

  // Triggers for Canvas-side effects
  const [clearTrigger, setClearTrigger] = useState(0);
  const [spawnRequest, setSpawnRequest] = useState<{item: PaletteItem, x?: number, y?: number} | null>(null);
  const [moleculeRequest, setMoleculeRequest] = useState<{molecule: Molecule, id: number} | null>(null);
  const [testTrigger, setTestTrigger] = useState(0);

  /**
   * Time Scale Calculation
   */
  const timeScale = useMemo(() => {
    if (sliderValue <= 50) {
        // 0 to 1x linear
        return sliderValue / 50;
    } else {
        // 1x to 10,000x log
        const power = (sliderValue - 50) / 12.5; 
        return Math.pow(10, power);
    }
  }, [sliderValue]);

  // Pause simulation if slider is at 0
  const isPlaying = sliderValue > 0;

  // --- DISCOVERY HANDLER ---
  const handleDiscovery = useCallback((newFindings: Partial<DiscoveryState>) => {
      setDiscovered(prev => {
          let changed = false;
          const next = { ...prev };
          const newUnlocksUpdates: Partial<typeof newlyUnlocked> = {};

          if (newFindings.elements) {
              const wasEmpty = prev.elements.size === 0;
              newFindings.elements.forEach(e => {
                  if (!prev.elements.has(e)) { next.elements = new Set(next.elements).add(e); changed = true; }
              });
              if (wasEmpty && next.elements.size > 0 && gameMode === 'discovery') newUnlocksUpdates.elements = true;
          }
          if (newFindings.particles) {
              const wasEmpty = prev.particles.size === 0;
              newFindings.particles.forEach(p => {
                  if (!prev.particles.has(p)) { next.particles = new Set(next.particles).add(p); changed = true; }
              });
              if (wasEmpty && next.particles.size > 0 && gameMode === 'discovery') newUnlocksUpdates.particles = true;
          }
          if (newFindings.molecules) {
              const wasEmpty = prev.molecules.size === 0;
              newFindings.molecules.forEach(m => {
                  if (!prev.molecules.has(m)) { next.molecules = new Set(next.molecules).add(m); changed = true; }
              });
              if (wasEmpty && next.molecules.size > 0 && gameMode === 'discovery') {
                  newUnlocksUpdates.molecules = true;
                  newUnlocksUpdates.lasso = true; // Lasso unlocks with first molecule
              }
          }

          // Apply Halo updates if any
          if (Object.keys(newUnlocksUpdates).length > 0) {
              setNewlyUnlocked(curr => ({ ...curr, ...newUnlocksUpdates }));
              
              // Set 60s timers to auto-clear halos
              Object.keys(newUnlocksUpdates).forEach(key => {
                  if (unlockTimerRef.current[key]) clearTimeout(unlockTimerRef.current[key]);
                  unlockTimerRef.current[key] = setTimeout(() => {
                      setNewlyUnlocked(curr => ({ ...curr, [key]: false }));
                  }, 60000);
              });
          }

          return changed ? next : prev;
      });
  }, [gameMode]);

  // Clear Halo when a specific modal is opened
  const clearHalo = (category: 'particles' | 'elements' | 'molecules' | 'lasso') => {
      if (newlyUnlocked[category]) {
          setNewlyUnlocked(prev => ({ ...prev, [category]: false }));
          if (unlockTimerRef.current[category]) {
              clearTimeout(unlockTimerRef.current[category]);
          }
      }
  };

  // --- MODE TOGGLE HANDLER ---
  const handleToggleGameMode = () => {
      setGameMode(prev => {
          const nextMode = prev === 'sandbox' ? 'discovery' : 'sandbox';
          
          if (nextMode === 'sandbox') {
              setPalette(DEFAULT_PALETTE);
          } else {
              setPalette([]); // Clear palette when entering RPG mode
          }
          
          return nextMode;
      });
  };

  // --- ADD HANDLERS ---

  const handleAddAtom = (el: ElementData) => {
      const stableIndex = el.iso.findIndex(i => i.hl === "stable");
      const idx = stableIndex !== -1 ? stableIndex : 0;
      
      const newItem: PaletteItem = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'atom',
          element: el,
          isotopeIndex: idx
      };
      setPalette(prev => [...prev, newItem]);
      setActiveTool(newItem.id);
  };

  const handleAddMolecule = (mol: Molecule) => {
      const newItem: PaletteItem = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'molecule',
          molecule: mol
      };
      setPalette(prev => [...prev, newItem]);
      setActiveTool(newItem.id);
  };

  const handleAddParticle = (pId: string) => {
      const pDef = SM_PARTICLES.find(p => p.id === pId);
      if (!pDef) return;

      const newItem: PaletteItem = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'particle',
          particle: pDef
      };
      setPalette(prev => [...prev, newItem]);
      setActiveTool(newItem.id);
  };

  const handleRemoveFromPalette = useCallback((id: string) => {
      setPalette(prev => prev.filter(item => item.id !== id));
      if (activeTool === id) {
          setActiveTool('lasso'); 
      }
  }, [activeTool]);

  const handleUpdateIsotope = (id: string, newIndex: number) => {
      setPalette(prev => prev.map(item => 
          item.id === id ? { ...item, isotopeIndex: newIndex } : item
      ));
  };

  // Handles drag-and-drop spawns from Sidebar
  const handleSpawnItem = useCallback((item: PaletteItem, pos?: {x: number, y: number}) => {
    setSpawnRequest({
        item,
        x: pos?.x,
        y: pos?.y
    });
  }, []);

  const handleUnlockParticle = useCallback((id: string) => {
      handleDiscovery({ particles: new Set([id]) });
  }, [handleDiscovery]);

  const handleAtomCountChange = useCallback((count: number) => {
      // Placeholder for potential future UI updates, currently no-op or debug
  }, []);

  // Computed Active Entity for Canvas
  // Replaces specific "element/isotope" check with full item resolution
  const activeEntity = useMemo<PaletteItem | null>(() => {
      if (activeTool === 'lasso' || activeTool === 'energy') return null;
      
      // Standard Pallete Lookup
      const paletteItem = palette.find(p => p.id === activeTool);
      return paletteItem || null;
  }, [activeTool, palette]);

  const hasDiscoveredMolecules = discovered.molecules.size > 0;
  const hasDiscoveredElements = discovered.elements.size > 0;
  const hasDiscoveredParticles = discovered.particles.size > 0;

  return (
    <div className="flex h-screen w-screen bg-black overflow-hidden font-sans">
      <Sidebar 
        palette={palette}
        onOpenTable={() => { setIsTableOpen(true); clearHalo('elements'); }}
        onOpenMolecules={() => { setIsMoleculeOpen(true); clearHalo('molecules'); }}
        onOpenStandardModel={() => { setIsStandardModelOpen(true); clearHalo('particles'); }}
        onOpenHelp={() => setIsHelpOpen(true)}
        onRemoveFromPalette={handleRemoveFromPalette}
        onUpdateIsotope={handleUpdateIsotope}
        sliderValue={sliderValue}
        setSliderValue={setSliderValue}
        onClear={() => setClearTrigger(prev => prev + 1)}
        onSpawnItem={handleSpawnItem}
        showBonds={showBonds}
        onToggleBonds={() => setShowBonds(!showBonds)}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(prev => prev === 'solid' ? 'glass' : 'solid')}
        activeTool={activeTool}
        onSelectTool={(tool) => { setActiveTool(tool); if(tool === 'lasso') clearHalo('lasso'); }}
        onRunTest={() => setTestTrigger(t => t + 1)}
        gameMode={gameMode}
        onToggleGameMode={handleToggleGameMode}
        hasDiscoveredMolecules={hasDiscoveredMolecules}
        hasDiscoveredElements={hasDiscoveredElements}
        hasDiscoveredParticles={hasDiscoveredParticles}
        newlyUnlocked={newlyUnlocked}
      />
      
      <main className="flex-grow h-full relative bg-neutral-950">
        <Canvas 
            timeScale={timeScale}
            isPlaying={isPlaying}
            onAtomCountChange={handleAtomCountChange}
            clearTrigger={clearTrigger}
            spawnRequest={spawnRequest}
            moleculeRequest={moleculeRequest} // Kept for legacy tests, but main usage moves to spawnRequest
            showBonds={showBonds}
            viewMode={viewMode}
            activeTool={activeTool}
            activeEntity={activeEntity}
            testTrigger={testTrigger}
            onUnlockParticle={handleUnlockParticle}
            onDiscovery={handleDiscovery}
        />
      </main>

      <PeriodicTable 
        isOpen={isTableOpen}
        onClose={() => setIsTableOpen(false)}
        onSelect={handleAddAtom}
        gameMode={gameMode}
        discoveredElements={discovered.elements}
      />

      <MoleculePicker
        isOpen={isMoleculeOpen}
        onClose={() => setIsMoleculeOpen(false)}
        onSelect={handleAddMolecule}
        gameMode={gameMode}
        discoveredMolecules={discovered.molecules}
      />

      <StandardModelPicker
        isOpen={isStandardModelOpen}
        onClose={() => setIsStandardModelOpen(false)}
        onSelect={handleAddParticle}
        gameMode={gameMode}
        discoveredParticles={discovered.particles}
      />

      <HelpModal 
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        discovery={discovered}
      />
    </div>
  );
};

export default App;
