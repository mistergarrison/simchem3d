
import React from 'react';
import { DiscoveryState } from '../../types/ui';
import { ELEMENTS, SM_PARTICLES } from '../../data/elements';
import { MOLECULES } from '../../data/molecules';

interface DiscoveryOverviewProps {
    isOpen: boolean;
    onClose: () => void;
    discovery: DiscoveryState;
    onResetProgress?: () => void;
}

export const DiscoveryOverview: React.FC<DiscoveryOverviewProps> = ({ isOpen, onClose, discovery, onResetProgress }) => {
    if (!isOpen) return null;

    const particleCount = discovery.particles.size;
    const particleTotal = SM_PARTICLES.length;
    const elementCount = discovery.elements.size;
    const elementTotal = ELEMENTS.length;
    const moleculeCount = discovery.molecules.size;
    const moleculeTotal = MOLECULES.length;

    const totalCount = particleCount + elementCount + moleculeCount;
    const grandTotal = particleTotal + elementTotal + moleculeTotal;
    const totalPercent = Math.round((totalCount / Math.max(1, grandTotal)) * 100);

    const StatRow = ({ label, current, max, icon, color }: { label: string, current: number, max: number, icon: string, color: string }) => {
        const pct = Math.round((current / Math.max(1, max)) * 100);
        return (
            <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-gray-300 flex items-center gap-2">
                        <span className="text-lg">{icon}</span> {label}
                    </span>
                    <span className="font-mono text-gray-400 text-xs">{current} / {max}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ${color}`} 
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-gray-950 border border-gray-700 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                    <h2 className="text-lg font-bold text-white">Discovery Progress</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-xl p-1">&times;</button>
                </div>
                
                <div className="p-6">
                    <div className="flex items-center justify-center mb-8 relative">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
                            <circle cx="64" cy="64" r="58" fill="none" stroke="#1f2937" strokeWidth="8" />
                            <circle 
                                cx="64" cy="64" r="58" 
                                fill="none" 
                                stroke="url(#gradient)" 
                                strokeWidth="8" 
                                strokeDasharray={365} 
                                strokeDashoffset={365 - (365 * totalPercent) / 100} 
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-white">{totalPercent}%</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Complete</span>
                        </div>
                    </div>

                    <StatRow label="Particles" current={particleCount} max={particleTotal} icon="✨" color="bg-pink-500" />
                    <StatRow label="Elements" current={elementCount} max={elementTotal} icon="⚛️" color="bg-blue-500" />
                    <StatRow label="Molecules" current={moleculeCount} max={moleculeTotal} icon="⚗️" color="bg-purple-500" />
                </div>

                {onResetProgress && (
                    <div className="p-4 border-t border-gray-800 bg-gray-900/30">
                        <button 
                            onClick={() => {
                                onClose();
                                onResetProgress();
                            }}
                            className="w-full py-3 rounded-lg border border-red-900/30 bg-red-900/10 hover:bg-red-900/20 text-red-400 text-sm font-bold transition-colors flex items-center justify-center gap-2 group"
                        >
                            <span className="group-hover:scale-110 transition-transform">🗑️</span> Reset All Progress
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
