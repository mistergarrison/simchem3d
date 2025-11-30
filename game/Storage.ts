
import { GameMode } from '../types/ui';

const STORAGE_KEY = 'simchem_user_config_v1';

export interface SerializedDiscoveryState {
    elements: number[];
    molecules: string[];
    particles: string[];
}

export interface UserConfig {
    gameMode: GameMode;
    discovered: SerializedDiscoveryState;
    newlyUnlocked: {
        particles: boolean;
        elements: boolean;
        molecules: boolean;
        lasso: boolean;
        [key: string]: boolean; // Allow for future expansion
    };
    sliderValue: number;
    showBonds: boolean;
    viewMode: 'solid' | 'glass';
    debugMode: boolean;
}

const DEFAULT_CONFIG: UserConfig = {
    gameMode: 'discovery',
    discovered: {
        elements: [],
        molecules: [],
        particles: []
    },
    newlyUnlocked: {
        particles: false,
        elements: false,
        molecules: false,
        lasso: false
    },
    sliderValue: 50,
    showBonds: false,
    viewMode: 'glass',
    debugMode: false
};

export const saveUserConfig = (config: UserConfig) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
        console.warn('Failed to save config:', e);
    }
};

export const loadUserConfig = (): UserConfig | null => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return null;
        
        const loaded = JSON.parse(data);
        
        // Deep Merge Strategy for backward compatibility
        // 1. Merge Top Level (overwriting defaults with loaded values)
        const merged: UserConfig = {
            ...DEFAULT_CONFIG,
            ...loaded,
            // 2. Merge Nested Objects explicitly to ensure new keys in Default are preserved
            newlyUnlocked: {
                ...DEFAULT_CONFIG.newlyUnlocked,
                ...(loaded.newlyUnlocked || {})
            },
            // Discovered arrays are replaced, not merged, as we want the user's exact state
            // However, we ensure the object structure exists
            discovered: {
                ...DEFAULT_CONFIG.discovered,
                ...(loaded.discovered || {})
            }
        };

        return merged;
    } catch (e) {
        console.warn('Failed to load config:', e);
        return null;
    }
};

export const clearUserConfig = () => {
    localStorage.removeItem(STORAGE_KEY);
};
