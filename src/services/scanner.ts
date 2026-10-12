import { ethers } from 'ethers';
import {
  POLYGON_RPC_URL,
  TOKENS,
  DEXS,
  FLASH_LOAN_PROVIDERS,
  PRIORITY_PAIRS,
  generateAllPairs,
  UNISWAP_V3_FACTORY_ABI,
  UNISWAP_V3_POOL_ABI,
  ALGEBRA_POOL_ABI,
  PriceQuote,
  ArbOpportunity,
} from './blockchain';

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private priceCache: Map<string, PriceQuote> = new Map();
  private poolCache: Map<string, string> = new Map();
  private isInitialized = false;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
  }

  // ═══════════════════════════════════════════════════════════
  // BASIC QUERIES
  // ═══════════════════════════════════════════════════════════

  async getBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch {
      return 0;
    }
  }

  async getGasPrice(): Promise<number> {
    try {
      const feeData = await this.provider.getFeeData();
      return Number(feeData.gasPrice || 0) / 1e9;
    } catch {
      return 0;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // POOL DISCOVERY
  // ═══════════════════════════════════════════════════════════

  async findPool(dexKey: string, tokenA: string, tokenB: string, fee: number): Promise<string | null> {
    const cacheKey = `${dexKey}-${tokenA}-${tokenB}-${fee}`;
    if (this.poolCache.has(cacheKey)) {
      const cached = this.poolCache.get(cacheKey)!;
      return cached === 'null' ? null : cached;
    }

    const dex = DEXS[dexKey];
    if (!dex) return null;

    try {
      const factory = new ethers.Contract(dex.factory, UNISWAP_V3_FACTORY_ABI, this.provider);
      const pool = await factory.getPool(
        TOKENS[tokenA].address,
        TOKENS[tokenB].address,
        fee
      );
      
      const result = pool === ethers.ZeroAddress ? 'null' : pool;
      this.poolCache.set(cacheKey, result);
      return result === 'null' ? null : result;
    } catch {
      this.poolCache.set(cacheKey, 'null');
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PRICE FETCHING
  // ═══════════════════════════════════════════════════════════

  async getPoolPrice(
    poolAddress: string,
    tokenASymbol: string,
    tokenBSymbol: string,
    dexKey: string
  ): Promise<PriceQuote | null> {
    const dex = DEXS[dexKey];
    if (!dex) return null;

    try {
      if (DEXS[dexKey].type === 'uniswapV3') {
        return await this.getUniswapV3Price(poolAddress, tokenASymbol, tokenBSymbol, dexKey);
      } else if (DEXS[dexKey].type === 'algebra') {
        return await this.getAlgebraPrice(poolAddress, tokenASymbol, tokenBSymbol, dexKey);
      }
      return null;
    } catch {
      return null;
    }
  }

  private async getUniswapV3Price(
    poolAddress: string,
    tokenASymbol: string,
    tokenBSymbol: string,
    dexKey: string
  ): Promise<PriceQuote | null> {
    try {
      const pool = new ethers.Contract(poolAddress, UNISWAP_V3_POOL_ABI, this.provider);
      const [slot0, token0Addr, fee, liquidity] = await Promise.all([
        pool.slot0(),
        pool.token0(),
        pool.fee(),
        pool.liquidity(),
      ]);

      const sqrtPriceX96 = slot0.sqrtPriceX96;
      const token0Symbol = token0Addr.toLowerCase() === TOKENS[tokenASymbol].address.toLowerCase()
        ? tokenASymbol : tokenBSymbol;
      const token1Symbol = token0Symbol === tokenASymbol ? tokenBSymbol : tokenASymbol;

      const decimals0 = TOKENS[token0Symbol].decimals;
      const decimals1 = TOKENS[token1Symbol].decimals;

      const Q96 = BigInt(2) ** BigInt(96);
      const sqrtPrice = Number(sqrtPriceX96) / Number(Q96);
      const rawPrice = sqrtPrice * sqrtPrice;
      const decimalAdjustment = Math.pow(10, decimals0 - decimals1);
      const price0in1 = rawPrice * decimalAdjustment;
      const price1in0 = 1 / price0in1;

      const priceAinB = token0Symbol === tokenASymbol ? price0in1 : price1in0;
      const priceBinA = token0Symbol === tokenASymbol ? price1in0 : price0in1;

      return {
        tokenA: tokenASymbol,
        tokenB: tokenBSymbol,
        dex: DEXS[dexKey].name,
        dexType: DEXS[dexKey].type,
        poolFee: Number(fee) / 1000000,
        priceAinB,
        priceBinA,
        liquidity,
        timestamp: Date.now(),
        poolAddress,
      };
    } catch {
      return null;
    }
  }

  private async getAlgebraPrice(
    poolAddress: string,
    tokenASymbol: string,
    tokenBSymbol: string,
    dexKey: string
  ): Promise<PriceQuote | null> {
    try {
      const pool = new ethers.Contract(poolAddress, ALGEBRA_POOL_ABI, this.provider);
      const [globalState, token0Addr, liquidity] = await Promise.all([
        pool.globalState(),
        pool.token0(),
        pool.liquidity(),
      ]);

      const sqrtPriceX96 = globalState.price;
      const token0Symbol = token0Addr.toLowerCase() === TOKENS[tokenASymbol].address.toLowerCase()
        ? tokenASymbol : tokenBSymbol;
      const token1Symbol = token0Symbol === tokenASymbol ? tokenBSymbol : tokenASymbol;

      const decimals0 = TOKENS[token0Symbol].decimals;
      const decimals1 = TOKENS[token1Symbol].decimals;

      const Q96 = BigInt(2) ** BigInt(96);
      const sqrtPrice = Number(sqrtPriceX96) / Number(Q96);
      const rawPrice = sqrtPrice * sqrtPrice;
      const decimalAdjustment = Math.pow(10, decimals0 - decimals1);
      const price0in1 = rawPrice * decimalAdjustment;
      const price1in0 = 1 / price0in1;

      const priceAinB = token0Symbol === tokenASymbol ? price0in1 : price1in0;
      const priceBinA = token0Symbol === tokenASymbol ? price1in0 : price0in1;

      return {
        tokenA: tokenASymbol,
        tokenB: tokenBSymbol,
        dex: DEXS[dexKey].name,
        dexType: DEXS[dexKey].type,
        poolFee: 0.0025, // Algebra uses dynamic fees, avg ~0.25%
        priceAinB,
        priceBinA,
        liquidity,
        timestamp: Date.now(),
        poolAddress,
      };
    } catch {
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // BATCH PRICE FETCHING
  // ═══════════════════════════════════════════════════════════

  async fetchAllPrices(onProgress?: (current: number, total: number) => void): Promise<Map<string, PriceQuote>> {
    const allPairs = PRIORITY_PAIRS;
    const dexKeys = Object.keys(DEXS);
    const tasks: { pair: [string, string]; dex: string; fee: number }[] = [];

    // Build task list
    for (const [tokenA, tokenB] of allPairs) {
      for (const dexKey of dexKeys) {
        const dex = DEXS[dexKey];
        for (const fee of dex.fees) {
          tasks.push({ pair: [tokenA, tokenB], dex: dexKey, fee });
        }
      }
    }

    let completed = 0;
    const total = tasks.length;

    // Process in batches to avoid rate limiting
    const batchSize = 20;
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (task) => {
          const poolAddress = await this.findPool(task.dex, task.pair[0], task.pair[1], task.fee);
          if (poolAddress) {
            const quote = await this.getPoolPrice(poolAddress, task.pair[0], task.pair[1], task.dex);
            if (quote) {
              const key = `${task.pair[0]}-${task.pair[1]}-${DEXS[task.dex].name}-${task.fee}`;
              this.priceCache.set(key, quote);
            }
          }
        })
      );
      completed += batch.length;
      onProgress?.(completed, total);
    }

    this.isInitialized = true;
    return this.priceCache;
  }

  // ═══════════════════════════════════════════════════════════
  // ARBITRAGE DETECTION
  // ═══════════════════════════════════════════════════════════

  detectArbitrage(): ArbOpportunity[] {
    const opportunities: ArbOpportunity[] = [];
    const quotes = Array.from(this.priceCache.values());

    // Group by pair
    const pairQuotes: Map<string, PriceQuote[]> = new Map();
    for (const quote of quotes) {
      const key = `${quote.tokenA}-${quote.tokenB}`;
      if (!pairQuotes.has(key)) pairQuotes.set(key, []);
      pairQuotes.get(key)!.push(quote);
    }

    // Find best arb for each pair
    for (const [pairKey, quotesForPair] of pairQuotes) {
      if (quotesForPair.length < 2) continue;

      // Sort by priceAinB
      const sorted = [...quotesForPair].sort((a, b) => a.priceAinB - b.priceAinB);
      
      // Compare cheapest vs most expensive
      for (let i = 0; i < sorted.length; i++) {
        for (let j = sorted.length - 1; j > i; j--) {
          const cheapest = sorted[i];
          const mostExpensive = sorted[j];
          
          if (cheapest.dex === mostExpensive.dex && cheapest.poolFee === mostExpensive.poolFee) continue;

          const spread = (mostExpensive.priceAinB - cheapest.priceAinB) / cheapest.priceAinB;
          const totalFees = (cheapest.poolFee + mostExpensive.poolFee) / 100;
          const netSpread = spread - totalFees;

          if (netSpread > 0.0003) {
            const [tokenA] = pairKey.split('-');
            
            // Determine optimal flash loan (free ones first)
            const flashProvider = this.getBestFlashLoanProvider(tokenA);
            const flashLoanAmount = this.getOptimalFlashAmount(tokenA, cheapest.liquidity);
            
            const gasCost = 0.003; // Polygon gas is cheap
            const grossProfit = netSpread * flashLoanAmount;
            const flashFee = (flashProvider.fee / 10000) * flashLoanAmount;
            const mevShareTip = grossProfit * 0.75;
            const netProfit = grossProfit - gasCost - flashFee - mevShareTip;

            if (netProfit > 0) {
              const id = `${pairKey}-${cheapest.dex}-${mostExpensive.dex}-${Date.now()}-${Math.random()}`;
              opportunities.push({
                id,
                pair: pairKey.split('-') as [string, string],
                buyDex: cheapest.dex,
                sellDex: mostExpensive.dex,
                buyPrice: cheapest.priceAinB,
                sellPrice: mostExpensive.priceAinB,
                spread,
                spreadBps: spread * 10000,
                estimatedProfit: grossProfit,
                gasCost,
                netProfit,
                timestamp: Date.now(),
                status: 'detected',
                flashLoanAmount,
                flashLoanProvider: flashProvider.name,
                flashLoanFee: flashProvider.fee,
                strategy: netSpread > 0.005 ? 'flashbots' : 'simple',
                mevShareTip,
                confidence: Math.min(0.99, 0.5 + netSpread * 50),
                optimalTradeSize: flashLoanAmount,
                poolLiquidity: Number(cheapest.liquidity),
              });
            }
          }
        }
      }
    }

    return opportunities.sort((a, b) => b.netProfit - a.netProfit).slice(0, 20);
  }

  private getBestFlashLoanProvider(token: string): { name: string; fee: number } {
    // Balancer V2 is free (0 bps) - best choice
    return { name: 'Balancer V2', fee: 0 };
  }

  private getOptimalFlashAmount(token: string, liquidity: bigint): number {
    // Use a fraction of available liquidity
    const liqNum = Number(liquidity);
    const maxBorrow = liqNum * 0.1; // Max 10% of pool liquidity
    
    // Cap based on token
    const caps: Record<string, number> = {
      WETH: 100,
      WBTC: 5,
      WMATIC: 100000,
      USDC: 500000,
      USDT: 500000,
      DAI: 500000,
    };
    
    const cap = caps[token] || 10000;
    return Math.min(cap, maxBorrow);
  }

  // ═══════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════

  getPriceCache(): Map<string, PriceQuote> {
    return this.priceCache;
  }

  getPoolCount(): number {
    return this.priceCache.size;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  getFlashLoanProviders() {
    return FLASH_LOAN_PROVIDERS;
  }

  getDexCount(): number {
    return Object.keys(DEXS).length;
  }

  getTokenCount(): number {
    return Object.keys(TOKENS).length;
  }

  getPairCount(): number {
    return PRIORITY_PAIRS.length;
  }
}

export const blockchainService = new BlockchainService();
