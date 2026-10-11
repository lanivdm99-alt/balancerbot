// Chain configurations
export const CHAINS = {
  arbitrum: {
    id: 42161,
    name: 'Arbitrum One',
    rpc: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    color: '#28a0f0',
    dexs: ['Balancer V3', 'Uniswap V3', 'SushiSwap V3', 'Camelot'],
  },
  polygon: {
    id: 137,
    name: 'Polygon PoS',
    rpc: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    color: '#8247e5',
    dexs: ['Balancer V3', 'Uniswap V3', 'QuickSwap V3'],
  },
};

// Token configurations
export const TOKENS = [
  { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, basePrice: 3450 },
  { symbol: 'USDC', name: 'USD Coin', decimals: 6, basePrice: 1.0 },
  { symbol: 'USDT', name: 'Tether', decimals: 6, basePrice: 1.0 },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, basePrice: 67500 },
  { symbol: 'ARB', name: 'Arbitrum', decimals: 18, basePrice: 1.15 },
  { symbol: 'POL', name: 'Polygon Ecosystem', decimals: 18, basePrice: 0.52 },
];

// Trading pairs
export const PAIRS = [
  ['WETH', 'USDC'],
  ['WETH', 'USDT'],
  ['WETH', 'WBTC'],
  ['WETH', 'ARB'],
  ['WETH', 'POL'],
  ['WBTC', 'USDC'],
  ['WBTC', 'USDT'],
  ['ARB', 'USDC'],
  ['POL', 'USDC'],
  ['USDC', 'USDT'],
];

// DEX fee tiers (in basis points)
export const DEX_FEES: Record<string, number> = {
  'Balancer V3': 10,
  'Uniswap V3': 30,
  'SushiSwap V3': 30,
  'Camelot': 25,
  'QuickSwap V3': 30,
};

// Flash loan fees (in basis points)
export const FLASH_LOAN_FEE = 0; // Balancer V3 flash loans are free

// Gas configurations
export const GAS_CONFIG = {
  arbitrum: { baseFee: 0.1, priorityFee: 0.01, unit: 'Gwei' },
  polygon: { baseFee: 30, priorityFee: 2, unit: 'Gwei' },
};

// Contract addresses (simulated)
export const CONTRACTS = {
  arbitrum: {
    vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    flashArb: '0x7A1b5c...FlashArbX',
  },
  polygon: {
    vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    flashArb: '0x3F2d8e...FlashArbX',
  },
};
