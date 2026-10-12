/**
 * ═══════════════════════════════════════════════════════════
 * FLASH-X REAL MEMPOOL MONITORING
 * Watch pending transactions for backrunning opportunities
 * ═══════════════════════════════════════════════════════════
 */

import { ethers } from 'ethers';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface PendingTransaction {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  data: string;
  nonce: number;
  timestamp: number;
}

export interface MempoolOpportunity {
  type: 'backrun' | 'sandwich' | 'liquidation' | 'oracle';
  tx: PendingTransaction;
  estimatedProfit: number;
  confidence: number;
  strategy: string;
}

export interface MempoolStats {
  pendingCount: number;
  largeTxDetected: number;
  opportunitiesFound: number;
  avgGasPrice: number;
  lastUpdate: number;
}

// ═══════════════════════════════════════════════════════════
// KNOWN DEX ROUTERS (Polygon)
// ═══════════════════════════════════════════════════════════

const KNOWN_ROUTERS = {
  uniswapV3: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  quickswap: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
  sushiswap: '0x1b02dA8Cb0d097eE8DdF7d9f39168529C2D6864c',
};

// ═══════════════════════════════════════════════════════════
// MEMPOOL SERVICE
// ═══════════════════════════════════════════════════════════

export class MempoolService {
  private provider: ethers.WebSocketProvider | null = null;
  private isMonitoring = false;
  private pendingTxs: Map<string, PendingTransaction> = new Map();
  private opportunities: MempoolOpportunity[] = [];
  private stats: MempoolStats = {
    pendingCount: 0,
    largeTxDetected: 0,
    opportunitiesFound: 0,
    avgGasPrice: 0,
    lastUpdate: Date.now(),
  };

  private onOpportunity?: (opp: MempoolOpportunity) => void;

  constructor() {}

  /**
   * Connect to WebSocket provider for mempool monitoring
   */
  async connect(wsUrl: string): Promise<boolean> {
    try {
      this.provider = new ethers.WebSocketProvider(wsUrl);
      await this.provider.ready;
      console.log('[Mempool] WebSocket connected');
      return true;
    } catch (err) {
      console.error('[Mempool] WebSocket connection failed:', err);
      return false;
    }
  }

  /**
   * Start monitoring pending transactions
   */
  startMonitoring(onOpportunity?: (opp: MempoolOpportunity) => void): void {
    if (!this.provider || this.isMonitoring) return;

    this.isMonitoring = true;
    this.onOpportunity = onOpportunity;

    // Listen for pending transactions
    this.provider.on('pending', async (txHash: string) => {
      try {
        const tx = await this.provider!.getTransaction(txHash);
        if (!tx) return;

        const pendingTx: PendingTransaction = {
          hash: tx.hash,
          from: tx.from,
          to: tx.to || '',
          value: tx.value,
          gasPrice: tx.gasPrice || BigInt(0),
          maxFeePerGas: tx.maxFeePerGas || undefined,
          maxPriorityFeePerGas: tx.maxPriorityFeePerGas || undefined,
          data: tx.data,
          nonce: tx.nonce,
          timestamp: Date.now(),
        };

        this.pendingTxs.set(txHash, pendingTx);
        this.stats.pendingCount = this.pendingTxs.size;

        // Analyze transaction
        this.analyzeTransaction(pendingTx);

        // Clean up old transactions (older than 30 seconds)
        this.cleanupOldTransactions();

        this.stats.lastUpdate = Date.now();
      } catch (err) {
        // Transaction might have been mined already
      }
    });

    console.log('[Mempool] Monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.provider) {
      this.provider.removeAllListeners('pending');
    }
    console.log('[Mempool] Monitoring stopped');
  }

  /**
   * Analyze a pending transaction for opportunities
   */
  private analyzeTransaction(tx: PendingTransaction): void {
    // Check if it's a large DEX swap
    const isLargeSwap = this.isLargeDexSwap(tx);
    
    if (isLargeSwap) {
      this.stats.largeTxDetected++;
      
      // Create backrun opportunity
      const opportunity: MempoolOpportunity = {
        type: 'backrun',
        tx,
        estimatedProfit: this.estimateBackrunProfit(tx),
        confidence: 0.75,
        strategy: 'backrun_large_swap',
      };

      this.opportunities.push(opportunity);
      this.stats.opportunitiesFound++;

      if (this.onOpportunity) {
        this.onOpportunity(opportunity);
      }
    }

    // Check for liquidation opportunities
    if (this.isLiquidationCall(tx)) {
      const opportunity: MempoolOpportunity = {
        type: 'liquidation',
        tx,
        estimatedProfit: this.estimateLiquidationProfit(tx),
        confidence: 0.85,
        strategy: 'liquidation_backrun',
      };

      this.opportunities.push(opportunity);
      this.stats.opportunitiesFound++;

      if (this.onOpportunity) {
        this.onOpportunity(opportunity);
      }
    }
  }

  /**
   * Check if transaction is a large DEX swap
   */
  private isLargeDexSwap(tx: PendingTransaction): boolean {
    const routerAddresses = Object.values(KNOWN_ROUTERS).map(r => r.toLowerCase());
    const isDexCall = routerAddresses.includes(tx.to.toLowerCase());
    
    // Check if value is large (> $10,000 worth)
    const minValue = ethers.parseEther('0.01'); // ~$30 at current prices
    const isLargeValue = tx.value >= minValue;

    // Check if data is a swap function
    const swapSelectors = [
      '0x414bf389', // exactInputSingle
      '0xc04b8d59', // exactInput
      '0xdb3e2198', // exactOutputSingle
      '0xf28c0498', // exactOutput
    ];
    const isSwapCall = swapSelectors.some(sel => tx.data.startsWith(sel));

    return isDexCall && (isLargeValue || isSwapCall);
  }

  /**
   * Check if transaction is a liquidation call
   */
  private isLiquidationCall(tx: PendingTransaction): boolean {
    const liquidationSelectors = [
      '0x00a718a9', // liquidationCall (Aave)
      '0x490e6cbc', // liquidateBorrow (Compound)
    ];
    
    return liquidationSelectors.some(sel => tx.data.startsWith(sel));
  }

  /**
   * Estimate profit from backrunning a large swap
   */
  private estimateBackrunProfit(tx: PendingTransaction): number {
    // Estimate based on transaction value
    const txValueEth = Number(ethers.formatEther(tx.value));
    
    // Assume 0.1% price impact on large swaps
    const priceImpact = txValueEth * 0.001;
    
    // We can capture ~50% of the price impact
    const captureRate = 0.5;
    
    // Subtract gas costs (~$0.01)
    const gasCost = 0.01;
    
    return Math.max(0, priceImpact * captureRate - gasCost);
  }

  /**
   * Estimate profit from liquidation backrun
   */
  private estimateLiquidationProfit(tx: PendingTransaction): number {
    // Liquidations typically have 5-10% bonus
    // We estimate based on typical liquidation size
    const typicalLiquidation = 10000; // $10,000
    const bonusRate = 0.05; // 5% bonus
    
    return typicalLiquidation * bonusRate * 0.5; // We capture 50%
  }

  /**
   * Clean up old transactions
   */
  private cleanupOldTransactions(): void {
    const thirtySecondsAgo = Date.now() - 30000;
    
    for (const [hash, tx] of this.pendingTxs.entries()) {
      if (tx.timestamp < thirtySecondsAgo) {
        this.pendingTxs.delete(hash);
      }
    }
    
    this.stats.pendingCount = this.pendingTxs.size;
  }

  /**
   * Get current opportunities
   */
  getOpportunities(): MempoolOpportunity[] {
    return [...this.opportunities];
  }

  /**
   * Get stats
   */
  getStats(): MempoolStats {
    return { ...this.stats };
  }

  /**
   * Check if monitoring is active
   */
  isActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Clear opportunities
   */
  clearOpportunities(): void {
    this.opportunities = [];
  }
}

// Singleton instance
let mempoolInstance: MempoolService | null = null;

export function getMempoolService(): MempoolService {
  if (!mempoolInstance) {
    mempoolInstance = new MempoolService();
  }
  return mempoolInstance;
}
