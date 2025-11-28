
import React from 'react';
import { GameMode } from '../../types';

interface SimulationOptionsProps {
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
    debugMode: boolean;
    onToggleDebugMode: () => void;
    onClearStorage?: () => void;
}

export const SimulationOptions: React.FC<SimulationOptionsProps> = ({ 
    sliderValue, 
    setSliderValue, 
    getScaleText, 
    showBonds, 
    onToggleBonds, 
    viewMode, 
    onToggleViewMode, 
    gameMode, 
    onToggleGameMode, 
    onRunTest, 
    showDevTools, 
    className, 
    showLogo, 
    onLogoClick, 
    onOpenHelp,
    debugMode,
    onToggleDebugMode,
    onClearStorage
}) => {
    return (
        <div className={`p-3 bg-gray-900 border border-gray-700 rounded-lg space-y-4 shadow-xl ${className || ''}`}>
            {showLogo && (
                 <div className="mb-2 pb-2 border-b border-gray-700 flex justify-between items-center">
                    <div onClick={onLogoClick} className="cursor-pointer select-none">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">SimChem 3D</h1>
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

            {showDevTools && (
                <div className="pt-2 border-t border-gray-800 animate-in fade-in slide-in-from-top-2 space-y-2">
                    <button 
                        onClick={onToggleDebugMode}
                        className={`w-full py-2 rounded border flex items-center justify-center gap-2 text-xs font-bold transition-colors ${debugMode ? 'bg-yellow-600/20 border-yellow-500 text-yellow-300' : 'bg-gray-800 border-gray-700 text-gray-500 hover:bg-gray-700'}`}
                    >
                        <span>🐞</span> Debug Logs {debugMode ? '(ON)' : '(OFF)'}
                    </button>
                    {onClearStorage && (
                        <button 
                            onClick={onClearStorage}
                            className="w-full py-2 rounded border border-red-900/50 bg-red-900/20 hover:bg-red-900/40 text-red-400 text-xs font-bold transition-colors"
                        >
                            ⚠️ Clear Saved Progress
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
