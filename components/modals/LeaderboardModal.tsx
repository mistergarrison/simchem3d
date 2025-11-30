
import React, { useEffect, useState } from 'react';

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    score: number;
}

interface LeaderboardEntry {
    name: string;
    score: number;
    timestamp?: string;
}

const API_URL = "https://script.google.com/macros/s/AKfycbw4ekHbnbjOUnf5j7q6k-GW62G3sEkNVOj1qBfdxCwyGCWgsU32au-graLG9aSmPaoGuA/exec";

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, score }) => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [currentPlayerName, setCurrentPlayerName] = useState<string | null>(null);
    
    // New state for name input
    const [showNameInput, setShowNameInput] = useState(false);
    const [inputName, setInputName] = useState('');

    useEffect(() => {
        if (isOpen) {
            const storedName = localStorage.getItem('simchem_player_name');
            if (storedName) {
                setCurrentPlayerName(storedName);
                submitAndFetch(storedName);
            } else {
                setShowNameInput(true);
                setLeaderboard([]);
            }
        }
    }, [isOpen]);

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const nameToUse = inputName.trim() || "Anonymous";
        localStorage.setItem('simchem_player_name', nameToUse);
        setCurrentPlayerName(nameToUse);
        setShowNameInput(false);
        submitAndFetch(nameToUse);
    };

    const submitAndFetch = async (name: string) => {
        setLoading(true);
        setError(false);

        try {
            // 1. Submit Score
            await fetch(API_URL, {
                method: "POST",
                body: JSON.stringify({ name, score }),
                headers: { "Content-Type": "text/plain" }
            });

            // 2. Fetch Leaderboard
            const res = await fetch(API_URL);
            const data: LeaderboardEntry[] = await res.json();

            // Sort descending by score
            const sorted = data.sort((a, b) => b.score - a.score);
            setLeaderboard(sorted);
        } catch (e) {
            console.error("Leaderboard error:", e);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Process data for display
    const top10 = leaderboard.slice(0, 10);
    const userIndex = leaderboard.findIndex(entry => entry.name === currentPlayerName && entry.score === score);
    const userIsInTop10 = userIndex !== -1 && userIndex < 10;
    const userEntry = userIndex !== -1 ? leaderboard[userIndex] : null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-gray-950 border border-yellow-600/50 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-5 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-yellow-500 flex items-center gap-2">
                        <span>🏆</span> Leaderboard
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-xl p-1 transition-colors">&times;</button>
                </div>

                {/* Body */}
                <div className="p-0 overflow-y-auto flex-grow custom-scrollbar">
                    {showNameInput ? (
                        <div className="p-8 flex flex-col items-center gap-4">
                            <p className="text-gray-300 text-center">Enter your name to join the leaderboard.</p>
                            <form onSubmit={handleNameSubmit} className="w-full max-w-xs flex flex-col gap-3">
                                <input 
                                    type="text" 
                                    value={inputName} 
                                    onChange={(e) => setInputName(e.target.value)} 
                                    placeholder="Scientist Name"
                                    className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 outline-none transition-colors text-center font-bold"
                                    autoFocus
                                    maxLength={15}
                                />
                                <button 
                                    type="submit"
                                    disabled={!inputName.trim()}
                                    className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Submit Score
                                </button>
                            </form>
                        </div>
                    ) : loading ? (
                        <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Loading leaderboard...</span>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-400">
                            <p>Connection Error.</p>
                            <p className="text-xs text-gray-500 mt-2">Could not access the mainframe.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-900 text-xs uppercase text-gray-500 font-bold sticky top-0">
                                <tr>
                                    <th className="p-3 pl-5 w-16">Rank</th>
                                    <th className="p-3">Scientist</th>
                                    <th className="p-3 pr-5 text-right">Discoveries</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                                {top10.map((entry, idx) => {
                                    const isMe = entry.name === currentPlayerName;
                                    let rankIcon = `#${idx + 1}`;
                                    if (idx === 0) rankIcon = '🥇';
                                    if (idx === 1) rankIcon = '🥈';
                                    if (idx === 2) rankIcon = '🥉';

                                    return (
                                        <tr key={idx} className={isMe ? 'bg-yellow-900/20' : 'hover:bg-gray-900/30'}>
                                            <td className="p-3 pl-5 font-mono text-gray-500">{rankIcon}</td>
                                            <td className={`p-3 font-bold ${isMe ? 'text-yellow-400' : 'text-white'}`}>
                                                {entry.name}
                                            </td>
                                            <td className="p-3 pr-5 text-right font-mono text-blue-300">{entry.score}</td>
                                        </tr>
                                    );
                                })}

                                {!userIsInTop10 && userEntry && (
                                    <>
                                        <tr>
                                            <td colSpan={3} className="px-4 py-2 bg-gray-900/50 text-center text-xs text-gray-600 tracking-widest uppercase">
                                                ...
                                            </td>
                                        </tr>
                                        <tr className="bg-yellow-900/20 border-l-4 border-yellow-500">
                                            <td className="p-3 pl-4 font-mono text-yellow-500">#{userIndex + 1}</td>
                                            <td className="p-3 font-bold text-yellow-400">{userEntry.name} (You)</td>
                                            <td className="p-3 pr-5 text-right font-mono text-blue-300">{userEntry.score}</td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 bg-gray-900/30 flex justify-between items-center text-xs text-gray-500">
                    <span>Current Score: <span className="text-white font-mono">{score}</span></span>
                    {!showNameInput && (
                        <button 
                            onClick={() => { 
                                localStorage.removeItem('simchem_player_name'); 
                                setShowNameInput(true);
                                setLeaderboard([]);
                            }}
                            className="hover:text-red-400 transition-colors"
                        >
                            Change Name
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
