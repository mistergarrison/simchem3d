
import React, { useState, useEffect, useRef } from 'react';
import { DiscoveryState, GameMode } from '../../types/ui';
import { ELEMENTS, SM_PARTICLES } from '../../data/elements';
import { MOLECULES } from '../../data/molecules';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    discovery: DiscoveryState;
    gameMode: GameMode;
    unseenSections: Set<string>;
    markSectionSeen: (id: string) => void;
}

type PageId = 'basics' | 'particles' | 'hadrons' | 'nuclear' | 'chemistry' | 'dictionary';

// --- DATA: DICTIONARY ---
const DICTIONARY_DATA: { term: string, def: string }[] = [
    { term: "Activation Energy", def: "The minimum energy required to start a chemical reaction. In this simulation, it acts as a velocity threshold—atoms must collide with sufficient speed to overcome electrostatic repulsion and lock into the Lennard-Jones potential well." },
    { term: "Alpha Decay", def: "A type of radioactive decay where an atomic nucleus emits an alpha particle (two protons and two neutrons). It is a dramatic example of quantum tunneling, where a cluster of particles escapes the strong nuclear force potential well." },
    { term: "Annihilation", def: "The total conversion of mass into energy when a particle meets its antiparticle (e.g., Electron + Positron). This process conserves momentum and charge, releasing high-energy photons (gamma rays) according to E=mc²." },
    { term: "Antimatter", def: "Matter composed of antiparticles. An antiparticle has the same mass as its ordinary matter counterpart but opposite electric charge and quantum numbers (like lepton number). Creating it requires high-energy pair production." },
    { term: "Atom", def: "The smallest unit of ordinary matter that forms a chemical element. It consists of a dense, positively charged nucleus surrounded by a cloud of negatively charged electrons bound by the electromagnetic force." },
    { term: "Baryon", def: "A composite subatomic particle made of three quarks (e.g., Protons and Neutrons). Baryons are fermions, meaning they obey the Pauli Exclusion Principle." },
    { term: "Beta Decay", def: "A type of radioactive decay mediated by the Weak Force. A neutron transforms into a proton (or vice versa), emitting an electron (or positron) and a neutrino to conserve charge and lepton number." },
    { term: "Binding Energy", def: "The energy required to disassemble a whole system into separate parts. For nuclei, this energy is so immense that it measurably reduces the mass of the nucleus (Mass Defect). Energy released in fusion comes from this difference." },
    { term: "Boson", def: "Particles with integer spin (0, 1, 2...) that carry fundamental forces. Photons (electromagnetism) and Gluons (strong force) are bosons. Unlike matter particles, bosons can occupy the same quantum state, allowing for phenomena like lasers." },
    { term: "Color Charge", def: "The property of quarks and gluons that causes them to interact via the Strong Force. It comes in three 'colors': Red, Green, and Blue. Nature requires all stable particles to be 'Color Neutral' (White)." },
    { term: "Confinement", def: "The phenomenon in QCD where quarks cannot be isolated. The force between quarks does not diminish with distance; pulling them apart injects so much energy into the gluon field that new quark-antiquark pairs are ripped from the vacuum." },
    { term: "Conservation Laws", def: "Fundamental rules of the universe stating that certain properties (Energy, Momentum, Charge, Lepton Number) cannot be created or destroyed, only transferred or transformed." },
    { term: "Coulomb Barrier", def: "The energy barrier due to electrostatic repulsion that two nuclei must overcome to get close enough for the Strong Force to bind them. This is why fusion requires high temperatures or high velocities." },
    { term: "Covalent Bonding", def: "A chemical bond formed by the sharing of electron pairs between atoms. In quantum mechanics, this is due to the constructive interference of atomic orbitals forming a lower-energy molecular orbital." },
    { term: "Cross Section", def: "A measure of the probability that a specific interaction (like a collision or reaction) will occur between particles. It is effectively the 'target area' a particle presents to another." },
    { term: "Dirac Sea", def: "A theoretical model of the vacuum as an infinite sea of particles with negative energy. Pair production can be visualized as kicking a particle out of this sea, creating a real particle and leaving a 'hole' (antiparticle)." },
    { term: "Electron", def: "A stable subatomic particle with a charge of -1e. It acts as the primary carrier of electricity and, through its arrangement in orbitals, determines the chemical bonding properties of elements." },
    { term: "Electron Affinity", def: "The amount of energy released when an electron is attached to a neutral atom to form a negative ion. Halogens like Fluorine have very high electron affinity." },
    { term: "Electron Capture", def: "A nuclear decay process where a proton-rich nucleus absorbs an inner atomic electron, converting a proton into a neutron and emitting an electron neutrino." },
    { term: "Electronegativity", def: "A chemical property that describes the tendency of an atom to attract a shared pair of electrons towards itself. Differences in electronegativity create polar bonds." },
    { term: "Energy", def: "The capacity to do work. In this simulation, energy is the fundamental currency—converted into mass via pair production, released via bond formation, or stored in nuclear binding." },
    { term: "Entropy", def: "A measure of the number of specific ways a thermodynamic system may be arranged, often interpreted as 'disorder'. The Second Law of Thermodynamics states that the total entropy of an isolated system can never decrease." },
    { term: "Fermion", def: "Particles with half-integer spin (1/2, 3/2...) that make up matter (Quarks, Leptons). They obey the Pauli Exclusion Principle, which prevents matter from collapsing into a single point." },
    { term: "Flux Tube", def: "A tube-like region of space where the gluon field is concentrated. Unlike electric fields which spread out, the strong force field is collimated into tubes, leading to confinement." },
    { term: "Gauge Boson", def: "A particle that carries a fundamental force. The photon carries electromagnetism; the gluon carries the strong force; W/Z bosons carry the weak force." },
    { term: "Gluon", def: "The massless vector boson that mediates the strong interaction between quarks. Gluons themselves carry color charge, meaning they interact with other gluons, making QCD highly complex." },
    { term: "Ground State", def: "The lowest energy state of a quantum mechanical system. Atoms and nuclei naturally seek their ground state by emitting energy (photons) or decaying." },
    { term: "Hadron", def: "Any composite particle made of quarks held together by the strong force. Hadrons are categorized into Baryons (3 quarks) and Mesons (quark + antiquark)." },
    { term: "Hadronization", def: "The process where high-energy quarks and gluons spontaneously create new quark-antiquark pairs from the vacuum to form color-neutral hadrons, ensuring no free quarks exist." },
    { term: "Half-Life", def: "The time required for a quantity to reduce to half of its initial value. In nuclear physics, it is the time for half of the radioactive atoms in a sample to decay." },
    { term: "Heisenberg Uncertainty Principle", def: "A fundamental limit in quantum mechanics stating that certain pairs of properties (like position and momentum) cannot be simultaneously known to infinite precision." },
    { term: "Higgs Boson", def: "An excitation of the Higgs field. Interaction with this field gives mass to elementary particles like electrons and quarks. Without it, these particles would travel at light speed." },
    { term: "Ion", def: "An atom or molecule with a net electric charge due to the loss or gain of one or more electrons." },
    { term: "Isomer", def: "Molecules with the same chemical formula but different structural arrangements of atoms (e.g., Butane vs Isobutane). In nuclear physics, a metastable state of an atomic nucleus." },
    { term: "Isotope", def: "Variants of a particular chemical element which differ in neutron number. They have the same chemical properties but different nuclear masses and stability." },
    { term: "Lennard-Jones Potential", def: "A mathematical model describing the interaction between neutral atoms. It includes a strong short-range repulsion (Pauli) and a weaker long-range attraction (Van der Waals)." },
    { term: "Lepton", def: "An elementary particle that does not undergo strong interactions. The best known is the electron. Leptons come in three generations: Electron, Muon, and Tau." },
    { term: "Mass Defect", def: "The difference between the mass of an object and the sum of its constituent parts. The missing mass is converted into binding energy ($E=mc^2$) which holds the nucleus together." },
    { term: "Neutrino", def: "A fermion that interacts only via the weak subatomic force and gravity. They are extremely light and pass through normal matter almost undisturbed." },
    { term: "Neutron", def: "A subatomic particle of about the same mass as a proton but without an electric charge. It is present in all atomic nuclei except ordinary hydrogen." },
    { term: "Nucleon", def: "A collective name for protons and neutrons, the components of atomic nuclei." },
    { term: "Nucleosynthesis", def: "The process that creates new atomic nuclei from pre-existing nucleons, primarily occurring in stars (fusion) and supernovae (neutron capture)." },
    { term: "Orbital", def: "A mathematical function describing the wave-like behavior of an electron. It represents the volume of space where there is a high probability of finding the electron." },
    { term: "Pair Production", def: "The creation of an elementary particle and its antiparticle from a neutral boson. Examples include creating an electron and a positron from a high-energy photon." },
    { term: "Pauli Exclusion Principle", def: "The quantum mechanical principle which states that two or more identical fermions cannot occupy the same quantum state within a quantum system simultaneously." },
    { term: "Photon", def: "The quantum of the electromagnetic field including electromagnetic radiation such as light and radio waves, and the force carrier for the electromagnetic force." },
    { term: "Plasma", def: "A state of matter similar to gas in which a certain portion of the particles are ionized. The presence of free charge carriers makes plasma electrically conductive." },
    { term: "Positron", def: "The antiparticle or the antimatter counterpart of the electron. It has an electric charge of +1e." },
    { term: "Proton", def: "A stable subatomic particle occurring in all atomic nuclei, with a positive electric charge equal in magnitude to that of an electron." },
    { term: "Quantum Chromodynamics (QCD)", def: "The theory of the strong interaction between quarks and gluons, the fundamental particles that make up composite hadrons such as the proton, neutron and pion." },
    { term: "Quantum Field Theory", def: "A theoretical framework that combines classical field theory, special relativity and quantum mechanics. Particles are excited states (quanta) of their underlying fields." },
    { term: "Quantum Tunneling", def: "The quantum mechanical phenomenon where a wavefunction can propagate through a potential barrier. This plays an essential role in nuclear fusion and alpha decay." },
    { term: "Quark", def: "A type of elementary particle and a fundamental constituent of matter. Quarks combine to form composite particles called hadrons, the most stable of which are protons and neutrons." },
    { term: "Resonance", def: "In particle physics, a peak in the cross-section of a scattering experiment, corresponding to a short-lived excited state or a specific particle mass energy." },
    { term: "Spontaneous Fission", def: "A form of radioactive decay that is found only in very heavy chemical elements. The nucleus splits into two smaller nuclei and a few isolated neutrons." },
    { term: "Standard Model", def: "The theory describing three of the four known fundamental forces (the electromagnetic, weak, and strong interactions) and classifying all known elementary particles." },
    { term: "Strong Force", def: "The fundamental interaction that confines quarks into hadrons and binds protons and neutrons together to form atomic nuclei." },
    { term: "Virtual Particle", def: "A transient fluctuation that exhibits some of the characteristics of an ordinary particle, but exists for a limited time allowed by the Heisenberg Uncertainty Principle." },
    { term: "VSEPR", def: "Valence Shell Electron Pair Repulsion theory. A model used in chemistry to predict the geometry of individual molecules from the number of electron pairs surrounding their central atoms." },
    { term: "Weak Force", def: "The mechanism of interaction between subatomic particles that is responsible for the radioactive decay of atoms. It affects all known fermions." },
    { term: "Zero-Point Energy", def: "The lowest possible energy that a quantum mechanical system may have. Unlike in classical mechanics, quantum systems constantly fluctuate even in their lowest energy state." },
    { term: "Z-Plane", def: "The central 2D plane (Z=0) of the simulation. A restoring force acts to keep particles near this plane to facilitate 3D interaction on a 2D screen." }
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

    // --- UNLOCK STATE ---
    const unlockedAll = gameMode === 'sandbox';
    const discoveredQuantum = unlockedAll || discovery.particles.size > 0;
    const discoveredProton = discovery.particles.has('proton') || discovery.elements.has(1); 
    const discoveredNeutron = discovery.particles.has('neutron') || discovery.elements.has(0);
    const discoveredHadrons = unlockedAll || (discoveredProton || discoveredNeutron);
    const discoveredHeavyElements = unlockedAll || discovery.elements.size > 1; 
    const discoveredMolecules = unlockedAll || discovery.molecules.size > 0;

    const totalItems = ELEMENTS.length + SM_PARTICLES.length + MOLECULES.length;
    const discoveredCount = unlockedAll ? totalItems : (discovery.elements.size + discovery.particles.size + discovery.molecules.size);
    const progressPercent = Math.min(100, Math.round((discoveredCount / totalItems) * 100));

    const NAV_ITEMS: { id: PageId; label: string; icon: string; locked: boolean; color: string }[] = [
        { id: 'basics', label: 'Lab Manual', icon: '🎮', locked: false, color: 'text-white' },
        { id: 'particles', label: 'Quantum Vacuum', icon: '⚡', locked: false, color: 'text-pink-400' },
        { id: 'hadrons', label: 'Hadronization', icon: '🧩', locked: !discoveredHadrons, color: 'text-violet-400' },
        { id: 'nuclear', label: 'Nuclear Physics', icon: '☢️', locked: !discoveredHadrons, color: 'text-orange-400' },
        { id: 'chemistry', label: 'Chemistry', icon: '⚗️', locked: !discoveredHeavyElements, color: 'text-green-400' },
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
                        <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">🎮 Operating Procedures</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
                            <div>
                                <h4 className="font-bold text-blue-400 uppercase text-xs mb-2">Manipulation</h4>
                                <ul className="space-y-2">
                                    <li>{renderText("Left Click / Drag: Grab atoms. Release while moving to 'throw' them with momentum.")}</li>
                                    <li>{renderText("Scroll Wheel: Rotate the molecule currently under your cursor for 3D inspection.")}</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-purple-400 uppercase text-xs mb-2">Visualization</h4>
                                <ul className="space-y-2">
                                    <li>{renderText("View Mode: Toggle between 'Solid' (easier to see) and 'Glass' (internal structure).")}</li>
                                    <li>{renderText("Z-Plane: The simulation applies a weak restoration force to keep atoms near the center plane (Z=0) so they don't drift into the void.")}</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="bg-yellow-900/10 p-6 rounded-lg border border-yellow-500/20">
                        <h3 className="text-xl font-bold text-yellow-500 mb-4 border-b border-yellow-500/20 pb-2">🛠️ Laboratory Tools</h3>
                        <div className="space-y-6 text-sm text-gray-300">
                            <div>
                                <strong className="text-white block mb-1 text-lg">⚡ Energy tool</strong>
                                <p>{renderText("Injects raw energy into the vacuum field. Holding the button increases local energy density (measured in electron-volts). If you hit a resonance frequency, the vacuum may decay into real particles.")}</p>
                            </div>

                            {discoveredMolecules ? (
                                <div>
                                    <strong className="text-white block mb-1 text-lg">𓎤 Bonding loop</strong>
                                    <p>{renderText("Draw a loop around multiple atoms to select them. If the selected ingredients match a known recipe, the Bonding loop acts as a 'nano-assembler', using force-directed algorithms to fold the atoms into a valid Molecule.")}</p>
                                </div>
                            ) : (
                                <div className="opacity-50 flex items-center gap-2 py-2 bg-gray-900/50 rounded px-3 border border-dashed border-gray-700">
                                    <span className="text-xl">🔒</span>
                                    <span className="text-gray-500 italic">Advanced assembly tools are currently offline. Synthesize your first molecule to unlock.</span>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            );
            
            case 'particles': return (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <section className="bg-pink-900/20 p-6 rounded-lg border border-pink-500/30">
                        <h3 className="text-xl font-bold text-pink-400 mb-4">The Quantum Vacuum</h3>
                        
                        {!discoveredQuantum ? (
                            <div className="space-y-4">
                                <p className="text-base text-gray-300 leading-relaxed">{renderText("To the naked eye, the space before you appears empty. However, Quantum Field Theory (QFT) tells us otherwise. The vacuum is a seething ocean of invisible fields, bubbling with 'virtual particles' that exist for mere femtoseconds.")}</p>
                                <div className="bg-black/40 p-5 rounded border border-pink-500/20 mt-4">
                                    <strong className="text-white text-sm block mb-3 uppercase tracking-wider">Research Proposal</strong>
                                    <p className="text-sm text-gray-300">{renderText("We believe that by injecting sufficient energy into a focused point, we can pay the 'mass debt' to rip these virtual particles into reality.")}</p>
                                    <p className="text-sm text-gray-300 mt-2">{renderText("Use the")} <strong className="text-yellow-400">Energy tool (⚡)</strong>. {renderText("Watch the gauge. We predict resonances at specific energy thresholds. If the gauge turns")} <span className="text-green-400 font-bold">Green</span>, {renderText("release the beam immediately to spark a Pair Production event.")}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-pink-500/10 p-4 rounded border-l-4 border-pink-500">
                                    <h4 className="font-bold text-pink-300 text-sm uppercase mb-1">Mechanism Verified</h4>
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
                                    <h4 className="font-bold text-white border-b border-gray-700 pb-1 mt-6 text-lg">Detailed Analysis</h4>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Quantum Field Theory (QFT):</strong> {renderText("The universe is not made of particles, but of continuous fields (like the Electron Field). A 'particle' is simply a localized vibration in that field. The vacuum is the state where these fields are quiet—but according to the Heisenberg Uncertainty Principle, they can never be perfectly still. They fluctuate, borrowing energy to create 'virtual particles'.")}</p>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Paying the Energy Cost:</strong> {renderText("To make a real, permanent particle, you must pay its energy cost upfront. Einstein's famous equation, E=mc², sets the price tag. An electron has a mass of 0.511 MeV/c². To create one, you need at least that much energy concentrated in one spot.")}</p>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Conservation Laws & Symmetry:</strong> {renderText("Why did two particles appear? The universe strictly conserves Electric Charge and Lepton Number. You cannot create negative charge from nothing. To create a negative Electron (-1), you must simultaneously create its antimatter twin, the positive Positron (+1). This keeps the net charge of the universe at zero.")}</p>
                                </div>
                                <div className="space-y-4 mt-6 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                    <h4 className="font-bold text-red-400 text-xs uppercase">Simulation vs Reality</h4>
                                    <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                                        <li><strong>Momentum Conservation:</strong> {renderText("In reality, a single photon in a vacuum cannot spontaneously split because momentum would not be conserved (light has momentum, but a stationary pair has zero). Real pair production requires a nearby heavy nucleus to absorb the kick. In this simulation, we allow vacuum production for gameplay.")}</li>
                                        <li><strong>Mass Scaling:</strong> {renderText("Real electrons are 1836 times lighter than protons. If we simulated that ratio, electrons would fly off the screen instantly. We simulate electrons as roughly 1/10th the mass of a proton for visual stability.")}</li>
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
                        
                        {!discoveredHadrons ? (
                            <div className="space-y-6">
                                <p className="text-base text-gray-300 leading-relaxed">{renderText("You may have noticed that Quarks disappear rapidly after creation. They are violently unstable in isolation. This is due to a phenomenon called 'Color Confinement'.")}</p>
                                <div className="bg-black/40 p-5 rounded border border-violet-500/20">
                                    <strong className="text-white text-sm block mb-3 uppercase tracking-wider">Research Proposal</strong>
                                    <p className="text-sm text-gray-300">{renderText("Quarks carry 'Color Charge'. Nature strictly forbids 'naked' color. To stabilize a quark, you must combine it with others such that their colors cancel out to white (Red + Green + Blue).")}</p>
                                    <p className="text-sm text-gray-300 mt-2">{renderText("Try spawning")} <strong>3 Quarks</strong> {renderText("(combinations of Up/Down) in rapid succession in the exact same spot to form a Baryon.")}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-violet-500/10 p-4 rounded border-l-4 border-violet-500">
                                    <h4 className="font-bold text-violet-300 text-sm uppercase mb-1">Mechanism Verified</h4>
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
                                    <h4 className="font-bold text-white border-b border-gray-700 pb-1 mt-6 text-lg">Detailed Analysis</h4>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Quantum Chromodynamics (QCD):</strong> {renderText("This is the theory of the Strong Force. Just as electricity has +/- charge, the strong force has 'Color Charge' (Red, Green, Blue). The carrier particle, the Gluon, transmits this force. Uniquely, Gluons attract each other.")}</p>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Flux Tubes & Confinement:</strong> {renderText("Because gluons attract each other, the strong force field doesn't spread out like an electric field. Instead, it forms a tight 'Flux Tube' between quarks. It behaves like a rubber band: the further you pull quarks apart, the stronger the force gets. If you pull hard enough, the tube snaps, and the energy creates new quark pairs. This is why you never see a free quark.")}</p>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Mass from Energy:</strong> {renderText("Look at the mass of the Proton (938 MeV). The three quarks inside only weigh about 9 MeV combined. Where does the other 99% come from? It is pure Binding Energy trapped in the gluon field. You are made mostly of energy, not matter.")}</p>
                                </div>
                                <div className="space-y-4 mt-6 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                    <h4 className="font-bold text-red-400 text-xs uppercase">Simulation vs Reality</h4>
                                    <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                                        <li><strong>Jets:</strong> {renderText("In particle colliders, a loose quark creates a 'Jet'—a spray of dozens of particles. We simplify this to a rapid decay/removal.")}</li>
                                        <li><strong>Mesons:</strong> {renderText("We focus on Baryons (3 quarks). In reality, quarks also form Mesons (quark + antiquark), which act as messengers for the nuclear force.")}</li>
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
                        <h3 className="text-xl font-bold text-orange-400 mb-4">Nuclear Synthesis</h3>
                        
                        {!discoveredHeavyElements ? (
                            <div className="space-y-6">
                                <p className="text-base text-gray-300 leading-relaxed">{renderText("You have Hydrogen (Protons). To build the universe, you need heavier elements. But Protons are positively charged—they repel each other violently (Coulomb Barrier) before they can fuse.")}</p>
                                <div className="bg-black/40 p-5 rounded border border-orange-500/20">
                                    <strong className="text-white text-sm block mb-3 uppercase tracking-wider">Research Proposal</strong>
                                    <p className="text-sm text-gray-300 mb-2">{renderText("You need a 'Trojan Horse'—a particle with mass but NO charge to slip past the electric defenses of the nucleus.")}</p>
                                    <ol className="text-sm text-gray-400 list-decimal list-inside space-y-2 mt-3">
                                        <li>{renderText("Identify a Proton.")}</li>
                                        <li>{renderText("Launch a Neutron at it. It acts as nuclear glue.")}</li>
                                        <li>{renderText("Add neutrons until the nucleus becomes unstable (check the isotope mass).")}</li>
                                        <li>{renderText("Wait for the Weak Force (Beta Decay) to transmute the element.")}</li>
                                    </ol>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-orange-500/10 p-4 rounded border-l-4 border-orange-500">
                                    <h4 className="font-bold text-orange-300 text-sm uppercase mb-1">Mechanism Verified</h4>
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
                                    <h4 className="font-bold text-white border-b border-gray-700 pb-1 mt-6 text-lg">Detailed Analysis</h4>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Residual Strong Force:</strong> {renderText("Inside the nucleus, Protons repel each other magnetically. Neutrons act as buffers. They attract protons via the short-range Nuclear Force (a residual effect of the strong force between quarks) but have no charge to cause repulsion. This balance allows nuclei to hold together.")}</p>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Beta Decay (The Weak Force):</strong> {renderText("When a nucleus has too many neutrons, it is energetically unfavorable. The Weak Force allows a Down quark inside a neutron to spontaneously flip into an Up quark. This alchemy turns the Neutron (udd) into a Proton (uud). To conserve charge, the nucleus ejects an electron (Beta radiation). This increases the Atomic Number by 1, literally turning one element into another.")}</p>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Valley of Stability:</strong> {renderText("For every element, there is an ideal ratio of protons to neutrons. Stray too far (too many neutrons), and the nucleus decays to slide back down into this 'valley' of stability.")}</p>
                                </div>
                                <div className="space-y-4 mt-6 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                    <h4 className="font-bold text-red-400 text-xs uppercase">Simulation vs Reality</h4>
                                    <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                                        <li><strong>Cold Synthesis:</strong> {renderText("Stars forge elements via Fusion (smashing protons together at millions of degrees). We use Neutron Capture (similar to the r-process in supernovae) because it allows nucleosynthesis at low temperatures, which is easier to gamify.")}</li>
                                        <li><strong>Time Acceleration:</strong> {renderText("Real beta decay can take billions of years. We accelerate this probability by factors of 10^20 so you don't have to wait for the heat death of the universe.")}</li>
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
                        
                        {!discoveredMolecules ? (
                            <div className="space-y-6">
                                <p className="text-base text-gray-300 leading-relaxed">{renderText("We are now leaving the high-energy realm of the nucleus. The forces here are gentler. Atoms desire electronic stability—they want to fill their outer electron shells (The Octet Rule).")}</p>
                                <div className="bg-black/40 p-5 rounded border border-green-500/20">
                                    <strong className="text-white text-sm block mb-3 uppercase tracking-wider">Research Proposal</strong>
                                    <ol className="text-sm text-gray-400 list-decimal list-inside space-y-2">
                                        <li>{renderText("Create an Oxygen atom (Z=8) and two Hydrogen atoms (Z=1).")}</li>
                                        <li>{renderText("Notice their charge? Bare nuclei are positive ions, and they repel. Throw Electrons at them until they are neutral atoms.")}</li>
                                        <li>{renderText("Once neutral, bring them gently together. If the geometry is right, they will share electrons and bond.")}</li>
                                    </ol>
                                    <p className="text-xs text-gray-500 mt-3 italic border-t border-gray-800 pt-2">{renderText("Tip: Check the Recipe Palette (⚗️) to see valid molecular combinations.")}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-green-500/10 p-4 rounded border-l-4 border-green-500">
                                    <h4 className="font-bold text-green-300 text-sm uppercase mb-1">Mechanism Verified</h4>
                                    <p className="text-white font-bold">Covalent Bonding & VSEPR Theory</p>
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
                                    <h4 className="font-bold text-white border-b border-gray-700 pb-1 mt-6 text-lg">Detailed Analysis</h4>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>Atomic Orbitals:</strong> {renderText("Electrons do not orbit nuclei like planets. They exist as 3D standing waves called Orbitals. When atoms approach, these waves can interfere constructively. If the phases align, electron density concentrates between the nuclei. This negative glue holds the positive nuclei together—a Covalent Bond.")}</p>
                                    <p className="text-sm text-gray-300 leading-relaxed"><strong>VSEPR Theory:</strong> {renderText("Valence Shell Electron Pair Repulsion theory dictates shape. Electrons are negative; they repel each other. The electron domains (bonds and lone pairs) around a central atom will push each other as far apart as mathematically possible. In Carbon Dioxide, 2 domains push to 180° (Linear). In Methane, 4 domains push to 109.5° (Tetrahedral).")}</p>
                                </div>
                                <div className="space-y-4 mt-6 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                    <h4 className="font-bold text-red-400 text-xs uppercase">Simulation vs Reality</h4>
                                    <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                                        <li><strong>Spring Physics:</strong> {renderText("We model bonds as damped harmonic oscillators (springs) to visualize their rigidity and vibration. In reality, bonds are continuous quantum states described by the Schrödinger equation, not mechanical parts.")}</li>
                                        <li><strong>Hard Spheres:</strong> {renderText("The simulation treats atoms as solid spheres with a defined radius. Real atoms are fuzzy probability clouds that can overlap significantly.")}</li>
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
                            <p className="text-xs text-gray-500 mt-2 leading-relaxed">Welcome to the SimChem Lab. This help guide tracks your scientific progress.</p>
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
                                        {item.locked && <span className="text-[10px] uppercase tracking-wide font-normal">Unknown</span>}
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
                            <button onClick={onClose} className="px-8 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold text-sm transition-colors border border-gray-700 shadow-lg">Close Help</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
