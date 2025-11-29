
import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentScore: number;
    debugMode?: boolean;
}

const STORAGE_KEY_NAME = 'simchem_player_name';
const LEADERBOARD_URL = 'https://script.google.com/macros/s/AKfycbxWSm9hfkN4eEAB1cbB4RTbZEqyJfPbYWBs9834-QbGoyQiearPZwCp0p5mzoZZ25BYNA/exec';

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, currentScore, debugMode }) => {
    const [activeTab, setActiveTab] = useState<'ranks' | 'submit'>('ranks');
    const [scores, setScores] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [playerName, setPlayerName] = useState('');
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    useEffect(() => {
        const savedName = localStorage.getItem(STORAGE_KEY_NAME);
        if (savedName) setPlayerName(savedName);

        if (isOpen) {
            fetchScores();
        }
    }, [isOpen]);

    const fetchScores = async () => {
        setLoading(true);
        setError(null);
        try {
            if (debugMode) console.log("[Leaderboard] Fetching from:", LEADERBOARD_URL);

            const res = await fetch(LEADERBOARD_URL);
            
            if (debugMode) {
                console.log("[Leaderboard] Response Status:", res.status, res.statusText);
            }

            if (!res.ok) {
                throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
            }

            const text = await res.text();
            if (debugMode) {
                // Log the start of the response to check for HTML error pages
                console.log("[Leaderboard] Raw Response Body (first 500 chars):", text.substring(0, 500));
            }

            let data;
            try {
                data = JSON.parse(text);
            } catch (jsonErr) {
                throw new Error(`JSON Parse Failed: ${jsonErr instanceof Error ? jsonErr.message : String(jsonErr)}. \nResponse likely HTML or empty.`);
            }

            if (Array.isArray(data)) {
                setScores(data.slice(0, 100)); // Top 100
            } else {
                if (debugMode) console.error("[Leaderboard] Invalid data format (Expected Array):", data);
                setError("Invalid data format received.");
            }
        } catch (e) {
            if (debugMode) {
                console.error("[Leaderboard] Detailed Fetch Error:", e);
                if (e instanceof TypeError && e.message === "Failed to fetch") {
                    console.warn("[Leaderboard] Hint: 'Failed to fetch' typically implies a Network Error or CORS block. Check browser DevTools Network tab.");
                }
            }
            setError(e instanceof Error ? e.message : "Failed to fetch scores.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitScore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!playerName.trim()) return;
        localStorage.setItem(STORAGE_KEY_NAME, playerName);
        setSubmitStatus('submitting');

        try {
            if (debugMode) console.log("[Leaderboard] Submitting score...");
            
            // Google Apps Script doPost typically requires form-data or url-encoded
            // It often has CORS issues with application/json
            const formData = new FormData();
            formData.append('name', playerName);
            formData.append('score', currentScore.toString());

            await fetch(LEADERBOARD_URL, {
                method: 'POST',
                body: formData,
                mode: 'no-cors' // Critical for Google Apps Script simple triggers
            });

            // Since mode is no-cors, we can't read the response, but we assume success if no error
            setSubmitStatus('success');
            setTimeout(() => {
                setSubmitStatus('idle');
                setActiveTab('ranks');
                fetchScores();
            }, 1500);

        } catch (err) {
            if (debugMode) console.error("[Leaderboard] Submission failed:", err);
            setSubmitStatus('error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={onClose}>
            <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🏆</span>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Global Leaderboard</h2>
                            <p className="text-xs text-gray-400">Top Scientists</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl px-2">&times;</button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800">
                    <button 
                        onClick={() => setActiveTab('ranks')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'ranks' ? 'bg-gray-800 text-white border-b-2 border-yellow-500' : 'text-gray-500 hover:bg-gray-800/50'}`}
                    >
                        Top Scores
                    </button>
                    <button 
                        onClick={() => setActiveTab('submit')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'submit' ? 'bg-gray-800 text-white border-b-2 border-green-500' : 'text-gray-500 hover:bg-gray-800/50'}`}
                    >
                        Submit Score
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
                    
                    {/* --- RANKS TAB --- */}
                    {activeTab === 'ranks' && (
                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center py-10 text-gray-400 animate-pulse">Loading scores...</div>
                            ) : error ? (
                                <div className="text-center py-10 text-red-400">
                                    <p className="font-bold mb-2">Error</p>
                                    <p className="text-sm font-mono bg-red-900/20 p-2 rounded break-all">{error}</p>
                                    {debugMode && <p className="text-xs text-gray-500 mt-2">Check browser console (F12) for raw response.</p>}
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                                            <th className="p-3">Rank</th>
                                            <th className="p-3">Scientist</th>
                                            <th className="p-3">Discoveries</th>
                                            <th className="p-3 text-right">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scores.map((entry, idx) => (
                                            <tr key={idx} className={`border-b border-gray-800/50 hover:bg-gray-900 ${idx < 3 ? 'text-yellow-100' : 'text-gray-300'}`}>
                                                <td className="p-3 font-mono text-gray-500">#{idx + 1}</td>
                                                <td className="p-3 font-bold">
                                                    {idx === 0 && '🥇 '}
                                                    {idx === 1 && '🥈 '}
                                                    {idx === 2 && '🥉 '}
                                                    {entry.name}
                                                </td>
                                                <td className="p-3 font-mono text-blue-400">{entry.score}</td>
                                                <td className="p-3 text-right text-xs text-gray-600">{entry.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* --- SUBMIT TAB --- */}
                    {activeTab === 'submit' && (
                        <div className="flex flex-col items-center justify-center h-full py-8">
                            <div className="w-full max-w-sm space-y-6">
                                <div className="text-center">
                                    <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">Current Discoveries</div>
                                    <div className="text-6xl font-bold text-white mb-2 font-mono">{currentScore}</div>
                                    <p className="text-sm text-gray-400">Total Particles, Elements & Molecules discovered.</p>
                                </div>

                                <form onSubmit={handleSubmitScore} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Scientist Name</label>
                                        <input 
                                            type="text" 
                                            required
                                            maxLength={20}
                                            value={playerName}
                                            onChange={(e) => setPlayerName(e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
                                            placeholder="e.g. Marie Curie"
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={submitStatus === 'submitting'}
                                        className={`w-full py-3 rounded font-bold text-white transition-all
                                            ${submitStatus === 'submitting' ? 'bg-gray-700 cursor-wait' : 'bg-green-600 hover:bg-green-500 shadow-lg hover:shadow-green-900/20'}
                                            ${submitStatus === 'success' ? 'bg-green-500' : ''}
                                        `}
                                    >
                                        {submitStatus === 'submitting' ? 'Transmitting...' : submitStatus === 'success' ? 'Submitted!' : 'Submit to Global Leaderboard'}
                                    </button>
                                    {submitStatus === 'error' && <p className="text-center text-red-400 text-sm">Transmission Failed.</p>}
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeaderboardModal;
