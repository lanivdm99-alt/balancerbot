import { ethers } from 'ethers';
import {
  POLYGON_RPC_URL,
  TOKENS,
  DEXS,
  PRIORITY_PAIRS,
  FLASH_LOAN_PROVIDERS,
  UNISWAP_V3_FACTORY_ABI,
  UNISWAP_V3_POOL_ABI,
  ALGEBRA_POOL_ABI,
  PriceQuote,
  ArbOpportunity,
} from './blockchain';

/**
 * Ultra-Optimized Scanner v2.0
 * - Parallel price fetching
 * - Advanced arbitrage detection
 * - Gas optimization
 * - Real-time WebSocket updates
 * - Intelligent caching
 */
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wsProvider: ethers.WebSocketProvider | null = null;
  private priceCache: Map<string, PriceQuote> = new Map();
  private poolCache: Map<string, string> = new Map();
  private lastUpdate: number = 0;
  private updateInterval: number = 2000; // 2 seconds for faster updates
  private isInitialized = false;
  
  // Performance metrics
  private scanCount = 0;
  private totalScanTime = 0;
  private opportunitiesDetected = 0;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    this.initWebSocket();
  }

  /**
   * Initialize WebSocket connection for real-time updates
   */
  private async initWebSocket() {
    try {
      const wssUrl = POLYGON_RPC_URL.replace('https://', 'wss://');
      this.wsProvider = new ethers.WebSocketProvider(wssUrl);
      
      // Listen for new blocks
      this.wsProvider.on('block', async (blockNumber) => {
        console.log(`[WS] New block: ${blockNumber}`);
        // Trigger fast update on new block
        await this.fastUpdate();
      });
      
      console.log('[WS] WebSocket connected for real-time updates');
    } catch (err) {
      console.log('[WS] WebSocket unavailable, using HTTP polling');
    }
  }

  /**
   * Fast update on new block (only refresh prices, not pools)
   */
  private async fastUpdate() {
    if (!this.isInitialized) return;
    
    const startTime = Date.now();
    
    try {
      // Only update prices for existing pools (much faster)
      const existingPools = Array.from(this.poolCache.entries())
        .filter(([_, addr]) => addr !== 'null')
        .map(([key, addr]) => ({ key, address: addr }));
      
      // Batch update prices
      const batchSize = 50;
      for (let i = 0; i < existingPools.length; i += batchSize) {
        const batch = existingPools.slice(i, i + batchSize);
        await Promise.all(batch.map(async ({ key, address }) => {
          const [dexKey, tokenA, tokenB, fee] = key.split('-');
          const quote = await this.getPoolPrice(address, tokenA, tokenB, dexKey);
          if (quote) {
            const cacheKey = `${tokenA}-${tokenB}-${DEXS[dexKey].name}-${fee}`;
            this.priceCache.set(cacheKey, quote);
          }
        }));
      }
      
      this.lastUpdate = Date.now();
      const scanTime = Date.now() - startTime;
      this.totalScanTime += scanTime;
      this.scanCount++;
      
    } catch (err) {
      console.error('[Fast Update] Error:', err);
    }
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch {
      return 0;
    }
  }

  /**
   * Get current gas price with optimization
   */
  async getGasPrice(): Promise<number> {
    try {
      const feeData = await this.provider.getFeeData();
      const gasPrice = Number(feeData.gasPrice || 0) / 1e9;
      
      // Return optimized gas price (slightly above base for faster inclusion)
      return gasPrice * 1.1;
    } catch {
      return 0;
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(address: string): Promise<number> {
    try {
      const balance = await this.provider.getBalance(address);
      return Number(ethers.formatEther(balance));
    } catch {
      return 0;
    }
  }

  /**
   * Find pool with caching
   */
  async findPool(dexKey: string, tokenA: string, tokenB: string, fee: number): Promise<string | null> {
    const cacheKey = `${dexKey}-${tokenA}-${tokenB}-${fee}`;
    
    // Check cache first
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
      return result === 'null' ? null : pool;
    } catch {
      this.poolCache.set(cacheKey, 'null');
      return null;
    }
  }

  /**
   * Get pool price with optimized calculation
   */
  async getPoolPrice(
    poolAddress: string,
    tokenASymbol: string,
    tokenBSymbol: string,
    dexKey: string
  ): Promise<PriceQuote | null> {
    const dex = DEXS[dexKey];
    if (!dex) return null;

    try {
      if (dex.type === 'uniswapV3') {
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

        // Optimized price calculation
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
          dex: dex.name,
          dexType: dex.type,
          poolFee: Number(fee) / 1000000,
          priceAinB,
          priceBinA,
          liquidity,
          timestamp: Date.now(),
          poolAddress,
        };
      } else if (dex.type === 'algebra') {
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
          dex: dex.name,
          dexType: dex.type,
          poolFee: 0.0025,
          priceAinB,
          priceBinA,
          liquidity,
          timestamp: Date.now(),
          poolAddress,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch all prices with parallel processing
   */
  async fetchAllPrices(onProgress?: (current: number, total: number) => void): Promise<Map<string, PriceQuote>> {
    const startTime = Date.now();
    const dexKeys = Object.keys(DEXS);
    let completed = 0;
    const total = PRIORITY_PAIRS.length * dexKeys.length * 3;

    // Parallel pool discovery
    const poolPromises: Promise<void>[] = [];
    
    for (const [tokenA, tokenB] of PRIORITY_PAIRS) {
      for (const dexKey of dexKeys) {
        const dex = DEXS[dexKey];
        for (const fee of dex.fees) {
          poolPromises.push(
            (async () => {
              try {
                const poolAddress = await this.findPool(dexKey, tokenA, tokenB, fee);
                if (poolAddress) {
                  const quote = await this.getPoolPrice(poolAddress, tokenA, tokenB, dexKey);
                  if (quote) {
                    const key = `${tokenA}-${tokenB}-${dex.name}-${fee}`;
                    this.priceCache.set(key, quote);
                  }
                }
              } catch {
                // Skip failed pools
              }
              completed++;
              onProgress?.(completed, total);
            })()
          );
        }
      }
    }

    // Execute all promises in parallel (with concurrency limit)
    const concurrencyLimit = 20;
    for (let i = 0; i < poolPromises.length; i += concurrencyLimit) {
      const batch = poolPromises.slice(i, i + concurrencyLimit);
      await Promise.all(batch);
    }

    this.lastUpdate = Date.now();
    this.isInitialized = true;
    
    const scanTime = Date.now() - startTime;
    this.totalScanTime += scanTime;
    this.scanCount++;
    
    console.log(`[Scanner] Initial scan complete: ${this.priceCache.size} pools in ${scanTime}ms`);
    
    return this.priceCache;
  }

  /**
   * Advanced arbitrage detection with multiple strategies
   */
  detectArbitrage(): ArbOpportunity[] {
    const startTime = Date.now();
    const opportunities: ArbOpportunity[] = [];
    const quotes = Array.from(this.priceCache.values());

    // Group by pair
    const pairQuotes: Map<string, PriceQuote[]> = new Map();
    for (const quote of quotes) {
      const key = `${quote.tokenA}-${quote.tokenB}`;
      if (!pairQuotes.has(key)) pairQuotes.set(key, []);
      pairQuotes.get(key)!.push(quote);
    }

    // Multi-strategy detection
    for (const [pairKey, quotesForPair] of pairQuotes) {
      if (quotesForPair.length < 2) continue;

      // Strategy 1: Simple arbitrage (buy low, sell high)
      const simpleOpps = this.detectSimpleArbitrage(pairKey, quotesForPair);
      opportunities.push(...simpleOpps);

      // Strategy 2: Multi-hop arbitrage (if 3+ quotes)
      if (quotesForPair.length >= 3) {
        const multiHopOpps = this.detectMultiHopArbitrage(pairKey, quotesForPair);
        opportunities.push(...multiHopOpps);
      }
    }

    // Sort by net profit (highest first)
    opportunities.sort((a, b) => b.netProfit - a.netProfit);
    
    // Take top 20 opportunities
    const topOpps = opportunities.slice(0, 20);
    
    const scanTime = Date.now() - startTime;
    this.opportunitiesDetected += topOpps.length;
    
    console.log(`[Detection] Found ${topOpps.length} opportunities in ${scanTime}ms`);
    
    return topOpps;
  }

  /**
   * Simple arbitrage detection
   */
  private detectSimpleArbitrage(pairKey: string, quotes: PriceQuote[]): ArbOpportunity[] {
    const opportunities: ArbOpportunity[] = [];
    const sorted = [...quotes].sort((a, b) => a.priceAinB - b.priceAinB);
    
    const cheapest = sorted[0];
    const mostExpensive = sorted[sorted.length - 1];
    
    if (cheapest.dex === mostExpensive.dex) return opportunities;

    const spread = (mostExpensive.priceAinB - cheapest.priceAinB) / cheapest.priceAinB;
    const totalFees = (cheapest.poolFee + mostExpensive.poolFee) / 100;
    const netSpread = spread - totalFees;

    // Minimum 0.05% profit after fees
    if (netSpread > 0.0005) {
      const [tokenA] = pairKey.split('-');
      const flashLoanAmount = this.calculateOptimalTradeSize(tokenA, cheapest.liquidity);
      const gasCost = 0.005;
      const grossProfit = netSpread * flashLoanAmount;
      const netProfit = grossProfit - gasCost;

      if (netProfit > 0) {
        opportunities.push({
          id: `${pairKey}-${cheapest.dex}-${mostExpensive.dex}-${Date.now()}`,
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
          flashLoanProvider: 'Uniswap V3 Flash',
          flashLoanFee: 0,
          strategy: 'simple',
          confidence: Math.min(0.99, 0.5 + netSpread * 100),
        });
      }
    }

    return opportunities;
  }

  /**
   * Multi-hop arbitrage detection (A→B→C→A)
   */
  private detectMultiHopArbitrage(pairKey: string, quotes: PriceQuote[]): ArbOpportunity[] {
    // TODO: Implement triangular arbitrage
    // This would detect opportunities like:
    // WETH → USDC on Uniswap
    // USDC → DAI on QuickSwap
    // DAI → WETH on SushiSwap
    return [];
  }

  /**
   * Calculate optimal trade size based on liquidity
   */
  private calculateOptimalTradeSize(token: string, liquidity: bigint): number {
    const liqNum = Number(liquidity);
    
    // Use 5% of pool liquidity (safe amount)
    const maxBorrow = liqNum * 0.05;
    
    // Token-specific caps
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

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const avgScanTime = this.scanCount > 0 ? this.totalScanTime / this.scanCount : 0;
    
    return {
      scanCount: this.scanCount,
      avgScanTime: avgScanTime.toFixed(2),
      totalPools: this.priceCache.size,
      opportunitiesDetected: this.opportunitiesDetected,
      lastUpdate: this.lastUpdate,
    };
  }

  /**
   * Get price cache
   */
  getPriceCache(): Map<string, PriceQuote> {
    return this.priceCache;
  }

  /**
   * Get pool count
   */
  getPoolCount(): number {
    return this.priceCache.size;
  }

  /**
   * Get the provider instance
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }
}

export const blockchainService = new BlockchainService();
