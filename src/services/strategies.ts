/**
 * ═══════════════════════════════════════════════════════════
 * FLASH-X ADVANCED STRATEGIES
 * Production MEV strategies beyond simple arbitrage
 * ═══════════════════════════════════════════════════════════
 */

import { MempoolOpportunity } from './mempool';
import { ArbOpportunity } from './blockchain';

// ═══════════════════════════════════════════════════════════
// STRATEGY TYPES
// ═══════════════════════════════════════════════════════════

export type StrategyType = 
  | 'simple_arb'
  | 'backrun'
  | 'jit_liquidity'
  | 'liquidation'
  | 'oracle_update'
  | 'sandwich_defense'
  | 'cross_dex_arb'
  | 'triangular_arb';

export interface Strategy {
  type: StrategyType;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  expectedProfit: string;
  enabled: boolean;
  priority: number; // Higher = more important
}

export interface StrategyResult {
  strategy: StrategyType;
  opportunity: ArbOpportunity | MempoolOpportunity;
  estimatedProfit: number;
  confidence: number;
  gasCost: number;
  netProfit: number;
  executionTime: number;
  success: boolean;
}

// ═══════════════════════════════════════════════════════════
// AVAILABLE STRATEGIES
// ═══════════════════════════════════════════════════════════

export const STRATEGIES: Strategy[] = [
  {
    type: 'simple_arb',
    name: 'Simple Arbitrage',
    description: 'Buy low on DEX A, sell high on DEX B',
    riskLevel: 'low',
    expectedProfit: '$0.01 - $1.00',
    enabled: true,
    priority: 1,
  },
  {
    type: 'backrun',
    name: 'Backrunning',
    description: 'Execute after large swaps to capture price impact',
    riskLevel: 'medium',
    expectedProfit: '$0.10 - $10.00',
    enabled: true,
    priority: 2,
  },
  {
    type: 'jit_liquidity',
    name: 'JIT Liquidity',
    description: 'Add liquidity before large swap, remove after',
    riskLevel: 'medium',
    expectedProfit: '$0.05 - $5.00',
    enabled: true,
    priority: 3,
  },
  {
    type: 'liquidation',
    name: 'Liquidation Backrun',
    description: 'Backrun liquidation calls to capture bonus',
    riskLevel: 'low',
    expectedProfit: '$1.00 - $100.00',
    enabled: true,
    priority: 4,
  },
  {
    type: 'oracle_update',
    name: 'Oracle Update Arb',
    description: 'Arbitrage after oracle price updates',
    riskLevel: 'low',
    expectedProfit: '$0.01 - $0.50',
    enabled: true,
    priority: 5,
  },
  {
    type: 'sandwich_defense',
    name: 'Sandwich Defense',
    description: 'Protect users from sandwich attacks',
    riskLevel: 'low',
    expectedProfit: '$0.00 (defensive)',
    enabled: false,
    priority: 6,
  },
  {
    type: 'cross_dex_arb',
    name: 'Cross-DEX Arbitrage',
    description: 'Multi-hop arbitrage across 3+ DEXs',
    riskLevel: 'medium',
    expectedProfit: '$0.05 - $2.00',
    enabled: true,
    priority: 7,
  },
  {
    type: 'triangular_arb',
    name: 'Triangular Arbitrage',
    description: 'A→B→C→A cycle arbitrage',
    riskLevel: 'medium',
    expectedProfit: '$0.02 - $1.00',
    enabled: true,
    priority: 8,
  },
];

// ═══════════════════════════════════════════════════════════
// STRATEGY ENGINE
// ═══════════════════════════════════════════════════════════

export class StrategyEngine {
  private enabledStrategies: Set<StrategyType> = new Set();
  private strategyStats: Map<StrategyType, {
    attempts: number;
    successes: number;
    totalProfit: number;
    avgProfit: number;
  }> = new Map();

  constructor() {
    // Enable all strategies by default
    STRATEGIES.forEach(s => {
      if (s.enabled) {
        this.enabledStrategies.add(s.type);
      }
      this.strategyStats.set(s.type, {
        attempts: 0,
        successes: 0,
        totalProfit: 0,
        avgProfit: 0,
      });
    });
  }

  /**
   * Enable/disable a strategy
   */
  setStrategyEnabled(type: StrategyType, enabled: boolean): void {
    if (enabled) {
      this.enabledStrategies.add(type);
    } else {
      this.enabledStrategies.delete(type);
    }
  }

  /**
   * Check if strategy is enabled
   */
  isStrategyEnabled(type: StrategyType): boolean {
    return this.enabledStrategies.has(type);
  }

  /**
   * Get all enabled strategies
   */
  getEnabledStrategies(): Strategy[] {
    return STRATEGIES.filter(s => this.enabledStrategies.has(s.type));
  }

  /**
   * Get all strategies
   */
  getAllStrategies(): Strategy[] {
    return STRATEGIES.map(s => ({
      ...s,
      enabled: this.enabledStrategies.has(s.type),
    }));
  }

  /**
   * Evaluate simple arbitrage opportunity
   */
  evaluateSimpleArb(opp: ArbOpportunity): StrategyResult {
    const stats = this.strategyStats.get('simple_arb')!;
    stats.attempts++;

    const gasCost = opp.gasCost;
    const netProfit = opp.netProfit;
    const success = netProfit > 0;

    if (success) {
      stats.successes++;
      stats.totalProfit += netProfit;
      stats.avgProfit = stats.totalProfit / stats.successes;
    }

    return {
      strategy: 'simple_arb',
      opportunity: opp,
      estimatedProfit: opp.estimatedProfit,
      confidence: opp.confidence,
      gasCost,
      netProfit,
      executionTime: 2000, // ~2 seconds
      success,
    };
  }

  /**
   * Evaluate backrun opportunity
   */
  evaluateBackrun(opp: MempoolOpportunity): StrategyResult {
    const stats = this.strategyStats.get('backrun')!;
    stats.attempts++;

    const gasCost = 0.015; // Higher gas for backruns
    const netProfit = opp.estimatedProfit - gasCost;
    const success = netProfit > 0 && opp.confidence > 0.6;

    if (success) {
      stats.successes++;
      stats.totalProfit += netProfit;
      stats.avgProfit = stats.totalProfit / stats.successes;
    }

    return {
      strategy: 'backrun',
      opportunity: opp,
      estimatedProfit: opp.estimatedProfit,
      confidence: opp.confidence,
      gasCost,
      netProfit,
      executionTime: 500, // Must be fast! ~0.5 seconds
      success,
    };
  }

  /**
   * Evaluate JIT liquidity opportunity
   */
  evaluateJIT(opp: MempoolOpportunity): StrategyResult {
    const stats = this.strategyStats.get('jit_liquidity')!;
    stats.attempts++;

    const gasCost = 0.025; // Higher gas for JIT (add + remove liquidity)
    const estimatedProfit = opp.estimatedProfit * 0.7; // Capture 70% of fees
    const netProfit = estimatedProfit - gasCost;
    const success = netProfit > 0 && opp.confidence > 0.7;

    if (success) {
      stats.successes++;
      stats.totalProfit += netProfit;
      stats.avgProfit = stats.totalProfit / stats.successes;
    }

    return {
      strategy: 'jit_liquidity',
      opportunity: opp,
      estimatedProfit,
      confidence: opp.confidence * 0.9,
      gasCost,
      netProfit,
      executionTime: 800, // ~0.8 seconds
      success,
    };
  }

  /**
   * Evaluate liquidation opportunity
   */
  evaluateLiquidation(opp: MempoolOpportunity): StrategyResult {
    const stats = this.strategyStats.get('liquidation')!;
    stats.attempts++;

    const gasCost = 0.02;
    const netProfit = opp.estimatedProfit - gasCost;
    const success = netProfit > 0 && opp.confidence > 0.8;

    if (success) {
      stats.successes++;
      stats.totalProfit += netProfit;
      stats.avgProfit = stats.totalProfit / stats.successes;
    }

    return {
      strategy: 'liquidation',
      opportunity: opp,
      estimatedProfit: opp.estimatedProfit,
      confidence: opp.confidence,
      gasCost,
      netProfit,
      executionTime: 600, // ~0.6 seconds
      success,
    };
  }

  /**
   * Get strategy statistics
   */
  getStrategyStats(type: StrategyType) {
    return this.strategyStats.get(type);
  }

  /**
   * Get all strategy statistics
   */
  getAllStats() {
    const result: Record<string, any> = {};
    this.strategyStats.forEach((stats, type) => {
      result[type] = {
        ...stats,
        successRate: stats.attempts > 0 ? (stats.successes / stats.attempts) * 100 : 0,
      };
    });
    return result;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.strategyStats.forEach((stats) => {
      stats.attempts = 0;
      stats.successes = 0;
      stats.totalProfit = 0;
      stats.avgProfit = 0;
    });
  }
}

// Singleton instance
let strategyEngineInstance: StrategyEngine | null = null;

export function getStrategyEngine(): StrategyEngine {
  if (!strategyEngineInstance) {
    strategyEngineInstance = new StrategyEngine();
  }
  return strategyEngineInstance;
}
