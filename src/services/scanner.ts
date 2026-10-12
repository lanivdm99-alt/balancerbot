import { ethers } from 'ethers';
import {
  POLYGON_RPC_URL,
  TOKENS,
  DEXS,
  PRIORITY_PAIRS,
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

  constructor() {
    this.provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
  }

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

  async getWalletBalance(address: string): Promise<number> {
    try {
      const balance = await this.provider.getBalance(address);
      return Number(ethers.formatEther(balance));
    } catch {
      return 0;
    }
  }

  async getUSDCBalance(address: string): Promise<number> {
    try {
      const contract = new ethers.Contract(
        TOKENS.USDC.address,
        ['function balanceOf(address) view returns (uint256)'],
        this.provider
      );
      const balance = await contract.balanceOf(address);
      return Number(balance) / 1e6;
    } catch {
      return 0;
    }
  }

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
      return result === 'null' ? null : pool;
    } catch {
      this.poolCache.set(cacheKey, 'null');
      return null;
    }
  }

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

  async fetchAllPrices(onProgress?: (current: number, total: number) => void): Promise<Map<string, PriceQuote>> {
    const dexKeys = Object.keys(DEXS);
    let completed = 0;
    const total = PRIORITY_PAIRS.length * dexKeys.length * 3; // 3 fees per dex

    for (const [tokenA, tokenB] of PRIORITY_PAIRS) {
      for (const dexKey of dexKeys) {
        const dex = DEXS[dexKey];
        for (const fee of dex.fees) {
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
        }
      }
    }

    return this.priceCache;
  }

  detectArbitrage(): ArbOpportunity[] {
    const opportunities: ArbOpportunity[] = [];
    const quotes = Array.from(this.priceCache.values());

    const pairQuotes: Map<string, PriceQuote[]> = new Map();
    for (const quote of quotes) {
      const key = `${quote.tokenA}-${quote.tokenB}`;
      if (!pairQuotes.has(key)) pairQuotes.set(key, []);
      pairQuotes.get(key)!.push(quote);
    }

    for (const [pairKey, quotesForPair] of pairQuotes) {
      if (quotesForPair.length < 2) continue;

      const sorted = [...quotesForPair].sort((a, b) => a.priceAinB - b.priceAinB);
      const cheapest = sorted[0];
      const mostExpensive = sorted[sorted.length - 1];
      
      if (cheapest.dex === mostExpensive.dex) continue;

      const spread = (mostExpensive.priceAinB - cheapest.priceAinB) / cheapest.priceAinB;
      const totalFees = (cheapest.poolFee + mostExpensive.poolFee) / 100;
      const netSpread = spread - totalFees;

      if (netSpread > 0.0003) {
        const [tokenA] = pairKey.split('-');
        const flashLoanAmount = tokenA === 'WETH' ? 10 : tokenA === 'WBTC' ? 0.5 : 10000;
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
            confidence: Math.min(0.99, 0.5 + netSpread * 50),
          });
        }
      }
    }

    return opportunities.sort((a, b) => b.netProfit - a.netProfit).slice(0, 10);
  }

  getPriceCache(): Map<string, PriceQuote> {
    return this.priceCache;
  }

  getPoolCount(): number {
    return this.priceCache.size;
  }
}

export const blockchainService = new BlockchainService();
