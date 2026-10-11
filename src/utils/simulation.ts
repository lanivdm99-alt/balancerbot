import { TOKENS, PAIRS, DEX_FEES, CHAINS } from './constants';

// ═══════════════════════════════════════════════════════════
// ADVANCED PRICE ENGINE - Simulates realistic market dynamics
// with liquidity-weighted pricing and cross-DEX arbitrage
// ═══════════════════════════════════════════════════════════

export class PriceEngine {
  private prices: Map<string, Map<string, number>> = new Map();
  private volatility: Map<string, number> = new Map();
  private trend: Map<string, number> = new Map();
  private liquidity: Map<string, Map<string, number>> = new Map();
  private tickCount: number = 0;

  constructor() {
    this.initializePrices();
  }

  private initializePrices() {
    const allDexs = new Set<string>();
    Object.values(CHAINS).forEach(chain => chain.dexs.forEach(d => allDexs.add(d)));

    TOKENS.forEach(token => {
      const dexPrices = new Map<string, number>();
      const dexLiquidity = new Map<string, number>();
      
      allDexs.forEach(dex => {
        // Each DEX has slightly different prices (simulating liquidity differences)
        const spread = token.basePrice * 0.0005 * (Math.random() - 0.5);
        dexPrices.set(dex, token.basePrice + spread);
        // Different liquidity levels per DEX
        dexLiquidity.set(dex, 0.5 + Math.random() * 2);
      });
      
      this.prices.set(token.symbol, dexPrices);
      this.liquidity.set(token.symbol, dexLiquidity);
      this.volatility.set(token.symbol, 0.001 + Math.random() * 0.003);
      this.trend.set(token.symbol, (Math.random() - 0.5) * 0.0002);
    });
  }

  tick() {
    this.tickCount++;
    
    TOKENS.forEach(token => {
      const dexPrices = this.prices.get(token.symbol)!;
      const dexLiq = this.liquidity.get(token.symbol)!;
      const vol = this.volatility.get(token.symbol)!;
      const trend = this.trend.get(token.symbol)!;

      // Update trend (mean-reverting with momentum)
      const newTrend = trend * 0.92 + (Math.random() - 0.5) * 0.00008;
      this.trend.set(token.symbol, newTrend);

      // Periodically create arbitrage opportunities (market events)
      const isMarketEvent = Math.random() < 0.03;
      
      dexPrices.forEach((price, dex) => {
        const liq = dexLiq.get(dex)!;
        
        // Random walk with trend, volatility, and liquidity weighting
        const shock = (Math.random() - 0.5) * vol * price / liq;
        const trendComponent = newTrend * price;
        
        // Market events create larger dislocations
        const eventShock = isMarketEvent 
          ? (Math.random() - 0.5) * price * 0.008 / liq 
          : 0;
        
        // Cross-DEX mean reversion (arbitrageurs close gaps)
        const avgPrice = Array.from(dexPrices.values()).reduce((a, b) => a + b, 0) / dexPrices.size;
        const reversion = (avgPrice - price) * 0.01;
        
        const newPrice = Math.max(
          price * 0.95, 
          Math.min(price * 1.05, price + shock + trendComponent + eventShock + reversion)
        );
        dexPrices.set(dex, newPrice);
      });
    });
  }

  getPrice(token: string, dex: string): number {
    return this.prices.get(token)?.get(dex) || 0;
  }

  getAllPrices(): Record<string, Record<string, number>> {
    const result: Record<string, Record<string, number>> = {};
    TOKENS.forEach(token => {
      result[token.symbol] = {};
      this.prices.get(token.symbol)?.forEach((price, dex) => {
        result[token.symbol][dex] = price;
      });
    });
    return result;
  }
}

// ═══════════════════════════════════════════════════════════
// ARBITRAGE OPPORTUNITY - Enhanced with optimal trade sizing
// ═══════════════════════════════════════════════════════════

export interface ArbOpportunity {
  id: string;
  chain: 'arbitrum' | 'polygon';
  pair: [string, string];
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadBps: number;
  estimatedProfit: number;
  gasCost: number;
  netProfit: number;
  timestamp: number;
  status: 'detected' | 'executing' | 'success' | 'failed' | 'skipped';
  flashLoanAmount: number;
  optimalTradeSize: number;
  strategy: 'simple' | 'triangular' | 'cross-chain' | 'flashbots';
  mevShareTip: number;
  confidence: number;
}

// ═══════════════════════════════════════════════════════════
// OPTIMAL TRADE SIZE CALCULATOR
// Based on Flashbots simple-blind-arbitrage formula
// ═══════════════════════════════════════════════════════════

function calculateOptimalTradeSize(
  spreadBps: number,
  buyDexFee: number,
  sellDexFee: number,
  availableLiquidity: number
): number {
  // Simplified version of the optimal trade size formula
  // profit = (spread - fees) * tradeSize - gasCost
  // Optimal tradeSize maximizes profit while considering slippage
  
  const netSpread = (spreadBps - buyDexFee - sellDexFee) / 10000;
  if (netSpread <= 0) return 0;
  
  // Square root formula for optimal sizing (from AMM math)
  // tradeSize = sqrt(reserve_in * reserve_out * fee^2 / fee_divisor^2) - reserve
  const optimalSize = Math.min(
    availableLiquidity * 0.1, // Don't use more than 10% of liquidity
    Math.sqrt(availableLiquidity * netSpread * 1000)
  );
  
  return Math.max(0, optimalSize);
}

// ═══════════════════════════════════════════════════════════
// ARBITRAGE DETECTOR - Multi-strategy scanner
// ═══════════════════════════════════════════════════════════

export function detectArbitrage(
  prices: Record<string, Record<string, number>>,
  chain: 'arbitrum' | 'polygon'
): ArbOpportunity[] {
  const chainConfig = CHAINS[chain];
  const opportunities: ArbOpportunity[] = [];

  PAIRS.forEach(([tokenA, tokenB]) => {
    chainConfig.dexs.forEach((dexA, i) => {
      chainConfig.dexs.forEach((dexB, j) => {
        if (i >= j) return;

        const priceAB_buy = prices[tokenA]?.[dexA];
        const priceAB_sell = prices[tokenA]?.[dexB];
        const priceBA_buy = prices[tokenB]?.[dexB];
        const priceBA_sell = prices[tokenB]?.[dexA];

        if (!priceAB_buy || !priceAB_sell || !priceBA_buy || !priceBA_sell) return;

        const spreadA = (priceAB_sell - priceAB_buy) / priceAB_buy;
        const spreadB = (priceBA_sell - priceBA_buy) / priceBA_buy;

        const feeA = DEX_FEES[dexA] / 10000;
        const feeB = DEX_FEES[dexB] / 10000;
        const totalFees = feeA + feeB;

        const netSpread = Math.max(spreadA, spreadB) - totalFees;

        if (netSpread > 0.0002) {
          const isA = spreadA > spreadB;
          const spreadBps = Math.max(spreadA, spreadB) * 10000;
          
          // Calculate optimal trade size
          const availableLiquidity = tokenA === 'WETH' ? 50 : tokenA === 'WBTC' ? 5 : 100000;
          const optimalSize = calculateOptimalTradeSize(
            spreadBps,
            DEX_FEES[isA ? dexA : dexB],
            DEX_FEES[isA ? dexB : dexA],
            availableLiquidity
          );

          const flashLoanAmount = optimalSize || (tokenA === 'WETH' ? 10 : tokenA === 'WBTC' ? 0.5 : 10000);
          const gasCost = chain === 'arbitrum' ? 0.00008 : 0.004;
          
          // MEV-Share tip calculation (competitive environment)
          const grossProfit = netSpread * flashLoanAmount;
          const mevTipPercentage = 0.75 + Math.random() * 0.15; // 75-90% tip
          const mevShareTip = grossProfit * mevTipPercentage;
          const netProfit = grossProfit - gasCost - mevShareTip;

          // Determine strategy type
          let strategy: ArbOpportunity['strategy'] = 'simple';
          if (Math.random() < 0.1) strategy = 'triangular';
          else if (Math.random() < 0.05) strategy = 'cross-chain';
          else if (Math.random() < 0.3) strategy = 'flashbots';

          // Confidence based on spread size and liquidity
          const confidence = Math.min(0.99, 0.5 + netSpread * 100 + Math.random() * 0.2);

          if (netProfit > 0) {
            opportunities.push({
              id: `${chain}-${tokenA}-${tokenB}-${dexA}-${dexB}-${Date.now()}-${Math.random()}`,
              chain,
              pair: [tokenA, tokenB],
              buyDex: isA ? dexA : dexB,
              sellDex: isA ? dexB : dexA,
              buyPrice: isA ? priceAB_buy : priceAB_sell,
              sellPrice: isA ? priceAB_sell : priceAB_buy,
              spread: Math.max(spreadA, spreadB),
              spreadBps,
              estimatedProfit: grossProfit,
              gasCost,
              netProfit,
              timestamp: Date.now(),
              status: 'detected',
              flashLoanAmount,
              optimalTradeSize: optimalSize,
              strategy,
              mevShareTip,
              confidence,
            });
          }
        }
      });
    });
  });

  return opportunities
    .sort((a, b) => b.netProfit - a.netProfit)
    .slice(0, 8);
}

// ═══════════════════════════════════════════════════════════
// GAS SIMULATOR - Realistic gas price modeling
// ═══════════════════════════════════════════════════════════

export class GasSimulator {
  private baseFees: Map<string, number> = new Map();
  private spikeProbability: Map<string, number> = new Map();

  constructor() {
    this.baseFees.set('arbitrum', 0.1);
    this.baseFees.set('polygon', 30);
    this.spikeProbability.set('arbitrum', 0.02);
    this.spikeProbability.set('polygon', 0.05);
  }

  tick() {
    // Arbitrum gas is very stable (L2 rollup)
    const arbFee = this.baseFees.get('arbitrum')!;
    const arbSpike = Math.random() < this.spikeProbability.get('arbitrum')! ? Math.random() * 0.1 : 0;
    this.baseFees.set('arbitrum', Math.max(0.05, arbFee + (Math.random() - 0.5) * 0.02 + arbSpike));

    // Polygon gas is more volatile
    const polyFee = this.baseFees.get('polygon')!;
    const polySpike = Math.random() < this.spikeProbability.get('polygon')! ? Math.random() * 30 : 0;
    this.baseFees.set('polygon', Math.max(15, polyFee + (Math.random() - 0.5) * 5 + polySpike));
  }

  getGas(chain: string): number {
    return this.baseFees.get(chain) || 0;
  }
}

// ═══════════════════════════════════════════════════════════
// PnL TRACKER - Enhanced with strategy breakdown
// ═══════════════════════════════════════════════════════════

export interface PnLEntry {
  timestamp: number;
  profit: number;
  cumulative: number;
  chain: string;
  pair: string;
  strategy: string;
  gasUsed: number;
  mevTip: number;
}

export class PnLTracker {
  private entries: PnLEntry[] = [];
  private cumulative: number = 0;
  private highScore: number = 0;
  private wins: number = 0;
  private losses: number = 0;
  private totalGasSpent: number = 0;
  private totalMevTips: number = 0;
  private strategyStats: Map<string, { wins: number; losses: number; profit: number }> = new Map();

  addEntry(profit: number, chain: string, pair: string, strategy: string = 'simple', gasUsed: number = 0, mevTip: number = 0) {
    this.cumulative += profit;
    if (this.cumulative > this.highScore) this.highScore = this.cumulative;
    if (profit > 0) this.wins++;
    else this.losses++;
    
    this.totalGasSpent += gasUsed;
    this.totalMevTips += mevTip;

    // Track per-strategy stats
    const stats = this.strategyStats.get(strategy) || { wins: 0, losses: 0, profit: 0 };
    if (profit > 0) stats.wins++;
    else stats.losses++;
    stats.profit += profit;
    this.strategyStats.set(strategy, stats);

    this.entries.push({
      timestamp: Date.now(),
      profit,
      cumulative: this.cumulative,
      chain,
      pair,
      strategy,
      gasUsed,
      mevTip,
    });

    if (this.entries.length > 100) this.entries.shift();
  }

  getStats() {
    const strategyBreakdown: Record<string, { wins: number; losses: number; profit: number }> = {};
    this.strategyStats.forEach((stats, strategy) => {
      strategyBreakdown[strategy] = { ...stats };
    });

    return {
      cumulative: this.cumulative,
      highScore: this.highScore,
      wins: this.wins,
      losses: this.losses,
      winRate: this.wins + this.losses > 0 ? (this.wins / (this.wins + this.losses)) * 100 : 0,
      entries: this.entries,
      last24hProfit: this.entries.slice(-24).reduce((sum, e) => sum + e.profit, 0),
      totalGasSpent: this.totalGasSpent,
      totalMevTips: this.totalMevTips,
      strategyBreakdown,
      avgProfitPerTrade: this.wins + this.losses > 0 ? this.cumulative / (this.wins + this.losses) : 0,
    };
  }
}
