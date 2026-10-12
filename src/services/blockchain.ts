import { ethers } from 'ethers';

// ═══════════════════════════════════════════════════════════
// POLYGON MAINNET CONFIGURATION
// ═══════════════════════════════════════════════════════════

export const POLYGON_RPC_URL = 'https://polygon-mainnet.g.alchemy.com/v2/alch_2vyGIJRc9zdXptWHGeTM1';

// ═══════════════════════════════════════════════════════════
// ALL TOKENS ON POLYGON (High Liquidity)
// ═══════════════════════════════════════════════════════════

export const TOKENS: Record<string, { address: string; decimals: number; symbol: string }> = {
  // Major Assets
  WETH:    { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18, symbol: 'WETH' },
  WBTC:    { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', decimals: 8,  symbol: 'WBTC' },
  WMATIC:  { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18, symbol: 'WMATIC' },
  
  // Stablecoins
  USDC:    { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6,  symbol: 'USDC' },
  USDT:    { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6,  symbol: 'USDT' },
  DAI:     { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18, symbol: 'DAI' },
  miMATIC: { address: '0xa3Fa99A148fA48D14Ed51d610c367C61876997f1', decimals: 18, symbol: 'miMATIC' },
  EURS:    { address: '0xE111178A87A3BFf0c8d18DECBa5798827539Ae99', decimals: 2,  symbol: 'EURS' },
  
  // DeFi Blue Chips
  AAVE:    { address: '0xD6DF932A45C0f255f85145f286eA0b292B21C90B', decimals: 18, symbol: 'AAVE' },
  LINK:    { address: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', decimals: 18, symbol: 'LINK' },
  UNI:     { address: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f', decimals: 18, symbol: 'UNI' },
  SUSHI:   { address: '0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a', decimals: 18, symbol: 'SUSHI' },
  CRV:     { address: '0x172370d5Cd63279eFa6d502DAB29171933a610AF', decimals: 18, symbol: 'CRV' },
  BAL:     { address: '0x9a71012B13CA4d3D0Cdc72A177DF3ef03b0E76A3', decimals: 18, symbol: 'BAL' },
  COMP:    { address: '0x8505b9d2254A7Ae468c0E9dd10Ccea3B837a2DE7', decimals: 18, symbol: 'COMP' },
  
  // Gaming / Metaverse
  SAND:    { address: '0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683', decimals: 18, symbol: 'SAND' },
  MANA:    { address: '0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4', decimals: 18, symbol: 'MANA' },
  GHST:    { address: '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7', decimals: 18, symbol: 'GHST' },
  
  // Layer 2 / Infrastructure
  GHO:     { address: '0x52Cd613f1A12085E45B95d1A4fC4dBAE93B3bCCD', decimals: 18, symbol: 'GHO' },
  LDO:     { address: '0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD', decimals: 18, symbol: 'LDO' },
  
  // Wrapped / Bridged
  renBTC:  { address: '0xDBf31dF14B66535aF65AaC99C32e9eA844e14501', decimals: 8,  symbol: 'renBTC' },
  WSTETH:  { address: '0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD', decimals: 18, symbol: 'wstETH' },
  
  // Meme / Community
  QI:      { address: '0x580A84C73811E1839F75d86d75d88cCa0c241fF4', decimals: 18, symbol: 'QI' },
  DXA:     { address: '0x4A81745d58F3d2d5c2E54B6dFb341F3A86b24D5F', decimals: 18, symbol: 'DXA' },
};

// ═══════════════════════════════════════════════════════════
// ALL DEX EXCHANGES ON POLYGON (Updated 2026)
// ═══════════════════════════════════════════════════════════

export const DEXS: Record<string, {
  name: string;
  factory: string;
  type: 'uniswapV3' | 'algebra' | 'balancerV3' | 'curve' | 'dodo';
  fees: number[];
  flashLoanFee: number;
}> = {
  UniswapV3: {
    name: 'Uniswap V3',
    factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    type: 'uniswapV3',
    fees: [100, 500, 3000, 10000],
    flashLoanFee: 0,
  },
  QuickSwapV3: {
    name: 'QuickSwap V3',
    factory: '0x411b0fAcC3489691f28ad58c47006AF5E3Ab3A28',
    type: 'algebra',
    fees: [100, 500, 2500, 10000],
    flashLoanFee: 0,
  },
  SushiSwapV3: {
    name: 'SushiSwap V3',
    factory: '0x917933899c6A5F8E37F31E19f92CdBFF7e8FF049',
    type: 'uniswapV3',
    fees: [100, 500, 3000, 10000],
    flashLoanFee: 0,
  },
  RetroV3: {
    name: 'Retro V3',
    factory: '0x91e1B872Cc066B0c4A17FbB4B3b5e798e1DEc81C',
    type: 'uniswapV3',
    fees: [100, 500, 3000, 10000],
    flashLoanFee: 0,
  },
  BalancerV3: {
    name: 'Balancer V3',
    factory: '0x94eA795B2Cd476C86fD8D7e56c664aE2d76B8a2d',
    type: 'balancerV3',
    fees: [100, 500, 3000],
    flashLoanFee: 0,
  },
  DODO: {
    name: 'DODO',
    factory: '0x72d2252a86E869fC7e2C4C3d8d8B6E1C7d8d4e3f',
    type: 'dodo',
    fees: [2000],
    flashLoanFee: 0,
  },
};

// ═══════════════════════════════════════════════════════════
// FREE FLASH LOAN PROVIDERS (Updated 2026 - No Balancer V2!)
// ═══════════════════════════════════════════════════════════

export const FLASH_LOAN_PROVIDERS: Record<string, {
  name: string;
  address: string;
  fee: number;
  maxAmount: string;
  status: 'active' | 'deprecated';
}> = {
  UniswapV3Flash: {
    name: 'Uniswap V3 Flash',
    address: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    fee: 0,
    maxAmount: 'Pool Liquidity',
    status: 'active',
  },
  AaveV3: {
    name: 'Aave V3',
    address: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    fee: 5,
    maxAmount: 'Pool TVL',
    status: 'active',
  },
  Morpho: {
    name: 'Morpho Blue',
    address: '0xBBBBBbbBBB9cC5e90e3b3Af64bdAF62C37EEFFCb',
    fee: 0,
    maxAmount: 'Vault Balance',
    status: 'active',
  },
  BalancerV3: {
    name: 'Balancer V3',
    address: '0x94eA795B2Cd476C86fD8D7e56c664aE2d76B8a2d',
    fee: 0,
    maxAmount: 'Unlimited',
    status: 'active',
  },
  BalancerV2: {
    name: 'Balancer V2',
    address: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    fee: 0,
    maxAmount: 'Unlimited',
    status: 'deprecated',
  },
};

// ═══════════════════════════════════════════════════════════
// ALL TRADING PAIRS
// ═══════════════════════════════════════════════════════════

export const PRIORITY_PAIRS: [string, string][] = [
  // Stablecoin pairs
  ['USDC', 'USDT'], ['USDC', 'DAI'], ['USDT', 'DAI'],
  ['USDC', 'miMATIC'], ['USDT', 'miMATIC'],
  
  // Major asset pairs
  ['WETH', 'USDC'], ['WETH', 'USDT'], ['WETH', 'DAI'],
  ['WETH', 'WBTC'], ['WETH', 'WMATIC'], ['WETH', 'AAVE'],
  ['WETH', 'LINK'], ['WETH', 'UNI'], ['WETH', 'SUSHI'],
  
  // BTC pairs
  ['WBTC', 'USDC'], ['WBTC', 'USDT'], ['WBTC', 'DAI'],
  
  // MATIC pairs
  ['WMATIC', 'USDC'], ['WMATIC', 'USDT'], ['WMATIC', 'DAI'],
  
  // DeFi token pairs
  ['AAVE', 'USDC'], ['AAVE', 'WETH'], ['LINK', 'USDC'],
  ['LINK', 'WETH'], ['UNI', 'USDC'], ['UNI', 'WETH'],
  ['SUSHI', 'USDC'], ['SUSHI', 'WETH'], ['CRV', 'USDC'],
  ['BAL', 'USDC'], ['COMP', 'USDC'],
  
  // Gaming/Metaverse
  ['SAND', 'USDC'], ['SAND', 'WETH'], ['MANA', 'USDC'],
  ['MANA', 'WETH'], ['GHST', 'USDC'],
  
  // Cross pairs
  ['AAVE', 'LINK'], ['UNI', 'SUSHI'], ['SAND', 'MANA'],
  ['LDO', 'WETH'], ['LDO', 'USDC'],
];

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

export const MULTICALL3_ABI = [
  'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) public payable returns (tuple(bool success, bytes returnData)[] returnData)',
];

export const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';

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
  mevShareTip: number;
  confidence: number;
  optimalTradeSize: number;
  poolLiquidity: number;
}
