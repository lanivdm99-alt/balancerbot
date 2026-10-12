/**
 * ═══════════════════════════════════════════════════════════
 * FLASH-X RISK MANAGEMENT
 * Protect capital with circuit breakers and position limits
 * ═══════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface RiskLimits {
  maxDailyLoss: number;           // Maximum loss per day in USD
  maxTradeSize: number;           // Maximum single trade size in USD
  maxPositionSize: number;        // Maximum position size in USD
  maxGasPrice: number;            // Maximum gas price in Gwei
  maxSlippage: number;            // Maximum slippage in basis points
  maxConsecutiveLosses: number;   // Stop trading after N consecutive losses
  circuitBreakerThreshold: number; // Stop if loss exceeds this % of capital
  cooldownPeriod: number;         // Minutes to wait after circuit breaker
}

export interface RiskMetrics {
  dailyPnL: number;
  dailyTrades: number;
  consecutiveLosses: number;
  currentDrawdown: number;        // Current drawdown from peak
  peakCapital: number;
  circuitBreakerActive: boolean;
  circuitBreakerTriggeredAt?: number;
  lastTradeTimestamp: number;
  totalGasSpent: number;
  averageTradeSize: number;
}

export interface RiskCheck {
  allowed: boolean;
  reason?: string;
  warning?: string;
}

// ═══════════════════════════════════════════════════════════
// DEFAULT LIMITS
// ═══════════════════════════════════════════════════════════

export const DEFAULT_RISK_LIMITS: RiskLimits = {
  maxDailyLoss: 10.0,              // $10 max daily loss
  maxTradeSize: 1000.0,            // $1000 max per trade (with flash loans)
  maxPositionSize: 5000.0,         // $5000 max position
  maxGasPrice: 100,                // 100 Gwei max
  maxSlippage: 100,                // 1% max slippage (100 bps)
  maxConsecutiveLosses: 5,         // Stop after 5 losses in a row
  circuitBreakerThreshold: 0.10,   // 10% drawdown triggers breaker
  cooldownPeriod: 60,              // 60 minutes cooldown
};

// ═══════════════════════════════════════════════════════════
// RISK MANAGER
// ═══════════════════════════════════════════════════════════

export class RiskManager {
  private limits: RiskLimits;
  private metrics: RiskMetrics;
  private tradeHistory: Array<{
    timestamp: number;
    profit: number;
    gasCost: number;
    size: number;
  }> = [];

  constructor(limits: RiskLimits = DEFAULT_RISK_LIMITS) {
    this.limits = { ...limits };
    this.metrics = {
      dailyPnL: 0,
      dailyTrades: 0,
      consecutiveLosses: 0,
      currentDrawdown: 0,
      peakCapital: 0,
      circuitBreakerActive: false,
      lastTradeTimestamp: 0,
      totalGasSpent: 0,
      averageTradeSize: 0,
    };
  }

  /**
   * Check if a trade is allowed
   */
  checkTrade(
    tradeSize: number,
    gasPrice: number,
    currentCapital: number
  ): RiskCheck {
    // Update peak capital
    if (currentCapital > this.metrics.peakCapital) {
      this.metrics.peakCapital = currentCapital;
    }

    // Check circuit breaker
    if (this.metrics.circuitBreakerActive) {
      const cooldownEnd = (this.metrics.circuitBreakerTriggeredAt || 0) + 
                          (this.limits.cooldownPeriod * 60 * 1000);
      
      if (Date.now() < cooldownEnd) {
        const minutesLeft = Math.ceil((cooldownEnd - Date.now()) / 60000);
        return {
          allowed: false,
          reason: `Circuit breaker active. Wait ${minutesLeft} minutes.`,
        };
      } else {
        // Cooldown expired, reset circuit breaker
        this.metrics.circuitBreakerActive = false;
        this.metrics.circuitBreakerTriggeredAt = undefined;
      }
    }

    // Check daily loss limit
    if (this.metrics.dailyPnL <= -this.limits.maxDailyLoss) {
      return {
        allowed: false,
        reason: `Daily loss limit reached: $${Math.abs(this.metrics.dailyPnL).toFixed(2)}`,
      };
    }

    // Check trade size
    if (tradeSize > this.limits.maxTradeSize) {
      return {
        allowed: false,
        reason: `Trade size $${tradeSize.toFixed(2)} exceeds limit $${this.limits.maxTradeSize.toFixed(2)}`,
      };
    }

    // Check gas price
    if (gasPrice > this.limits.maxGasPrice) {
      return {
        allowed: false,
        reason: `Gas price ${gasPrice.toFixed(2)} Gwei exceeds limit ${this.limits.maxGasPrice} Gwei`,
      };
    }

    // Check consecutive losses
    if (this.metrics.consecutiveLosses >= this.limits.maxConsecutiveLosses) {
      return {
        allowed: false,
        reason: `${this.metrics.consecutiveLosses} consecutive losses. Take a break.`,
      };
    }

    // Check drawdown
    const drawdown = this.metrics.currentDrawdown;
    if (drawdown >= this.limits.circuitBreakerThreshold) {
      this.metrics.circuitBreakerActive = true;
      this.metrics.circuitBreakerTriggeredAt = Date.now();
      return {
        allowed: false,
        reason: `Circuit breaker triggered: ${(drawdown * 100).toFixed(1)}% drawdown`,
      };
    }

    // Warnings
    let warning: string | undefined;
    
    if (this.metrics.dailyPnL < -this.limits.maxDailyLoss * 0.5) {
      warning = `Approaching daily loss limit: $${Math.abs(this.metrics.dailyPnL).toFixed(2)}`;
    } else if (this.metrics.consecutiveLosses >= this.limits.maxConsecutiveLosses - 2) {
      warning = `${this.metrics.consecutiveLosses} consecutive losses. Be cautious.`;
    } else if (gasPrice > this.limits.maxGasPrice * 0.8) {
      warning = `Gas price high: ${gasPrice.toFixed(2)} Gwei`;
    }

    return {
      allowed: true,
      warning,
    };
  }

  /**
   * Record a trade result
   */
  recordTrade(profit: number, gasCost: number, tradeSize: number): void {
    const timestamp = Date.now();
    
    this.tradeHistory.push({
      timestamp,
      profit,
      gasCost,
      size: tradeSize,
    });

    // Update metrics
    this.metrics.dailyPnL += profit;
    this.metrics.dailyTrades++;
    this.metrics.lastTradeTimestamp = timestamp;
    this.metrics.totalGasSpent += gasCost;

    // Update consecutive losses
    if (profit < 0) {
      this.metrics.consecutiveLosses++;
    } else {
      this.metrics.consecutiveLosses = 0;
    }

    // Update average trade size
    const totalSize = this.tradeHistory.reduce((sum, t) => sum + t.size, 0);
    this.metrics.averageTradeSize = totalSize / this.tradeHistory.length;

    // Keep only last 1000 trades in memory
    if (this.tradeHistory.length > 1000) {
      this.tradeHistory = this.tradeHistory.slice(-1000);
    }
  }

  /**
   * Update drawdown based on current capital
   */
  updateDrawdown(currentCapital: number): void {
    if (currentCapital > this.metrics.peakCapital) {
      this.metrics.peakCapital = currentCapital;
    }

    if (this.metrics.peakCapital > 0) {
      this.metrics.currentDrawdown = 
        (this.metrics.peakCapital - currentCapital) / this.metrics.peakCapital;
    }
  }

  /**
   * Reset daily metrics (call at start of each day)
   */
  resetDaily(): void {
    this.metrics.dailyPnL = 0;
    this.metrics.dailyTrades = 0;
    this.metrics.consecutiveLosses = 0;
  }

  /**
   * Get current metrics
   */
  getMetrics(): RiskMetrics {
    return { ...this.metrics };
  }

  /**
   * Get limits
   */
  getLimits(): RiskLimits {
    return { ...this.limits };
  }

  /**
   * Update limits
   */
  updateLimits(newLimits: Partial<RiskLimits>): void {
    this.limits = { ...this.limits, ...newLimits };
  }

  /**
   * Manually trigger circuit breaker
   */
  triggerCircuitBreaker(): void {
    this.metrics.circuitBreakerActive = true;
    this.metrics.circuitBreakerTriggeredAt = Date.now();
  }

  /**
   * Manually reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.metrics.circuitBreakerActive = false;
    this.metrics.circuitBreakerTriggeredAt = undefined;
    this.metrics.consecutiveLosses = 0;
  }

  /**
   * Get trade history
   */
  getTradeHistory(limit: number = 100) {
    return this.tradeHistory.slice(-limit);
  }

  /**
   * Calculate risk-adjusted position size
   */
  calculatePositionSize(
    confidence: number,
    currentCapital: number,
    maxRiskPercent: number = 0.02 // 2% of capital
  ): number {
    // Kelly criterion simplified
    const winRate = this.metrics.dailyTrades > 0 
      ? this.tradeHistory.filter(t => t.profit > 0).length / this.metrics.dailyTrades
      : 0.5;
    
    const avgWin = this.tradeHistory.filter(t => t.profit > 0).reduce((sum, t) => sum + t.profit, 0) /
                   Math.max(1, this.tradeHistory.filter(t => t.profit > 0).length);
    
    const avgLoss = Math.abs(
      this.tradeHistory.filter(t => t.profit < 0).reduce((sum, t) => sum + t.profit, 0) /
      Math.max(1, this.tradeHistory.filter(t => t.profit < 0).length)
    );

    // Kelly fraction
    const kellyFraction = winRate - ((1 - winRate) / (avgWin / Math.max(0.01, avgLoss)));
    
    // Apply confidence and risk limits
    const adjustedFraction = Math.max(0, Math.min(1, kellyFraction * confidence * 0.5));
    const positionSize = currentCapital * adjustedFraction * maxRiskPercent;

    // Enforce limits
    return Math.min(positionSize, this.limits.maxTradeSize);
  }

  /**
   * Get risk score (0-100, higher = more risky)
   */
  getRiskScore(): number {
    let score = 0;

    // Daily loss contribution
    if (this.metrics.dailyPnL < 0) {
      score += Math.min(30, (Math.abs(this.metrics.dailyPnL) / this.limits.maxDailyLoss) * 30);
    }

    // Consecutive losses contribution
    score += Math.min(25, (this.metrics.consecutiveLosses / this.limits.maxConsecutiveLosses) * 25);

    // Drawdown contribution
    score += Math.min(25, (this.metrics.currentDrawdown / this.limits.circuitBreakerThreshold) * 25);

    // Circuit breaker
    if (this.metrics.circuitBreakerActive) {
      score += 20;
    }

    return Math.min(100, Math.round(score));
  }
}

// Singleton instance
let riskManagerInstance: RiskManager | null = null;

export function getRiskManager(limits?: RiskLimits): RiskManager {
  if (!riskManagerInstance) {
    riskManagerInstance = new RiskManager(limits);
  }
  return riskManagerInstance;
}
