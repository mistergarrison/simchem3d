import React from 'react';

interface AddEntityButtonsProps {
    onOpenStandardModel: () => void;
    onOpenTable: () => void;
    onOpenMolecules: () => void;
    onClose?: () => void;
    canOpenParticles: boolean;
    canOpenAtoms: boolean;
    canOpenMolecules: boolean;
    newlyUnlocked: { particles: boolean, elements: boolean, molecules: boolean };
}

export const AddEntityButtons: React.FC<AddEntityButtonsProps> = ({ 
    onOpenStandardModel, 
    onOpenTable, 
    onOpenMolecules, 
    onClose, 
    canOpenParticles, 
    canOpenAtoms, 
    canOpenMolecules, 
    newlyUnlocked 
}) => {
    const handle = (fn: () => void) => {
        fn();
        if (onClose) onClose();
    };

    return (
        <div className="grid grid-cols-3 gap-1">
            <button 
                onClick={() => canOpenParticles && handle(onOpenStandardModel)} 
                disabled={!canOpenParticles}
                className={`relative py-2 border rounded text-xs flex flex-col items-center gap-1 group transition-colors overflow-hidden
                    ${canOpenParticles 
                        ? 'bg-gray-900 hover:bg-gray-800 border-gray-700' 
                        : 'bg-gray-900/50 border-gray-800 opacity-50 cursor-not-allowed'}
                    ${newlyUnlocked.particles ? 'shimmer-halo' : ''}
                `}
            >
                <span className={`text-lg transition-transform ${canOpenParticles ? 'text-pink-400 group-hover:scale-110' : 'text-gray-600'}`}>
                    {canOpenParticles ? '✨' : '🔒'}
                </span> 
                <span className="font-semibold text-gray-300">Part</span>
            </button>

            <button 
                onClick={() => canOpenAtoms && handle(onOpenTable)}
                disabled={!canOpenAtoms} 
                className={`relative py-2 border rounded text-xs flex flex-col items-center gap-1 group transition-colors overflow-hidden
                    ${canOpenAtoms 
                        ? 'bg-gray-900 hover:bg-gray-800 border-gray-700' 
                        : 'bg-gray-900/50 border-gray-800 opacity-50 cursor-not-allowed'}
                    ${newlyUnlocked.elements ? 'shimmer-halo' : ''}
                `}
            >
                <span className={`text-lg transition-transform ${canOpenAtoms ? 'text-blue-400 group-hover:scale-110' : 'text-gray-600'}`}>
                    {canOpenAtoms ? '⚛️' : '🔒'}
                </span> 
                <span className="font-semibold text-gray-300">Atom</span>
            </button>

            <button 
                onClick={() => canOpenMolecules && handle(onOpenMolecules)}
                disabled={!canOpenMolecules} 
                className={`relative py-2 border rounded text-xs flex flex-col items-center gap-1 group transition-colors overflow-hidden
                    ${canOpenMolecules 
                        ? 'bg-gray-900 hover:bg-gray-800 border-gray-700' 
                        : 'bg-gray-900/50 border-gray-800 opacity-50 cursor-not-allowed'}
                    ${newlyUnlocked.molecules ? 'shimmer-halo' : ''}
                `}
            >
                <span className={`text-lg transition-transform ${canOpenMolecules ? 'text-purple-400 group-hover:scale-110' : 'text-gray-600'}`}>
                    {canOpenMolecules ? '⚗️' : '🔒'}
                </span> 
                <span className="font-semibold text-gray-300">Mol</span>
            </button>
        </div>
    );
};