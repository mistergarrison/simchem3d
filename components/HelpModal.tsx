
import React, { useState, useEffect } from 'react';
import { DiscoveryState, GameMode } from '../types';
import { ELEMENTS, SM_PARTICLES } from '../elements';
import { MOLECULES } from '../molecules';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    discovery: DiscoveryState;
    gameMode: GameMode;
}

type PageId = 'basics' | 'particles' | 'hadrons' | 'nuclear' | 'chemistry';

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, discovery, gameMode }) => {
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
    const discoveredHeavyElements = discovery.elements.size > 1; 
    
    const discoveredMolecules = discovery.molecules.size > 0;

    const unlockedAll = gameMode === 'sandbox';
    const hasLasso = unlockedAll || discoveredMolecules;

    // Progress Tracking
    const totalItems = ELEMENTS.length + SM_PARTICLES.length + MOLECULES.length;
    const discoveredCount = unlockedAll ? totalItems : (discovery.elements.size + discovery.particles.size + discovery.molecules.size);
    const progressPercent = Math.min(100, Math.round((discoveredCount / totalItems) * 100));

    const NAV_ITEMS: { id: PageId; label: string; icon: string; locked: boolean; color: string }[] = [
        { id: 'basics', label: 'Controls & Sim', icon: '🎮', locked: false, color: 'text-white' },
        { id: 'particles', label: 'Quantum Field', icon: '⚡', locked: false, color: 'text-pink-400' },
        { id: 'hadrons', label: 'Hadronization', icon: '🧩', locked: !unlockedAll && !discoveredQuantum, color: 'text-violet-400' },
        { id: 'nuclear', label: 'Nuclear Physics', icon: '☢️', locked: !unlockedAll && !discoveredHadrons, color: 'text-orange-400' },
        { id: 'chemistry', label: 'Chemistry', icon: '⚗️', locked: !unlockedAll && !discoveredHeavyElements, color: 'text-green-400' },
    ];

    const renderContent = () => {
        switch (activePage) {
            case 'basics':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <section className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">🎮 Interaction</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
                                <div>
                                    <h4 className="font-bold text-blue-400 uppercase text-xs mb-2">Mouse & Keyboard</h4>
                                    <ul className="space-y-2">
                                        <li><strong className="text-white">Left Click / Drag:</strong> Interact with atoms. Grab an atom to move it. Fling it to impart velocity.</li>
                                        <li><strong className="text-white">Scroll Wheel:</strong> Rotate the hovered molecule or group.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-purple-400 uppercase text-xs mb-2">Touch / Mobile</h4>
                                    <ul className="space-y-2">
                                        <li><strong className="text-white">Tap:</strong> Selects tools or spawn items.</li>
                                        <li><strong className="text-white">Drag Object:</strong> Moves the atom. Velocity is calculated from your throw speed.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">⚙️ Simulation Mechanics</h3>
                            <div className="space-y-6 text-sm text-gray-300">
                                <div>
                                    <h4 className="font-bold text-white text-base mb-2">Time Dilation</h4>
                                    <p className="leading-relaxed">
                                        The slider at the bottom controls the flow of time.
                                        <br/><br/>
                                        <span className="text-blue-300 font-bold">Slow Motion (0.1x - 1.0x):</span> Best for observing fast chemical reactions or carefully arranging atoms.
                                        <br/><br/>
                                        <span className="text-blue-300 font-bold">Fast Forward (10x - 10,000x):</span> Essential for Nuclear Physics. Use this to speed up radioactive decay, which can otherwise take minutes or years.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-base mb-2">The Z-Plane</h4>
                                    <p className="leading-relaxed">
                                        While the simulation is 3D, interactions primarily occur on a focal plane (Z=0). 
                                        A weak "restoration force" gently pulls atoms back to Z=0 so they don't drift into the abyss, while still allowing 3D molecular structures to form.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-yellow-900/10 p-6 rounded-lg border border-yellow-500/20">
                            <h3 className="text-xl font-bold text-yellow-500 mb-4 border-b border-yellow-500/20 pb-2">🛠️ Tools</h3>
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li>
                                    <strong className="text-white">⚡ Energy Tool:</strong> Your primary interaction method in the void. Hold to accumulate energy in the vacuum, release to discharge it.
                                </li>
                                {hasLasso && (
                                    <li>
                                        <strong className="text-white">𓎤 Lasso Tool:</strong> Draw a loop around multiple atoms to select them. If they match a known molecule recipe, they will snap into a valid structure.
                                    </li>
                                )}
                            </ul>
                        </section>
                    </div>
                );

            case 'particles':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <section className="bg-pink-900/20 p-6 rounded-lg border border-pink-500/30">
                            <h3 className="text-xl font-bold text-pink-400 mb-4">Quantum Field Theory</h3>
                            
                            {!discoveredQuantum && !unlockedAll ? (
                                <div className="space-y-4">
                                    <p className="text-base text-gray-300 leading-loose">
                                        The vacuum is not empty space. It is a seething ocean of potential energy.
                                    </p>
                                    <div className="bg-black/40 p-5 rounded border border-pink-500/20 mt-4">
                                        <strong className="text-white text-sm block mb-3">Objective: Perturb the Vacuum</strong>
                                        <p className="text-sm text-gray-300">
                                            If you concentrate enough energy into a single point, you may be able to rip real particles out of the void.
                                        </p>
                                        <p className="text-sm text-gray-300 mt-2">
                                            Use the <strong className="text-yellow-400">Energy Tool (⚡)</strong>. Hold it to charge up energy (eV/MeV). Try to release it when you hit a resonant frequency.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        You have successfully triggered <strong>Pair Production</strong>! By injecting energy greater than the rest mass of the particles (E &gt; 2mc²), you converted pure energy into matter and antimatter.
                                    </p>
                                    
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-white border-b border-gray-700 pb-1">Real World Physics</h4>
                                        <p className="text-xs text-gray-400">
                                            <strong>Conservation of Lepton Number:</strong> In reality, you cannot simply create an electron. Nature requires balance. You must create a matter/antimatter pair (e.g., an Electron and a Positron) so the net charge and lepton number of the universe remain zero.
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            <strong>Bosons:</strong> Force carriers like Photons (γ) are modeled here as massless particles. They travel at max speed and pass through other matter ("ghosting"), mimicking their wave-like behavior.
                                        </p>
                                    </div>

                                    <div className="space-y-4 mt-4 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                        <h4 className="font-bold text-red-400 text-xs uppercase">Simulation Inaccuracies</h4>
                                        <p className="text-xs text-gray-500">
                                            <strong>Scale:</strong> Subatomic particles are drawn vastly larger than reality. If an atom were a stadium, the nucleus would be a marble, and the electron a speck of dust. We scale them up for visibility.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                );

            case 'hadrons':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <section className="bg-violet-900/20 p-6 rounded-lg border border-violet-500/30">
                            <h3 className="text-xl font-bold text-violet-300 mb-4">Hadronization & Confinement</h3>
                            
                            {!discoveredHadrons && !unlockedAll ? (
                                <div className="space-y-6">
                                    <p className="text-base text-gray-300 leading-relaxed">
                                        You may have noticed that Quarks disappear rapidly after creation. This is due to <strong>Color Confinement</strong>. Quarks cannot exist in isolation.
                                    </p>
                                    <div className="bg-black/40 p-5 rounded border border-violet-500/20">
                                        <strong className="text-white text-sm block mb-3">Objective: Stabilize the Quarks</strong>
                                        <p className="text-sm text-gray-300">
                                            To save a Quark from decaying back into the vacuum, you must combine it with others to form a color-neutral <strong>Hadron</strong>.
                                        </p>
                                        <p className="text-sm text-gray-300 mt-2">
                                            Try spawning 3 Quarks (Up/Down) in rapid succession in the same spot.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        Success! You have created a <strong>Nucleon</strong> (Proton or Neutron). By grouping 3 quarks, their color charges canceled out, creating a stable composite particle.
                                    </p>
                                    
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-white border-b border-gray-700 pb-1">Real World Physics</h4>
                                        <p className="text-xs text-gray-400">
                                            <strong>Mass Deficit:</strong> A proton weighs ~938 MeV, but its three quarks only weigh ~10 MeV combined. The remaining 99% of the mass comes from the kinetic energy of the gluons binding them together (E=mc²).
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            <strong>Strong Force:</strong> This is the force that holds quarks together. It gets stronger as you pull them apart, acting like a rubber band.
                                        </p>
                                    </div>

                                    <div className="space-y-4 mt-4 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                        <h4 className="font-bold text-red-400 text-xs uppercase">Simulation Inaccuracies</h4>
                                        <p className="text-xs text-gray-500">
                                            <strong>Flux Tubes:</strong> In reality, pulling quarks apart snaps the gluon field, creating new quark pairs from the energy (Hadronization Jets). In this sim, we simplify this by just decaying isolated quarks after a few seconds.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                );

            case 'nuclear':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <section className="bg-orange-900/20 p-6 rounded-lg border border-orange-500/30">
                            <h3 className="text-xl font-bold text-orange-400 mb-4">Nuclear Synthesis</h3>
                            
                            {!discoveredHeavyElements && !unlockedAll ? (
                                <div className="space-y-6">
                                    <p className="text-base text-gray-300 leading-relaxed">
                                        You have Hydrogen (Protons). But how do you make heavier elements like Helium or Carbon? 
                                        Smashing protons together is difficult because they repel each other (Coulomb Barrier).
                                    </p>
                                    <div className="bg-black/40 p-5 rounded border border-orange-500/20">
                                        <strong className="text-white text-sm block mb-3">Objective: Bypass the Electric Defense</strong>
                                        <p className="text-sm text-gray-300 mb-2">
                                            You need a particle with mass but NO charge.
                                        </p>
                                        <ol className="text-sm text-gray-400 list-decimal list-inside space-y-2 mt-3">
                                            <li>Take a <strong>Proton</strong>.</li>
                                            <li>Throw a <strong>Neutron</strong> at it. It should stick!</li>
                                            <li>Keep adding neutrons until the nucleus becomes unstable.</li>
                                            <li>Wait for nature to take its course.</li>
                                        </ol>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        You have discovered <strong>Neutron Capture</strong> and <strong>Beta Decay</strong>! This is your engine for climbing the periodic table.
                                    </p>
                                    <p className="text-sm text-gray-300">
                                        By adding neutrons, you created a heavy isotope. It eventually became unstable and turned a neutron into a proton (emitting an electron), transforming the element into the next one on the table.
                                    </p>

                                    <div className="space-y-4">
                                        <h4 className="font-bold text-white border-b border-gray-700 pb-1">Real World Physics</h4>
                                        <p className="text-xs text-gray-400">
                                            <strong>Valley of Stability:</strong> Atomic nuclei need a specific balance of protons and neutrons. Too many neutrons? Beta decay. Too many protons? Positron emission or Alpha decay.
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            <strong>Breeder Reactors:</strong> This process (Neutron Capture -> Decay) is exactly how we create plutonium and other synthetic elements in nuclear reactors.
                                        </p>
                                    </div>

                                    <div className="space-y-4 mt-4 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                        <h4 className="font-bold text-red-400 text-xs uppercase">Simulation Inaccuracies</h4>
                                        <p className="text-xs text-gray-500">
                                            <strong>Fusion vs Capture:</strong> Stars build elements by smashing protons together (Fusion) at millions of degrees. Simulating that requires extreme temperature/pressure mechanics. We use Neutron Capture because it works at "room temperature" in the sim, making it playable without gravity.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                );

            case 'chemistry':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <section className="bg-green-900/20 p-6 rounded-lg border border-green-500/30">
                            <h3 className="text-xl font-bold text-green-400 mb-4">Molecular Chemistry</h3>
                            
                            {!discoveredMolecules && !unlockedAll ? (
                                <div className="space-y-6">
                                    <p className="text-base text-gray-300 leading-relaxed">
                                        Atoms desire stability. They want to have full outer electron shells.
                                    </p>
                                    <div className="bg-black/40 p-5 rounded border border-green-500/20">
                                        <strong className="text-white text-sm block mb-3">Objective: Make Water</strong>
                                        <ol className="text-sm text-gray-400 list-decimal list-inside space-y-2">
                                            <li>Create an <strong>Oxygen</strong> atom (Z=8) and two <strong>Hydrogen</strong> atoms (Z=1).</li>
                                            <li>Throw <strong>Electrons</strong> at them until they are neutral (Charge 0). Ions repel each other!</li>
                                            <li>Bring them gently together. If they are compatible, they will bond.</li>
                                        </ol>
                                        <p className="text-xs text-gray-500 mt-3 italic border-t border-gray-800 pt-2">
                                            Tip: Check the Recipe Palette (⚗️) to see valid combinations.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        You have created a molecule! By sharing electrons (<strong>Covalent Bonding</strong>), the atoms have locked together to complete their valence shells.
                                    </p>
                                    
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-white border-b border-gray-700 pb-1">Real World Physics</h4>
                                        <p className="text-xs text-gray-400">
                                            <strong>VSEPR Theory:</strong> Notice how the atoms arrange themselves? Electron pairs repel each other, forcing bonds into specific 3D geometries (like the 109.5° angle in Methane). The simulation actively calculates these forces.
                                        </p>
                                    </div>

                                    <div className="space-y-4 mt-4 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                        <h4 className="font-bold text-red-400 text-xs uppercase">Simulation Inaccuracies</h4>
                                        <p className="text-xs text-gray-500">
                                            <strong>Springs vs Waves:</strong> Real chemical bonds are standing waves of probability (orbitals). We model them as damped springs. This is a common approximation in computational chemistry (Molecular Dynamics) that visualizes vibration and rigidity well, though it simplifies the quantum reality.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-gray-950 border border-gray-700 rounded-xl w-full max-w-5xl h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                
                {/* SIDEBAR NAVIGATION */}
                <div className="w-full md:w-72 bg-gray-900 border-b md:border-b-0 md:border-r border-gray-800 flex flex-row md:flex-col overflow-x-auto md:overflow-visible no-scrollbar shrink-0">
                    <div className="p-6 hidden md:block border-b border-gray-800">
                        <h3 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
                            <span>📘</span> Help
                        </h3>
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                            Welcome to the SimChem Lab. This guide tracks your scientific progress.
                        </p>
                        
                        {/* Progress Bar */}
                        <div className="mt-4">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Discovery</span>
                                <span>{progressPercent}%</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                            <div className="text-[10px] text-gray-600 mt-1 text-right">
                                {discoveredCount} / {totalItems} unlocked
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-row md:flex-col p-3 gap-2 w-full">
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActivePage(item.id)}
                                disabled={item.locked}
                                className={`flex items-center gap-4 p-4 rounded-lg text-sm font-bold transition-all w-full text-left
                                    ${activePage === item.id 
                                        ? 'bg-gray-800 text-white shadow-lg ring-1 ring-white/10 translate-x-1' 
                                        : 'text-gray-500 hover:bg-gray-800/50 hover:text-gray-300'}
                                    ${item.locked ? 'opacity-40 cursor-not-allowed grayscale' : ''}
                                `}
                            >
                                <span className="text-2xl">{item.locked ? '🔒' : item.icon}</span>
                                <div className="flex flex-col">
                                    <span className={item.locked ? '' : item.color}>{item.label}</span>
                                    {item.locked && <span className="text-[10px] uppercase tracking-wide font-normal">Locked</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="flex-1 flex flex-col h-full bg-gray-950 relative min-w-0">
                    <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white z-10 p-2 rounded-full hover:bg-gray-800 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="p-8 md:p-12 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="max-w-3xl mx-auto">
                            {renderContent()}
                        </div>
                    </div>

                    {/* Footer Nav Buttons */}
                    <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex justify-between items-center md:justify-end">
                        <button onClick={onClose} className="px-8 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold text-sm transition-colors border border-gray-700 shadow-lg">
                            Close Guide
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HelpModal;
