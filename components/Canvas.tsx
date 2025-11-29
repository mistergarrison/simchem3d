
import React, { useRef, useEffect, useState } from 'react';
import { PaletteItem, ToolType, DiscoveryState, Molecule } from '../types';
import { SimulationEngine } from '../simulation/Engine';
import { runSystemTest } from '../simulation/systemTest';

interface CanvasProps {
  timeScale: number;
  isPlaying: boolean;
  onAtomCountChange: (count: number) => void;
  clearTrigger: number;
  spawnRequest: { item: PaletteItem, x?: number, y?: number } | null;
  showBonds: boolean;
  viewMode: 'solid' | 'glass';
  activeTool: ToolType;
  activeEntity: PaletteItem | null;
  testTrigger?: number;
  onUnlockParticle: (id: string) => void;
  onDiscovery: (discovery: Partial<DiscoveryState>) => void;
  mobileBottomOffset: number;
  debug: boolean;
}

const Canvas: React.FC<CanvasProps> = ({
  timeScale,
  isPlaying,
  onAtomCountChange,
  clearTrigger,
  spawnRequest,
  showBonds,
  viewMode,
  activeTool,
  activeEntity,
  testTrigger,
  onUnlockParticle,
  onDiscovery,
  mobileBottomOffset,
  debug
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SimulationEngine | null>(null);
  
  const [testToast, setTestToast] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- STABLE CALLBACKS FOR ENGINE ---
  // Using refs ensures the Engine always calls the LATEST version of the callback
  // without needing to be re-instantiated or updated constantly.
  const onDiscoveryRef = useRef(onDiscovery);
  const onUnlockParticleRef = useRef(onUnlockParticle);
  const onAtomCountChangeRef = useRef(onAtomCountChange);

  useEffect(() => { onDiscoveryRef.current = onDiscovery; }, [onDiscovery]);
  useEffect(() => { onUnlockParticleRef.current = onUnlockParticle; }, [onUnlockParticle]);
  useEffect(() => { onAtomCountChangeRef.current = onAtomCountChange; }, [onAtomCountChange]);

  // Initialize Engine
  useEffect(() => {
      if (canvasRef.current && !engineRef.current) {
          engineRef.current = new SimulationEngine(
              canvasRef.current,
              {
                  timeScale,
                  showBonds,
                  viewMode,
                  activeTool: typeof activeTool === 'string' ? activeTool : 'lasso',
                  activeEntity,
                  mobileBottomOffset,
                  debug
              },
              {
                  // Pass wrappers that delegate to the current ref
                  onAtomCountChange: (c) => onAtomCountChangeRef.current(c),
                  onDiscovery: (d) => onDiscoveryRef.current(d),
                  onUnlockParticle: (id) => onUnlockParticleRef.current(id)
              }
          );
          engineRef.current.start();
      }

      return () => {
          if (engineRef.current) {
              engineRef.current.stop();
              engineRef.current = null;
          }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Engine Configuration when props change
  useEffect(() => {
      if (engineRef.current) {
          engineRef.current.updateConfig({
              timeScale,
              showBonds,
              viewMode,
              activeTool: typeof activeTool === 'string' ? activeTool : 'lasso',
              activeEntity,
              mobileBottomOffset,
              debug
          });
      }
  }, [timeScale, showBonds, viewMode, activeTool, activeEntity, mobileBottomOffset, debug]);

  // Handle Resize
  useEffect(() => {
      const handleResize = () => {
          if (canvasRef.current && canvasRef.current.parentElement) {
              const parent = canvasRef.current.parentElement;
              const dpr = window.devicePixelRatio || 1;
              
              // Update Canvas buffer size (Physical Pixels)
              canvasRef.current.width = parent.clientWidth * dpr;
              canvasRef.current.height = parent.clientHeight * dpr;
              
              // Notify Engine to recalculate Viewport (Logical Pixels)
              if (engineRef.current) {
                  engineRef.current.handleResize();
              }
          }
      };
      handleResize(); 
      window.addEventListener('resize', handleResize);
      let observer: ResizeObserver | null = null;
      if (canvasRef.current && canvasRef.current.parentElement) {
          observer = new ResizeObserver(handleResize);
          observer.observe(canvasRef.current.parentElement);
      }
      return () => {
          window.removeEventListener('resize', handleResize);
          if (observer) observer.disconnect();
      };
  }, []);

  // Handle Triggers
  useEffect(() => {
    if (clearTrigger > 0 && engineRef.current) {
        engineRef.current.clear();
    }
  }, [clearTrigger]);

  useEffect(() => {
    if (spawnRequest && engineRef.current) {
        engineRef.current.handleSpawnRequest(spawnRequest);
    }
  }, [spawnRequest]);

  useEffect(() => {
      if (testTrigger && testTrigger > 0 && engineRef.current) {
          runSystemTest(engineRef.current, (msg, type) => {
              if (toastTimeoutRef.current) {
                  clearTimeout(toastTimeoutRef.current);
                  toastTimeoutRef.current = null;
              }
              if (type === 'error') console.error(msg);
              setTestToast({ msg, type });
              if (type !== 'error') {
                  toastTimeoutRef.current = setTimeout(() => {
                      setTestToast(null);
                      toastTimeoutRef.current = null;
                  }, 3000);
              }
          });
      }
  }, [testTrigger]);

  // Input Handlers
  const handlePointerDown = (e: React.PointerEvent) => engineRef.current?.handlePointerDown(e);
  const handlePointerMove = (e: React.PointerEvent) => engineRef.current?.handlePointerMove(e);
  const handlePointerUp = (e: React.PointerEvent) => engineRef.current?.handlePointerUp(e);
  const handleWheel = (e: React.WheelEvent) => engineRef.current?.handleWheel(e);

  return (
    <>
        <canvas 
            ref={canvasRef}
            className="block w-full h-full touch-none cursor-crosshair active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
        />
        {testToast && (
            <div className={`fixed top-[30%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-6 py-4 rounded-lg shadow-2xl z-50 font-bold border max-w-lg w-full flex flex-col gap-2 select-text
                ${testToast.type === 'error' ? 'bg-red-900/95 border-red-500 text-white' : testToast.type === 'success' ? 'bg-green-600 border-green-400 text-white' : 'bg-blue-600 border-blue-400 text-white'}
            `}>
                <div className="flex justify-between items-start">
                    <span className="font-mono text-sm break-words">{testToast.msg}</span>
                </div>
                {testToast.type === 'error' && (
                    <button 
                        onClick={() => setTestToast(null)}
                        className="self-end px-4 py-1 bg-white/20 hover:bg-white/30 rounded text-sm uppercase tracking-wider transition-colors mt-2"
                    >
                        Okay
                    </button>
                )}
            </div>
        )}
    </>
  );
};

export default Canvas;
