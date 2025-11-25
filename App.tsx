

import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import PeriodicTable from './components/PeriodicTable';
import MoleculePicker from './components/RecipePicker'; // Note: File name retained, component renamed
import { ELEMENTS, ELECTRON_ELEM, PROTON_ELEM, NEUTRON_ELEM } from './elements';
import { ElementData, PaletteItem, Molecule, ToolType, Isotope } from './types';

/**
 * App.tsx
 * 
 * The Root Container and State Orchestrator.
 */
const App: React.FC = () => {
  // Initialize palette with Hydrogen, Helium, Carbon, Oxygen, and Uranium-235
  const [palette, setPalette] = useState<PaletteItem[]>([
    { id: 'init-h', element: ELEMENTS[0], isotopeIndex: 0 },   // H-1
    { id: 'init-he', element: ELEMENTS[1], isotopeIndex: 1 },  // He-4
    { id: 'init-c', element: ELEMENTS[5], isotopeIndex: 2 },   // C-12
    { id: 'init-o', element: ELEMENTS[7], isotopeIndex: 1 },   // O-16
    { id: 'init-u235', element: ELEMENTS[91], isotopeIndex: 3 } // U-235
  ]);
  
  const [isTableOpen, setIsTableOpen] = useState(false);
  const [isMoleculeOpen, setIsMoleculeOpen] = useState(false);
  
  // Slider value 0-100. 50 = 1x real-time speed.
  const [sliderValue, setSliderValue] = useState(50);
  
  // Visual Settings
  const [showBonds, setShowBonds] = useState(false);
  const [viewMode, setViewMode] = useState<'solid' | 'glass'>('glass');
  
  // Tools
  const [activeTool, setActiveTool] = useState<ToolType>('lasso');

  // Triggers for Canvas-side effects
  const [clearTrigger, setClearTrigger] = useState(0);
  const [spawnRequest, setSpawnRequest] = useState<{z: number, isoIndex: number, id: number, x?: number, y?: number} | null>(null);
  const [moleculeRequest, setMoleculeRequest] = useState<{molecule: Molecule, id: number} | null>(null);

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

  const handleAddAtom = (el: ElementData) => {
      // Default to stable isotope or first one if no stable version exists
      const stableIndex = el.iso.findIndex(i => i.hl === "stable");
      const idx = stableIndex !== -1 ? stableIndex : 0;
      
      const newItem: PaletteItem = {
          id: Math.random().toString(36).substr(2, 9),
          element: el,
          isotopeIndex: idx
      };
      setPalette(prev => [...prev, newItem]);
  };

  const handleRemoveFromPalette = (id: string) => {
      setPalette(prev => prev.filter(item => item.id !== id));
      if (activeTool === id) {
          setActiveTool('lasso'); // Reset to lasso if active item removed
      }
  };

  const handleUpdateIsotope = (id: string, newIndex: number) => {
      setPalette(prev => prev.map(item => 
          item.id === id ? { ...item, isotopeIndex: newIndex } : item
      ));
  };

  // Handles drag-and-drop spawns from Sidebar
  const handleSpawnAtom = (item: PaletteItem, pos?: {x: number, y: number}) => {
    setSpawnRequest({
        z: item.element.z,
        isoIndex: item.isotopeIndex,
        id: Date.now(),
        x: pos?.x,
        y: pos?.y
    });
  };

  const handleSelectMolecule = (molecule: Molecule) => {
      setMoleculeRequest({
          molecule,
          id: Date.now()
      });
  };

  // Computed Active Entity for Canvas (Atom Tool Logic)
  const activeEntity = useMemo<{ element: ElementData, isotopeIndex: number } | null>(() => {
      if (activeTool === 'lasso') return null;
      if (activeTool === 'electron') return { element: ELECTRON_ELEM, isotopeIndex: 0 };
      if (activeTool === 'proton') return { element: PROTON_ELEM, isotopeIndex: 0 };
      if (activeTool === 'neutron') return { element: NEUTRON_ELEM, isotopeIndex: 0 };
      
      // Check if it matches a palette ID
      const paletteItem = palette.find(p => p.id === activeTool);
      if (paletteItem) {
          return { element: paletteItem.element, isotopeIndex: paletteItem.isotopeIndex };
      }
      return null;
  }, [activeTool, palette]);

  return (
    <div className="flex h-screen w-screen bg-black overflow-hidden font-sans">
      <Sidebar 
        palette={palette}
        onAddAtom={() => setIsTableOpen(true)}
        onRemoveFromPalette={handleRemoveFromPalette}
        onUpdateIsotope={handleUpdateIsotope}
        sliderValue={sliderValue}
        setSliderValue={setSliderValue}
        onClear={() => setClearTrigger(prev => prev + 1)}
        onSpawnAtom={handleSpawnAtom}
        onOpenMolecules={() => setIsMoleculeOpen(true)}
        showBonds={showBonds}
        onToggleBonds={() => setShowBonds(!showBonds)}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(prev => prev === 'solid' ? 'glass' : 'solid')}
        activeTool={activeTool}
        onSelectTool={setActiveTool}
      />
      
      <main className="flex-grow h-full relative bg-neutral-950">
        <Canvas 
            timeScale={timeScale}
            isPlaying={isPlaying}
            onAtomCountChange={() => {}}
            clearTrigger={clearTrigger}
            spawnRequest={spawnRequest}
            moleculeRequest={moleculeRequest}
            showBonds={showBonds}
            viewMode={viewMode}
            activeTool={activeTool}
            activeEntity={activeEntity}
        />
      </main>

      <PeriodicTable 
        isOpen={isTableOpen}
        onClose={() => setIsTableOpen(false)}
        onSelect={handleAddAtom}
      />

      <MoleculePicker
        isOpen={isMoleculeOpen}
        onClose={() => setIsMoleculeOpen(false)}
        onSelect={handleSelectMolecule}
      />
    </div>
  );
};

export default App;