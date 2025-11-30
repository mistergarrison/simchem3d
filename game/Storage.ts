
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
    };
    sliderValue: number;
    showBonds: boolean;
    viewMode: 'solid' | 'glass';
    debugMode: boolean;
}

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
        return JSON.parse(data) as UserConfig;
    } catch (e) {
        console.warn('Failed to load config:', e);
        return null;
    }
};

export const clearUserConfig = () => {
    localStorage.removeItem(STORAGE_KEY);
};
