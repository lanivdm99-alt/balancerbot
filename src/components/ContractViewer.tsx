import { useState } from 'react';

const FLASH_ARB_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IFlashLoanReceiver} from "@balancer/v3/contracts/vault/interfaces/IFlashLoanReceiver.sol";
import {IVault} from "@balancer/v3/contracts/vault/interfaces/IVault.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title FlashArbX
 * @notice Multi-hop atomic arbitrage executor with multi-provider flash loans
 * @dev Supports multiple FREE flash loan providers:
 *      - Balancer V3 (0 bps) - Primary provider
 *      - Uniswap V3 Flash (0 bps) - Alternative
 *      - Morpho Blue (0 bps) - Alternative
 *      - Aave V3 (5 bps) - Fallback
 *      ⚠ Balancer V2 is DEPRECATED (exploited Nov 2025) - DO NOT USE
 *      
 *      Executes multi-DEX swaps atomically with strict profit guardrails
 *      Integrates Flashbots MEV-Share for private transaction submission
 */
contract FlashArbX is IFlashLoanReceiver, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IVault public immutable vault;
    mapping(address => bool) public authorizedBots;
    mapping(address => uint256) public minProfit;
    bool public paused;

    event ArbitrageExecuted(
        address indexed token,
        uint256 flashAmount,
        uint256 profit,
        address[] route,
        uint256 mevTip
    );
    
    event BotAuthorization(address indexed bot, bool authorized);
    event MinProfitSet(address indexed token, uint256 minProfit);
    event EmergencySweep(address indexed token, uint256 amount);

    modifier onlyBot() {
        require(
            authorizedBots[msg.sender] || msg.sender == owner(),
            "FlashArbX: caller is not authorized"
        );
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "FlashArbX: contract is paused");
        _;
    }

    constructor(address _vault) Ownable(msg.sender) {
        vault = IVault(_vault);
    }

    function executeArbitrage(
        address[] calldata tokens,
        uint256[] calldata amounts,
        bytes calldata route
    ) external onlyBot whenNotPaused nonReentrant {
        (
            address[] memory dexRouters,
            bytes[] memory swapData,
            uint256 minNetProfit
        ) = abi.decode(route, (address[], bytes[], uint256));

        require(
            minNetProfit >= minProfit[tokens[0]],
            "FlashArbX: below min profit threshold"
        );

        vault.flashLoan(
            this,
            tokens,
            amounts,
            abi.encode(dexRouters, swapData, minNetProfit, tokens[0])
        );
    }

    function receiveFlashLoan(
        address[] memory tokens,
        uint256[] memory amounts,
        uint256[] memory feeAmounts,
        bytes memory userData
    ) external override nonReentrant {
        require(msg.sender == address(vault), "FlashArbX: only vault");

        (
            address[] memory dexRouters,
            bytes[] memory swapData,
            uint256 minNetProfit,
            address profitToken
        ) = abi.decode(userData, (address[], bytes[], uint256, address));

        uint256 balanceBefore = IERC20(profitToken).balanceOf(address(this));

        // Execute multi-hop swaps across DEXs
        for (uint256 i = 0; i < dexRouters.length; i++) {
            _executeSwap(dexRouters[i], swapData[i]);
        }

        uint256 balanceAfter = IERC20(profitToken).balanceOf(address(this));
        uint256 totalFees = 0;
        for (uint256 i = 0; i < feeAmounts.length; i++) {
            totalFees += feeAmounts[i];
        }
        
        uint256 netProfit = balanceAfter - balanceBefore - totalFees;

        // STRICT PROFIT GUARDRAIL: Revert if not profitable
        require(
            netProfit >= minNetProfit,
            "FlashArbX: insufficient net profit, reverting"
        );

        // Approve vault to pull back flash loan + fees
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20(tokens[i]).forceApprove(address(vault), amounts[i] + feeAmounts[i]);
        }

        // MEV-Share tip to block builder
        uint256 mevTip = netProfit * 80 / 100; // 80% to builder
        block.coinbase.transfer(mevTip);

        emit ArbitrageExecuted(profitToken, amounts[0], netProfit, dexRouters, mevTip);
    }

    function _executeSwap(address router, bytes memory swapData) internal {
        (bool success, bytes memory returnData) = router.call(swapData);
        require(success, string(abi.encodePacked("FlashArbX: swap failed: ", returnData)));
    }

    function setBotAuthorization(address bot, bool authorized) external onlyOwner {
        authorizedBots[bot] = authorized;
        emit BotAuthorization(bot, authorized);
    }

    function setMinProfit(address token, uint256 _minProfit) external onlyOwner {
        minProfit[token] = _minProfit;
        emit MinProfitSet(token, _minProfit);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }

    function emergencySweep(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "FlashArbX: no balance to sweep");
        IERC20(token).safeTransfer(owner(), balance);
        emit EmergencySweep(token, balance);
    }

    receive() external payable {
        revert("FlashArbX: no ETH transfers");
    }
}`;

const SCANNER_CODE = `/**
 * FLASH-X Off-Chain Scanner & Execution Engine v4.0
 * TypeScript / Node.js - Ultra-High-Performance MEV Bot
 * 
 * Architecture:
 * - Multicall3 batched queries (100+ pools per RPC call)
 * - WebSocket + HTTP hybrid for fastest updates
 * - Pool address caching (discovered once, reused forever)
 * - Multi-provider flash loans (Uniswap V3 Flash, Morpho, Balancer V3)
 * - Flashbots MEV-Share integration for private transactions
 * - Optimal trade sizing using AMM mathematical formulas
 * - ⚠ Balancer V2 REMOVED (deprecated after Nov 2025 exploit)
 */

import { WebSocket } from 'ws';
import { ethers } from 'ethers';

interface ChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  wssUrl: string;
  vaultAddress: string;
  flashArbAddress: string;
  dexRouters: Record<string, string>;
}

interface ArbOpportunity {
  chain: string;
  pair: [string, string];
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
  spreadBps: number;
  estimatedProfit: number;
  gasCost: number;
  netProfit: number;
  flashLoanAmount: bigint;
  optimalTradeSize: number;
  strategy: 'simple' | 'triangular' | 'cross-chain' | 'flashbots';
  mevShareTip: number;
}

class FlashArbScanner {
  private providers: Map<string, ethers.WebSocketProvider> = new Map();
  private priceCache: Map<string, Map<string, PriceQuote[]>> = new Map();
  private isRunning: boolean = false;
  private isDryRun: boolean = true;
  private flashbotsEnabled: boolean = true;
  
  constructor(private configs: ChainConfig[]) {
    this.initializeProviders();
  }

  private async initializeProviders() {
    for (const config of this.configs) {
      const provider = new ethers.WebSocketProvider(config.wssUrl);
      this.providers.set(config.name, provider);
      
      provider.on('block', async (blockNumber: number) => {
        await this.onNewBlock(config.name, blockNumber);
      });

      provider.on('pending', async (txHash: string) => {
        await this.onPendingTx(config.name, txHash);
      });
    }
  }

  private async onNewBlock(chain: string, blockNumber: number) {
    await this.refreshPrices(chain);
    const opportunities = this.scanArbitrage(chain);
    
    for (const opp of opportunities) {
      if (opp.netProfit > this.getMinProfitThreshold()) {
        if (this.isDryRun) {
          await this.simulateExecution(opp);
        } else {
          await this.executeArbitrage(opp);
        }
      }
    }
  }

  /**
   * Calculate optimal trade size using AMM math
   * Based on Flashbots simple-blind-arbitrage formula
   */
  private calculateOptimalTradeSize(
    spreadBps: number,
    buyDexFee: number,
    sellDexFee: number,
    availableLiquidity: number
  ): number {
    const netSpread = (spreadBps - buyDexFee - sellDexFee) / 10000;
    if (netSpread <= 0) return 0;
    
    // Square root formula for optimal sizing
    const optimalSize = Math.min(
      availableLiquidity * 0.1,
      Math.sqrt(availableLiquidity * netSpread * 1000)
    );
    
    return Math.max(0, optimalSize);
  }

  private scanArbitrage(chain: string): ArbOpportunity[] {
    const opportunities: ArbOpportunity[] = [];
    const chainPrices = this.priceCache.get(chain);
    if (!chainPrices) return opportunities;

    for (const [pairKey, dexQuotes] of chainPrices) {
      if (dexQuotes.length < 2) continue;

      const sorted = [...dexQuotes].sort((a, b) => a.price - b.price);
      const bestBuy = sorted[0];
      const bestSell = sorted[sorted.length - 1];

      const spreadBps = ((bestSell.price - bestBuy.price) / bestBuy.price) * 10000;
      const totalFeesBps = this.getDexFee(bestBuy.dex) + this.getDexFee(bestSell.dex);
      const netSpreadBps = spreadBps - totalFeesBps;
      
      if (netSpreadBps > 3) {
        const optimalSize = this.calculateOptimalTradeSize(
          netSpreadBps,
          this.getDexFee(bestBuy.dex),
          this.getDexFee(bestSell.dex),
          100000 // Available liquidity
        );
        
        const flashAmount = optimalSize || BigInt(10e18);
        const grossProfit = (netSpreadBps / 10000) * Number(flashAmount);
        const gasCost = await this.estimateGasCost(chain);
        
        // MEV-Share tip calculation (competitive environment)
        const mevTipPercentage = 0.75 + Math.random() * 0.15;
        const mevShareTip = grossProfit * mevTipPercentage;
        const netProfit = grossProfit - gasCost - mevShareTip;

        if (netProfit > 0) {
          opportunities.push({
            chain,
            pair: pairKey.split('/') as [string, string],
            buyDex: bestBuy.dex,
            sellDex: bestSell.dex,
            buyPrice: bestBuy.price,
            sellPrice: bestSell.price,
            spreadBps,
            estimatedProfit: grossProfit,
            gasCost,
            netProfit,
            flashLoanAmount: flashAmount,
            optimalTradeSize: optimalSize,
            strategy: this.flashbotsEnabled ? 'flashbots' : 'simple',
            mevShareTip,
          });
        }
      }
    }

    return opportunities.sort((a, b) => b.netProfit - a.netProfit);
  }

  private async executeArbitrage(opp: ArbOpportunity) {
    const config = this.configs.find(c => c.name === opp.chain)!;
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, this.providers.get(opp.chain)!);
    const contract = FlashArbX__factory.connect(config.flashArbAddress, wallet);

    const tokens = [this.getTokenAddress(opp.pair[0])];
    const amounts = [opp.flashLoanAmount];
    const route = this.encodeRoute(opp);

    if (this.flashbotsEnabled) {
      // Submit via Flashbots for private execution
      await this.submitFlashbotsBundle(contract, tokens, amounts, route);
    } else {
      // Direct execution (public mempool)
      const tx = await contract.executeArbitrage(tokens, amounts, route, {
        gasLimit: 500000,
        maxFeePerGas: ethers.parseUnits(this.getMaxGasGwei(), 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
      });
      await tx.wait();
    }
  }

  private async submitFlashbotsBundle(
    contract: any,
    tokens: string[],
    amounts: bigint[],
    route: string
  ) {
    // Flashbots bundle submission logic
    const signedBundle = await this.flashbotsProvider.signBundle([
      {
        transaction: await contract.executeArbitrage.populateTransaction(
          tokens,
          amounts,
          route
        ),
        signers: [this.wallet],
      }
    ]);
    
    const bundleReceipt = await this.flashbotsProvider.sendRawBundle(
      signedBundle,
      await this.provider.getBlockNumber() + 1
    );
    
    console.log('[FLASHBOTS] Bundle submitted:', bundleReceipt.bundleHash);
  }

  async start() {
    this.isRunning = true;
    console.log('[FLASH-X] Scanner started across ' + this.configs.length + ' chains');
    console.log('[FLASH-X] Mode: ' + (this.isDryRun ? 'DRY RUN' : 'LIVE'));
    console.log('[FLASH-X] Flashbots: ' + (this.flashbotsEnabled ? 'ENABLED' : 'DISABLED'));
  }

  async stop() {
    this.isRunning = false;
    for (const provider of this.providers.values()) {
      provider.destroy();
    }
    console.log('[FLASH-X] Scanner stopped');
  }
}

const scanner = new FlashArbScanner([
  {
    name: 'arbitrum',
    chainId: 42161,
    rpcUrl: process.env.ARB_RPC_URL!,
    wssUrl: process.env.ARB_WSS_URL!,
    vaultAddress: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    flashArbAddress: process.env.ARB_FLASH_ARB!,
    dexRouters: {
      'Balancer V3': '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      'Uniswap V3': '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      'SushiSwap V3': '0x1b02dA8Cb0d097eE8DdF7d9f39168529C2D6864c',
      'Camelot': '0x3c3A8e6423bB2C1e3d89a2F0a7c6e1D4B5C7f8A9',
    },
  },
  {
    name: 'polygon',
    chainId: 137,
    rpcUrl: process.env.POL_RPC_URL!,
    wssUrl: process.env.POL_WSS_URL!,
    vaultAddress: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    flashArbAddress: process.env.POL_FLASH_ARB!,
    dexRouters: {
      'Balancer V3': '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      'Uniswap V3': '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      'QuickSwap V3': '0xf5b509bB0909a69B161c7D84a5c8eD97f1A01800',
    },
  },
]);

scanner.start();`;

export default function ContractViewer() {
  const [activeContract, setActiveContract] = useState<'flashArb' | 'scanner'>('flashArb');

  return (
    <div className="p-4 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-lg shock-cyan font-bold">◈ Source Code</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveContract('flashArb')}
            className={`px-3 py-1 text-xs rounded transition-all ${
              activeContract === 'flashArb'
                ? 'btn-cyan'
                : 'border-2 border-cyan-500 shock-cyan hover:bg-cyan-500/10'
            }`}
          >
            FlashArbX.sol
          </button>
          <button
            onClick={() => setActiveContract('scanner')}
            className={`px-3 py-1 text-xs rounded transition-all ${
              activeContract === 'scanner'
                ? 'btn-pink'
                : 'border-2 border-pink-500 shock-pink hover:bg-pink-500/10'
            }`}
          >
            Scanner.ts
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto box-cyan">
        <pre className="p-4 text-[11px] leading-relaxed shock-cyan whitespace-pre-wrap font-mono">
          {activeContract === 'flashArb' ? FLASH_ARB_CONTRACT : SCANNER_CODE}
        </pre>
      </div>
    </div>
  );
}
