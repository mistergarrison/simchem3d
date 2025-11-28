
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
        { id: 'particles', label: 'The Quantum Vacuum', icon: '⚡', locked: false, color: 'text-pink-400' },
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
                            <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">🎮 Controls</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
                                <div>
                                    <h4 className="font-bold text-blue-400 uppercase text-xs mb-2">Mouse & Keyboard</h4>
                                    <ul className="space-y-2">
                                        <li><strong className="text-white">Left Click / Drag:</strong> Interact with atoms. Grab to move, release while moving to throw.</li>
                                        <li><strong className="text-white">Scroll Wheel:</strong> Rotate the molecule currently under your cursor.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-purple-400 uppercase text-xs mb-2">Touch / Mobile</h4>
                                    <ul className="space-y-2">
                                        <li><strong className="text-white">Tap:</strong> Select tools or spawn items from the palette.</li>
                                        <li><strong className="text-white">Drag Object:</strong> Touch and hold an atom to move it. Momentum is conserved on release.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section className="bg-yellow-900/10 p-6 rounded-lg border border-yellow-500/20">
                            <h3 className="text-xl font-bold text-yellow-500 mb-4 border-b border-yellow-500/20 pb-2">🛠️ Tools</h3>
                            <div className="space-y-6 text-sm text-gray-300">
                                <div>
                                    <strong className="text-white block mb-1 text-lg">⚡ Energy Tool</strong>
                                    {discoveredQuantum || unlockedAll ? (
                                        <div className="space-y-2">
                                            <p>
                                                This tool allows you to inject raw electron-volts (eV) directly into the vacuum. By holding the button, you ramp up the energy density at a single point in space.
                                            </p>
                                            <p>
                                                According to mass-energy equivalence (E=mc²), if you concentrate enough energy to equal the rest mass of a particle pair, you can rip them into existence. The gauge turns <span className="text-green-400 font-bold">Green</span> when you hit a resonance frequency matching a particle's mass. Release at that moment to spawn.
                                            </p>
                                        </div>
                                    ) : (
                                        <p>
                                            Allows you to interact directly with the vacuum of space. Experiment with holding it to charge up energy, then releasing. The vacuum may respond if you hit specific resonance frequencies.
                                        </p>
                                    )}
                                </div>

                                {hasLasso ? (
                                    <div>
                                        <strong className="text-white block mb-1 text-lg">𓎤 Lasso Tool</strong>
                                        <p>
                                            Draw a loop around multiple atoms to select them. If the selected atoms match a known chemical recipe (e.g., 2 Hydrogens + 1 Oxygen), the simulation will attempt to assemble them into a molecule using a force-directed layout algorithm.
                                        </p>
                                        <p className="mt-2 text-xs text-gray-500">
                                            <em>Note: In reality, molecules self-assemble via random collisions and thermodynamics. The Lasso acts as a "nano-assembler," allowing you to bypass chance collisions to build complex structures explicitly.</em>
                                        </p>
                                    </div>
                                ) : (
                                    <div className="opacity-50 flex items-center gap-2 py-2 bg-gray-900/50 rounded px-3 border border-dashed border-gray-700">
                                        <span className="text-xl">🔒</span>
                                        <span className="text-gray-500 italic">Advanced assembly tools are locked. Discover your first molecule to unlock.</span>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">⚙️ Simulation Mechanics</h3>
                            <div className="space-y-6 text-sm text-gray-300">
                                <div>
                                    <h4 className="font-bold text-white text-base mb-2">Time Dilation (The Slider)</h4>
                                    <p className="leading-relaxed">
                                        The universe operates on vastly different timescales. A chemical bond vibrates in femtoseconds (10⁻¹⁵ s). A neutron decays in about 15 minutes. A Proton might be stable for 10³⁴ years.
                                    </p>
                                    <p className="leading-relaxed mt-2">
                                        To observe these phenomena in a single human lifetime, this simulation uses a variable <strong className="text-blue-300">Time Slider</strong>.
                                    </p>
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li><span className="text-white">Real Time (1.0x):</span> Essential for chemistry. If time moves too fast, molecular bonds will fly apart due to integration error (the simulation cannot calculate forces fast enough to keep up with hyper-speed atoms).</li>
                                        <li><span className="text-white">Hyper Time ({'>'}100x):</span> Essential for nuclear physics. You must fast-forward probability to observe rare decay events like Beta Decay or Spontaneous Fission.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-base mb-2">The Z-Plane Restoration</h4>
                                    <p className="leading-relaxed">
                                        Navigating 3D space on a 2D screen is inherently difficult. To keep atoms from drifting infinitely into the background, the simulation applies a weak "restoration force" that gently pulls atoms back to the focal plane (Z=0). This allows for 3D structures (like Tetrahedral Methane) to exist while keeping the action focused on your screen.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                );

            case 'particles':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <section className="bg-pink-900/20 p-6 rounded-lg border border-pink-500/30">
                            <h3 className="text-xl font-bold text-pink-400 mb-4">The Quantum Vacuum</h3>
                            
                            {!discoveredQuantum && !unlockedAll ? (
                                <div className="space-y-4">
                                    <p className="text-base text-gray-300 leading-loose">
                                        You are staring at empty space, but in quantum mechanics, "empty" does not mean "nothing". The vacuum is a seething ocean of invisible fields, bubbling with potential energy and virtual particles that pop in and out of existence.
                                    </p>
                                    <div className="bg-black/40 p-5 rounded border border-pink-500/20 mt-4">
                                        <strong className="text-white text-sm block mb-3 uppercase tracking-wider">Research Hint</strong>
                                        <p className="text-sm text-gray-300">
                                            If you concentrate enough energy into a single point, you might be able to pay the energy debt required to turn a virtual fluctuation into a real particle.
                                        </p>
                                        <p className="text-sm text-gray-300 mt-2">
                                            Use the <strong className="text-yellow-400">Energy Tool (⚡)</strong>. Watch the gauge. There are specific energy thresholds where the vacuum resonates. Try releasing the tool when the gauge turns <span className="text-green-400 font-bold">Green</span>.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-pink-500/10 p-4 rounded border-l-4 border-pink-500">
                                        <h4 className="font-bold text-pink-300 text-sm uppercase mb-1">Mechanism Discovered</h4>
                                        <p className="text-white font-bold">Pair Production (E = mc²)</p>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-white border-b border-gray-700 pb-1 mt-6 text-lg">Fundamental Physics</h4>
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong>Quantum Field Theory (QFT):</strong> The deepest reality of our universe is not particles, but fields. Imagine the entire universe filled with fluids: an Electron Fluid, an Up-Quark Fluid, a Photon Fluid, etc. A "particle" is merely a localized ripple or excitation in one of these fields, traveling like a wave across an ocean. This explains why every electron in the universe is identical—they are all ripples in the exact same field.
                                        </p>
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong>Virtual Particles & Uncertainty:</strong> The Heisenberg Uncertainty Principle (ΔE Δt ≥ ℏ/2) allows the vacuum to "borrow" energy for infinitesimally short times. Virtual particle-antiparticle pairs constantly pop into existence and annihilate before the universe notices the energy debt. This "vacuum foam" has real effects (like the Casimir Effect), but these particles are not "real" in the sense that they cannot persist.
                                        </p>
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong>Pair Production:</strong> To make a real particle, you must pay the energy cost upfront. Einstein's E=mc² tells us that mass (m) is just condensed energy (E). If you inject enough raw energy (e.g., via a high-energy photon or a collision) into a point in space to exceed twice the rest mass of an electron (2 × 0.511 MeV = 1.022 MeV), you can rip a real Electron and Positron out of the field.
                                        </p>
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong>Conservation of Charge:</strong> Why pairs? You cannot create electric charge from nothing. The net charge of the vacuum is zero. To create a negative electron (-1), nature demands you simultaneously create its antimatter twin, the positive positron (+1). They emerge together, conserving the total charge of the universe.
                                        </p>
                                    </div>

                                    <div className="space-y-4 mt-6 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                        <h4 className="font-bold text-red-400 text-xs uppercase">Simulation vs Reality</h4>
                                        <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                                            <li>
                                                <strong>Momentum Conservation:</strong> In the real world, a single photon in a vacuum cannot spontaneously convert into an electron-positron pair because momentum would not be conserved (the center of mass cannot go from moving at light speed to moving slower). Real pair production usually requires a nearby atomic nucleus to absorb the recoil. In this sim, we allow vacuum production for gameplay.
                                            </li>
                                            <li>
                                                <strong>Electron Mass:</strong> In this simulation, the electron mass is set to ~0.1u (approx 1/10th proton mass) instead of the realistic 1/1836th. This is a necessary compromise for the physics engine; a realistic electron would accelerate so violently under forces (F=ma) that it would either tunnel out of the simulation or require nanosecond timesteps, freezing the game.
                                            </li>
                                        </ul>
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
                            <h3 className="text-xl font-bold text-violet-300 mb-4">Hadronization & The Strong Force</h3>
                            
                            {!discoveredHadrons && !unlockedAll ? (
                                <div className="space-y-6">
                                    <p className="text-base text-gray-300 leading-relaxed">
                                        You may have noticed that Quarks disappear rapidly after creation. They are unstable in isolation and cannot exist freely in our universe.
                                    </p>
                                    <div className="bg-black/40 p-5 rounded border border-violet-500/20">
                                        <strong className="text-white text-sm block mb-3 uppercase tracking-wider">Research Hint</strong>
                                        <p className="text-sm text-gray-300">
                                            Quarks carry a "Color Charge". Nature abhors naked color; it enforces a rule called Confinement. To save a Quark from decaying back into the vacuum, you must combine it with others to form a neutral "white" object.
                                        </p>
                                        <p className="text-sm text-gray-300 mt-2">
                                            Try spawning <strong>3 Quarks</strong> (combinations of Up/Down) in rapid succession in the exact same spot.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-violet-500/10 p-4 rounded border-l-4 border-violet-500">
                                        <h4 className="font-bold text-violet-300 text-sm uppercase mb-1">Mechanism Discovered</h4>
                                        <p className="text-white font-bold">Baryon Genesis (Hadronization)</p>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-bold text-white border-b border-gray-700 pb-1 mt-6 text-lg">Fundamental Physics</h4>
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong>Quantum Chromodynamics (QCD):</strong> This is the theory of the Strong Interaction. Just as electromagnetism has 2 charges (+/-), the Strong Force has 3 types of charge, whimsically named "Red", "Green", and "Blue" (Color Charge). These have nothing to do with visual colors, but the math of combining them follows the rules of additive light: Red + Green + Blue = White (Neutral).
                                        </p>
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong>Confinement & Flux Tubes:</strong> The Strong Force is unique because it does not diminish with distance like gravity. It is mediated by Gluons, which themselves carry color charge. This means gluons attract other gluons, squeezing the force field into a tight "Flux Tube" or rubber band connecting the quarks. If you try to pull two quarks apart, the energy in this tube grows linearly until it snaps. The energy released by the snap is sufficient to create a new quark-antiquark pair (E=mc²). Thus, you can never isolate a quark; pulling one out just creates more quarks. This is Confinement.
                                        </p>
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong>Mass from Nothing:</strong> A Proton is made of two Up quarks and one Down quark (uud). The rest mass of these three quarks is only about 9 MeV/c². Yet, the Proton weighs 938 MeV/c². Where does the other 99% of the mass come from? It is pure energy—the kinetic energy of the quarks buzzing around at near light-speed, and the potential energy of the dynamic gluon field binding them. <em>You are made almost entirely of trapped energy.</em>
                                        </p>
                                    </div>

                                    <div className="space-y-4 mt-6 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                        <h4 className="font-bold text-red-400 text-xs uppercase">Simulation vs Reality</h4>
                                        <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                                            <li>
                                                <strong>Decay vs Jets:</strong> In reality, an isolated high-energy quark does not simply "evaporate" or decay. Due to the flux tube snapping mentioned above, it would produce a spray of new particles called a "Hadronic Jet" (mostly mesons). In this simulation, for clarity and performance, we simplify this: isolated quarks simply fade away if they fail to hadronize within a short window.
                                            </li>
                                            <li>
                                                <strong>Spin Statistics:</strong> Real quarks are Fermions with spin 1/2 and obey the Pauli Exclusion Principle. We do not simulate spin states or color-exclusion logic in the collision engine.
                                            </li>
                                        </ul>
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
                            <h3 className="text-xl font-bold text-orange-400 mb-4">Nuclear Synthesis & Weak Force</h3>
                            
                            {!discoveredHeavyElements && !unlockedAll ? (
                                <div className="space-y-6">
                                    <p className="text-base text-gray-300 leading-relaxed">
                                        You have Hydrogen (single Protons). To make heavier elements, you need to fuse them. However, protons are positively charged—they repel each other violently via the Coulomb Force before they can touch.
                                    </p>
                                    <div className="bg-black/40 p-5 rounded border border-orange-500/20">
                                        <strong className="text-white text-sm block mb-3 uppercase tracking-wider">Research Hint</strong>
                                        <p className="text-sm text-gray-300 mb-2">
                                            You need a particle with mass but NO charge to slip past the electric defenses of the nucleus.
                                        </p>
                                        <ol className="text-sm text-gray-400 list-decimal list-inside space-y-2 mt-3">
                                            <li>Take a <strong>Proton</strong> (Hydrogen nucleus).</li>
                                            <li>Throw a <strong>Neutron</strong> at it. It has no charge, so it won't be repelled.</li>
                                            <li>Keep adding neutrons until the nucleus becomes unstable (check the Isotope info).</li>
                                            <li>Wait for nature to fix the imbalance via Beta Decay.</li>
                                        </ol>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-orange-500/10 p-4 rounded border-l-4 border-orange-500">
                                        <h4 className="font-bold text-orange-300 text-sm uppercase mb-1">Mechanism Discovered</h4>
                                        <p className="text-white font-bold">Neutron Capture & Beta Decay</p>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-bold text-white border-b border-gray-700 pb-1 mt-6 text-lg">Fundamental Physics</h4>
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong>Residual Strong Force:</strong> The Strong Force confines quarks inside protons/neutrons. However, a tiny fraction of this force "leaks" out. This residual force (historically modeled as the exchange of Pions) attracts nucleons to each other. It is very short-range (a few femtometers). It must overcome the infinite-range electric repulsion of the protons. Neutrons act as the "glue"—they add Strong Force attraction without adding electric repulsion, stabilizing the nucleus.
                                        </p>
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong>Valley of Stability:</strong> Atomic nuclei can only exist with specific ratios of protons to neutrons. Too few neutrons, and the electric repulsion rips the nucleus apart. Too many neutrons, and quantum mechanical energy levels force the nucleus into a higher energy state. Nature always seeks the lowest energy state, leading to radioactive decay to correct the ratio.
                                        </p>
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong>The Weak Interaction (Beta Decay):</strong> The Weak Force is the only fundamental force capable of changing the "flavor" of a quark. In Beta Minus Decay, a Down quark inside a Neutron (udd) spontaneously flips into an Up quark, turning the Neutron into a Proton (uud). To conserve charge (0 → +1) and lepton number, the nucleus ejects an electron (e⁻) and an electron-antineutrino (ν̅e). This increases the atomic number (Z → Z+1), transmuting the element. This is how the universe builds complexity.
                                        </p>
                                    </div>

                                    <div className="space-y-4 mt-6 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                        <h4 className="font-bold text-red-400 text-xs uppercase">Simulation vs Reality</h4>
                                        <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                                            <li>
                                                <strong>Stellar Nucleosynthesis:</strong> In our universe, elements like Helium and Carbon are largely formed in stars via <strong>Nuclear Fusion</strong>, smashing protons together at millions of degrees to overcome the Coulomb Barrier. In this sandbox, we primarily use Neutron Capture (similar to the astrophysical "r-process" seen in neutron star mergers) because it allows you to build elements at "room temperature" without needing the gravity of a star.
                                            </li>
                                            <li>
                                                <strong>Tunneling:</strong> Real fusion relies on Quantum Tunneling to overcome the electric repulsion. We simulate this probabilistically.
                                            </li>
                                            <li>
                                                <strong>Time Scale:</strong> Real Beta decay half-lives vary from milliseconds to billions of years (like Potassium-40). We accelerate this massively when you use the Time Slider so you don't have to wait for the heat death of the universe to make Helium.
                                            </li>
                                        </ul>
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
                                        We are now leaving the nucleus. The forces here are gentler. Atoms generally desire electronic stability—they want to fill their outer electron shells.
                                    </p>
                                    <div className="bg-black/40 p-5 rounded border border-green-500/20">
                                        <strong className="text-white text-sm block mb-3 uppercase tracking-wider">Research Hint</strong>
                                        <ol className="text-sm text-gray-400 list-decimal list-inside space-y-2">
                                            <li>Create an <strong>Oxygen</strong> atom (Z=8) and two <strong>Hydrogen</strong> atoms (Z=1).</li>
                                            <li>Notice their charge? Bare nuclei are positive ions (H⁺, O⁸⁺), and they repel. Throw <strong>Electrons</strong> at them until they are neutral.</li>
                                            <li>Once neutral, bring them gently together. If they are compatible, they will snap together to share electrons.</li>
                                        </ol>
                                        <p className="text-xs text-gray-500 mt-3 italic border-t border-gray-800 pt-2">
                                            Tip: Check the Recipe Palette (⚗️) to see valid combinations.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-green-500/10 p-4 rounded border-l-4 border-green-500">
                                        <h4 className="font-bold text-green-300 text-sm uppercase mb-1">Mechanism Discovered</h4>
                                        <p className="text-white font-bold">Covalent Bonding & VSEPR</p>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-bold text-white border-b border-gray-700 pb-1 mt-6 text-lg">Fundamental Physics</h4>
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong>Atomic Orbitals:</strong> Electrons do not orbit nuclei like planets. They exist as standing waves of probability called Orbitals (s, p, d, f). The Schrödinger equation dictates the shape of these clouds. Electrons are Fermions, meaning no two can occupy the same state (Pauli Exclusion Principle).
                                        </p>
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong>Covalent Bonding:</strong> When two atoms approach, their wavefunctions can overlap. If the phase is correct, they interfere constructively, creating a region of high electron density between the nuclei. This negative charge attracts the positive nuclei of both atoms, gluing them together. Bonding lowers the total potential energy of the system, which is why it happens spontaneously.
                                        </p>
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong>VSEPR Theory (Geometry):</strong> Why is Water (H₂O) bent? Why is Methane (CH₄) a pyramid? Electrons are negatively charged and repel each other. The Valence Shell Electron Pair Repulsion theory states that electron domains (both bonding pairs and invisible "lone pairs") will arrange themselves as far apart as possible on the surface of the atom.
                                            <br/>
                                            In Methane, Carbon has 4 bonding pairs, forming a Tetrahedron (109.5°). In Water, Oxygen has 2 bonds and 2 lone pairs. The lone pairs are "fatter" and push the Hydrogen bonds closer together, resulting in a bent angle of 104.5°.
                                        </p>
                                    </div>

                                    <div className="space-y-4 mt-6 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                        <h4 className="font-bold text-red-400 text-xs uppercase">Simulation vs Reality</h4>
                                        <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                                            <li>
                                                <strong>Springs vs Waves:</strong> We model bonds as damped springs to visualize their rigidity and vibration in real-time. In reality, bonds are quantum mechanical states that don't "jiggle" quite like macroscopic springs unless excited by infrared photons.
                                            </li>
                                            <li>
                                                <strong>Hard Spheres:</strong> We calculate collisions using hard radii. Real atoms are fuzzy clouds that can overlap, tunnel, and distort (polarize) under pressure.
                                            </li>
                                            <li>
                                                <strong>Deterministic Assembly:</strong> Real chemistry is driven by random collisions and thermodynamics (Gibbs Free Energy). Here, you act as a "molecular architect" using the Lasso tool, allowing you to hand-assemble structures that might be statistically unlikely to form spontaneously without a catalyst.
                                            </li>
                                        </ul>
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
