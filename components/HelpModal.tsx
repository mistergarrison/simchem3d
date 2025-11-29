
import React, { useState, useEffect, useRef } from 'react';
import { DiscoveryState, GameMode } from '../types';
import { ELEMENTS, SM_PARTICLES } from '../elements';
import { MOLECULES } from '../molecules';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    discovery: DiscoveryState;
    gameMode: GameMode;
    unseenSections: Set<string>;
    markSectionSeen: (id: string) => void;
}

type PageId = 'basics' | 'particles' | 'hadrons' | 'nuclear' | 'chemistry' | 'dictionary';

const DICTIONARY_DATA: { term: string, def: string }[] = [
    { term: "Activation Energy", def: "The minimum energy required to start a chemical reaction. In this simulation, it is represented by the velocity threshold required to force atoms together against repulsive forces." },
    { term: "Alpha Decay", def: "A type of radioactive decay where an atomic nucleus emits an alpha particle (two protons and two neutrons). This reduces the atomic mass by 4 and atomic number by 2. It is a quantum tunneling event." },
    { term: "Annihilation", def: "The violent process where a particle meets its antiparticle (e.g., Electron + Positron). Their mass is completely converted into energy (photons/gamma rays) according to E=mc²." },
    { term: "Antimatter", def: "Matter composed of antiparticles. Antiparticles have the same mass as normal matter but opposite charge and quantum numbers. The simulation allows creation of antimatter via high-energy pair production." },
    { term: "Atom", def: "The basic unit of a chemical element. It consists of a dense central nucleus surrounded by a cloud of negatively charged electrons. The chemical behavior is determined by the electron configuration." },
    { term: "Baryon", def: "A heavy composite particle made of exactly three quarks. Protons (uud) and Neutrons (udd) are the most common baryons. They are held together by the Strong Force." },
    { term: "Beta Decay", def: "A radioactive process mediated by the Weak Force. A neutron turns into a proton, emitting an electron and an antineutrino. This increases the atomic number by 1, transmuting the element." },
    { term: "Binding Energy", def: "The energy required to disassemble a system into its separate parts. For nuclei, this energy accounts for the 'mass defect'—a nucleus weighs less than the sum of its protons and neutrons." },
    { term: "Boson", def: "Particles that carry forces (like Photons for electromagnetism or Gluons for the strong force). Unlike Fermions (matter particles), multiple bosons can occupy the same quantum state." },
    { term: "Color Charge", def: "The 'charge' associated with the Strong Force, carried by quarks and gluons. It comes in three types: Red, Green, and Blue. Nature requires all stable particles to be 'Color Neutral' (White)." },
    { term: "Confinement", def: "The physical principle that quarks cannot exist in isolation. If you try to pull two quarks apart, the energy in the gluon field increases until it snaps, creating new quark-antiquark pairs." },
    { term: "Conservation Laws", def: "Fundamental rules of the universe stating certain properties never change in an isolated system. Key conserved quantities include Energy, Momentum, Electric Charge, and Lepton Number." },
    { term: "Coulomb Barrier", def: "The energy barrier due to electrostatic repulsion that two nuclei must overcome to get close enough to undergo nuclear fusion." },
    { term: "Covalent Bonding", def: "A chemical bond where atoms share pairs of electrons to achieve a stable electron configuration (filling their valence shells). It is the primary bond in organic chemistry." },
    { term: "Electron", def: "A stable lepton with a charge of -1. It acts as the carrier of electricity and forms the outer shell of atoms, determining chemical bonding." },
    { term: "Electron Capture", def: "A decay mode where a proton-rich nucleus absorbs one of its own inner electrons, turning a proton into a neutron and emitting a neutrino." },
    { term: "Electronegativity", def: "A measure of how strongly an atom attracts bonding electrons to itself. Fluorine is the most electronegative element; Francium is the least." },
    { term: "Energy", def: "The quantitative property that must be transferred to a body or physical system to perform work on the body, or to heat it. In relativity, Energy and Mass are interchangeable (E=mc²)." },
    { term: "Entropy", def: "A measure of disorder or randomness. The Second Law of Thermodynamics states that the total entropy of an isolated system can never decrease over time." },
    { term: "Fermion", def: "Matter particles (Quarks, Leptons) with half-integer spin. They obey the Pauli Exclusion Principle, meaning no two fermions can occupy the same space at the same time." },
    { term: "Flux Tube", def: "A tube-like region of space containing a strong gluon field connecting quarks. Unlike electric fields which spread out, gluon fields form tight tubes, leading to quark confinement." },
    { term: "Gluon", def: "The exchange particle (gauge boson) for the Strong Force. Gluons 'glue' quarks together. uniquely, gluons themselves carry color charge and interact with other gluons." },
    { term: "Hadron", def: "Any composite particle made of quarks held together by the Strong Force. Includes Baryons (3 quarks) and Mesons (quark-antiquark pairs)." },
    { term: "Hadronization", def: "The process where high-energy quarks and gluons spontaneously create new particles to form color-neutral hadrons, as naked color cannot exist." },
    { term: "Half-Life", def: "The time required for half of the radioactive atoms in a sample to decay. It is a probabilistic average; individual decay events are random." },
    { term: "Heisenberg Uncertainty Principle", def: "A fundamental limit in quantum mechanics stating you cannot simultaneously know a particle's exact position and momentum. This allows for 'virtual particles' to borrow energy from the vacuum briefly." },
    { term: "Higgs Boson", def: "An excitation of the Higgs Field. Interaction with this field is what gives fundamental particles like electrons and quarks their mass." },
    { term: "Ion", def: "An atom or molecule with a net electric charge due to the loss or gain of one or more electrons." },
    { term: "Isotope", def: "Variants of a chemical element that have the same number of protons but different numbers of neutrons. They have identical chemistry but different nuclear stability." },
    { term: "Lepton", def: "An elementary particle that does not undergo strong interactions. The electron, muon, tau, and their neutrinos are leptons." },
    { term: "Neutrino", def: "A ghostly elementary particle with almost no mass and no electric charge. It interacts only via the Weak Force and gravity, passing through Earth mostly stopping." },
    { term: "Neutron", def: "A neutral baryon made of one Up and two Down quarks. It is stable inside a nucleus but decays into a proton (beta decay) with a half-life of ~15 minutes when free." },
    { term: "Nucleon", def: "A collective term for protons and neutrons, the components of an atomic nucleus." },
    { term: "Nucleosynthesis", def: "The cosmic process of creating new atomic nuclei from pre-existing nucleons, primarily occurring in stars (fusion) and supernovae (neutron capture)." },
    { term: "Orbital", def: "A mathematical probability function describing where an electron is likely to be found. Unlike planetary orbits, orbitals are 3D standing waves." },
    { term: "Pair Production", def: "A quantum phenomenon where energy is converted directly into matter and antimatter (e.g., a photon becoming an electron and positron)." },
    { term: "Pauli Exclusion Principle", def: "The quantum rule that prevents two identical fermions (like electrons) from occupying the same quantum state. This force prevents atoms from collapsing and creates electron shells." },
    { term: "Photon", def: "The quantum of electromagnetic radiation (light). It is a massless boson that carries the electromagnetic force." },
    { term: "Positron", def: "The antimatter counterpart to the electron. It has the same mass but a positive charge." },
    { term: "Proton", def: "A stable baryon made of two Up quarks and one Down quark. Its positive charge determines the atomic number and chemical identity of an atom." },
    { term: "Quantum Chromodynamics (QCD)", def: "The quantum field theory describing the Strong Interaction between quarks and gluons. It explains color charge and confinement." },
    { term: "Quantum Field Theory", def: "The theoretical framework combining classical field theory, special relativity, and quantum mechanics. It treats particles as excited states (ripples) in underlying physical fields." },
    { term: "Quark", def: "Fundamental constituent of matter. Quarks combine to form hadrons. They have fractional electric charge (+2/3 or -1/3) and color charge." },
    { term: "Resonance", def: "In particle physics, a short-lived state or peak in energy probability. In this simulation, you must hit the mass-energy resonance of a particle to spawn it from the vacuum." },
    { term: "Spontaneous Fission", def: "A form of radioactive decay found in very heavy elements (like Californium) where the nucleus splits into two smaller daughter nuclei and free neutrons." },
    { term: "Standard Model", def: "The current best theory of particle physics, classifying all known elementary particles and three of the four fundamental forces (excluding gravity)." },
    { term: "Strong Force", def: "The fundamental interaction that binds quarks together to form nucleons, and binds nucleons together to form nuclei. It is the strongest force in nature but has a very short range." },
    { term: "Virtual Particles", def: "Transient fluctuations in quantum fields that appear and disappear within the limits of the uncertainty principle. They mediate forces between real particles." },
    { term: "VSEPR", def: "Valence Shell Electron Pair Repulsion theory. A model used to predict the geometry of molecules based on the idea that electron pairs repel each other and want to be as far apart as possible." },
    { term: "Weak Force", def: "One of the four fundamental forces, responsible for radioactive decay (like Beta decay) and neutrino interactions. It is the only force that can change a quark's flavor." },
    { term: "Z-Plane", def: "The central 2D plane (Z=0) of the simulation. In this simulator, a weak restoring force keeps atoms near this plane to aid 3D visualization on 2D screens." }
];

const SORTED_TERMS = DICTIONARY_DATA.map(d => d.term).sort((a, b) => b.length - a.length);
const TERM_REGEX = new RegExp(`\\b(${SORTED_TERMS.join('|').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})s?\\b`, 'gi');

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, discovery, gameMode, unseenSections, markSectionSeen }) => {
    const [activePage, setActivePage] = useState<PageId>('basics');
    const [highlightTerm, setHighlightTerm] = useState<string | null>(null);
    const dictionaryRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    useEffect(() => {
        if (isOpen) {
            setActivePage('basics');
            setHighlightTerm(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (activePage === 'dictionary' && highlightTerm) {
            const el = dictionaryRefs.current.get(highlightTerm);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('bg-blue-900/50');
                setTimeout(() => el.classList.remove('bg-blue-900/50'), 1500);
            }
            setHighlightTerm(null);
        }
    }, [activePage, highlightTerm]);

    if (!isOpen) return null;

    const discoveredQuantum = discovery.particles.size > 0;
    const discoveredProton = discovery.particles.has('proton') || discovery.elements.has(1); 
    const discoveredNeutron = discovery.particles.has('neutron') || discovery.elements.has(0);
    const discoveredHadrons = discoveredProton || discoveredNeutron;
    const discoveredHeavyElements = discovery.elements.size > 1; 
    const discoveredMolecules = discovery.molecules.size > 0;
    const unlockedAll = gameMode === 'sandbox';
    const hasLasso = unlockedAll || discoveredMolecules;

    const totalItems = ELEMENTS.length + SM_PARTICLES.length + MOLECULES.length;
    const discoveredCount = unlockedAll ? totalItems : (discovery.elements.size + discovery.particles.size + discovery.molecules.size);
    const progressPercent = Math.min(100, Math.round((discoveredCount / totalItems) * 100));

    const NAV_ITEMS: { id: PageId; label: string; icon: string; locked: boolean; color: string }[] = [
        { id: 'basics', label: 'Controls & Sim', icon: '🎮', locked: false, color: 'text-white' },
        { id: 'particles', label: 'The Quantum Vacuum', icon: '⚡', locked: false, color: 'text-pink-400' },
        { id: 'hadrons', label: 'Hadronization', icon: '🧩', locked: !unlockedAll && !discoveredQuantum, color: 'text-violet-400' },
        { id: 'nuclear', label: 'Nuclear Physics', icon: '☢️', locked: !unlockedAll && !discoveredHadrons, color: 'text-orange-400' },
        { id: 'chemistry', label: 'Chemistry', icon: '⚗️', locked: !unlockedAll && !discoveredHeavyElements, color: 'text-green-400' },
        { id: 'dictionary', label: 'Dictionary', icon: '📖', locked: false, color: 'text-blue-400' },
    ];

    const handleTermClick = (clickedText: string) => {
        const match = DICTIONARY_DATA.find(d => 
            d.term.toLowerCase() === clickedText.toLowerCase() || 
            d.term.toLowerCase() + 's' === clickedText.toLowerCase()
        );
        if (match) {
            setActivePage('dictionary');
            setHighlightTerm(match.term);
        }
    };

    const renderText = (text: string) => {
        const parts = text.split(TERM_REGEX);
        return (
            <span>
                {parts.map((part, i) => {
                    const match = DICTIONARY_DATA.find(d => d.term.toLowerCase() === part.toLowerCase() || d.term.toLowerCase() + 's' === part.toLowerCase());
                    if (match) {
                        return (
                            <button 
                                key={i} 
                                onClick={() => handleTermClick(match.term)}
                                className="text-blue-400 hover:text-blue-300 hover:underline font-semibold decoration-blue-500/30 underline-offset-2 decoration-2"
                                title={`Go to definition of ${match.term}`}
                            >
                                {part}
                            </button>
                        );
                    }
                    return part;
                })}
            </span>
        );
    };

    const renderContent = () => {
        switch (activePage) {
            case 'basics': return (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <section className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">🎮 Controls</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
                            <div>
                                <h4 className="font-bold text-blue-400 uppercase text-xs mb-2">Mouse & Keyboard</h4>
                                <ul className="space-y-2">
                                    <li>{renderText("Left Click / Drag: Interact with atoms. Grab to move, release while moving to throw.")}</li>
                                    <li>{renderText("Scroll Wheel: Rotate the molecule currently under your cursor.")}</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-purple-400 uppercase text-xs mb-2">Touch / Mobile</h4>
                                <ul className="space-y-2">
                                    <li>{renderText("Tap: Select tools or spawn items from the palette.")}</li>
                                    <li>{renderText("Drag Object: Touch and hold an atom to move it. Momentum is conserved on release.")}</li>
                                    <li>{renderText("Two Fingers: Rotate the molecule under your fingers.")}</li>
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
                                        <p>{renderText("The Energy Tool allows you to perform Pair Production. By holding the button, you ramp up the energy density at a single point in the Vacuum.")}</p>
                                        <p>{renderText("As per Einstein's Mass-Energy Equivalence (E=mc²), if you concentrate enough energy to equal the rest mass of a particle pair, you can rip them into existence. The gauge turns")} <span className="text-green-400 font-bold">Green</span> {renderText("when you hit a Resonance frequency matching a particle's mass (e.g., 1.022 MeV for electrons). Release at that moment to spawn.")}</p>
                                    </div>
                                ) : (
                                    <p>{renderText("Allows you to interact directly with the Vacuum. Experiment with holding it to charge up energy, then releasing. The vacuum may respond if you hit specific frequencies.")}</p>
                                )}
                            </div>

                            {hasLasso ? (
                                <div>
                                    <strong className="text-white block mb-1 text-lg">𓎤 Lasso Tool</strong>
                                    <p>{renderText("Draw a loop around multiple atoms to select them. If the selected atoms match a known chemical recipe (e.g., 2 Hydrogens + 1 Oxygen), the simulation will attempt to assemble them into a Molecule using a force-directed layout algorithm.")}</p>
                                    <p className="mt-2 text-xs text-gray-500"><em>{renderText("Note: In reality, molecules self-assemble via random collisions and thermodynamics. The Lasso acts as a 'nano-assembler,' allowing you to bypass chance collisions to build complex structures explicitly.")}</em></p>
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
                                <p className="leading-relaxed">{renderText("The universe operates on vastly different timescales. A chemical bond vibrates in femtoseconds (10⁻¹⁵ s). A neutron decays in about 15 minutes. A Proton might be stable for 10³⁴ years.")}</p>
                                <p className="leading-relaxed mt-2">{renderText("To observe these phenomena in a single human lifetime, this simulation uses a variable")} <strong className="text-blue-300">Time Slider</strong>.</p>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li><span className="text-white">Real Time (1.0x):</span> {renderText("Essential for chemistry. If time moves too fast, molecular bonds will fly apart due to integration error (the simulation cannot calculate forces fast enough to keep up with hyper-speed atoms).")}</li>
                                    <li><span className="text-white">Hyper Time ({'>'}100x):</span> {renderText("Essential for nuclear physics. You must fast-forward probability to observe rare decay events like Beta Decay or Spontaneous Fission.")}</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-base mb-2">The Z-Plane Restoration</h4>
                                <p className="leading-relaxed">{renderText("Navigating 3D space on a 2D screen is inherently difficult. To keep atoms from drifting infinitely into the background, the simulation applies a weak 'restoration force' that gently pulls atoms back to the focal plane (Z=0). This allows for 3D structures (like Tetrahedral Methane) to exist while keeping the action focused on your screen.")}</p>
                            </div>
                        </div>
                    </section>
                </div>
            );
            case 'particles': return (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <section className="bg-pink-900/20 p-6 rounded-lg border border-pink-500/30">
                        <h3 className="text-xl font-bold text-pink-400 mb-4">The Quantum Vacuum</h3>
                        {!discoveredQuantum && !unlockedAll ? (
                            <div className="space-y-4">
                                <p className="text-base text-gray-300 leading-loose">{renderText("You are staring at empty space, but in quantum mechanics, 'empty' does not mean 'nothing'. The Vacuum is a seething ocean of invisible fields, bubbling with potential energy and Virtual Particles that pop in and out of existence.")}</p>
                                <div className="bg-black/40 p-5 rounded border border-pink-500/20 mt-4">
                                    <strong className="text-white text-sm block mb-3 uppercase tracking-wider">Research Hint</strong>
                                    <p className="text-sm text-gray-300">{renderText("The vacuum has an energy debt limit. If you inject enough raw energy into a single point, you might be able to pay the cost to turn a virtual fluctuation into a real particle.")}</p>
                                    <p className="text-sm text-gray-300 mt-2">{renderText("Use the")} <strong className="text-yellow-400">Energy Tool (⚡)</strong>. {renderText("Watch the gauge. The vacuum resonates at specific frequencies corresponding to particle masses. Try releasing when the gauge turns")} <span className="text-green-400 font-bold">Green</span>.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-pink-500/10 p-4 rounded border-l-4 border-pink-500">
                                    <h4 className="font-bold text-pink-300 text-sm uppercase mb-1">Mechanism Discovered</h4>
                                    <p className="text-white font-bold">Pair Production (E = mc²)</p>
                                </div>
                                
                                <div className="flex justify-center py-4">
                                    <svg viewBox="0 0 200 100" className="w-full max-w-sm border border-pink-500/30 rounded bg-black/50">
                                        <defs>
                                            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#fff"/></marker>
                                        </defs>
                                        <text x="10" y="50" fill="yellow" fontSize="10">γ (Photon)</text>
                                        <path d="M 10 55 Q 50 55 90 55" stroke="yellow" strokeWidth="2" strokeDasharray="4 2" markerEnd="url(#arrow)" />
                                        <circle cx="100" cy="55" r="5" fill="white" className="animate-pulse" />
                                        
                                        <path d="M 100 55 C 130 55 130 10 160 20" stroke="#FF9999" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                                        <text x="170" y="20" fill="#FF9999" fontSize="10">e⁺</text>
                                        
                                        <path d="M 100 55 C 130 55 130 100 160 90" stroke="#FFFFFF" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                                        <text x="170" y="90" fill="#FFFFFF" fontSize="10">e⁻</text>
                                    </svg>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-white border-b border-gray-700 pb-1 mt-6 text-lg">Fundamental Physics</h4>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Quantum Field Theory (QFT):</strong> {renderText("The deepest reality of our universe is not made of tiny billiard balls, but continuous fluid-like fields that permeate all of space. There is an 'Electron Field', an 'Up-Quark Field', a 'Photon Field', and so on. What we perceive as a 'particle' is merely a localized vibration or ripple in one of these fields, much like a wave traveling across an ocean.")}</p>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>The Heisenberg Uncertainty Principle:</strong> {renderText("This principle (ΔE·Δt ≥ ℏ/2) allows the vacuum to 'borrow' energy for very short periods of time. This creates Virtual Particles that pop into existence and annihilate nanoseconds later. The vacuum is not empty; it is a chaotic foam of potential.")}</p>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Pair Production:</strong> {renderText("To make a real, lasting particle, you must pay the energy cost upfront. Einstein's equation E=mc² dictates the price. If you inject enough energy (e.g., a Gamma Ray) to exceed twice the rest mass of an electron (2 * 0.511 MeV = 1.022 MeV), you can rip a real Electron and Positron out of the field.")}</p>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Conservation Laws:</strong> {renderText("Why pairs? You cannot create electric charge from nothing. The net charge of the vacuum is zero. To create a negative electron (-1), the laws of physics demand you simultaneously create its antimatter twin, the positive Positron (+1). This ensures the total charge of the universe remains exactly zero.")}</p>
                                </div>
                                <div className="space-y-4 mt-6 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                    <h4 className="font-bold text-red-400 text-xs uppercase">Simulation vs Reality</h4>
                                    <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                                        <li><strong>Momentum Conservation:</strong> {renderText("In reality, a single photon in a vacuum cannot spontaneously split into a pair because momentum would not be conserved. Real pair production requires a nearby atomic nucleus to absorb the recoil. In this simulation, we allow spontaneous vacuum production for gameplay.")}</li>
                                        <li><strong>Particle Masses:</strong> {renderText("We simulate the electron mass as ~0.1u (1/10th proton) instead of the realistic 1/1836th. Real electrons are so light they would fly off the screen instantly under standard forces.")}</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            );
            case 'hadrons': return (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <section className="bg-violet-900/20 p-6 rounded-lg border border-violet-500/30">
                        <h3 className="text-xl font-bold text-violet-300 mb-4">Hadronization & The Strong Force</h3>
                        {!discoveredHadrons && !unlockedAll ? (
                            <div className="space-y-6">
                                <p className="text-base text-gray-300 leading-relaxed">{renderText("You may have noticed that Quarks disappear rapidly after creation. They are unstable in isolation and cannot exist freely in our universe for more than a fraction of a second.")}</p>
                                <div className="bg-black/40 p-5 rounded border border-violet-500/20">
                                    <strong className="text-white text-sm block mb-3 uppercase tracking-wider">Research Hint</strong>
                                    <p className="text-sm text-gray-300">{renderText("Quarks carry a special property called 'Color Charge'. Nature abhors naked color; it enforces a rule called Confinement. To save a Quark from decaying back into the vacuum, you must combine it with others to form a neutral 'white' object.")}</p>
                                    <p className="text-sm text-gray-300 mt-2">{renderText("Try spawning")} <strong>3 Quarks</strong> {renderText("(combinations of Up/Down) in rapid succession in the exact same spot.")}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-violet-500/10 p-4 rounded border-l-4 border-violet-500">
                                    <h4 className="font-bold text-violet-300 text-sm uppercase mb-1">Mechanism Discovered</h4>
                                    <p className="text-white font-bold">Baryon Genesis (Hadronization)</p>
                                </div>

                                <div className="flex justify-center py-4">
                                    <svg viewBox="0 0 200 100" className="w-full max-w-sm border border-violet-500/30 rounded bg-black/50">
                                        <circle cx="100" cy="50" r="40" fill="none" stroke="white" strokeDasharray="2 2" opacity="0.3" />
                                        
                                        <path d="M 100 20 L 70 70" stroke="#FFD700" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
                                        <path d="M 70 70 L 130 70" stroke="#FFD700" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
                                        <path d="M 130 70 L 100 20" stroke="#FFD700" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
                                        
                                        <circle cx="100" cy="20" r="12" fill="red" />
                                        <text x="100" y="20" textAnchor="middle" dy="4" fontSize="8" fill="white" fontWeight="bold">u</text>
                                        
                                        <circle cx="70" cy="70" r="12" fill="#00FF00" />
                                        <text x="70" y="70" textAnchor="middle" dy="4" fontSize="8" fill="black" fontWeight="bold">u</text>
                                        
                                        <circle cx="130" cy="70" r="12" fill="#0088FF" />
                                        <text x="130" y="70" textAnchor="middle" dy="4" fontSize="8" fill="white" fontWeight="bold">d</text>
                                        
                                        <text x="100" y="95" textAnchor="middle" fill="white" fontSize="10">Proton (uud)</text>
                                    </svg>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-white border-b border-gray-700 pb-1 mt-6 text-lg">Fundamental Physics</h4>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Quantum Chromodynamics (QCD):</strong> {renderText("This theory governs the Strong Force. Like electromagnetism has +/- charge, the Strong Force has 'Color Charge' (Red, Green, Blue). A stable particle must be 'Color Neutral' (White). This is why quarks usually group in threes (Red+Green+Blue = White) to form Baryons.")}</p>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Flux Tubes & Confinement:</strong> {renderText("Electromagnetic fields get weaker with distance. The Strong Force gets *stronger*. The Gluons that carry the force attract each other, constricting the field into a tight 'Flux Tube' or string. Pulling two quarks apart adds massive energy to this tube. Eventually, the tube snaps, and the energy converts into a new quark-antiquark pair. This ensures a quark is never found alone.")}</p>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Mass from Energy:</strong> {renderText("A Proton (uud) has a mass of 938 MeV. The three quarks inside only weigh about 9 MeV combined. Where is the other 99%? It is pure Energy ($E=mc^2$)—the kinetic energy of the quarks zipping around at light speed and the binding energy of the gluon field.")}</p>
                                </div>
                                <div className="space-y-4 mt-6 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                    <h4 className="font-bold text-red-400 text-xs uppercase">Simulation vs Reality</h4>
                                    <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                                        <li><strong>Jets:</strong> {renderText("In high-energy physics, a loose quark doesn't just fade away; it creates a 'Jet'—a spray of dozens of hadrons as it rips particles out of the vacuum. We simplify this to a rapid decay.")}</li>
                                        <li><strong>Mesons:</strong> {renderText("The simulation focuses on Baryons (3 quarks). In reality, quarks also form Mesons (quark + antiquark), which are crucial for mediating the nuclear force between protons.")}</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            );
            case 'nuclear': return (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <section className="bg-orange-900/20 p-6 rounded-lg border border-orange-500/30">
                        <h3 className="text-xl font-bold text-orange-400 mb-4">Nuclear Synthesis & Weak Force</h3>
                        {!discoveredHeavyElements && !unlockedAll ? (
                            <div className="space-y-6">
                                <p className="text-base text-gray-300 leading-relaxed">{renderText("You have Hydrogen (single Protons). To make heavier elements like Helium or Carbon, you need to fuse them. However, protons are positively charged—they repel each other violently via the Coulomb Force before they can touch.")}</p>
                                <div className="bg-black/40 p-5 rounded border border-orange-500/20">
                                    <strong className="text-white text-sm block mb-3 uppercase tracking-wider">Research Hint</strong>
                                    <p className="text-sm text-gray-300 mb-2">{renderText("You need a particle with mass but NO charge to slip past the electric defenses of the nucleus.")}</p>
                                    <ol className="text-sm text-gray-400 list-decimal list-inside space-y-2 mt-3">
                                        <li>{renderText("Take a Proton (Hydrogen nucleus).")}</li>
                                        <li>{renderText("Throw a Neutron at it. It has no charge, so it won't be repelled.")}</li>
                                        <li>{renderText("Keep adding neutrons until the nucleus becomes unstable.")}</li>
                                        <li>{renderText("Wait for nature to fix the imbalance via Beta Decay.")}</li>
                                    </ol>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-orange-500/10 p-4 rounded border-l-4 border-orange-500">
                                    <h4 className="font-bold text-orange-300 text-sm uppercase mb-1">Mechanism Discovered</h4>
                                    <p className="text-white font-bold">Neutron Capture & Beta Decay</p>
                                </div>

                                <div className="flex justify-center py-4">
                                    <svg viewBox="0 0 200 120" className="w-full max-w-sm border border-orange-500/30 rounded bg-black/50">
                                        <g transform="translate(40, 60)">
                                            <text x="0" y="-30" fill="white" textAnchor="middle" fontSize="10">Neutron (ddu)</text>
                                            <circle cx="0" cy="0" r="15" fill="#3333FF" />
                                            <text x="0" y="4" fill="white" textAnchor="middle" fontSize="8" fontWeight="bold">n</text>
                                        </g>
                                        
                                        <path d="M 60 60 L 100 60" stroke="orange" strokeWidth="2" markerEnd="url(#arrow)" strokeDasharray="4 2" />
                                        <text x="80" y="50" fill="orange" textAnchor="middle" fontSize="8">Weak Force</text>
                                        
                                        <g transform="translate(140, 60)">
                                            <text x="0" y="-30" fill="white" textAnchor="middle" fontSize="10">Proton (uud)</text>
                                            <circle cx="0" cy="0" r="15" fill="#FF3333" />
                                            <text x="0" y="4" fill="white" textAnchor="middle" fontSize="8" fontWeight="bold">p⁺</text>
                                            
                                            <path d="M 10 10 L 40 40" stroke="#FFFFFF" strokeWidth="1" markerEnd="url(#arrow)" />
                                            <text x="45" y="45" fill="#FFFFFF" fontSize="10">e⁻</text>
                                            
                                            <path d="M 10 -10 L 40 -40" stroke="#AAAAAA" strokeWidth="1" markerEnd="url(#arrow)" strokeDasharray="2 2" />
                                            <text x="45" y="-45" fill="#AAAAAA" fontSize="10">ν</text>
                                        </g>
                                    </svg>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-white border-b border-gray-700 pb-1 mt-6 text-lg">Fundamental Physics</h4>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Residual Strong Force:</strong> {renderText("Protons naturally repel each other. Neutrons act as the 'glue' of the nucleus. They attract protons via the Strong Force but, lacking charge, don't add any repulsion. This allows stable nuclei to form.")}</p>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>The Weak Interaction (Beta Decay):</strong> {renderText("When a nucleus has too many neutrons, it becomes unstable. The Weak Force allows a Down quark inside a neutron to spontaneously flip into an Up quark. This transforms the Neutron (udd) into a Proton (uud). To conserve charge, the nucleus spits out an electron (Beta radiation). This increases the atomic number by 1, turning Hydrogen into Helium, or Carbon into Nitrogen.")}</p>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Valley of Stability:</strong> {renderText("There is a narrow path of stable proton/neutron ratios. If you stray too far to the left or right (too many or too few neutrons), the nucleus will radioactively decay to get back to the valley.")}</p>
                                </div>
                                <div className="space-y-4 mt-6 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                    <h4 className="font-bold text-red-400 text-xs uppercase">Simulation vs Reality</h4>
                                    <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                                        <li><strong>Cold Fusion:</strong> {renderText("In nature, elements are forged in stars at millions of degrees (Fusion). This simulation uses 'Neutron Capture' (similar to the r-process in supernovae) which allows you to build elements at room temperature without overcoming massive energy barriers.")}</li>
                                        <li><strong>Decay Rates:</strong> {renderText("Real beta decay can take billions of years. We accelerate this by factors of 10^20 so you don't have to wait for the heat death of the universe to see Carbon form.")}</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            );
            case 'chemistry': return (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <section className="bg-green-900/20 p-6 rounded-lg border border-green-500/30">
                        <h3 className="text-xl font-bold text-green-400 mb-4">Molecular Chemistry</h3>
                        {!discoveredMolecules && !unlockedAll ? (
                            <div className="space-y-6">
                                <p className="text-base text-gray-300 leading-relaxed">{renderText("We are now leaving the nucleus. The forces here are gentler. Atoms generally desire electronic stability—they want to fill their outer electron shells (the Octet Rule).")}</p>
                                <div className="bg-black/40 p-5 rounded border border-green-500/20">
                                    <strong className="text-white text-sm block mb-3 uppercase tracking-wider">Research Hint</strong>
                                    <ol className="text-sm text-gray-400 list-decimal list-inside space-y-2">
                                        <li>{renderText("Create an Oxygen atom (Z=8) and two Hydrogen atoms (Z=1).")}</li>
                                        <li>{renderText("Notice their charge? Bare nuclei are positive ions, and they repel. Throw Electrons at them until they are neutral.")}</li>
                                        <li>{renderText("Once neutral, bring them gently together. If compatible, they will bond.")}</li>
                                    </ol>
                                    <p className="text-xs text-gray-500 mt-3 italic border-t border-gray-800 pt-2">{renderText("Tip: Check the Recipe Palette (⚗️) to see valid combinations.")}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-green-500/10 p-4 rounded border-l-4 border-green-500">
                                    <h4 className="font-bold text-green-300 text-sm uppercase mb-1">Mechanism Discovered</h4>
                                    <p className="text-white font-bold">Covalent Bonding & VSEPR</p>
                                </div>

                                <div className="flex justify-center py-4 gap-4">
                                    <div className="text-center">
                                        <svg viewBox="0 0 60 60" className="w-16 h-16 mx-auto">
                                            <circle cx="30" cy="30" r="10" fill="#AAAAAA" />
                                            <circle cx="30" cy="10" r="5" fill="white" />
                                            <circle cx="30" cy="50" r="5" fill="white" />
                                            <path d="M 30 20 L 30 40" stroke="white" strokeWidth="2" opacity="0.5" />
                                        </svg>
                                        <span className="text-[9px] text-gray-400 uppercase">Linear (180°)</span>
                                    </div>
                                    <div className="text-center">
                                        <svg viewBox="0 0 60 60" className="w-16 h-16 mx-auto">
                                            <circle cx="30" cy="30" r="10" fill="#AAAAAA" />
                                            <circle cx="30" cy="10" r="5" fill="white" />
                                            <circle cx="12" cy="40" r="5" fill="white" />
                                            <circle cx="48" cy="40" r="5" fill="white" />
                                            <path d="M 30 20 L 30 30 L 16 37 M 30 30 L 44 37" stroke="white" strokeWidth="2" opacity="0.5" />
                                        </svg>
                                        <span className="text-[9px] text-gray-400 uppercase">Trigonal (120°)</span>
                                    </div>
                                    <div className="text-center">
                                        <svg viewBox="0 0 60 60" className="w-16 h-16 mx-auto">
                                            <circle cx="30" cy="30" r="10" fill="#AAAAAA" />
                                            <circle cx="30" cy="10" r="5" fill="white" />
                                            <circle cx="10" cy="45" r="5" fill="white" />
                                            <circle cx="50" cy="45" r="5" fill="white" />
                                            <circle cx="30" cy="40" r="5" fill="white" opacity="0.5" /> 
                                        </svg>
                                        <span className="text-[9px] text-gray-400 uppercase">Tetrahedral (~109°)</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-white border-b border-gray-700 pb-1 mt-6 text-lg">Fundamental Physics</h4>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Atomic Orbitals:</strong> {renderText("Electrons do not orbit nuclei like planets. They exist as standing waves of probability called Orbitals. Because electrons are Fermions, they cannot occupy the same state. This forces them to stack into shells (s, p, d, f) with distinct shapes.")}</p>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Covalent Bonding:</strong> {renderText("When atoms approach, their wavefunctions can overlap. If phases align, electron density concentrates between the nuclei. This negative charge attracts the positive nuclei, binding them together. This releases energy, making the molecule more stable than the isolated atoms.")}</p>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>VSEPR Theory:</strong> {renderText("Electrons are negatively charged and repel each other. Valence Shell Electron Pair Repulsion theory states that electron domains (bonds or lone pairs) will push each other as far apart as physically possible. In Methane (CH4), 4 bonds form a Tetrahedron. In Water (H2O), 2 bonds and 2 invisible lone pairs form a 'Bent' shape.")}</p>
                                </div>
                                <div className="space-y-4 mt-6 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                    <h4 className="font-bold text-red-400 text-xs uppercase">Simulation vs Reality</h4>
                                    <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                                        <li><strong>Springs vs Waves:</strong> {renderText("We model bonds as damped springs to visualize their rigidity. In reality, bonds are continuous quantum states without mechanical parts.")}</li>
                                        <li><strong>Hard Spheres:</strong> {renderText("The simulation treats atoms as hard spheres. Real atoms are fuzzy probability clouds that can overlap significantly.")}</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            );
            case 'dictionary': return (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <section className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                        <h3 className="text-xl font-bold text-blue-400 mb-6 border-b border-gray-700 pb-4">📖 Scientific Dictionary</h3>
                        <div className="space-y-8">
                            {DICTIONARY_DATA.map((entry, idx) => (
                                <div 
                                    key={idx} 
                                    ref={el => { if(el) dictionaryRefs.current.set(entry.term, el); }}
                                    className="group transition-colors duration-500 rounded-lg p-2 -mx-2 hover:bg-gray-800/50"
                                >
                                    <h4 className="text-lg font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">{entry.term}</h4>
                                    <p className="text-sm text-gray-400 leading-relaxed">{renderText(entry.def)}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            );
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="relative w-full max-w-5xl h-[85vh]" onClick={e => e.stopPropagation()}>
                
                <button 
                    onClick={onClose} 
                    className="absolute -top-10 right-0 text-gray-400 hover:text-white z-50 p-1 transition-transform hover:scale-110"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="bg-gray-950 border border-gray-700 rounded-xl w-full h-full flex flex-col md:flex-row overflow-hidden shadow-2xl relative">
                    
                    <div className="w-full md:w-72 bg-gray-900 border-b md:border-b-0 md:border-r border-gray-800 flex flex-row md:flex-col overflow-x-auto md:overflow-visible no-scrollbar shrink-0">
                        <div className="p-6 hidden md:block border-b border-gray-800">
                            <h3 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight"><span>📘</span> Help</h3>
                            <p className="text-xs text-gray-500 mt-2 leading-relaxed">Welcome to the SimChem Lab. This guide tracks your scientific progress.</p>
                            <div className="mt-4">
                                <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Discovery</span><span>{progressPercent}%</span></div>
                                <div className="w-full bg-gray-800 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div></div>
                                <div className="text-[10px] text-gray-600 mt-1 text-right">{discoveredCount} / {totalItems} unlocked</div>
                            </div>
                        </div>
                        
                        <div className="flex flex-row md:flex-col p-3 gap-2 w-full pr-12 md:pr-3">
                            {NAV_ITEMS.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { setActivePage(item.id); markSectionSeen(item.id); }}
                                    disabled={item.locked}
                                    className={`flex items-center gap-4 p-4 rounded-lg text-sm font-bold transition-all w-auto md:w-full text-left flex-shrink-0 md:flex-shrink min-w-[120px] md:min-w-0 whitespace-nowrap relative overflow-hidden
                                        ${activePage === item.id 
                                            ? 'bg-gray-800 text-white shadow-lg ring-1 ring-white/10 translate-x-1' 
                                            : 'text-gray-500 hover:bg-gray-800/50 hover:text-gray-300'}
                                        ${item.locked ? 'opacity-40 cursor-not-allowed grayscale' : ''}
                                        ${unseenSections.has(item.id) && !item.locked ? 'shimmer-halo text-white border border-white/20' : ''}
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

                    <div className="flex-1 flex flex-col h-full bg-gray-950 relative min-w-0">
                        <div className="p-8 md:p-12 overflow-y-auto flex-1 custom-scrollbar pt-12 md:pt-12">
                            <div className="max-w-3xl mx-auto">
                                {renderContent()}
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex justify-between items-center md:justify-end">
                            <button onClick={onClose} className="px-8 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold text-sm transition-colors border border-gray-700 shadow-lg">Close Guide</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
