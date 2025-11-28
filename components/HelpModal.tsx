
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

    // Progress Tracking
    // Note: SM_PARTICLES has 22 entries (12 elementary fermions + 5 bosons + 2 hadrons + 3 antiparticles in list)
    // ELEMENTS has 118
    // MOLECULES has ~50
    const totalItems = ELEMENTS.length + SM_PARTICLES.length + MOLECULES.length;
    // In Sandbox mode, we show full progress to reflect that everything is unlocked
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
                                        <li><strong className="text-gray-500">Zoom/Pan:</strong> Fixed viewport. No zoom or pan available.</li>
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
                                        The slider at the bottom controls the flow of time. This is not just a playback speed; it scales the physics integration.
                                        <br/><br/>
                                        <span className="text-blue-300 font-bold">Microsecond Scale (0.1x - 1.0x):</span> Best for "Bullet Time". Use this to observe fast chemical reactions, watch bonds snap into place, or carefully arrange atoms without them flying away.
                                        <br/><br/>
                                        <span className="text-blue-300 font-bold">Geological Scale (10x - 10,000x):</span> Essential for Nuclear Physics. Many isotopes have half-lives of minutes, years, or millennia. At 1x speed, you would have to wait 10 minutes for a Neutron to decay. By cranking time to 10,000x, you can observe entire decay chains in seconds.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-base mb-2">The Z-Plane</h4>
                                    <p className="leading-relaxed">
                                        While the simulation is fully 3D, interactions primarily occur on a focal plane (Z=0) to make it playable on a 2D screen. 
                                        A weak "restoration force" ($F = -kz$) gently pulls atoms back to Z=0. This prevents your creations from drifting into the infinite abyss while still allowing 3D structures (like the tetrahedral shape of Methane) to form naturally.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-yellow-900/10 p-6 rounded-lg border border-yellow-500/20">
                            <h3 className="text-xl font-bold text-yellow-500 mb-4 border-b border-yellow-500/20 pb-2">🛠️ Tools</h3>
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li>
                                    <strong className="text-white">⚡ Energy Tool:</strong> The primary creator in Discovery Mode. Hold to charge vacuum energy (eV/MeV/GeV). Release to trigger Pair Production. The gauge color changes when you hit a resonance frequency for a specific particle.
                                </li>
                                <li>
                                    <strong className="text-white">𓎤 Lasso Tool:</strong> Draw a loop around multiple atoms. This selects them and attempts to "Assemble" them. If they match a known molecule recipe, they will snap into a valid chemical structure.
                                </li>
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
                                        The vacuum is not empty space. In Quantum Field Theory, it is described as a seething ocean of potential energy, with virtual particles constantly popping in and out of existence.
                                    </p>
                                    <p className="text-sm text-gray-400 italic border-l-2 border-pink-500 pl-4 py-2">
                                        "Energy and mass are different forms of the same thing." — Albert Einstein ($E=mc^2$)
                                    </p>
                                    <div className="bg-black/40 p-5 rounded border border-pink-500/20 mt-4">
                                        <strong className="text-white text-sm block mb-3">Objective: Perturb the Vacuum</strong>
                                        <p className="text-sm text-gray-300">
                                            If you could concentrate enough energy into a single point in space-time, you might be able to bridge the mass gap and tear real, permanent particles out of the void.
                                        </p>
                                        <p className="text-sm text-gray-300 mt-2">
                                            Experiment with the <strong className="text-yellow-400">Energy Tool (⚡)</strong>. Try to find the resonant frequencies of the universe.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        You have successfully triggered <strong>Pair Production</strong>. By injecting energy greater than the rest mass of the particles ($E > 2mc^2$), you have converted pure energy into matter and antimatter.
                                    </p>
                                    <p className="text-sm text-gray-300">
                                        The <strong>Energy Tool</strong> allows you to target specific fields. Injecting ~1 MeV resonates with the Electron field. Higher energies (~9 MeV) can excite the heavier Quark fields.
                                    </p>
                                    
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-white border-b border-gray-700 pb-1">The Standard Model</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-gray-800 p-4 rounded border border-gray-700">
                                                <strong className="block text-pink-300 mb-2">Leptons (e⁻, ν)</strong>
                                                <p className="text-xs text-gray-400">
                                                    Fundamental particles that do not feel the Strong Nuclear Force. The Electron (e⁻) is the most famous, responsible for electricity and chemistry. Neutrinos (ν) are ghost-like particles that rarely interact with anything.
                                                </p>
                                            </div>
                                            <div className="bg-gray-800 p-4 rounded border border-gray-700">
                                                <strong className="block text-purple-300 mb-2">Quarks (u, d, s...)</strong>
                                                <p className="text-xs text-gray-400">
                                                    The constituents of atomic nuclei. They carry fractional electric charge (+2/3, -1/3) and a "Color Charge" that binds them together via the Strong Force.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        <section className="bg-gray-900 p-6 rounded-lg border-l-4 border-blue-500 shadow-lg relative overflow-hidden">
                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Simulation vs Reality</h4>
                            <div className="space-y-4 text-sm text-gray-400">
                                <div>
                                    <strong className="text-white block mb-1">Conservation of Lepton Number</strong>
                                    <p>
                                        In reality, you cannot simply create an electron. Nature requires balance. You must create a matter/antimatter pair (e.g., an Electron and a Positron) so that the net "lepton number" of the universe remains zero. This simulation strictly enforces this law—you will always spawn pairs.
                                    </p>
                                </div>
                                <div>
                                    <strong className="text-white block mb-1">Boson Physics</strong>
                                    <p>
                                        Force carriers like Photons (γ) and Gluons (g) are technically particles, but they behave like waves. In this simulation, we model them as massless kinematic objects. They move at <span className="font-mono text-xs text-yellow-500">MAX_SPEED</span>, ignore air resistance, and pass through other matter ("ghosting") because force carriers do not experience Pauli Exclusion collisions.
                                    </p>
                                </div>
                                <div>
                                    <strong className="text-white block mb-1">Scale</strong>
                                    <p>
                                        Subatomic particles are drawn vastly larger than they are in reality. If an atom were the size of a football stadium, the nucleus would be a marble on the 50-yard line, and the electron would be a gnat in the stands. We scale them up so you can see them!
                                    </p>
                                </div>
                            </div>
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
                                        Quarks are unique among particles. They carry a property called <strong>Color Charge</strong>. The universe strictly prohibits "colored" objects from existing in isolation, a principle known as <strong>Color Confinement</strong>. 
                                    </p>
                                    <div className="bg-black/40 p-5 rounded border border-violet-500/20">
                                        <strong className="text-white text-sm block mb-3">Objective: Stabilize the Quarks</strong>
                                        <p className="text-sm text-gray-300">
                                            If you create a Quark, it will decay (vanish) rapidly unless it finds partners to form a "white" (color-neutral) composite particle: a <strong>Hadron</strong>.
                                        </p>
                                        <p className="text-sm text-gray-300 mt-2">
                                            You need 3 Quarks to make a Baryon. Try creating them in rapid succession in a small area.
                                        </p>
                                        <ul className="text-xs text-gray-400 mt-3 space-y-1 list-disc list-inside">
                                            <li><strong>Proton (p⁺):</strong> 2 Up Quarks + 1 Down Quark (uud).</li>
                                            <li><strong>Neutron (n):</strong> 1 Up Quark + 2 Down Quarks (udd).</li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        Success! You've stabilized the vacuum fluctuations into permanent matter. By combining quarks, you have created <strong>Nucleons</strong>.
                                    </p>
                                    <p className="text-sm text-gray-300">
                                        Protons are stable effectively forever. Neutrons are stable inside a nucleus, but if left alone in free space, they will undergo Beta Decay in about 15 minutes.
                                    </p>
                                </div>
                            )}
                        </section>

                        <section className="bg-gray-900 p-6 rounded-lg border-l-4 border-blue-500 shadow-lg">
                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Simulation vs Reality</h4>
                            <div className="space-y-4 text-sm text-gray-400">
                                <div>
                                    <strong className="text-white block mb-1">Flux Tubes & Jets</strong>
                                    <p>
                                        In reality, if you try to pull two quarks apart, the gluon field between them forms a tight tube of energy (like a rubber band). Eventually, the energy density in the tube becomes so high that it snaps, using that energy to create a new quark/antiquark pair out of the vacuum. This is why you can never isolate a quark. The simulation simplifies this by simply decaying isolated quarks after a short time.
                                    </p>
                                </div>
                                <div>
                                    <strong className="text-white block mb-1">Mass Deficit</strong>
                                    <p>
                                        The mass of a Proton (~938 MeV) is much higher than the sum of its three quarks (~10 MeV). Where does the rest come from? 99% of your mass is actually the kinetic energy of the gluon field binding the quarks together, via $E=mc^2$.
                                    </p>
                                </div>
                            </div>
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
                                        You have Hydrogen (Protons). But how do you make heavier elements like Carbon, Oxygen, or Gold? 
                                        Smashing protons together is incredibly difficult because they both have positive charge—they repel each other furiously (The Coulomb Barrier).
                                    </p>
                                    <div className="bg-black/40 p-5 rounded border border-orange-500/20">
                                        <strong className="text-white text-sm block mb-3">Method: Neutron Capture</strong>
                                        <p className="text-sm text-gray-300 mb-2">
                                            Is there a particle that has mass but no charge? One that could slip past the electric defenses of the nucleus?
                                        </p>
                                        <ol className="text-sm text-gray-400 list-decimal list-inside space-y-2 mt-3">
                                            <li>Create a <strong>Proton</strong> (Hydrogen Nucleus).</li>
                                            <li>Create a <strong>Neutron</strong> nearby and throw it at the Proton.</li>
                                            <li>They will merge to form <strong>Deuterium</strong> (H-2).</li>
                                            <li>Keep adding neutrons. Eventually, the nucleus will become unstable (too neutron-rich).</li>
                                            <li>It will undergo <strong>Beta Decay</strong>: A neutron will spontaneously turn into a proton, creating Helium!</li>
                                        </ol>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        You are climbing the Periodic Table! By managing the ratio of Protons to Neutrons (The Valley of Stability), you can synthesize any element in the universe.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
                                        <div className="p-3 border border-orange-500/30 rounded bg-orange-900/10">
                                            <strong className="text-orange-300 text-sm block mb-1">Alpha Decay</strong>
                                            <p>The nucleus emits a Helium nucleus (2p, 2n). This drops the atomic number by 2. Common in very heavy elements like Uranium.</p>
                                        </div>
                                        <div className="p-3 border border-blue-500/30 rounded bg-blue-900/10">
                                            <strong className="text-blue-300 text-sm block mb-1">Beta Decay</strong>
                                            <p>A neutron turns into a proton (emitting an electron). This raises atomic number by 1. This is your primary method for moving "up" the table.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        <section className="bg-gray-900 p-6 rounded-lg border-l-4 border-blue-500 shadow-lg">
                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Simulation vs Reality</h4>
                            <div className="space-y-4 text-sm text-gray-400">
                                <div>
                                    <strong className="text-white block mb-1">Stars vs Reactors</strong>
                                    <p>
                                        Stars build elements by smashing protons together (Fusion) at millions of degrees. On Earth, and in this sim, it's much easier to build elements by adding neutrons (as in a nuclear reactor). Neutrons have no charge, so you don't need stellar temperatures to overcome electric repulsion.
                                    </p>
                                </div>
                                <div>
                                    <strong className="text-white block mb-1">The Strong Force</strong>
                                    <p>
                                        In this sim, the Strong Nuclear Force is modeled as a simple "latch" that engages when nucleons touch. In reality, it is a complex residual force (Yukawa potential) mediated by the exchange of pions between nucleons.
                                    </p>
                                </div>
                            </div>
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
                                        Atoms desire stability. They want to have full outer electron shells. They achieve this by sharing electrons with neighbors, forming <strong>Covalent Bonds</strong>.
                                    </p>
                                    <div className="bg-black/40 p-5 rounded border border-green-500/20">
                                        <strong className="text-white text-sm block mb-3">Objective: Make Water</strong>
                                        <ol className="text-sm text-gray-400 list-decimal list-inside space-y-2">
                                            <li>Create an <strong>Oxygen</strong> atom (Z=8) and two <strong>Hydrogen</strong> atoms (Z=1).</li>
                                            <li>Throw electrons at them until they are neutral (Charge 0). Ions repel each other!</li>
                                            <li>Use the Lasso tool to group them, or bring them gently together.</li>
                                            <li>If they are close enough, they will snap into a <strong className="text-green-300">Water (H₂O)</strong> molecule.</li>
                                        </ol>
                                        <p className="text-xs text-gray-500 mt-3 italic border-t border-gray-800 pt-2">
                                            Note: The simulation automatically handles electron sharing. You just need to bring compatible atoms together.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        You are building complex structures! Check the <strong className="text-white">Recipe Palette (⚗️)</strong> to see what molecules are unlocked.
                                    </p>
                                    <p className="text-sm text-gray-300">
                                        The simulation constantly runs an "Annealing" process. If you attach too many atoms to a Carbon (Valency > 4), it will randomly shed the weakest bond to correct the error.
                                    </p>
                                </div>
                            )}
                        </section>

                        <section className="bg-gray-900 p-6 rounded-lg border-l-4 border-blue-500 shadow-lg">
                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Simulation vs Reality</h4>
                            <div className="space-y-4 text-sm text-gray-400">
                                <div>
                                    <strong className="text-white block mb-1">Springs vs Waves</strong>
                                    <p>
                                        Real chemical bonds are standing waves of probability density where electrons exist (Orbitals). We model them as damped springs. This is surprisingly accurate for visualizing vibrations and structural rigidity!
                                    </p>
                                </div>
                                <div>
                                    <strong className="text-white block mb-1">VSEPR Theory</strong>
                                    <p>
                                        The simulation actively calculates the ideal angles between bonds (e.g., 109.5° for Carbon) based on Valence Shell Electron Pair Repulsion theory. It applies torque forces to twist your molecules into their correct 3D shapes automatically.
                                    </p>
                                </div>
                                <div>
                                    <strong className="text-white block mb-1">Temperature</strong>
                                    <p>
                                        In the sim, temperature is just the velocity of the atoms. In reality, chemical reactions often require specific "Activation Energy" to happen. We simulate this by checking relative velocities before allowing a bond to snap.
                                    </p>
                                </div>
                            </div>
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
