import { TOKENS, PAIRS, DEX_FEES, CHAINS } from './constants';

// Simulated price engine with realistic market dynamics
export class PriceEngine {
  private prices: Map<string, Map<string, number>> = new Map();
  private volatility: Map<string, number> = new Map();
  private trend: Map<string, number> = new Map();

  constructor() {
    this.initializePrices();
  }

  private initializePrices() {
    const allDexs = new Set<string>();
    Object.values(CHAINS).forEach(chain => chain.dexs.forEach(d => allDexs.add(d)));

    TOKENS.forEach(token => {
      const dexPrices = new Map<string, number>();
      allDexs.forEach(dex => {
        // Each DEX has slightly different prices (simulating liquidity differences)
        const spread = token.basePrice * 0.0005 * (Math.random() - 0.5);
        dexPrices.set(dex, token.basePrice + spread);
      });
      this.prices.set(token.symbol, dexPrices);
      this.volatility.set(token.symbol, 0.001 + Math.random() * 0.002);
      this.trend.set(token.symbol, (Math.random() - 0.5) * 0.0001);
    });
  }

  tick() {
    TOKENS.forEach(token => {
      const dexPrices = this.prices.get(token.symbol)!;
      const vol = this.volatility.get(token.symbol)!;
      const trend = this.trend.get(token.symbol)!;

      // Update trend (mean-reverting)
      const newTrend = trend * 0.95 + (Math.random() - 0.5) * 0.00005;
      this.trend.set(token.symbol, newTrend);

      dexPrices.forEach((price, dex) => {
        // Random walk with trend and volatility
        const shock = (Math.random() - 0.5) * vol * price;
        const trendComponent = newTrend * price;
        // Occasionally create arbitrage opportunities
        const arbShock = Math.random() < 0.02 ? (Math.random() - 0.5) * price * 0.005 : 0;
        const newPrice = Math.max(price * 0.99, price + shock + trendComponent + arbShock);
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

// Arbitrage opportunity detector
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
}

export function detectArbitrage(
  prices: Record<string, Record<string, number>>,
  chain: 'arbitrum' | 'polygon'
): ArbOpportunity[] {
  const chainConfig = CHAINS[chain];
  const opportunities: ArbOpportunity[] = [];

  PAIRS.forEach(([tokenA, tokenB]) => {
    chainConfig.dexs.forEach((dexA, i) => {
      chainConfig.dexs.forEach((dexB, j) => {
        if (i >= j) return; // Avoid duplicate pairs

        const priceAB_buy = prices[tokenA]?.[dexA];
        const priceAB_sell = prices[tokenA]?.[dexB];
        const priceBA_buy = prices[tokenB]?.[dexB];
        const priceBA_sell = prices[tokenB]?.[dexA];

        if (!priceAB_buy || !priceAB_sell || !priceBA_buy || !priceBA_sell) return;

        // Calculate spread for A/B pair
        const spreadA = (priceAB_sell - priceAB_buy) / priceAB_buy;
        const spreadB = (priceBA_sell - priceBA_buy) / priceBA_buy;

        // Check if profitable after fees
        const feeA = DEX_FEES[dexA] / 10000;
        const feeB = DEX_FEES[dexB] / 10000;
        const totalFees = feeA + feeB;

        const netSpread = Math.max(spreadA, spreadB) - totalFees;

        if (netSpread > 0.0003) { // Minimum 3 bps after fees
          const flashLoanAmount = tokenA === 'WETH' ? 10 : tokenA === 'WBTC' ? 0.5 : 10000;
          const gasCost = chain === 'arbitrum' ? 0.0001 : 0.005;
          const grossProfit = netSpread * flashLoanAmount;
          const netProfit = grossProfit - gasCost;

          if (netProfit > 0) {
            const isA = spreadA > spreadB;
            opportunities.push({
              id: `${chain}-${tokenA}-${tokenB}-${dexA}-${dexB}-${Date.now()}`,
              chain,
              pair: [tokenA, tokenB],
              buyDex: isA ? dexA : dexB,
              sellDex: isA ? dexB : dexA,
              buyPrice: isA ? priceAB_buy : priceAB_sell,
              sellPrice: isA ? priceAB_sell : priceAB_buy,
              spread: Math.max(spreadA, spreadB),
              spreadBps: Math.max(spreadA, spreadB) * 10000,
              estimatedProfit: grossProfit,
              gasCost,
              netProfit,
              timestamp: Date.now(),
              status: 'detected',
              flashLoanAmount,
            });
          }
        }
      });
    });
  });

  return opportunities.sort((a, b) => b.netProfit - a.netProfit).slice(0, 5);
}

// Gas price simulator
export class GasSimulator {
  private baseFees: Map<string, number> = new Map();

  constructor() {
    this.baseFees.set('arbitrum', 0.1);
    this.baseFees.set('polygon', 30);
  }

  tick() {
    // Arbitrum gas is very stable
    const arbFee = this.baseFees.get('arbitrum')!;
    this.baseFees.set('arbitrum', arbFee + (Math.random() - 0.5) * 0.02);

    // Polygon gas is more volatile
    const polyFee = this.baseFees.get('polygon')!;
    const spike = Math.random() < 0.05 ? Math.random() * 20 : 0;
    this.baseFees.set('polygon', Math.max(15, polyFee + (Math.random() - 0.5) * 5 + spike));
  }

  getGas(chain: string): number {
    return this.baseFees.get(chain) || 0;
  }
}

// PnL Tracker
export interface PnLEntry {
  timestamp: number;
  profit: number;
  cumulative: number;
  chain: string;
  pair: string;
}

export class PnLTracker {
  private entries: PnLEntry[] = [];
  private cumulative: number = 0;
  private highScore: number = 0;
  private wins: number = 0;
  private losses: number = 0;

  addEntry(profit: number, chain: string, pair: string) {
    this.cumulative += profit;
    if (this.cumulative > this.highScore) this.highScore = this.cumulative;
    if (profit > 0) this.wins++;
    else this.losses++;

    this.entries.push({
      timestamp: Date.now(),
      profit,
      cumulative: this.cumulative,
      chain,
      pair,
    });

    // Keep last 100 entries
    if (this.entries.length > 100) this.entries.shift();
  }

  getStats() {
    return {
      cumulative: this.cumulative,
      highScore: this.highScore,
      wins: this.wins,
      losses: this.losses,
      winRate: this.wins + this.losses > 0 ? (this.wins / (this.wins + this.losses)) * 100 : 0,
      entries: this.entries,
      last24hProfit: this.entries.slice(-24).reduce((sum, e) => sum + e.profit, 0),
    };
  }
}
