import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ColliderPhase } from '../../types/ui';
import { COLLIDER_TECH_TREE } from '../../game/Progression';

interface ColliderStatusProps {
    phase: ColliderPhase;
    gameMode: 'sandbox' | 'discovery';
    className?: string;
}

interface PhaseInfo {
    status: string;
    next: string;
    why: string;
}

const PHASE_DETAILS: Record<number, PhaseInfo> = {
    0: {
        status: "System Initialization complete. Vacuum background levels nominal.",
        next: "Detect Electron Neutrino (νe)",
        why: "We must calibrate the detector's sensitivity to the Weak Force before we can safely ramp up energy. The Electron Neutrino is the lightest target signature available."
    },
    1: {
        status: "First Generation Lepton detection confirmed. Beam stability holding.",
        next: "Detect Muon Neutrino (νμ)",
        why: "Muon Neutrinos signal the presence of high-energy Second Generation matter processes. Detecting one proves the collider can sustain the energy density required for heavier particle synthesis."
    },
    2: {
        status: "Lepton sectors operational. Hadronic calorimeter online.",
        next: "Synthesize a Nucleon (Proton or Neutron)",
        why: "Quarks cannot exist in isolation due to Color Confinement. To advance, you must spawn Quarks (u/d) and bind them into a stable Hadron (uud/udd) before they decay. This demonstrates mastery of the Strong Force."
    },
    3: {
        status: "Stable Hadronic matter achieved. Cooling systems holding.",
        next: "Synthesize Beryllium (Be)",
        why: "To forge heavy elements, we must overcome the Coulomb Barrier (electrostatic repulsion). Accelerating nucleons to collision velocities requires the higher energy ceiling provided by the Phase 3 upgrade."
    },
    4: {
        status: "Nuclear fusion and capture protocols verified.",
        next: "Synthesize Water (H₂O)",
        why: "We are moving from nuclear physics to chemistry. Water requires precise orbital bonding and charge neutralization. Synthesizing it proves we can control electron shell interactions."
    },
    5: {
        status: "Chemistry module active. Solvent systems operational.",
        next: "Synthesize Nitrogen Gas (N₂)",
        why: "Nitrogen Gas contains a triple bond, one of the strongest in nature (945 kJ/mol). Successfully creating it tests the stability of our bonding algorithms under high-stress conditions."
    },
    6: {
        status: "High-field superconducting magnets operational.",
        next: "Synthesize Benzene (C₆H₆) AND Silane (SiH₄)",
        why: "This step bridges organic and inorganic chemistry. Benzene's aromatic ring and Silane's pyrophoric hydride structure represent the pinnacle of molecular complexity required to unlock the final energy tiers."
    },
    7: {
        status: "Approaching heavy ion collision energies.",
        next: "Synthesize Gold (Au) AND Lead (Pb)",
        why: "These superheavy elements lie at the end of the nuclear s-process. Creating them requires massive neutron flux and extended beta-decay chains, testing the ultimate limits of the simulation's nuclear physics engine."
    },
    8: {
        status: "Maximum theoretical output achieved.",
        next: "Endgame / Sandbox",
        why: "You have mastered the Standard Model and the Periodic Table. The facility is operating at 14 TeV capacity."
    }
};

const ColliderVisual = ({ phaseId }: { phaseId: number }) => {
    // 0: Vacuum (Gray/Cyan)
    // 1: Linac (Orange/Silver)
    // 2: Cyclotron (Copper/Blue)
    // 3: Synchrotron (Purple/Green)
    // 4: Storage Ring (Yellow/Red)
    // 5: Cryo (Ice Blue/White)
    // 6: Superconductor (Deep Blue/Neon)
    // 7: Heavy Ion (Red/Gold)
    // 8: LHC (Rainbow/Tech)

    const renderPhaseContent = () => {
        const cx = 150, cy = 75;
        
        switch (phaseId) {
            case 0: // Vacuum Chamber
                return (
                    <g>
                        {/* Background Tech */}
                        <path d="M 50 120 L 50 30 L 250 30 L 250 120" fill="none" stroke="#334" strokeWidth="2" />
                        <rect x="70" y="40" width="160" height="80" rx="10" fill="url(#gradMetal)" stroke="#556" strokeWidth="2" />
                        
                        {/* Porthole */}
                        <circle cx="150" cy="80" r="30" fill="url(#gradGlass)" stroke="#889" strokeWidth="4" />
                        <circle cx="150" cy="80" r="25" fill="none" stroke="#fff" strokeOpacity="0.2" strokeWidth="1" />
                        
                        {/* Internal Glow */}
                        <circle cx="150" cy="80" r="10" fill="#0ff" filter="url(#glowStrong)" opacity="0.5">
                            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" />
                        </circle>

                        {/* Pumps/Pipes */}
                        <path d="M 110 120 L 110 140 M 190 120 L 190 140" stroke="#667" strokeWidth="8" />
                        <rect x="100" y="130" width="20" height="20" fill="#223" />
                        <rect x="180" y="130" width="20" height="20" fill="#223" />
                        
                        {/* Status LEDs */}
                        <circle cx="85" cy="55" r="3" fill="#0f0" filter="url(#glow)" />
                        <circle cx="85" cy="65" r="3" fill="#300" />
                        <circle cx="85" cy="75" r="3" fill="#300" />

                        <text x="215" y="55" fill="#0ff" fontSize="8" fontFamily="monospace">VAC: 10e-9</text>
                        <text x="150" y="145" fill="#889" fontSize="10" textAnchor="middle" opacity="0.8">HV Chamber</text>
                    </g>
                );
            case 1: // Linear Accelerator
                return (
                    <g>
                        {/* Perspective Floor */}
                        <path d="M 0 100 L 300 100" stroke="#333" strokeWidth="1" />
                        <path d="M 150 100 L 150 150" stroke="#333" strokeWidth="1" />
                        
                        {/* Beamline Perspective */}
                        <path d="M 20 80 L 280 80" stroke="url(#gradBeam)" strokeWidth="4" filter="url(#glow)" />
                        
                        {/* Drift Tubes - Increasingly spaced */}
                        {[30, 60, 100, 150, 210, 280].map((x, i) => (
                            <g key={i}>
                                <rect x={x - 10} y={65} width="20" height="30" fill="url(#gradCopper)" stroke="#b87333" rx="2" />
                                <rect x={x - 5} y={60} width="10" height="5" fill="#444" />
                                <path d={`M ${x} 60 L ${x} 40`} stroke="#666" strokeWidth="2" />
                                <circle cx={x} cy={35} r="3" fill="#f00" opacity={i % 2 === 0 ? 1 : 0.3} />
                            </g>
                        ))}

                        {/* RF Waveguide */}
                        <path d="M 0 30 L 300 30" stroke="#445" strokeWidth="6" />
                        <text x="150" y="20" fill="#f80" fontSize="10" textAnchor="middle" fontWeight="bold">RF LINAC • 500 keV</text>
                    </g>
                );
            case 2: // Cyclotron
                return (
                    <g>
                        {/* Magnet Yoke */}
                        <rect x="50" y="20" width="200" height="110" rx="20" fill="#223" stroke="#445" strokeWidth="2" />
                        <circle cx="150" cy="75" r="50" fill="#112" stroke="#000" strokeWidth="2" />
                        
                        {/* Dees */}
                        <path d="M 148 35 A 40 40 0 0 0 148 115 Z" fill="url(#gradCopper)" opacity="0.8" />
                        <path d="M 152 35 A 40 40 0 0 1 152 115 Z" fill="url(#gradCopper)" opacity="0.8" />
                        
                        {/* Spiral Beam */}
                        <path d="M 150 75 
                                 q 5 -5 10 0 
                                 q -5 15 -20 0
                                 q 10 -25 35 0
                                 q -20 40 -55 0
                                 q 30 -55 80 0
                                 " fill="none" stroke="#0ff" strokeWidth="2" filter="url(#glowStrong)" strokeLinecap="round" />
                        
                        {/* Extraction Line */}
                        <line x1="230" y1="75" x2="280" y2="75" stroke="#0ff" strokeWidth="2" strokeDasharray="4 2" />
                        <text x="260" y="65" fill="#0ff" fontSize="8">EXTRACT</text>

                        {/* RF Oscillation Symbol */}
                        <path d="M 130 130 L 170 130 M 130 140 L 170 140" stroke="#f80" strokeWidth="2" />
                        <path d="M 140 135 L 160 135" stroke="#f80" strokeWidth="2" />
                        <text x="150" y="15" fill="#b87333" fontSize="10" textAnchor="middle" fontWeight="bold">CYCLOTRON</text>
                    </g>
                );
            case 3: // Synchrotron
                return (
                    <g>
                        {/* Tunnel Walls */}
                        <ellipse cx="150" cy="75" rx="130" ry="60" fill="none" stroke="#333" strokeWidth="20" />
                        
                        {/* Beam Pipe */}
                        <ellipse cx="150" cy="75" rx="130" ry="60" fill="none" stroke="#88f" strokeWidth="3" filter="url(#glow)" />
                        
                        {/* Magnets */}
                        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
                            const rad = deg * Math.PI / 180;
                            const x = 150 + Math.cos(rad) * 130;
                            const y = 75 + Math.sin(rad) * 60;
                            const isQuad = i % 3 === 0;
                            return (
                                <g key={i} transform={`translate(${x},${y}) rotate(${deg + 90})`}>
                                    <rect x="-6" y="-6" width="12" height="12" fill={isQuad ? "#f0f" : "#00f"} stroke="white" strokeWidth="1" />
                                    {isQuad && <line x1="-6" y1="-6" x2="6" y2="6" stroke="#fff" opacity="0.5" />}
                                </g>
                            )
                        })}
                        
                        {/* RF Cavity */}
                        <rect x="140" y="10" width="20" height="10" fill="#silver" stroke="white" />
                        <text x="150" y="145" fill="#88f" fontSize="10" textAnchor="middle" fontWeight="bold">SYNCHROTRON RING</text>
                        
                        {/* Particles */}
                        <circle cx="20" cy="75" r="4" fill="white" filter="url(#glow)">
                            <animateMotion dur="2s" repeatCount="indefinite" path="M 130 0 A 130 60 0 1 1 129.9 0" />
                        </circle>
                    </g>
                );
            case 4: // Storage Ring
                return (
                    <g>
                        <ellipse cx="150" cy="75" rx="120" ry="50" fill="none" stroke="#444" strokeWidth="4" />
                        <ellipse cx="150" cy="75" rx="120" ry="50" fill="none" stroke="#ff0" strokeWidth="2" strokeDasharray="10 5" filter="url(#glow)" />
                        
                        {/* Injection Kicker */}
                        <path d="M 30 75 L 10 100" stroke="#f00" strokeWidth="2" markerEnd="url(#arrow)" />
                        <rect x="25" y="70" width="10" height="10" fill="#f00" />
                        
                        {/* Beam Profile Graph */}
                        <g transform="translate(220, 20)">
                            <rect width="60" height="40" fill="#000" stroke="#0f0" />
                            <path d="M 0 35 Q 30 5 60 35" stroke="#0f0" fill="none" />
                            <text x="30" y="10" fill="#0f0" fontSize="6" textAnchor="middle">LUMINOSITY</text>
                        </g>

                        <text x="150" y="75" fill="#ff0" fontSize="12" textAnchor="middle" opacity="0.3" fontWeight="bold">STORAGE MODE</text>
                        
                        {/* Quadrupoles */}
                        <circle cx="150" cy="25" r="5" fill="#f0f" />
                        <circle cx="150" cy="125" r="5" fill="#f0f" />
                        <circle cx="30" cy="75" r="5" fill="#f0f" />
                        <circle cx="270" cy="75" r="5" fill="#f0f" />
                    </g>
                );
            case 5: // Cryogenics
                return (
                    <g>
                        {/* Tanks */}
                        <defs>
                            <linearGradient id="gradCryo" x1="0" x2="1" y1="0" y2="0">
                                <stop offset="0%" stopColor="#889" />
                                <stop offset="50%" stopColor="#eef" />
                                <stop offset="100%" stopColor="#889" />
                            </linearGradient>
                        </defs>
                        <rect x="40" y="30" width="40" height="80" rx="5" fill="url(#gradCryo)" />
                        <rect x="220" y="30" width="40" height="80" rx="5" fill="url(#gradCryo)" />
                        
                        <text x="60" y="70" fill="#00f" fontSize="10" textAnchor="middle" transform="rotate(-90 60 70)">L-He</text>
                        <text x="240" y="70" fill="#00f" fontSize="10" textAnchor="middle" transform="rotate(-90 240 70)">L-N2</text>

                        {/* Pipes */}
                        <path d="M 80 50 L 220 50" stroke="#0af" strokeWidth="6" />
                        <path d="M 80 90 L 220 90" stroke="#0af" strokeWidth="6" />
                        
                        {/* Frost/Cold Effect */}
                        <path d="M 100 50 L 200 50" stroke="#fff" strokeWidth="2" strokeDasharray="2 4" filter="url(#glow)" opacity="0.5" />
                        <path d="M 100 90 L 200 90" stroke="#fff" strokeWidth="2" strokeDasharray="2 4" filter="url(#glow)" opacity="0.5" />

                        {/* Gauge */}
                        <circle cx="150" cy="70" r="15" fill="#fff" stroke="#000" />
                        <line x1="150" y1="70" x2="140" y2="80" stroke="#f00" strokeWidth="2" />
                        <text x="150" y="100" fill="#0ff" fontSize="12" textAnchor="middle" fontWeight="bold">1.9 K</text>
                        
                        <text x="150" y="20" fill="#0af" fontSize="10" textAnchor="middle">SUPERFLUID HELIUM</text>
                    </g>
                );
            case 6: // Superconductivity
                return (
                    <g>
                        {/* Cross Section of Dipole */}
                        <circle cx="150" cy="75" r="60" fill="#333" stroke="#888" strokeWidth="2" />
                        <circle cx="150" cy="75" r="55" fill="none" stroke="#f00" strokeWidth="1" strokeDasharray="5 5" />
                        
                        {/* Coils */}
                        <path d="M 110 75 A 40 40 0 0 1 190 75" fill="none" stroke="#f80" strokeWidth="15" strokeLinecap="round" />
                        <path d="M 110 75 A 40 40 0 0 0 190 75" fill="none" stroke="#f80" strokeWidth="15" strokeLinecap="round" />
                        
                        {/* Beam Pipes */}
                        <circle cx="130" cy="75" r="5" fill="#000" stroke="#fff" strokeWidth="1" />
                        <circle cx="170" cy="75" r="5" fill="#000" stroke="#fff" strokeWidth="1" />
                        
                        {/* Field Lines */}
                        <path d="M 130 75 Q 150 55 170 75" stroke="#0ff" fill="none" opacity="0.5" />
                        <path d="M 130 75 Q 150 95 170 75" stroke="#0ff" fill="none" opacity="0.5" />
                        <path d="M 130 75 Q 150 35 170 75" stroke="#0ff" fill="none" opacity="0.3" />
                        <path d="M 130 75 Q 150 115 170 75" stroke="#0ff" fill="none" opacity="0.3" />

                        {/* Lightning Arcs */}
                        <path d="M 100 40 L 110 50 L 105 60" stroke="#fff" strokeWidth="1" fill="none" opacity="0.8" />
                        <path d="M 200 110 L 190 100 L 195 90" stroke="#fff" strokeWidth="1" fill="none" opacity="0.8" />

                        <text x="150" y="145" fill="#f80" fontSize="10" textAnchor="middle">8.3 TESLA FIELD</text>
                    </g>
                );
            case 7: // Heavy Ion Detector
                return (
                    <g>
                        {/* Detector Layers */}
                        <circle cx="150" cy="75" r="60" fill="none" stroke="#444" strokeWidth="20" /> {/* Muon Chambers */}
                        <circle cx="150" cy="75" r="40" fill="none" stroke="#800" strokeWidth="10" /> {/* HCAL */}
                        <circle cx="150" cy="75" r="25" fill="none" stroke="#080" strokeWidth="10" /> {/* ECAL */}
                        <circle cx="150" cy="75" r="10" fill="#000" stroke="#ff0" strokeWidth="1" /> {/* Tracker */}
                        
                        {/* Particle Tracks */}
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
                            const rad = (deg + Math.random()*20) * Math.PI / 180;
                            const len = 30 + Math.random() * 40;
                            const x2 = 150 + Math.cos(rad) * len;
                            const y2 = 75 + Math.sin(rad) * len;
                            const color = ["#ff0", "#0ff", "#f0f"][i%3];
                            return <line key={i} x1="150" y1="75" x2={x2} y2={y2} stroke={color} strokeWidth="1" opacity="0.8" />
                        })}
                        
                        {/* Energy Deposits */}
                        <rect x="180" y="60" width="5" height="10" fill="#f00" />
                        <rect x="115" y="80" width="5" height="5" fill="#f00" />
                        
                        <text x="150" y="15" fill="#fff" fontSize="10" textAnchor="middle" fontWeight="bold">HEAVY ION COLLISION</text>
                        <text x="250" y="75" fill="#888" fontSize="8">Pb-Pb</text>
                    </g>
                );
            case 8: // LHC / Endgame
            default:
                return (
                    <g>
                        {/* Map Background */}
                        <rect x="0" y="0" width="300" height="150" fill="#112" />
                        <path d="M 20 20 L 40 40 L 20 60" stroke="#334" strokeWidth="1" fill="none" />
                        
                        {/* LHC Ring */}
                        <circle cx="180" cy="75" r="60" fill="none" stroke="#fff" strokeWidth="3" filter="url(#glow)" />
                        
                        {/* SPS Ring */}
                        <circle cx="100" cy="100" r="25" fill="none" stroke="#88f" strokeWidth="2" />
                        
                        {/* PS Ring */}
                        <circle cx="70" cy="110" r="12" fill="none" stroke="#f80" strokeWidth="1.5" />
                        
                        {/* Booster */}
                        <circle cx="50" cy="115" r="6" fill="none" stroke="#0f0" strokeWidth="1" />
                        
                        {/* Linac */}
                        <line x1="30" y1="125" x2="45" y2="118" stroke="#f0f" strokeWidth="1" />
                        
                        {/* Connections */}
                        <path d="M 70 98 L 85 90" stroke="#aaa" strokeWidth="1" strokeDasharray="2 1" />
                        <path d="M 120 90 L 135 85" stroke="#aaa" strokeWidth="1" strokeDasharray="2 1" />
                        
                        {/* Experiments */}
                        <g transform="translate(180, 15)">
                            <circle r="4" fill="#f00" />
                            <text y="-5" fill="#f00" fontSize="8" textAnchor="middle">ATLAS</text>
                        </g>
                        <g transform="translate(180, 135)">
                            <circle r="4" fill="#f00" />
                            <text y="10" fill="#f00" fontSize="8" textAnchor="middle">CMS</text>
                        </g>
                        <g transform="translate(120, 75)">
                            <circle r="4" fill="#ff0" />
                            <text x="-10" y="2" fill="#ff0" fontSize="8" textAnchor="end">ALICE</text>
                        </g>
                        <g transform="translate(240, 75)">
                            <circle r="4" fill="#0f0" />
                            <text x="10" y="2" fill="#0f0" fontSize="8" textAnchor="start">LHCb</text>
                        </g>

                        <text x="260" y="140" fill="#fff" fontSize="14" fontWeight="bold">14 TeV</text>
                    </g>
                );
        }
    };

    return (
        <svg viewBox="0 0 300 150" className="w-full h-full" style={{ opacity: 1.0 }}>
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                <filter id="glowStrong">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                <linearGradient id="gradMetal" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#889" />
                    <stop offset="50%" stopColor="#ccd" />
                    <stop offset="100%" stopColor="#556" />
                </linearGradient>
                <linearGradient id="gradCopper" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#b87333" />
                    <stop offset="50%" stopColor="#ffc080" />
                    <stop offset="100%" stopColor="#804000" />
                </linearGradient>
                <linearGradient id="gradGlass" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(0,255,255,0.1)" />
                    <stop offset="50%" stopColor="rgba(0,255,255,0.4)" />
                    <stop offset="100%" stopColor="rgba(0,255,255,0.1)" />
                </linearGradient>
                <linearGradient id="gradBeam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="#ffaa00" />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#fff"/>
                </marker>
            </defs>
            
            {/* Background Texture */}
            <rect width="300" height="150" fill="#080810" />
            <path d="M 0 20 H 300 M 0 40 H 300 M 0 60 H 300 M 0 80 H 300 M 0 100 H 300 M 0 120 H 300 M 0 140 H 300" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="1" />
            <path d="M 20 0 V 150 M 40 0 V 150 M 60 0 V 150 M 80 0 V 150 M 100 0 V 150 M 120 0 V 150 M 140 0 V 150 M 160 0 V 150 M 180 0 V 150 M 200 0 V 150 M 220 0 V 150 M 240 0 V 150 M 260 0 V 150 M 280 0 V 150" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="1" />

            {/* Render Content */}
            {renderPhaseContent()}
        </svg>
    )
}

export const ColliderStatus: React.FC<ColliderStatusProps> = ({ phase, gameMode, className }) => {
    const [expanded, setExpanded] = useState(false);

    // In Sandbox mode, we show the completed (MAX) state of the collider logic
    const displayPhase = gameMode === 'sandbox' ? COLLIDER_TECH_TREE[COLLIDER_TECH_TREE.length - 1] : phase;

    const formatCap = (ev: number) => {
        if (ev < 0.001) return `${(ev * 1e6).toFixed(0)} eV`;
        if (ev < 1) return `${(ev * 1000).toFixed(0)} keV`;
        if (ev < 1000) return `${ev.toFixed(1)} MeV`;
        return `${(ev / 1000).toFixed(1)} GeV`;
    };

    const details = PHASE_DETAILS[displayPhase.id] || { status: "Unknown", next: "Unknown", why: "No data." };

    const baseClasses = "bg-gray-900/80 border border-yellow-500/30 rounded-lg shadow-lg backdrop-blur-sm text-left hover:bg-gray-800 transition-colors group relative overflow-hidden flex flex-col justify-center";
    const layoutClasses = className || "w-full px-2 py-1.5 mt-2 min-h-[50px]";

    return (
        <>
            {/* Compact Card */}
            <button 
                onClick={() => setExpanded(true)}
                className={`${baseClasses} ${layoutClasses}`}
                title="Tap for Collider Status"
            >
                <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors" />
                
                <div className="relative z-10 w-full flex flex-col gap-0.5">
                    
                    {/* Row 1: Level */}
                    <div className="text-[9px] text-yellow-500 font-bold uppercase tracking-wider leading-none truncate w-full">
                        Lvl {displayPhase.id} <span className="opacity-50">•</span> {displayPhase.name}
                    </div>

                    {/* Row 2: Next */}
                    <div className="text-[10px] text-gray-300 font-medium truncate leading-tight w-full">
                        {displayPhase.nextUnlock === "Endgame" ? "Max Level Reached" : <><span className="text-gray-500 text-[9px] uppercase font-bold mr-1">Next</span>{displayPhase.nextUnlock}</>}
                    </div>

                    {/* Row 3: Cap */}
                    <div className="flex items-baseline gap-2 leading-none w-full">
                        <span className="text-[9px] text-gray-500 uppercase font-bold">Cap</span>
                        <span className="text-[10px] font-bold text-white font-mono">
                            {gameMode === 'sandbox' ? '∞' : formatCap(displayPhase.capMeV)}
                        </span>
                    </div>

                </div>
            </button>

            {/* Expanded Modal (Portaled to body to escape backdrop-filter constraints on mobile) */}
            {expanded && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={() => setExpanded(false)}>
                    <div 
                        className="bg-gray-950 border border-yellow-500/50 rounded-xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]" 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Decorative Header Background */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-yellow-900/20 to-transparent pointer-events-none" />

                        <div className="p-6 relative z-10 flex flex-col gap-6 overflow-y-auto">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-white tracking-tight">Collider Status</h2>
                                    <div className="text-yellow-500 text-sm font-mono mt-1 uppercase tracking-widest">
                                        Phase {displayPhase.id}: {displayPhase.name}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setExpanded(false)}
                                    className="text-gray-400 hover:text-white p-2 -mr-2 -mt-2"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {/* Visual Representation */}
                            <div className="bg-black/60 rounded-lg border border-gray-800 flex justify-center items-center h-40 overflow-hidden relative shadow-inner">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,0,0.05),_transparent_70%)]" />
                                <ColliderVisual phaseId={displayPhase.id} />
                            </div>

                            {/* Main Stats */}
                            <div className="bg-black/40 rounded-lg p-4 border border-gray-800 flex items-center justify-between">
                                <div>
                                    <div className="text-gray-500 text-xs uppercase mb-1">Current Energy Cap</div>
                                    <div className="text-3xl font-mono text-white font-bold">{gameMode === 'sandbox' ? 'UNLIMITED' : formatCap(displayPhase.capMeV)}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-gray-500 text-xs uppercase mb-1">Output</div>
                                    <div className="text-green-400 text-sm font-bold flex items-center gap-2 justify-end">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        STABLE
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-blue-400 text-xs uppercase font-bold mb-2 flex items-center gap-2">
                                        <span>✅</span> Status Report
                                    </h3>
                                    <p className="text-gray-300 text-sm leading-relaxed bg-blue-900/10 border-l-2 border-blue-500/50 p-3 rounded-r">
                                        {details.status}
                                    </p>
                                </div>

                                {displayPhase.nextUnlock !== "Endgame" && (
                                    <>
                                        <div>
                                            <h3 className="text-yellow-500 text-xs uppercase font-bold mb-2 flex items-center gap-2">
                                                <span>🎯</span> Next Objective
                                            </h3>
                                            <div className="bg-yellow-900/10 border border-yellow-500/20 rounded-lg p-3">
                                                <span className="text-white font-bold block mb-2 text-lg">{displayPhase.nextUnlock}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-purple-400 text-xs uppercase font-bold mb-2 flex items-center gap-2">
                                                <span>🔬</span> Scientific Rationale
                                            </h3>
                                            <p className="text-gray-300 text-sm leading-relaxed bg-purple-900/10 border-l-2 border-purple-500/50 p-3 rounded-r italic">
                                                "{details.why}"
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            <div className="flex justify-end pt-2">
                                <button 
                                    onClick={() => setExpanded(false)}
                                    className="w-full sm:w-auto px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg"
                                >
                                    Acknowledge
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};