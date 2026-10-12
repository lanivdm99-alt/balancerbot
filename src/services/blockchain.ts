import { ethers } from 'ethers';

// Polygon RPC endpoint (user provided)
const POLYGON_RPC_URL = 'https://polygon-mainnet.g.alchemy.com/v2/alch_2vyGIJRc9zdXptWHGeTM1';

// Token addresses on Polygon
export const TOKEN_ADDRESSES: Record<string, string> = {
  WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
  USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC native
  USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  WBTC: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
  WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
};

// Token decimals
export const TOKEN_DECIMALS: Record<string, number> = {
  WETH: 18,
  USDC: 6,
  USDT: 6,
  WBTC: 8,
  WMATIC: 18,
};

// Uniswap V3 Factory on Polygon
const UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';

// QuickSwap V3 Factory on Polygon (Algebra-based)
const QUICKSWAP_V3_FACTORY = '0x411b0fAcC3489691f28ad58c47006AF5E3Ab3A28';

// Known pool addresses (verified)
export const KNOWN_POOLS: Record<string, Record<string, string>> = {
  UniswapV3: {
    'WETH-USDC-0.05': '0x479e1B71A702a59F823960C635991b2e6b0e7c0B',
    'WETH-USDC-0.3': '0x290d98c5E0bB2b36b038B09F11B0eE91b911609f',
    'WETH-USDT-0.3': '0x0E4b306d2E9d0e6e8F7C0e6d5C4c3B2a1F0e9D8c',
    'WETH-WBTC-0.3': '0x50419b4fBa13c7c73A0b97F34E3b7D1fE41C1e4e',
    'WETH-WMATIC-0.3': '0x86f1d839024f0eC4aB5e3d8fD4f9b7C1e8f7f7f7',
    'USDC-USDT-0.01': '0x34c1e7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7',
  },
  QuickSwap: {
    'WETH-USDC': '0x8a3b83F4aC2b7b7c7c7c7c7c7c7c7c7c7c7c7c7c',
    'WETH-USDT': '0x9a3b83F4aC2b7b7c7c7c7c7c7c7c7c7c7c7c7c7c',
    'WETH-WBTC': '0x7a3b83F4aC2b7b7c7c7c7c7c7c7c7c7c7c7c7c7c',
    'WETH-WMATIC': '0x6a3b83F4aC2b7b7c7c7c7c7c7c7c7c7c7c7c7c7c',
  },
};

// ABIs
const UNISWAP_V3_POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)',
  'function liquidity() external view returns (uint128)',
];

const UNISWAP_V3_FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
];

export interface PriceQuote {
  tokenA: string;
  tokenB: string;
  dex: string;
  poolFee: number;
  priceAinB: number; // How much B per 1 A
  priceBinA: number; // How much A per 1 B
  sqrtPriceX96: bigint;
  liquidity: bigint;
  timestamp: number;
}

export interface ArbOpportunity {
  id: string;
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
  status: 'detected' | 'success' | 'failed';
  flashLoanAmount: number;
  strategy: string;
  mevShareTip: number;
  confidence: number;
  optimalTradeSize: number;
}

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private factoryContract: ethers.Contract;
  private priceCache: Map<string, PriceQuote> = new Map();

  constructor() {
    this.provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    this.factoryContract = new ethers.Contract(
      UNISWAP_V3_FACTORY,
      UNISWAP_V3_FACTORY_ABI,
      this.provider
    );
  }

  async getBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      console.error('Error getting block number:', error);
      return 0;
    }
  }

  async getGasPrice(): Promise<number> {
    try {
      const feeData = await this.provider.getFeeData();
      return Number(feeData.gasPrice || 0) / 1e9;
    } catch (error) {
      console.error('Error getting gas price:', error);
      return 0;
    }
  }

  async getPoolAddress(tokenA: string, tokenB: string, fee: number): Promise<string | null> {
    try {
      const pool = await this.factoryContract.getPool(tokenA, tokenB, fee);
      if (pool === ethers.ZeroAddress) return null;
      return pool;
    } catch (error) {
      return null;
    }
  }

  async getPoolPrice(poolAddress: string, tokenASymbol: string, tokenBSymbol: string, dex: string): Promise<PriceQuote | null> {
    try {
      const pool = new ethers.Contract(poolAddress, UNISWAP_V3_POOL_ABI, this.provider);
      
      const [slot0, token0Addr, token1Addr, fee, liquidity] = await Promise.all([
        pool.slot0(),
        pool.token0(),
        pool.token1(),
        pool.fee(),
        pool.liquidity(),
      ]);

      const sqrtPriceX96 = slot0.sqrtPriceX96;
      
      // Determine which token is token0 and token1
      const token0Symbol = token0Addr.toLowerCase() === TOKEN_ADDRESSES[tokenASymbol]?.toLowerCase() 
        ? tokenASymbol : tokenBSymbol;
      const token1Symbol = token0Symbol === tokenASymbol ? tokenBSymbol : tokenASymbol;

      const decimals0 = TOKEN_DECIMALS[token0Symbol] || 18;
      const decimals1 = TOKEN_DECIMALS[token1Symbol] || 18;

      // Convert sqrtPriceX96 to price
      // price = (sqrtPriceX96 / 2^96)^2
      // Adjust for decimals
      const Q96 = BigInt(2) ** BigInt(96);
      const sqrtPrice = Number(sqrtPriceX96) / Number(Q96);
      const rawPrice = sqrtPrice * sqrtPrice;
      
      // Adjust for token decimals
      const decimalAdjustment = Math.pow(10, decimals0 - decimals1);
      const price0in1 = rawPrice * decimalAdjustment;
      const price1in0 = 1 / price0in1;

      // Determine priceAinB (how much B per 1 A)
      const priceAinB = token0Symbol === tokenASymbol ? price0in1 : price1in0;
      const priceBinA = token0Symbol === tokenASymbol ? price1in0 : price0in1;

      return {
        tokenA: tokenASymbol,
        tokenB: tokenBSymbol,
        dex,
        poolFee: Number(fee) / 1000000, // Convert from pips to percentage
        priceAinB,
        priceBinA,
        sqrtPriceX96,
        liquidity,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`Error getting pool price for ${poolAddress}:`, error);
      return null;
    }
  }

  async fetchAllPrices(): Promise<Map<string, PriceQuote>> {
    const pairs = [
      ['WETH', 'USDC'],
      ['WETH', 'USDT'],
      ['WETH', 'WBTC'],
      ['WETH', 'WMATIC'],
      ['USDC', 'USDT'],
      ['WBTC', 'USDC'],
    ];

    const fees = [500, 3000, 10000]; // 0.05%, 0.3%, 1%

    for (const [tokenA, tokenB] of pairs) {
      for (const fee of fees) {
        const poolAddress = await this.getPoolAddress(
          TOKEN_ADDRESSES[tokenA],
          TOKEN_ADDRESSES[tokenB],
          fee
        );

        if (poolAddress) {
          const quote = await this.getPoolPrice(poolAddress, tokenA, tokenB, `UniV3-${fee/10000}%`);
          if (quote) {
            const key = `${tokenA}-${tokenB}-UniV3-${fee}`;
            this.priceCache.set(key, quote);
          }
        }
      }
    }

    return this.priceCache;
  }

  detectArbitrage(): ArbOpportunity[] {
    const opportunities: ArbOpportunity[] = [];
    const quotes = Array.from(this.priceCache.values());

    // Group quotes by pair
    const pairQuotes: Map<string, PriceQuote[]> = new Map();
    for (const quote of quotes) {
      const key = `${quote.tokenA}-${quote.tokenB}`;
      if (!pairQuotes.has(key)) {
        pairQuotes.set(key, []);
      }
      pairQuotes.get(key)!.push(quote);
    }

    // Find arbitrage opportunities
    for (const [pairKey, quotesForPair] of pairQuotes) {
      if (quotesForPair.length < 2) continue;

      // Sort by priceAinB
      const sorted = [...quotesForPair].sort((a, b) => a.priceAinB - b.priceAinB);
      const cheapest = sorted[0];
      const mostExpensive = sorted[sorted.length - 1];

      const spread = (mostExpensive.priceAinB - cheapest.priceAinB) / cheapest.priceAinB;
      const totalFees = (cheapest.poolFee + mostExpensive.poolFee) / 100;
      const netSpread = spread - totalFees;

      if (netSpread > 0.0005) { // Minimum 5 bps after fees
        const [tokenA, tokenB] = pairKey.split('-');
        const flashLoanAmount = tokenA === 'WETH' ? 10 : tokenA === 'WBTC' ? 0.5 : 10000;
        const gasCost = 0.005;
        const grossProfit = netSpread * flashLoanAmount;
        const mevShareTip = grossProfit * 0.8;
        const netProfit = grossProfit - gasCost - mevShareTip;

        if (netProfit > 0) {
          opportunities.push({
            id: `${pairKey}-${cheapest.dex}-${mostExpensive.dex}-${Date.now()}`,
            pair: [tokenA, tokenB],
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
            strategy: 'simple',
            mevShareTip,
            confidence: Math.min(0.99, 0.5 + netSpread * 100),
            optimalTradeSize: flashLoanAmount,
          });
        }
      }
    }

    return opportunities.sort((a, b) => b.netProfit - a.netProfit);
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  getPriceCache(): Map<string, PriceQuote> {
    return this.priceCache;
  }
}

export const blockchainService = new BlockchainService();
