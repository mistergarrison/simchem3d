
import React, { useState, useEffect } from 'react';
import { DiscoveryState } from '../types';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    discovery: DiscoveryState;
}

type PageId = 'basics' | 'particles' | 'hadrons' | 'nuclear' | 'chemistry';

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, discovery }) => {
    const [activePage, setActivePage] = useState<PageId>('basics');

    // Reset to basics when opened
    useEffect(() => {
        if (isOpen) setActivePage('basics');
    }, [isOpen]);

    if (!isOpen) return null;

    // Discovery Flags
    const discoveredElectron = discovery.particles.has('electron');
    const discoveredQuarks = discovery.particles.has('up') || discovery.particles.has('down');
    const discoveredQuantum = discoveredElectron || discoveredQuarks;

    // A proton can be discovered as a particle (from energy) or as Element Z=1
    const discoveredProton = discovery.particles.has('proton') || discovery.elements.has(1); 
    const discoveredNeutron = discovery.particles.has('neutron') || discovery.elements.has(0);
    const discoveredHadrons = discoveredProton || discoveredNeutron;

    // Has created elements heavier than H
    const discoveredFusion = discovery.elements.size > 1; 
    
    const discoveredMolecules = discovery.molecules.size > 0;

    const NAV_ITEMS: { id: PageId; label: string; icon: string; locked: boolean; color: string }[] = [
        { id: 'basics', label: 'Basics', icon: '🎮', locked: false, color: 'text-white' },
        { id: 'particles', label: 'Quantum', icon: '⚡', locked: false, color: 'text-pink-400' },
        { id: 'hadrons', label: 'Hadrons', icon: '🧩', locked: !discoveredQuantum, color: 'text-violet-400' },
        { id: 'nuclear', label: 'Nuclear', icon: '☢️', locked: !discoveredHadrons, color: 'text-orange-400' },
        { id: 'chemistry', label: 'Chemistry', icon: '⚗️', locked: !discoveredFusion, color: 'text-green-400' },
    ];

    const renderContent = () => {
        switch (activePage) {
            case 'basics':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                            <h4 className="font-bold text-lg mb-2 text-white">Controls</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                                <div>
                                    <span className="block font-bold text-gray-400 uppercase text-xs mb-1">Mouse</span>
                                    <ul className="space-y-1">
                                        <li><strong className="text-white">Left Click</strong>: Select / Spawn</li>
                                        <li><strong className="text-white">Drag</strong>: Move Atom</li>
                                        <li><strong className="text-white">Drag Background</strong>: Pan Camera</li>
                                        <li><strong className="text-white">Scroll</strong>: Rotate View (Pitch)</li>
                                    </ul>
                                </div>
                                <div>
                                    <span className="block font-bold text-gray-400 uppercase text-xs mb-1">Touch</span>
                                    <ul className="space-y-1">
                                        <li><strong className="text-white">Tap</strong>: Select / Spawn</li>
                                        <li><strong className="text-white">Drag Atom</strong>: Move</li>
                                        <li><strong className="text-white">Drag Empty</strong>: Pan</li>
                                        <li><strong className="text-white">Pinch</strong>: Zoom</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                            <h4 className="font-bold text-lg mb-2 text-white">Simulation Mechanics</h4>
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li className="flex gap-3">
                                    <span className="text-xl">⏱️</span>
                                    <div>
                                        <strong className="text-white block">Time Dilation</strong>
                                        Use the slider to control time. Slow down to 0.1x to observe fast reactions, or speed up to 10,000x to watch radioactive decay.
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-xl">👋</span>
                                    <div>
                                        <strong className="text-white block">Throwing Physics</strong>
                                        Atoms have mass and inertia. Drag and release to throw them.
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                );

            case 'particles':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-pink-900/20 p-4 rounded-lg border border-pink-500/30">
                            <h4 className="font-bold text-lg mb-2 text-pink-300">The Vacuum ⚡</h4>
                            
                            {!discoveredQuantum ? (
                                <>
                                    <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                                        The vacuum is not empty. It pulses with potential energy waiting to be released.
                                    </p>
                                    <div className="bg-black/40 p-3 rounded border border-pink-500/20">
                                        <strong className="text-white text-sm block mb-2">Current Mission</strong>
                                        <p className="text-xs text-gray-400 italic mb-2">
                                            Use the <strong>Energy Tool</strong> (⚡) to rip particles from the void.
                                        </p>
                                        <p className="text-xs text-gray-300">
                                            1. Select the Energy Tool.<br/>
                                            2. <strong>Hold down</strong> to accumulate MeV (Million Electron Volts).<br/>
                                            3. Release at different energy levels to find stable resonances.
                                        </p>
                                    </div>
                                    <p className="text-xs text-pink-400/70 mt-2">
                                        Warning: If you release at the wrong energy, the quantum fluctuation will simply collapse back into nothingness.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-300 mb-4">
                                        You have successfully unlocked Pair Production.
                                    </p>
                                    <div className="text-xs bg-black/40 p-3 rounded border border-pink-500/20 font-mono space-y-1 text-pink-200">
                                        <p>TARGET: 1.022 MeV -&gt; Electron + Positron</p>
                                        <p>TARGET: ~9.40 MeV -&gt; Down + Anti-Down Quark</p>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 italic">
                                        Tip: Release exactly when the gauge hits the target color.
                                    </p>
                                </>
                            )}
                        </div>

                        {discoveredQuantum && (
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-2">Physics Insight</h4>
                                <h3 className="font-bold text-white mb-2">Pair Production</h3>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    According to Einstein's <em className="font-serif">E=mc²</em>, energy can be converted into mass. 
                                    However, conservation laws require that matter is always created alongside antimatter.
                                    <br/><br/>
                                    If a particle touches its antiparticle, they <strong>annihilate</strong> back into energy. You must separate them quickly!
                                </p>
                            </div>
                        )}
                    </div>
                );

            case 'hadrons':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-violet-900/20 p-4 rounded-lg border border-violet-500/30">
                            <h4 className="font-bold text-lg mb-2 text-violet-300">Building Matter</h4>
                            
                            {!discoveredHadrons ? (
                                <>
                                    <p className="text-sm text-gray-300 mb-4">
                                        You have discovered Quarks. But they are unstable and decay rapidly in isolation.
                                    </p>
                                    <div className="bg-black/40 p-3 rounded border border-violet-500/20">
                                        <strong className="text-white text-sm block mb-2">Current Mission</strong>
                                        <p className="text-xs text-gray-400 italic">
                                            Stabilize the quarks by grouping them.
                                        </p>
                                        <p className="text-xs text-gray-300 mt-2">
                                            Nature prefers triplets. Try creating multiple quark pairs in rapid succession in the same location.
                                            Let them clump together before they decay.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-300 mb-4">
                                        You have created stable Baryons!
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-black/40 p-3 rounded border border-violet-500/20 text-center">
                                            <div className="text-2xl mb-1">p⁺</div>
                                            <div className="font-bold text-white text-sm">Proton</div>
                                            <div className="text-xs text-gray-400 mt-1">2 Up + 1 Down</div>
                                        </div>
                                        <div className="bg-black/40 p-3 rounded border border-violet-500/20 text-center">
                                            <div className="text-2xl mb-1">n</div>
                                            <div className="font-bold text-white text-sm">Neutron</div>
                                            <div className="text-xs text-gray-400 mt-1">1 Up + 2 Down</div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {discoveredHadrons && (
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-2">Physics Insight</h4>
                                <h3 className="font-bold text-white mb-2">Confinement</h3>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    The <strong>Strong Nuclear Force</strong> binds quarks together. Unlike gravity or electromagnetism, the strong force gets <em>stronger</em> as quarks move apart, making it impossible to isolate a single quark in nature.
                                </p>
                            </div>
                        )}
                    </div>
                );

            case 'nuclear':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-orange-900/20 p-4 rounded-lg border border-orange-500/30">
                            <h4 className="font-bold text-lg mb-2 text-orange-300">Nucleosynthesis</h4>
                            
                            {!discoveredFusion ? (
                                <>
                                    <p className="text-sm text-gray-300 mb-4">
                                        You have Protons (Hydrogen Nuclei). Now you must forge the heavy elements of the universe.
                                    </p>
                                    <div className="bg-black/40 p-3 rounded border border-orange-500/20">
                                        <strong className="text-white text-sm block mb-2">Current Mission</strong>
                                        <p className="text-xs text-gray-400 italic">
                                            Add neutrons to a nucleus.
                                        </p>
                                        <p className="text-xs text-gray-300 mt-2">
                                            Protons are positively charged and repel each other strongly. 
                                            <strong>Collisional fusion is not implemented.</strong>
                                        </p>
                                        <p className="text-xs text-gray-300 mt-2">
                                            Instead, use <strong>Neutron Capture</strong>. Fire Neutrons directly at a Proton to create Deuterium (Heavy Hydrogen).
                                            Continue adding neutrons to trigger Beta Decay, which converts Neutrons into Protons, creating new elements!
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-300 mb-4">
                                        Synthesized new elements via decay!
                                    </p>
                                    <ul className="space-y-2 text-sm">
                                        <li className="bg-black/40 p-2 rounded flex items-center gap-3">
                                            <span className="text-xl">🧲</span>
                                            <span><strong>Neutron Capture:</strong> The primary way to build elements here. Shoot neutrons at nuclei.</span>
                                        </li>
                                        <li className="bg-black/40 p-2 rounded flex items-center gap-3">
                                            <span className="text-xl">☢️</span>
                                            <span><strong>Beta Decay:</strong> Unstable isotopes will transmute neutron -> proton.</span>
                                        </li>
                                    </ul>
                                </>
                            )}
                        </div>

                        {discoveredFusion && (
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-2">Physics Insight</h4>
                                <h3 className="font-bold text-white mb-2">Stability & Decay</h3>
                                <p className="text-sm text-gray-300 leading-relaxed mb-3">
                                    Not all combinations of protons and neutrons are stable. 
                                    If the balance is off, the nucleus will decay to reach a lower energy state.
                                </p>
                                <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
                                    <li><strong>Beta Decay:</strong> Neutron turns into Proton (releases Electron).</li>
                                    <li><strong>Alpha Decay:</strong> Ejects a Helium nucleus (2p 2n).</li>
                                    <li><strong>Spontaneous Fission:</strong> Heavy nuclei split apart.</li>
                                </ul>
                            </div>
                        )}
                    </div>
                );

            case 'chemistry':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-green-900/20 p-4 rounded-lg border border-green-500/30">
                            <h4 className="font-bold text-lg mb-2 text-green-300">Chemistry</h4>
                            
                            {!discoveredMolecules ? (
                                <>
                                    <p className="text-sm text-gray-300 mb-4">
                                        The universe is cooling. It is time for electrons to find their homes.
                                    </p>
                                    <div className="bg-black/40 p-3 rounded border border-green-500/20">
                                        <strong className="text-white text-sm block mb-2">Current Mission</strong>
                                        <p className="text-xs text-gray-400 italic">
                                            Create a neutral Atom, then form a Molecule.
                                        </p>
                                        <p className="text-xs text-gray-300 mt-2">
                                            1. Spawn an <strong>Electron</strong> near a Proton. It will be captured to form neutral Hydrogen.<br/>
                                            2. Bring two neutral atoms close together gently. If they are compatible, they will share electrons and bond.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-300 mb-4">
                                        You have entered the age of Chemistry.
                                    </p>
                                    <div className="space-y-3">
                                        <div className="bg-black/40 p-3 rounded border border-green-500/20">
                                            <strong className="text-white text-sm block mb-1">Covalent Bonding</strong>
                                            <p className="text-xs text-gray-400">Atoms share electrons to fill their valence shells. Bring them together to bond.</p>
                                        </div>
                                        <div className="bg-black/40 p-3 rounded border border-green-500/20">
                                            <strong className="text-white text-sm block mb-1">Recipes</strong>
                                            <p className="text-xs text-gray-400">Check the Molecule Palette (⚗️) to see known structures you can synthesize.</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {discoveredMolecules && (
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-2">Physics Insight</h4>
                                <h3 className="font-bold text-white mb-2">VSEPR Theory</h3>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    Valence Shell Electron Pair Repulsion theory predicts the shape of molecules. 
                                    Electron pairs repel each other, forcing bonds into specific geometric arrangements (Linear, Trigonal, Tetrahedral) to maximize distance.
                                </p>
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-gray-950 border border-gray-700 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col md:flex-row overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                
                {/* SIDEBAR NAVIGATION */}
                <div className="w-full md:w-64 bg-gray-900 border-b md:border-b-0 md:border-r border-gray-800 flex flex-row md:flex-col overflow-x-auto md:overflow-visible no-scrollbar">
                    <div className="p-4 md:p-6 hidden md:block border-b border-gray-800">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>📘</span> Guide
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">SimChem Field Manual</p>
                    </div>
                    
                    <div className="flex flex-row md:flex-col p-2 gap-1 w-full">
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActivePage(item.id)}
                                disabled={item.locked}
                                className={`flex items-center gap-3 p-3 rounded-lg text-sm font-bold transition-all w-full text-left
                                    ${activePage === item.id 
                                        ? 'bg-gray-800 text-white shadow-md ring-1 ring-white/10' 
                                        : 'text-gray-500 hover:bg-gray-800/50 hover:text-gray-300'}
                                    ${item.locked ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                                `}
                            >
                                <span className="text-xl">{item.locked ? '🔒' : item.icon}</span>
                                <span className={item.locked ? '' : item.color}>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="flex-1 flex flex-col h-full bg-gray-950 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-10 p-2 rounded-full hover:bg-gray-800 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="p-6 md:p-10 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="max-w-2xl mx-auto">
                            <h2 className="text-3xl font-extrabold text-white mb-6 flex items-center gap-3">
                                <span>{NAV_ITEMS.find(i => i.id === activePage)?.icon}</span>
                                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                    {NAV_ITEMS.find(i => i.id === activePage)?.label}
                                </span>
                            </h2>
                            {renderContent()}
                        </div>
                    </div>

                    {/* Footer Nav Buttons (Mobile/Desktop) */}
                    <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex justify-between items-center md:justify-end">
                        <button onClick={onClose} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold text-sm transition-colors border border-gray-700">
                            Close
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HelpModal;