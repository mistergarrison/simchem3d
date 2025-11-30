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
    { term: "Asymptotic Freedom", def: "A feature of quantum chromodynamics (QCD) where the interaction between quarks becomes weaker as they get closer together, allowing them to move almost freely inside a hadron." },
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
    { term: "Dipole", def: "A separation of positive and negative charges. In a polar bond, the more electronegative atom pulls electrons closer, creating a partial negative charge and leaving a partial positive charge on the other atom." },
    { term: "Dirac Sea", def: "A theoretical model of the vacuum as an infinite sea of particles with negative energy. Pair production can be visualized as kicking a particle out of this sea, creating a real particle and leaving a 'hole' (antiparticle)." },
    { term: "Electron", def: "A stable subatomic particle with a charge of -1e. It acts as the primary carrier of electricity and, through its arrangement in orbitals, determines the chemical bonding properties of elements." },
    { term: "Electron Affinity", def: "The amount of energy released when an electron is attached to a neutral atom to form a negative ion. Halogens like Fluorine have very high electron affinity." },
    { term: "Electron Capture", def: "A nuclear decay process where a proton-rich nucleus absorbs an inner atomic electron, converting a proton into a neutron and emitting an electron neutrino." },
    { term: "Electronegativity", def: "A chemical property that describes the tendency of an atom to attract a shared pair of electrons towards itself. Differences in electronegativity create polar bonds." },
    { term: "Energy", def: "The capacity to do work. In this simulation, energy is the fundamental currency—converted into mass via pair production, released via bond formation, or stored in nuclear binding." },
    { term: "Entropy", def: "A measure of the number of specific ways a thermodynamic system may be arranged, often interpreted as 'disorder'. The Second Law of Thermodynamics states that the total entropy of an isolated system can never decrease." },
    { term: "Fermion", def: "Particles with half-integer spin (1/2, 3/2...) that make up matter (Quarks, Leptons). They obey the Pauli Exclusion Principle, which prevents matter from collapsing into a single point." },
    { term: "Flux Tube", def: "A tube-like region of space where the gluon field is concentrated. Unlike electric fields which spread out, the strong force field is collimated into tubes, leading to confinement." },
    { term: "Fusion", def: "A nuclear reaction in which two or more atomic nuclei combine to form one or more different atomic nuclei and subatomic particles. The difference in mass between the reactants and products is released as energy." },
    { term: "Gamma Ray", def: "Penetrating electromagnetic radiation of the shortest wavelength and highest photon energy. It is often emitted during radioactive decay as the nucleus settles from an excited state to a lower energy state." },
    { term: "Gauge Boson", def: "A particle that carries a fundamental force. The photon carries electromagnetism; the gluon carries the strong force; W/Z bosons carry the weak force." },
    { term: "Gluon", def: "The massless vector boson that mediates the strong interaction between quarks. Gluons themselves carry color charge, meaning they interact with other gluons, making QCD highly complex." },
    { term: "Ground State", def: "The lowest energy state of a quantum mechanical system. Atoms and nuclei naturally seek their ground state by emitting energy (photons) or decaying." },
    { term: "Hadron", def: "Any composite particle made of quarks held together by the strong force. Hadrons are categorized into Baryons (3 quarks) and Mesons (quark + antiquark)." },
    { term: "Hadronization", def: "The process where high-energy quarks and gluons spontaneously create new quark-antiquark pairs from the vacuum to form color-neutral hadrons, ensuring no free quarks exist." },
    { term: "Half-Life", def: "The time required for a quantity to reduce to half of its initial value. In nuclear physics, it is the time for half of the radioactive atoms in a sample to decay." },
    { term: "Heisenberg Uncertainty Principle", def: "A fundamental limit in quantum mechanics stating that certain pairs of properties (like position and momentum) cannot be simultaneously known to infinite precision." },
    { term: "Higgs Boson", def: "An excitation of the Higgs field. Interaction with this field gives mass to elementary particles like electrons and quarks. Without it, these particles would travel at light speed." },
    { term: "Hybridization", def: "The mathematical mixing of atomic orbitals (like s and p) to form new, equivalent hybrid orbitals (like sp3). This explains why Carbon forms four identical bonds in a tetrahedral shape." },
    { term: "Ion", def: "An atom or molecule with a net electric charge due to the loss or gain of one or more electrons." },
    { term: "Isomer", def: "Molecules with the same chemical formula but different structural arrangements of atoms (e.g., Butane vs Isobutane). In nuclear physics, a metastable state of an atomic nucleus." },
    { term: "Isotope", def: "Variants of a particular chemical element which differ in neutron number. They have the same chemical properties but different nuclear masses and stability." },
    { term: "Lennard-Jones Potential", def: "A mathematical model describing the interaction between neutral atoms. It includes a strong short-range repulsion (Pauli) and a weaker long-range attraction (Van der Waals)." },
    { term: "Lepton", def: "An elementary particle that does not undergo strong interactions. The best known is the electron. Leptons come in three generations: Electron, Muon, and Tau." },
    { term: "Lone Pair", def: "A pair of valence electrons that are not shared with another atom in a covalent bond. They occupy more space than bonding pairs, compressing the bond angles in molecules like water." },
    { term: "Mass Defect", def: "The difference between the mass of an object and the sum of its constituent parts. The missing mass is converted into binding energy ($E=mc^2$) which holds the nucleus together." },
    { term: "Meson", def: "A type of hadron composed of one quark and one antiquark. Pions are the most common mesons and mediate the force between nucleons." },
    { term: "Neutrino", def: "A fermion that interacts only via the weak subatomic force and gravity. They are extremely light and pass through normal matter almost undisturbed." },
    { term: "Neutron", def: "A subatomic particle of about the same mass as a proton but without an electric charge. It is present in all atomic nuclei except ordinary hydrogen." },
    { term: "Nuclear Force", def: "Also known as the Residual Strong Force. It is the force that binds protons and neutrons together in atomic nuclei. It is a secondary effect of the strong interaction between quarks." },
    { term: "Nucleon", def: "A collective name for protons and neutrons, the components of atomic nuclei." },
    { term: "Nucleosynthesis", def: "The process that creates new atomic nuclei from pre-existing nucleons, primarily occurring in stars (fusion) and supernovae (neutron capture)." },
    { term: "Octet Rule", def: "A rule of thumb stating that atoms tend to bond in such a way that they each have eight electrons in their valence shell, giving them the same electronic configuration as a noble gas." },
    { term: "Orbital", def: "A mathematical function describing the wave-like behavior of an electron. It represents the volume of space where there is a high probability of finding the electron." },
    { term: "Pair Production", def: "The creation of an elementary particle and its antiparticle from a neutral boson. Examples include creating an electron and a positron from a high-energy photon." },
    { term: "Pauli Exclusion Principle", def: "The quantum mechanical principle which states that two or more identical fermions cannot occupy the same quantum state within a quantum system simultaneously." },
    { term: "Photon", def: "The quantum of the electromagnetic field including electromagnetic radiation such as light and radio waves, and the force carrier for the electromagnetic force." },
    { term: "Pi Bond", def: "A covalent bond formed by the lateral overlap of atomic orbitals (typically p-orbitals). It prevents rotation and is found in double and triple bonds." },
    { term: "Pion", def: "The lightest meson (pi-meson). It acts as the exchange particle for the residual strong force, binding protons and neutrons together in the nucleus." },
    { term: "Plasma", def: "A state of matter similar to gas in which a certain portion of the particles are ionized. The presence of free charge carriers makes plasma electrically conductive." },
    { term: "Positron", def: "The antiparticle or the antimatter counterpart of the electron. It has an electric charge of +1e." },
    { term: "Proton", def: "A stable subatomic particle occurring in all atomic nuclei, with a positive electric charge equal in magnitude to that of an electron." },
    { term: "Quantum Chromodynamics (QCD)", def: "The theory of the strong interaction between quarks and gluons, the fundamental particles that make up composite hadrons such as the proton, neutron and pion." },
    { term: "Quantum Field Theory", def: "A theoretical framework that combines classical field theory, special relativity and quantum mechanics. Particles are treated as excited states (quanta) of underlying physical fields." },
    { term: "Quantum Tunneling", def: "The quantum mechanical phenomenon where a wavefunction can propagate through a potential barrier. This plays an essential role in nuclear fusion and alpha decay." },
    { term: "Quark", def: "A type of elementary particle and a fundamental constituent of matter. Quarks combine to form composite particles called hadrons, the most stable of which are protons and neutrons." },
    { term: "Resonance", def: "In particle physics, a condition where energy transfer is maximized because the input frequency matches the system's natural frequency. This often corresponds to the mass-energy of a particle." },
    { term: "Rest Mass", def: "The mass of a particle when it is stationary. According to Special Relativity, mass increases as velocity approaches the speed of light, but Rest Mass is an invariant intrinsic property." },
    { term: "Sigma Bond", def: "The strongest type of covalent chemical bond, formed by head-on overlapping between atomic orbitals. All single bonds are sigma bonds." },
    { term: "Spontaneous Fission", def: "A form of radioactive decay that is found only in very heavy chemical elements. The nucleus splits into two smaller nuclei and a few isolated neutrons." },
    { term: "Standard Model", def: "The theory describing three of the four known fundamental forces (the electromagnetic, weak, and strong interactions) and classifying all known elementary particles." },
    { term: "Strong Force", def: "The fundamental interaction that confines quarks into hadrons and binds protons and neutrons together to form atomic nuclei." },
    { term: "Valley of Stability", def: "A characterization of the stability of nuclides to radioactivity based on their binding energy. Stable nuclides lie in the bottom of the valley, while unstable ones decay to 'roll down' the slopes." },
    { term: "Virtual Particle", def: "A transient fluctuation that exhibits some of the characteristics of an ordinary particle, but exists for a limited time allowed by the Heisenberg Uncertainty Principle." },
    { term: "VSEPR", def: "Valence Shell Electron Pair Repulsion theory. A model used in chemistry to predict the geometry of individual molecules from the number of electron pairs surrounding their central atoms." },
    { term: "Wavefunction", def: "A mathematical description of the quantum state of an isolated quantum system. The probability of finding a particle at a specific location is related to the square of its wavefunction's amplitude." },
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
                                <p className="text-base text-gray-300 leading-relaxed">{renderText("To the naked eye, the space before you appears empty. However, our instruments indicate this vacuum is a seething ocean of invisible fields. According to the Heisenberg Uncertainty Principle, energy levels in the void are never zero; they fluctuate constantly, creating transient 'Virtual Particles'.")}</p>
                                
                                <div className="bg-black/40 p-5 rounded border border-pink-500/20 mt-4">
                                    <strong className="text-white text-sm block mb-3 uppercase tracking-wider">Research Proposal</strong>
                                    <p className="text-sm text-gray-300">{renderText("We can probe this structure using the")} <strong className="text-white">Energy Tool</strong>. {renderText("By focusing high-intensity energy into a specific coordinate, we may be able to 'pay the debt' of these virtual particles, dragging them into reality before they vanish.")}</p>
                                    
                                    <div className="mt-4 pt-4 border-t border-pink-500/20">
                                        <strong className="text-yellow-400 text-xs uppercase block mb-1">Operational Hint</strong>
                                        <p className="text-sm text-gray-300">{renderText("Hold the Energy Tool (⚡) to charge the local field. Watch the gauge carefully. We predict that specific energy levels will trigger a")} <strong>Resonance</strong>. {renderText("If the gauge locks onto a target (indicated by a")} <span className="text-green-400 font-bold">Green</span> {renderText("highlight), release the beam immediately to bridge the mass gap.")}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-pink-500/10 p-4 rounded border-l-4 border-pink-500">
                                    <h4 className="font-bold text-pink-300 text-sm uppercase mb-1">Mechanism Verified</h4>
                                    <p className="text-white font-bold">Pair Production (E = mc²)</p>
                                </div>
                                
                                <p className="text-sm text-gray-300">{renderText("You have successfully converted pure Energy into Matter. This is the direct application of Einstein's mass-energy equivalence. By supplying 1.022 MeV of energy (the combined rest mass of an electron and positron), you bridged the gap between a virtual fluctuation and a permanent physical entity.")}</p>

                                <div className="flex justify-center py-4 my-2">
                                    <svg viewBox="0 0 240 120" className="w-full max-w-sm border border-pink-500/30 rounded bg-black/50">
                                        <defs>
                                            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#fff"/></marker>
                                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
                                        </defs>
                                        
                                        {/* Photon Incoming */}
                                        <text x="20" y="55" fill="yellow" fontSize="12" fontWeight="bold">Energy (γ)</text>
                                        <path d="M 20 65 Q 60 55 100 65" stroke="yellow" strokeWidth="2" strokeDasharray="4 2" markerEnd="url(#arrow)" />
                                        
                                        {/* Interaction Point */}
                                        <circle cx="120" cy="65" r="6" fill="white" filter="url(#glow)" className="animate-pulse" />
                                        
                                        {/* Electron Out */}
                                        <path d="M 120 65 C 150 65 160 20 200 30" stroke="#FFFFFF" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                                        <circle cx="200" cy="30" r="4" fill="white" opacity="0.8" />
                                        <text x="210" y="35" fill="#FFFFFF" fontSize="12" fontWeight="bold">e⁻</text>
                                        
                                        {/* Positron Out */}
                                        <path d="M 120 65 C 150 65 160 110 200 100" stroke="#FF9999" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                                        <circle cx="200" cy="100" r="4" fill="#FF9999" opacity="0.8" />
                                        <text x="210" y="105" fill="#FF9999" fontSize="12" fontWeight="bold">e⁺</text>
                                        
                                        <text x="120" y="15" fill="gray" fontSize="10" textAnchor="middle">Target: 1.022 MeV</text>
                                    </svg>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-white border-b border-gray-700 pb-2 mt-6 text-lg">Deep Dive: Quantum Field Theory</h4>
                                    
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong className="text-pink-400 block mb-1">The Quantum Field</strong> 
                                            {renderText("In modern physics, particles are not tiny spheres; they are excitations in universal quantum fields that permeate all of space. An electron is a ripple in the Electron Field; a photon is a ripple in the Electromagnetic Field. The 'Vacuum' is simply the state where these fields are at their lowest energy level.")}
                                        </p>
                                        
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong className="text-pink-400 block mb-1">Virtual Particles & The Loan</strong> 
                                            {renderText("The Heisenberg Uncertainty Principle allows the universe to 'borrow' energy from nothing, provided it pays it back quickly. Pairs of particles and antiparticles constantly pop into existence and annihilate within zeptoseconds. They are 'virtual' because they don't have the full mass-energy required to exist permanently.")}
                                        </p>
                                        
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong className="text-pink-400 block mb-1">Paying the Debt</strong> 
                                            {renderText("When you use the Energy Tool, you dump real energy into this fluctuation. If you provide enough energy to equal the Rest Mass of the particles ($E=mc^2$), the debt is paid. The virtual ripple becomes a real, propagating wave. The particle is born.")}
                                        </p>
                                        
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong className="text-pink-400 block mb-1">Symmetry & Conservation</strong> 
                                            {renderText("Why two particles? The universe strictly conserves quantum numbers like Electric Charge. You cannot create a negative Electron (-1) from neutral energy (0) without also creating its antimatter twin, the positive Positron (+1). The net charge remains zero.")}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4 mt-6 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                    <h4 className="font-bold text-red-400 text-xs uppercase">Simulation vs Reality</h4>
                                    <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                                        <li><strong>Momentum Conservation:</strong> {renderText("In reality, a single photon in a vacuum cannot spontaneously split because momentum would not be conserved (light has momentum, but a stationary pair has zero). Real pair production requires a nearby heavy nucleus to absorb the kick. In SimChem 3D, we allow vacuum production for gameplay.")}</li>
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
                                <p className="text-base text-gray-300 leading-relaxed">{renderText("Our sensors detect that the individual Quarks you produced are extremely unstable. They vanish almost immediately after creation. This suggests a fundamental rule of the universe is preventing isolated 'colored' particles from existing.")}</p>
                                <div className="bg-black/40 p-5 rounded border border-violet-500/20">
                                    <strong className="text-white text-sm block mb-3 uppercase tracking-wider">Research Proposal</strong>
                                    <p className="text-sm text-gray-300">{renderText("We hypothesize that Quarks carry a hidden charge—let's call it 'Color Charge'—that must be neutralized to form stable matter. Just as Red, Green, and Blue light mix to make White, perhaps Quarks must be combined in specific triplets to become 'Color Neutral'.")}</p>
                                    
                                    <div className="mt-4 pt-4 border-t border-violet-500/20">
                                        <strong className="text-violet-400 text-xs uppercase block mb-1">Experiment</strong>
                                        <p className="text-sm text-gray-300">{renderText("Use the Energy Tool to spawn multiple")} <strong>Quarks</strong> {renderText("(Up or Down) in rapid succession at the exact same location. Try to assemble a triplet before they decay. We believe a combination of Ups and Downs might yield a stable Nucleon.")}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-violet-500/10 p-4 rounded border-l-4 border-violet-500">
                                    <h4 className="font-bold text-violet-300 text-sm uppercase mb-1">Mechanism Verified</h4>
                                    <p className="text-white font-bold">Baryon Genesis (Hadronization)</p>
                                </div>

                                <p className="text-sm text-gray-300">{renderText("You have successfully bound Quarks into a stable Baryon (Proton or Neutron). This process, known as Hadronization, is the genesis of all nuclear matter.")}</p>

                                <div className="flex justify-center py-4">
                                    <svg viewBox="0 0 300 140" className="w-full max-w-sm border border-violet-500/30 rounded bg-black/50">
                                        <defs>
                                            <marker id="gluon-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#FFD700"/></marker>
                                        </defs>
                                        
                                        {/* Background Field */}
                                        <circle cx="150" cy="70" r="50" fill="radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0) 70%)" />
                                        <circle cx="150" cy="70" r="45" fill="none" stroke="white" strokeDasharray="3 3" opacity="0.3" strokeWidth="1" />

                                        {/* Gluon Strings (Flux Tubes) */}
                                        <path d="M 150 30 Q 130 50 110 90" stroke="#FFD700" strokeWidth="3" fill="none" strokeDasharray="4 2" className="animate-pulse" />
                                        <path d="M 110 90 Q 150 110 190 90" stroke="#FFD700" strokeWidth="3" fill="none" strokeDasharray="4 2" className="animate-pulse" />
                                        <path d="M 190 90 Q 170 50 150 30" stroke="#FFD700" strokeWidth="3" fill="none" strokeDasharray="4 2" className="animate-pulse" />

                                        {/* Quarks with Colors */}
                                        <g transform="translate(150, 30)">
                                            <circle r="14" fill="#FF3333" stroke="white" strokeWidth="2" />
                                            <text y="4" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">u</text>
                                            <text y="-18" textAnchor="middle" fill="#FF3333" fontSize="8" fontWeight="bold">RED</text>
                                        </g>
                                        
                                        <g transform="translate(110, 90)">
                                            <circle r="14" fill="#00FF33" stroke="white" strokeWidth="2" />
                                            <text y="4" textAnchor="middle" fill="black" fontSize="10" fontWeight="bold">u</text>
                                            <text y="24" textAnchor="middle" fill="#00FF33" fontSize="8" fontWeight="bold">GREEN</text>
                                        </g>
                                        
                                        <g transform="translate(190, 90)">
                                            <circle r="14" fill="#3388FF" stroke="white" strokeWidth="2" />
                                            <text y="4" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">d</text>
                                            <text y="24" textAnchor="middle" fill="#3388FF" fontSize="8" fontWeight="bold">BLUE</text>
                                        </g>

                                        <text x="150" y="130" textAnchor="middle" fill="white" fontSize="10" opacity="0.8">Color Neutral Proton (Red + Green + Blue = White)</text>
                                    </svg>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                                        <h4 className="font-bold text-white text-sm uppercase mb-2 border-b border-gray-700 pb-1">How it Works in the Lab</h4>
                                        <p className="text-sm text-gray-300">When you spawn 3 Quarks (a mix of Up and Down) within close proximity, the simulation's Strong Force solver activates. It snaps them together into a single composite particle—a Nucleon. Momentum is conserved, so the new particle inherits the average velocity of its constituents.</p>
                                    </div>

                                    <h4 className="font-bold text-white border-b border-gray-700 pb-2 mt-6 text-lg">Deep Dive: Quantum Chromodynamics (QCD)</h4>
                                    
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong className="text-violet-400 block mb-1">Color Charge & Confinement</strong> 
                                            {renderText("Quarks possess a property called 'Color' (Red, Green, Blue). Nature imposes a strict law called 'Color Confinement': the net color of any isolated particle must be White (Neutral). This is why you cannot hold a single Quark; it would be like trying to hold a magnet with only a North pole.")}
                                        </p>
                                        
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong className="text-violet-400 block mb-1">The Strong Force & Flux Tubes</strong> 
                                            {renderText("Quarks exchange force carriers called Gluons. Unlike photons (which are electrically neutral), Gluons themselves carry color charge. This means Gluons attract other Gluons. As a result, the force field doesn't spread out like magnetism; it tightens into a narrow 'Flux Tube' or string connecting the quarks.")}
                                        </p>
                                        
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong className="text-violet-400 block mb-1">The Rubber Band Effect</strong> 
                                            {renderText("This flux tube behaves like a rubber band with 16 tons of tension. As you pull quarks apart, the energy stored in the stretched tube increases linearly. Eventually, it becomes energetically favorable to rip a new quark-antiquark pair out of the vacuum ($E=mc^2$) to snap the string, rather than stretching it further.")}
                                        </p>
                                        
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong className="text-violet-400 block mb-1">Mass is Energy</strong> 
                                            {renderText("A Proton weighs ~938 MeV, yet the three Quarks inside weigh only ~9 MeV combined. Where does the other 99% come from? It is pure Binding Energy trapped in the gluon field. You are literally made of frozen energy.")}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4 mt-6 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                    <h4 className="font-bold text-red-400 text-xs uppercase">Simulation vs Reality</h4>
                                    <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                                        <li><strong>Mesons:</strong> {renderText("In reality, a Quark and an Antiquark can also form a color-neutral pair called a 'Meson' (e.g., a Pion). In this simulation, we focus specifically on Baryons (3-quark states) to facilitate the construction of atomic nuclei.")}</li>
                                        <li><strong>Jets:</strong> {renderText("In high-energy physics experiments (like the LHC), pulling a quark out doesn't just create one pair; it creates a 'Jet'—a cone of dozens of hadrons sprayed in the direction of momentum. We simulate this simply as rapid decay for isolated quarks.")}</li>
                                        <li><strong>Asymptotic Freedom:</strong> {renderText("We do not simulate the complex weakening of the strong force at extremely short distances; quarks in the simulation are either 'bound' or 'free'.")}</li>
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
                                <p className="text-base text-gray-300 leading-relaxed">{renderText("To create elements heavier than Hydrogen, you must overcome the Coulomb Barrier. Protons are positively charged and repel each other with significant force. Smashing them together directly is difficult and requires immense energy (Fusion).")}</p>
                                <div className="bg-black/40 p-5 rounded border border-orange-500/20">
                                    <strong className="text-white text-sm block mb-3 uppercase tracking-wider">Research Proposal</strong>
                                    <p className="text-sm text-gray-300 mb-2">{renderText("You have access to a particle with mass but no electric charge: the Neutron. It can act as a 'Trojan Horse' to slip past the electric defenses of the nucleus.")}</p>
                                    <ol className="text-sm text-gray-400 list-decimal list-inside space-y-2 mt-3">
                                        <li>{renderText("Select a Proton.")}</li>
                                        <li>{renderText("Launch a Neutron at it using the throw mechanic.")}</li>
                                        <li>{renderText("Observe how the Neutron binds via the Nuclear Force.")}</li>
                                        <li>{renderText("Continue adding Neutrons until the nucleus becomes unstable.")}</li>
                                    </ol>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-orange-500/10 p-4 rounded border-l-4 border-orange-500">
                                    <h4 className="font-bold text-orange-300 text-sm uppercase mb-1">Mechanism Verified</h4>
                                    <p className="text-white font-bold">Neutron Capture & Transmutation</p>
                                </div>

                                <p className="text-sm text-gray-300">{renderText("You have synthesized a heavier element! By adding Neutrons to a nucleus, you increased its mass. Eventually, the nucleus became unstable and underwent Beta Decay, converting a Neutron into a Proton. This increased the Atomic Number (Z), creating a new chemical element.")}</p>

                                <div className="flex justify-center py-4">
                                    <svg viewBox="0 0 320 160" className="w-full max-w-sm border border-orange-500/30 rounded bg-black/50">
                                        <defs>
                                            <marker id="arrow-sm" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#fff"/></marker>
                                        </defs>
                                        
                                        {/* Step 1: Neutron (udd) */}
                                        <g transform="translate(50, 80)">
                                            <circle r="25" fill="#3333FF" opacity="0.2" stroke="#3333FF" strokeWidth="2" strokeDasharray="3 3"/>
                                            <circle cx="0" cy="-10" r="6" fill="#0088FF"><title>d</title></circle>
                                            <circle cx="-10" cy="10" r="6" fill="#0088FF"><title>d</title></circle>
                                            <circle cx="10" cy="10" r="6" fill="#FF3333"><title>u</title></circle>
                                            <text y="40" textAnchor="middle" fill="#3333FF" fontSize="10" fontWeight="bold">Neutron</text>
                                        </g>

                                        {/* Weak Force Interaction */}
                                        <path d="M 85 80 L 135 80" stroke="orange" strokeWidth="2" markerEnd="url(#arrow-sm)" />
                                        <text x="110" y="70" textAnchor="middle" fill="orange" fontSize="10" fontWeight="bold">Weak Force</text>
                                        <text x="110" y="95" textAnchor="middle" fill="white" fontSize="8">d → u</text>

                                        {/* Step 2: Proton (uud) + Ejections */}
                                        <g transform="translate(170, 80)">
                                            <circle r="25" fill="#FF3333" opacity="0.2" stroke="#FF3333" strokeWidth="2"/>
                                            <circle cx="0" cy="-10" r="6" fill="#FF3333"><title>u</title></circle>
                                            <circle cx="-10" cy="10" r="6" fill="#FF3333"><title>u</title></circle>
                                            <circle cx="10" cy="10" r="6" fill="#0088FF"><title>d</title></circle>
                                            <text y="40" textAnchor="middle" fill="#FF3333" fontSize="10" fontWeight="bold">Proton</text>
                                        </g>

                                        {/* Ejected Particles */}
                                        <path d="M 200 70 L 260 40" stroke="#FFFFFF" strokeWidth="1" markerEnd="url(#arrow-sm)" strokeDasharray="2 2"/>
                                        <circle cx="265" cy="38" r="3" fill="white" />
                                        <text x="275" y="42" fill="white" fontSize="10">e⁻</text>

                                        <path d="M 200 90 L 260 120" stroke="#AAAAAA" strokeWidth="1" markerEnd="url(#arrow-sm)" strokeDasharray="2 2"/>
                                        <text x="265" y="125" fill="#AAAAAA" fontSize="10">ν</text>
                                    </svg>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="font-bold text-white border-b border-gray-700 pb-2 mt-6 text-lg">Deep Dive: The Nuclear Lattice</h4>
                                    
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong className="text-orange-400 block mb-1">The Battle of Forces</strong> 
                                            {renderText("The atomic nucleus is a battleground between two primal forces. Electromagnetism causes Protons to repel each other with infinite range. The Nuclear Force (Residual Strong Force) attracts Nucleons together but has a very short range (~2 femtometers).")}
                                        </p>
                                        
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong className="text-orange-400 block mb-1">The Role of Neutrons</strong> 
                                            {renderText("Neutrons act as the buffer and the glue. They attract neighbors via the Nuclear Force but, having no charge, do not contribute to the electric repulsion. To keep a heavy nucleus from flying apart, you need more glue than charge. This is why heavy elements have more neutrons than protons (e.g., Gold has 79 protons but 118 neutrons).")}
                                        </p>
                                        
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong className="text-orange-400 block mb-1">Beta Decay: Nature's Alchemy</strong> 
                                            {renderText("When a nucleus has too many neutrons, it occupies a high-energy state. Nature seeks the lowest energy state. The Weak Force intervenes, allowing a Down Quark inside a Neutron to spontaneously flip into an Up Quark. This turns the Neutron (udd) into a Proton (uud). To conserve charge, an Electron is ejected. This moves the element one step up the Periodic Table.")}
                                        </p>

                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong className="text-orange-400 block mb-1">Valley of Stability</strong> 
                                            {renderText("Stable isotopes sit in a deep energy 'valley'. Unstable ones are high up the hillsides. Radioactive Decay is the process of rolling down the hill. Too many neutrons? Beta Decay. Too many protons? Electron Capture. Too heavy overall? Alpha Decay or Spontaneous Fission.")}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4 mt-6 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                    <h4 className="font-bold text-red-400 text-xs uppercase">Simulation vs Reality</h4>
                                    <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                                        <li><strong>The Time Scale Problem:</strong> {renderText("In reality, neutron capture is slow (s-process) or rapid (r-process). Beta decay can take milliseconds or billions of years. In SimChem 3D, we accelerate these probabilities so you can witness evolution in real-time.")}</li>
                                        <li><strong>Tunneling:</strong> {renderText("Real fusion relies on Quantum Tunneling to bypass the Coulomb Barrier even without sufficient energy. Our engine uses a classical collision model with a velocity threshold.")}</li>
                                        <li><strong>Gamma Rays:</strong> {renderText("Real nuclear transitions emit high-energy Photons (Gamma Rays). To keep the visual space clean, we mostly visualize the particle ejecta and show energy release as thermal motion.")}</li>
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
                                    <p className="text-xs text-blue-400 mt-1 italic">{renderText("Successful bonding will unlock advanced assembly tools.")}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-green-500/10 p-4 rounded border-l-4 border-green-500">
                                    <h4 className="font-bold text-green-300 text-sm uppercase mb-1">Mechanism Verified</h4>
                                    <p className="text-white font-bold">Covalent Bonding & VSEPR Theory</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                                        <h4 className="font-bold text-white text-sm uppercase mb-2 border-b border-gray-700 pb-1">Dual Bonding Modes</h4>
                                        <div className="grid grid-cols-1 gap-4 text-sm text-gray-300">
                                            <div>
                                                <strong className="text-green-400 block">1. Collision Bonding</strong>
                                                <p>Atoms with open valence slots will naturally snap together if they collide with moderate energy. If the collision is too violent, they bounce; too slow, they drift apart.</p>
                                            </div>
                                            <div>
                                                <strong className="text-purple-400 block">2. Lasso Assembly (Nano-Assembler)</strong>
                                                <p>{renderText("The Lasso Tool acts as a high-tech assembler. Select a group of atoms, and the system will calculate the optimal energy configuration (Greedy Fill Algorithm) to rearrange them into known Molecules instantly.")}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-center py-4 my-2">
                                        <svg viewBox="0 0 300 140" className="w-full max-w-sm border border-green-500/30 rounded bg-black/50">
                                            <defs>
                                                <radialGradient id="s-orb" cx="50%" cy="50%" r="50%">
                                                    <stop offset="0%" stopColor="rgba(0,255,0,0.8)" />
                                                    <stop offset="100%" stopColor="rgba(0,255,0,0)" />
                                                </radialGradient>
                                                <radialGradient id="p-orb" cx="50%" cy="50%" r="50%">
                                                    <stop offset="0%" stopColor="rgba(255,100,100,0.8)" />
                                                    <stop offset="100%" stopColor="rgba(255,100,100,0)" />
                                                </radialGradient>
                                            </defs>
                                            
                                            {/* s-s overlap */}
                                            <g transform="translate(60, 70)">
                                                <circle r="20" cx="-15" cy="0" fill="url(#s-orb)" />
                                                <circle r="20" cx="15" cy="0" fill="url(#s-orb)" />
                                                <text y="40" fill="white" fontSize="10" textAnchor="middle">s-s overlap (H₂)</text>
                                            </g>

                                            {/* p-p overlap */}
                                            <g transform="translate(220, 70)">
                                                {/* Left P */}
                                                <ellipse cx="-20" cy="0" rx="25" ry="12" fill="url(#p-orb)" />
                                                {/* Right P */}
                                                <ellipse cx="20" cy="0" rx="25" ry="12" fill="url(#p-orb)" />
                                                <text y="40" fill="white" fontSize="10" textAnchor="middle">p-p overlap (Sigma)</text>
                                            </g>
                                            
                                            <text x="150" y="20" fill="white" fontSize="12" textAnchor="middle" fontWeight="bold">Orbital Hybridization & Overlap</text>
                                        </svg>
                                    </div>

                                    <h4 className="font-bold text-white border-b border-gray-700 pb-2 mt-6 text-lg">Deep Dive: Quantum Chemistry</h4>
                                    
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong className="text-green-400 block mb-1">The Wave Nature of Electrons</strong> 
                                            {renderText("Electrons are not planets orbiting a nucleus; they are standing waves described by the Schrödinger Equation. When two atoms approach, their wavefunctions can overlap. If the waves interfere constructively (peaks align), electron density concentrates between the nuclei, pulling them together. This 'Negative Glue' is a Covalent Bond.")}
                                        </p>
                                        
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong className="text-green-400 block mb-1">Hybridization (The Methane Mystery)</strong> 
                                            {renderText("Carbon has 2 s-electrons and 2 p-electrons. Logic suggests it should form 2 different types of bonds. But Methane (CH₄) has 4 identical bonds. Why? Carbon promotes an electron and mixes the s and p orbitals mathematically to form 4 identical 'sp³ hybrid' orbitals. This is why organic chemistry is so versatile.")}
                                        </p>

                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong className="text-green-400 block mb-1">Sigma vs Pi Bonds</strong> 
                                            {renderText("The first bond formed is always a Sigma Bond (head-on overlap), which is strong and rotatable. Double and Triple bonds add Pi Bonds (sideways overlap). Pi bonds are weaker and prevent rotation, locking molecules into flat shapes (like Ethylene).")}
                                        </p>

                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            <strong className="text-green-400 block mb-1">VSEPR & Lone Pairs</strong> 
                                            {renderText("Valence Shell Electron Pair Repulsion theory dictates shape. Electrons repel each other. A Lone Pair (unbonded electrons) is 'fatter' than a bonding pair. In Water (H₂O), the two lone pairs on Oxygen push the Hydrogen bonds closer together, bending the angle from a perfect 109.5° (Tetrahedral) down to 104.5°.")}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4 mt-6 bg-gray-900 p-4 rounded border-l-2 border-red-500">
                                    <h4 className="font-bold text-red-400 text-xs uppercase">Simulation vs Reality</h4>
                                    <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                                        <li><strong>Spring Physics:</strong> {renderText("We model bonds as damped harmonic oscillators (springs) to visualize their rigidity and vibration. In reality, bonds are quantum potential wells, not mechanical parts.")}</li>
                                        <li><strong>Hard Spheres:</strong> {renderText("The simulation treats atoms as solid spheres with a defined radius. Real atoms are fuzzy probability clouds that can overlap significantly.")}</li>
                                        <li><strong>Explicit VSEPR:</strong> {renderText("In reality, molecular shape emerges naturally from electrostatic minimization. We apply explicit angular forces to 'enforce' correct geometry for educational clarity.")}</li>
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