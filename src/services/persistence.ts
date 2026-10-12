/**
 * ═══════════════════════════════════════════════════════════
 * FLASH-X STATE PERSISTENCE
 * Save and restore state from localStorage
 * ═══════════════════════════════════════════════════════════
 */

import { GameState } from './blockchain';

// ═══════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  GAME_STATE: 'flashx_game_state',
  TRADE_HISTORY: 'flashx_trade_history',
  SETTINGS: 'flashx_settings',
  ACHIEVEMENTS: 'flashx_achievements',
  MONSTERS: 'flashx_monsters',
  LAST_SAVE: 'flashx_last_save',
};

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface SavedSettings {
  isDryRun: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoConnect: boolean;
  theme: 'dark' | 'light';
}

export interface PersistedState {
  gameState: GameState;
  tradeHistory: any[];
  settings: SavedSettings;
  lastSave: number;
}

// ═══════════════════════════════════════════════════════════
// DEFAULT SETTINGS
// ═══════════════════════════════════════════════════════════

export const DEFAULT_SETTINGS: SavedSettings = {
  isDryRun: true,
  soundEnabled: true,
  notificationsEnabled: true,
  autoConnect: false,
  theme: 'dark',
};

// ═══════════════════════════════════════════════════════════
// PERSISTENCE SERVICE
// ═══════════════════════════════════════════════════════════

export class PersistenceService {
  /**
   * Save game state
   */
  saveGameState(state: GameState): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(state));
      localStorage.setItem(STORAGE_KEYS.LAST_SAVE, Date.now().toString());
      return true;
    } catch (err) {
      console.error('[Persistence] Failed to save game state:', err);
      return false;
    }
  }

  /**
   * Load game state
   */
  loadGameState(): GameState | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
      if (!data) return null;
      return JSON.parse(data);
    } catch (err) {
      console.error('[Persistence] Failed to load game state:', err);
      return null;
    }
  }

  /**
   * Save trade history
   */
  saveTradeHistory(history: any[]): boolean {
    try {
      // Keep only last 500 trades
      const trimmed = history.slice(0, 500);
      localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(trimmed));
      return true;
    } catch (err) {
      console.error('[Persistence] Failed to save trade history:', err);
      return false;
    }
  }

  /**
   * Load trade history
   */
  loadTradeHistory(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (err) {
      console.error('[Persistence] Failed to load trade history:', err);
      return [];
    }
  }

  /**
   * Save settings
   */
  saveSettings(settings: SavedSettings): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (err) {
      console.error('[Persistence] Failed to save settings:', err);
      return false;
    }
  }

  /**
   * Load settings
   */
  loadSettings(): SavedSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (err) {
      console.error('[Persistence] Failed to load settings:', err);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save achievements
   */
  saveAchievements(achievements: string[]): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
      return true;
    } catch (err) {
      console.error('[Persistence] Failed to save achievements:', err);
      return false;
    }
  }

  /**
   * Load achievements
   */
  loadAchievements(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      if (!data) return [];
      return JSON.parse(data);
    } catch (err) {
      console.error('[Persistence] Failed to load achievements:', err);
      return [];
    }
  }

  /**
   * Save monsters
   */
  saveMonsters(monsters: any[]): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS.MONSTERS, JSON.stringify(monsters));
      return true;
    } catch (err) {
      console.error('[Persistence] Failed to save monsters:', err);
      return false;
    }
  }

  /**
   * Load monsters
   */
  loadMonsters(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MONSTERS);
      if (!data) return [];
      return JSON.parse(data);
    } catch (err) {
      console.error('[Persistence] Failed to load monsters:', err);
      return [];
    }
  }

  /**
   * Get last save timestamp
   */
  getLastSave(): number {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LAST_SAVE);
      return data ? parseInt(data, 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Clear all data
   */
  clearAll(): boolean {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (err) {
      console.error('[Persistence] Failed to clear data:', err);
      return false;
    }
  }

  /**
   * Export all data as JSON
   */
  exportData(): string {
    const data: PersistedState = {
      gameState: this.loadGameState() || {} as GameState,
      tradeHistory: this.loadTradeHistory(),
      settings: this.loadSettings(),
      lastSave: this.getLastSave(),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON
   */
  importData(json: string): boolean {
    try {
      const data: PersistedState = JSON.parse(json);
      
      if (data.gameState) this.saveGameState(data.gameState);
      if (data.tradeHistory) this.saveTradeHistory(data.tradeHistory);
      if (data.settings) this.saveSettings(data.settings);
      
      return true;
    } catch (err) {
      console.error('[Persistence] Failed to import data:', err);
      return false;
    }
  }

  /**
   * Get storage usage
   */
  getStorageUsage(): { used: number; total: number } {
    let used = 0;
    
    Object.values(STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        used += item.length * 2; // UTF-16
      }
    });
    
    return {
      used,
      total: 5 * 1024 * 1024, // 5MB typical limit
    };
  }
}

// Singleton instance
let persistenceInstance: PersistenceService | null = null;

export function getPersistenceService(): PersistenceService {
  if (!persistenceInstance) {
    persistenceInstance = new PersistenceService();
  }
  return persistenceInstance;
}
