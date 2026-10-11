import { useState, useEffect, useRef, useCallback } from 'react';
import { PriceEngine, GasSimulator, PnLTracker, detectArbitrage, ArbOpportunity } from './utils/simulation';
import { CHAINS } from './utils/constants';
import Header from './components/Header';
import GasTracker from './components/GasTracker';
import PriceMatrix from './components/PriceMatrix';
import ArbOpportunities from './components/ArbOpportunities';
import PnLDashboard from './components/PnLDashboard';
import ExecutionLog from './components/ExecutionLog';
import ControlPanel from './components/ControlPanel';
import NetworkStatus from './components/NetworkStatus';
import ContractViewer from './components/ContractViewer';
import StatusBar from './components/StatusBar';

function App() {
  const [isRunning, setIsRunning] = useState(true);
  const [isDryRun, setIsDryRun] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contracts' | 'docs'>('dashboard');
  const [blockNumbers, setBlockNumbers] = useState({ arbitrum: 189234567, polygon: 52345678 });
  const [opportunities, setOpportunities] = useState<ArbOpportunity[]>([]);
  const [executionHistory, setExecutionHistory] = useState<ArbOpportunity[]>([]);
  const [gasPrices, setGasPrices] = useState({ arbitrum: 0.1, polygon: 30 });
  const [prices, setPrices] = useState<Record<string, Record<string, number>>>({});

  const priceEngine = useRef(new PriceEngine());
  const gasSimulator = useRef(new GasSimulator());
  const pnlTracker = useRef(new PnLTracker());
  const tickRef = useRef(0);

  const tick = useCallback(() => {
    if (!isRunning) return;

    priceEngine.current.tick();
    const currentPrices = priceEngine.current.getAllPrices();
    setPrices(currentPrices);

    gasSimulator.current.tick();
    setGasPrices({
      arbitrum: gasSimulator.current.getGas('arbitrum'),
      polygon: gasSimulator.current.getGas('polygon'),
    });

    setBlockNumbers(prev => ({
      arbitrum: prev.arbitrum + (Math.random() < 0.4 ? 1 : 0),
      polygon: prev.polygon + (Math.random() < 0.6 ? 1 : 0),
    }));

    const arbOpps = [
      ...detectArbitrage(currentPrices, 'arbitrum'),
      ...detectArbitrage(currentPrices, 'polygon'),
    ].sort((a, b) => b.netProfit - a.netProfit).slice(0, 10);

    setOpportunities(arbOpps);

    tickRef.current++;
    if (isDryRun && tickRef.current % 3 === 0 && arbOpps.length > 0) {
      const opp = arbOpps[0];
      const success = Math.random() > 0.15;
      const executedOpp = {
        ...opp,
        status: success ? 'success' as const : 'failed' as const,
        netProfit: success ? opp.netProfit : -opp.gasCost * 0.1,
      };

      pnlTracker.current.addEntry(
        executedOpp.netProfit,
        executedOpp.chain,
        executedOpp.pair.join('/'),
        executedOpp.strategy,
        executedOpp.gasCost,
        executedOpp.mevShareTip
      );

      setExecutionHistory(prev => [executedOpp, ...prev].slice(0, 50));
    }
  }, [isRunning, isDryRun]);

  useEffect(() => {
    const interval = setInterval(tick, 800);
    return () => clearInterval(interval);
  }, [tick]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        setIsRunning(prev => !prev);
      } else if (e.key === 'd' || e.key === 'D') {
        setIsDryRun(prev => !prev);
      } else if (e.key === 'k' || e.key === 'K') {
        handleKillSwitch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleKillSwitch = () => {
    setIsRunning(false);
    setTimeout(() => setIsRunning(true), 3000);
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <Header isRunning={isRunning} isDryRun={isDryRun} />

      <div className="border-b border-pink-500/30 px-4">
        <div className="flex gap-1">
          {(['dashboard', 'contracts', 'docs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'neon-button-cyan text-xs'
                  : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
              }`}
            >
              {tab === 'dashboard' ? '⌘ Terminal' : tab === 'contracts' ? '◈ Contracts' : '⊞ Docs'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="p-3 pb-8 grid grid-cols-12 gap-3 h-[calc(100vh-120px)]">
          <div className="col-span-3 flex flex-col gap-3 overflow-y-auto">
            <ControlPanel
              isRunning={isRunning}
              isDryRun={isDryRun}
              onToggleRunning={() => setIsRunning(!isRunning)}
              onToggleDryRun={() => setIsDryRun(!isDryRun)}
              onKillSwitch={handleKillSwitch}
            />
            <NetworkStatus
              blockNumbers={blockNumbers}
              gasPrices={gasPrices}
            />
            <GasTracker gasPrices={gasPrices} />
          </div>

          <div className="col-span-6 flex flex-col gap-3 overflow-y-auto">
            <PriceMatrix prices={prices} />
            <ArbOpportunities opportunities={opportunities} />
            <ExecutionLog history={executionHistory} />
          </div>

          <div className="col-span-3 flex flex-col gap-3 overflow-y-auto">
            <PnLDashboard tracker={pnlTracker.current} />
          </div>
        </div>
      )}

      {activeTab === 'contracts' && <ContractViewer />}
      {activeTab === 'docs' && <DocsViewer />}

      <StatusBar
        isRunning={isRunning}
        isDryRun={isDryRun}
        opportunities={opportunities.length}
        executions={executionHistory.length}
        pnl={executionHistory.reduce((sum, e) => sum + e.netProfit, 0)}
      />
    </div>
  );
}

function DocsViewer() {
  return (
    <div className="p-6 max-w-4xl mx-auto overflow-y-auto h-[calc(100vh-120px)]">
      <h2 className="text-2xl neon-fluffy-cyan mb-6">⊞ System Documentation</h2>

      <div className="space-y-6 text-sm">
        <section className="fluffy-box-pink p-4">
          <h3 className="text-lg neon-fluffy-yellow mb-3">▸ Architecture Overview</h3>
          <pre className="text-cyan-300 whitespace-pre-wrap leading-relaxed text-xs">
{`┌─────────────────────────────────────────────────────────────┐
│              FLASH-X NEON ARBITRAGE SYSTEM                    │
│              Multi-Chain MEV Infrastructure                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Price Oracle │───▶│  Arb Engine  │───▶│  Executor    │  │
│  │  (WebSocket)  │    │  (Scanner)   │    │  (Contract)  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Multi-DEX   │    │  Risk Guard  │    │  Balancer V3 │  │
│  │  Aggregator  │    │  (Min Profit)│    │  Vault Flash │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
│  Strategies: Simple Arb ◈ Triangular ◈ Cross-Chain ◈ MEV   │
│  Chains: Arbitrum One ◈ Polygon PoS                         │
│  DEXs: Balancer V3, Uniswap V3, SushiSwap, Camelot, QS     │
└─────────────────────────────────────────────────────────────┘`}
          </pre>
        </section>

        <section className="fluffy-box-cyan p-4">
          <h3 className="text-lg neon-fluffy-green mb-3">▸ Advanced Bot Strategies</h3>
          <div className="space-y-3 text-cyan-300">
            <div>
              <p className="neon-fluffy-pink">1. Flashbots MEV-Share Integration:</p>
              <code className="block bg-black/50 p-2 mt-1 rounded text-xs">
                - Private transaction pools (no public mempool exposure){'\n'}
                - Backrunning strategy: place txs after price-moving trades{'\n'}
                - Optimal validator tips: 75-90% of profit in competitive env{'\n'}
                - Bundle submission with flash loan protection
              </code>
            </div>
            <div>
              <p className="neon-fluffy-pink">2. Optimal Trade Sizing (AMM Math):</p>
              <code className="block bg-black/50 p-2 mt-1 rounded text-xs">
                - Square root formula for optimal trade amount{'\n'}
                - profit = (spread - fees) * tradeSize - gasCost{'\n'}
                - tradeSize = sqrt(reserve_in * reserve_out * fee^2){'\n'}
                - Liquidity-weighted sizing to minimize slippage
              </code>
            </div>
            <div>
              <p className="neon-fluffy-pink">3. Multi-Strategy Scanner:</p>
              <code className="block bg-black/50 p-2 mt-1 rounded text-xs">
                - Simple 2-hop arbitrage (buy low, sell high){'\n'}
                - Triangular arbitrage (A→B→C→A cycles){'\n'}
                - Cross-chain arbitrage (Arbitrum ↔ Polygon){'\n'}
                - Flashbots bundles with MEV-Share kickback
              </code>
            </div>
          </div>
        </section>

        <section className="fluffy-box-green p-4">
          <h3 className="text-lg neon-fluffy-yellow mb-3">▸ Deployment Guide</h3>
          <div className="space-y-3 text-cyan-300">
            <div>
              <p className="neon-fluffy-cyan">1. Local Simulation (Dry Run):</p>
              <code className="block bg-black/50 p-2 mt-1 rounded text-xs">
                $ cp .env.example .env{'\n'}
                $ npm run simulate{'\n'}
                $ # Starts Anvil fork + scanner in paper-trade mode
              </code>
            </div>
            <div>
              <p className="neon-fluffy-cyan">2. Testnet Testing:</p>
              <code className="block bg-black/50 p-2 mt-1 rounded text-xs">
                $ forge script script/Deploy.s.sol --rpc-url $ARB_SEPOLIA_RPC --broadcast{'\n'}
                $ npm run bot -- --network arbitrum-sepolia --dry-run
              </code>
            </div>
            <div>
              <p className="neon-fluffy-cyan">3. Mainnet Live:</p>
              <code className="block bg-black/50 p-2 mt-1 rounded text-xs">
                $ forge script script/Deploy.s.sol --rpc-url $ARB_MAINNET_RPC --broadcast --verify{'\n'}
                $ npm run bot -- --network arbitrum --live --flashbots
              </code>
            </div>
          </div>
        </section>

        <section className="fluffy-box-yellow p-4">
          <h3 className="text-lg neon-fluffy-pink mb-3">▸ Environment Variables (.env)</h3>
          <pre className="text-cyan-300 whitespace-pre-wrap text-xs bg-black/50 p-3 rounded">
{`# RPC Providers (Use private endpoints for low latency)
ARB_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
ARB_WSS_URL=wss://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
POL_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
POL_WSS_URL=wss://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY

# Flashbots (for private transaction submission)
FLASHBOTS_AUTH_SIGNER=0x...
FLASHBOTS_RELAY_URL=https://relay.flashbots.net

# Wallet (USE A DEDICATED HOT WALLET)
PRIVATE_KEY=0x...
WALLET_ADDRESS=0x...

# Contract Addresses (post-deployment)
ARB_FLASH_ARB=0x...
POL_FLASH_ARB=0x...

# Bot Configuration
MIN_PROFIT_USD=5.00
MAX_GAS_GWEI=100
SCAN_INTERVAL_MS=500
DRY_RUN=true
USE_FLASHBOTS=true
MEV_TIP_PERCENTAGE=80

# Alerting
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...`}
          </pre>
        </section>
      </div>
    </div>
  );
}

export default App;
