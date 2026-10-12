import { ethers } from 'ethers';
import {
  POLYGON_RPC_URL,
  TOKENS,
  DEXS,
  FLASH_LOAN_PROVIDERS,
  PRIORITY_PAIRS,
  UNISWAP_V3_FACTORY_ABI,
  UNISWAP_V3_POOL_ABI,
  ALGEBRA_POOL_ABI,
  MULTICALL3_ABI,
  MULTICALL3_ADDRESS,
  PriceQuote,
  ArbOpportunity,
} from './blockchain';

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wsProvider: ethers.WebSocketProvider | null = null;
  private multicall: ethers.Contract;
  private priceCache: Map<string, PriceQuote> = new Map();
  private poolCache: Map<string, string> = new Map();
  private isInitialized = false;
  private scanStartTime = 0;
  private lastScanDuration = 0;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    this.multicall = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, this.provider);
    this.initWebSocket();
  }

  // ═══════════════════════════════════════════════════════════
  // WEBSOCKET INITIALIZATION (for faster updates)
  // ═══════════════════════════════════════════════════════════

  private async initWebSocket() {
    try {
      const wssUrl = POLYGON_RPC_URL.replace('https://', 'wss://');
      this.wsProvider = new ethers.WebSocketProvider(wssUrl);
      console.log('[WS] WebSocket connected for faster updates');
    } catch (err) {
      console.log('[WS] WebSocket unavailable, using HTTP polling');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // BASIC QUERIES
  // ═══════════════════════════════════════════════════════════

  async getBlockNumber(): Promise<number> {
    try {
      if (this.wsProvider) {
        return await this.wsProvider.getBlockNumber();
      }
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
  // FAST POOL DISCOVERY (batched with multicall)
  // ═══════════════════════════════════════════════════════════

  async findPoolsBatch(
    pairs: [string, string][],
    dexKey: string
  ): Promise<Map<string, string>> {
    const dex = DEXS[dexKey];
    if (!dex) return new Map();

    const results = new Map<string, string>();
    const calls: { target: string; allowFailure: boolean; callData: string }[] = [];
    const callKeys: string[] = [];

    const factory = new ethers.Contract(dex.factory, UNISWAP_V3_FACTORY_ABI, this.provider);

    for (const [tokenA, tokenB] of pairs) {
      for (const fee of dex.fees) {
        const cacheKey = `${dexKey}-${tokenA}-${tokenB}-${fee}`;
        if (this.poolCache.has(cacheKey)) {
          const cached = this.poolCache.get(cacheKey)!;
          results.set(cacheKey, cached);
          continue;
        }

        const callData = factory.interface.encodeFunctionData('getPool', [
          TOKENS[tokenA].address,
          TOKENS[tokenB].address,
          fee,
        ]);

        calls.push({
          target: dex.factory,
          allowFailure: true,
          callData,
        });
        callKeys.push(cacheKey);
      }
    }

    if (calls.length === 0) return results;

    try {
      // Batch in chunks of 100 to avoid gas limits
      const chunkSize = 100;
      for (let i = 0; i < calls.length; i += chunkSize) {
        const chunk = calls.slice(i, i + chunkSize);
        const keys = callKeys.slice(i, i + chunkSize);

        const returnData = await this.multicall.aggregate3.staticCall(chunk);

        for (let j = 0; j < returnData.length; j++) {
          const { success, returnData: data } = returnData[j];
          if (success && data !== '0x') {
            const poolAddress = factory.interface.decodeFunctionResult('getPool', data)[0];
            const result = poolAddress === ethers.ZeroAddress ? 'null' : poolAddress;
            results.set(keys[j], result);
            this.poolCache.set(keys[j], result);
          } else {
            results.set(keys[j], 'null');
            this.poolCache.set(keys[j], 'null');
          }
        }
      }
    } catch (err) {
      console.error('[Multicall] Pool discovery error:', err);
    }

    return results;
  }

  // ═══════════════════════════════════════════════════════════
  // FAST PRICE FETCHING (batched with multicall)
  // ═══════════════════════════════════════════════════════════

  async fetchPricesBatch(poolAddresses: string[]): Promise<Map<string, PriceQuote>> {
    const results = new Map<string, PriceQuote>();
    const calls: { target: string; allowFailure: boolean; callData: string }[] = [];
    const callMeta: { poolAddress: string; call: string }[] = [];

    const uniV3Interface = new ethers.Interface(UNISWAP_V3_POOL_ABI);
    const algebraInterface = new ethers.Interface(ALGEBRA_POOL_ABI);

    for (const poolAddress of poolAddresses) {
      // Try Uniswap V3 style first (slot0)
      calls.push({
        target: poolAddress,
        allowFailure: true,
        callData: uniV3Interface.encodeFunctionData('slot0'),
      });
      callMeta.push({ poolAddress, call: 'slot0' });

      // Also get token0
      calls.push({
        target: poolAddress,
        allowFailure: true,
        callData: uniV3Interface.encodeFunctionData('token0'),
      });
      callMeta.push({ poolAddress, call: 'token0' });

      // And fee
      calls.push({
        target: poolAddress,
        allowFailure: true,
        callData: uniV3Interface.encodeFunctionData('fee'),
      });
      callMeta.push({ poolAddress, call: 'fee' });

      // And liquidity
      calls.push({
        target: poolAddress,
        allowFailure: true,
        callData: uniV3Interface.encodeFunctionData('liquidity'),
      });
      callMeta.push({ poolAddress, call: 'liquidity' });
    }

    if (calls.length === 0) return results;

    try {
      const chunkSize = 200;
      for (let i = 0; i < calls.length; i += chunkSize) {
        const chunk = calls.slice(i, i + chunkSize);
        const meta = callMeta.slice(i, i + chunkSize);

        const returnData = await this.multicall.aggregate3.staticCall(chunk);

        // Group results by pool
        const poolResults = new Map<string, { slot0?: any; token0?: string; fee?: number; liquidity?: bigint }>();

        for (let j = 0; j < returnData.length; j++) {
          const { success, returnData: data } = returnData[j];
          if (!success || data === '0x') continue;

          const { poolAddress, call } = meta[j];
          if (!poolResults.has(poolAddress)) {
            poolResults.set(poolAddress, {});
          }
          const poolData = poolResults.get(poolAddress)!;

          try {
            if (call === 'slot0') {
              poolData.slot0 = uniV3Interface.decodeFunctionResult('slot0', data);
            } else if (call === 'token0') {
              poolData.token0 = uniV3Interface.decodeFunctionResult('token0', data)[0];
            } else if (call === 'fee') {
              poolData.fee = Number(uniV3Interface.decodeFunctionResult('fee', data)[0]);
            } else if (call === 'liquidity') {
              poolData.liquidity = uniV3Interface.decodeFunctionResult('liquidity', data)[0];
            }
          } catch {
            // Skip failed decodes
          }
        }

        // Process each pool
        for (const [poolAddress, data] of poolResults) {
          if (!data.slot0 || !data.token0) continue;

          // Find which tokens this pool is for
          const quote = this.processPoolData(poolAddress, data);
          if (quote) {
            const key = `${quote.tokenA}-${quote.tokenB}-${quote.dex}-${quote.poolFee}`;
            results.set(key, quote);
            this.priceCache.set(key, quote);
          }
        }
      }
    } catch (err) {
      console.error('[Multicall] Price fetch error:', err);
    }

    return results;
  }

  private processPoolData(
    poolAddress: string,
    data: { slot0?: any; token0?: string; fee?: number; liquidity?: bigint }
  ): PriceQuote | null {
    if (!data.slot0 || !data.token0) return null;

    // Find token symbols
    let tokenASymbol = '';
    let tokenBSymbol = '';
    let dexKey = '';

    for (const [key, token] of Object.entries(TOKENS)) {
      if (token.address.toLowerCase() === data.token0!.toLowerCase()) {
        // token0 is this token, find token1
        // We need to figure out the pair from our pool cache
      }
    }

    // Find the pair from pool cache
    for (const [cacheKey, cachedPool] of this.poolCache) {
      if (cachedPool.toLowerCase() === poolAddress.toLowerCase()) {
        const parts = cacheKey.split('-');
        dexKey = parts[0];
        tokenASymbol = parts[1];
        tokenBSymbol = parts[2];
        break;
      }
    }

    if (!tokenASymbol || !tokenBSymbol) return null;

    const token0Symbol = data.token0!.toLowerCase() === TOKENS[tokenASymbol].address.toLowerCase()
      ? tokenASymbol : tokenBSymbol;
    const token1Symbol = token0Symbol === tokenASymbol ? tokenBSymbol : tokenASymbol;

    const decimals0 = TOKENS[token0Symbol].decimals;
    const decimals1 = TOKENS[token1Symbol].decimals;

    const sqrtPriceX96 = data.slot0.sqrtPriceX96;
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
      dex: DEXS[dexKey]?.name || dexKey,
      dexType: DEXS[dexKey]?.type || 'unknown',
      poolFee: (data.fee || 3000) / 1000000,
      priceAinB,
      priceBinA,
      liquidity: data.liquidity || BigInt(0),
      timestamp: Date.now(),
      poolAddress,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // ULTRA-FAST SCANNER (main entry point)
  // ═══════════════════════════════════════════════════════════

  async fetchAllPrices(onProgress?: (current: number, total: number) => void): Promise<Map<string, PriceQuote>> {
    this.scanStartTime = Date.now();
    const dexKeys = Object.keys(DEXS);
    let totalPools = 0;
    let processedPools = 0;

    // Phase 1: Discover all pools (batched)
    const allPoolAddresses: string[] = [];
    
    for (const dexKey of dexKeys) {
      const poolMap = await this.findPoolsBatch(PRIORITY_PAIRS, dexKey);
      for (const [key, address] of poolMap) {
        if (address !== 'null') {
          allPoolAddresses.push(address);
          totalPools++;
        }
      }
      onProgress?.(processedPools, totalPools + PRIORITY_PAIRS.length * dexKeys.length);
    }

    // Phase 2: Fetch all prices (batched with multicall)
    const uniquePools = [...new Set(allPoolAddresses)];
    const batchSize = 50;
    
    for (let i = 0; i < uniquePools.length; i += batchSize) {
      const batch = uniquePools.slice(i, i + batchSize);
      await this.fetchPricesBatch(batch);
      processedPools += batch.length;
      onProgress?.(processedPools, uniquePools.length);
    }

    this.lastScanDuration = Date.now() - this.scanStartTime;
    this.isInitialized = true;
    console.log(`[Scanner] Scan complete: ${this.priceCache.size} pools in ${this.lastScanDuration}ms`);
    
    return this.priceCache;
  }

  // ═══════════════════════════════════════════════════════════
  // ARBITRAGE DETECTION (optimized)
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

    // Find arb for each pair
    for (const [pairKey, quotesForPair] of pairQuotes) {
      if (quotesForPair.length < 2) continue;

      const sorted = [...quotesForPair].sort((a, b) => a.priceAinB - b.priceAinB);
      
      // Only compare extremes for speed (cheapest vs most expensive)
      const cheapest = sorted[0];
      const mostExpensive = sorted[sorted.length - 1];
      
      if (cheapest.dex === mostExpensive.dex && cheapest.poolFee === mostExpensive.poolFee) continue;

      const spread = (mostExpensive.priceAinB - cheapest.priceAinB) / cheapest.priceAinB;
      const totalFees = (cheapest.poolFee + mostExpensive.poolFee) / 100;
      const netSpread = spread - totalFees;

      if (netSpread > 0.0003) {
        const [tokenA] = pairKey.split('-');
        const flashProvider = this.getBestFlashLoanProvider();
        const flashLoanAmount = this.getOptimalFlashAmount(tokenA, cheapest.liquidity);
        
        const gasCost = 0.003;
        const grossProfit = netSpread * flashLoanAmount;
        const flashFee = (flashProvider.fee / 10000) * flashLoanAmount;
        const mevShareTip = grossProfit * 0.75;
        const netProfit = grossProfit - gasCost - flashFee - mevShareTip;

        if (netProfit > 0) {
          opportunities.push({
            id: `${pairKey}-${cheapest.dex}-${mostExpensive.dex}-${Date.now()}-${Math.random()}`,
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

    return opportunities.sort((a, b) => b.netProfit - a.netProfit).slice(0, 20);
  }

  private getBestFlashLoanProvider(): { name: string; fee: number } {
    // Prefer Uniswap V3 Flash (free, most liquid)
    // Then Morpho (free)
    // Then Balancer V3 (free)
    // Then Aave V3 (5 bps)
    return { name: 'Uniswap V3 Flash', fee: 0 };
  }

  private getOptimalFlashAmount(token: string, liquidity: bigint): number {
    const liqNum = Number(liquidity);
    const maxBorrow = liqNum * 0.05; // Max 5% of pool liquidity
    
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

  getLastScanDuration(): number {
    return this.lastScanDuration;
  }
}

export const blockchainService = new BlockchainService();
