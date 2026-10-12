import { ethers } from 'ethers';

// ═══════════════════════════════════════════════════════════
// POLYGON ONLY - Starting Chain
// ═══════════════════════════════════════════════════════════

export const POLYGON_RPC_URL = 'https://polygon-mainnet.g.alchemy.com/v2/alch_2vyGIJRc9zdXptWHGeTM1';

// ═══════════════════════════════════════════════════════════
// TOKENS ON POLYGON
// ═══════════════════════════════════════════════════════════

export const TOKENS: Record<string, { address: string; decimals: number; symbol: string }> = {
  WETH:    { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18, symbol: 'WETH' },
  WBTC:    { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', decimals: 8,  symbol: 'WBTC' },
  WMATIC:  { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18, symbol: 'WMATIC' },
  USDC:    { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6,  symbol: 'USDC' },
  USDT:    { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6,  symbol: 'USDT' },
  DAI:     { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18, symbol: 'DAI' },
  AAVE:    { address: '0xD6DF932A45C0f255f85145f286eA0b292B21C90B', decimals: 18, symbol: 'AAVE' },
  LINK:    { address: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', decimals: 18, symbol: 'LINK' },
  UNI:     { address: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f', decimals: 18, symbol: 'UNI' },
  SUSHI:   { address: '0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a', decimals: 18, symbol: 'SUSHI' },
};

// ═══════════════════════════════════════════════════════════
// DEXs ON POLYGON
// ═══════════════════════════════════════════════════════════

export const DEXS: Record<string, {
  name: string;
  factory: string;
  type: 'uniswapV3' | 'algebra';
  fees: number[];
}> = {
  UniswapV3: {
    name: 'Uniswap V3',
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    type: 'uniswapV3',
    fees: [500, 3000, 10000],
  },
  QuickSwapV3: {
    name: 'QuickSwap V3',
    factory: '0x411b0fAcC3489691f28ad58c47006AF5E3Ab3A28',
    type: 'algebra',
    fees: [500, 2500, 10000],
  },
  SushiSwapV3: {
    name: 'SushiSwap V3',
    factory: '0x917933899c6A5F8E37F31E19f92CdBFF7e8FF049',
    type: 'uniswapV3',
    fees: [500, 3000, 10000],
  },
};

// ═══════════════════════════════════════════════════════════
// FREE FLASH LOANS
// ═══════════════════════════════════════════════════════════

export const FLASH_LOAN_PROVIDERS: Record<string, {
  name: string;
  address: string;
  fee: number;
  maxAmount: string;
}> = {
  UniswapV3Flash: {
    name: 'Uniswap V3 Flash',
    address: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    fee: 0,
    maxAmount: 'Pool Liquidity',
  },
  Morpho: {
    name: 'Morpho Blue',
    address: '0xBBBBBbbBBB9cC5e90e3b3Af64bdAF62C37EEFFCb',
    fee: 0,
    maxAmount: 'Vault Balance',
  },
  AaveV3: {
    name: 'Aave V3',
    address: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    fee: 5,
    maxAmount: 'Pool TVL',
  },
};

// ═══════════════════════════════════════════════════════════
// TRADING PAIRS
// ═══════════════════════════════════════════════════════════

export const PRIORITY_PAIRS: [string, string][] = [
  ['WETH', 'USDC'], ['WETH', 'USDT'], ['WETH', 'DAI'],
  ['WETH', 'WBTC'], ['WETH', 'WMATIC'],
  ['WBTC', 'USDC'], ['WBTC', 'USDT'],
  ['WMATIC', 'USDC'], ['WMATIC', 'USDT'],
  ['USDC', 'USDT'], ['USDC', 'DAI'], ['USDT', 'DAI'],
  ['AAVE', 'WETH'], ['AAVE', 'USDC'],
  ['LINK', 'WETH'], ['LINK', 'USDC'],
  ['UNI', 'WETH'], ['UNI', 'USDC'],
  ['SUSHI', 'WETH'], ['SUSHI', 'USDC'],
];

// ═══════════════════════════════════════════════════════════
// GAME CONFIGURATION
// ═══════════════════════════════════════════════════════════

export const GAME_CONFIG = {
  startingCapital: 4.00,
  unlockArbitrumAt: 100.00,
  xpPerTrade: 10,
  xpPerWin: 25,
  xpPerBigWin: 100, // >$0.10 profit
  levels: [
    { level: 1, name: 'Newbie', xpRequired: 0, color: '#888888' },
    { level: 2, name: 'Apprentice', xpRequired: 100, color: '#00ff41' },
    { level: 3, name: 'Trader', xpRequired: 300, color: '#00ffff' },
    { level: 4, name: 'Sniper', xpRequired: 700, color: '#ffff00' },
    { level: 5, name: 'Whale', xpRequired: 1500, color: '#ff00ff' },
    { level: 6, name: 'MEV Lord', xpRequired: 3000, color: '#ff6600' },
    { level: 7, name: 'Flash God', xpRequired: 6000, color: '#ff0066' },
  ],
  achievements: [
    { id: 'first_trade', name: 'First Blood', desc: 'Execute your first trade', icon: '🎯' },
    { id: 'ten_wins', name: 'Hot Streak', desc: 'Win 10 trades in a row', icon: '🔥' },
    { id: 'profit_10', name: 'Double Down', desc: 'Reach $10 capital', icon: '💰' },
    { id: 'profit_50', name: 'Half Way', desc: 'Reach $50 capital', icon: '💎' },
    { id: 'profit_100', name: 'Century Club', desc: 'Reach $100 capital', icon: '👑' },
    { id: 'big_fish', name: 'Big Fish', desc: 'Single trade profit > $0.50', icon: '🐋' },
    { id: 'speed_demon', name: 'Speed Demon', desc: '5 trades in 1 minute', icon: '⚡' },
    { id: 'perfect_10', name: 'Perfect 10', desc: '100% win rate over 10 trades', icon: '✨' },
    { id: 'scanner', name: 'Pool Scanner', desc: 'Scan 1000 pools', icon: '🔍' },
    { id: 'arbitrum_unlock', name: 'Multi-Chain', desc: 'Unlock Arbitrum', icon: '🌐' },
    { id: 'contract_deployer', name: 'Contract Deployer', desc: 'Deploy FlashArbX contract', icon: '📜' },
    { id: 'flashbots_pro', name: 'Flashbots Pro', desc: 'Use MEV-Share integration', icon: '🤖' },
  ],
};

// ═══════════════════════════════════════════════════════════
// ABIs
// ═══════════════════════════════════════════════════════════

export const UNISWAP_V3_FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
];

export const UNISWAP_V3_POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)',
  'function liquidity() external view returns (uint128)',
];

export const ALGEBRA_POOL_ABI = [
  'function globalState() external view returns (uint160 price, int24 tick, uint16 fee, uint8 timepointIndex, uint8 communityFeeToken0, uint8 communityFeeToken1, bool unlocked)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function liquidity() external view returns (uint128)',
];

export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface PriceQuote {
  tokenA: string;
  tokenB: string;
  dex: string;
  dexType: string;
  poolFee: number;
  priceAinB: number;
  priceBinA: number;
  liquidity: bigint;
  timestamp: number;
  poolAddress: string;
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
  flashLoanProvider: string;
  flashLoanFee: number;
  strategy: string;
  confidence: number;
}

export interface Monster {
  type: string;
  level: number;
  xp: number;
  color: string;
  unlocked: boolean;
}

export interface GameState {
  capital: number;
  xp: number;
  level: number;
  streak: number;
  bestStreak: number;
  totalTrades: number;
  wins: number;
  losses: number;
  biggestWin: number;
  poolsScanned: number;
  unlockedAchievements: string[];
  arbitrumUnlocked: boolean;
  tradesThisMinute: number;
  lastTradeTime: number;
  monsters: Monster[];
  flashLoanUsed: number; // Total flash loan amount used
  flashLoanProfit: number; // Profit from flash loans
}

export const INITIAL_GAME_STATE: GameState = {
  capital: GAME_CONFIG.startingCapital,
  xp: 0,
  level: 1,
  streak: 0,
  bestStreak: 0,
  totalTrades: 0,
  wins: 0,
  losses: 0,
  biggestWin: 0,
  poolsScanned: 0,
  unlockedAchievements: [],
  arbitrumUnlocked: false,
  tradesThisMinute: 0,
  lastTradeTime: 0,
  monsters: [
    { type: 'flash', level: 1, xp: 0, color: '#ff0066', unlocked: true },
  ],
  flashLoanUsed: 0,
  flashLoanProfit: 0,
};
