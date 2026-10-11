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

    // Update prices
    priceEngine.current.tick();
    const currentPrices = priceEngine.current.getAllPrices();
    setPrices(currentPrices);

    // Update gas
    gasSimulator.current.tick();
    setGasPrices({
      arbitrum: gasSimulator.current.getGas('arbitrum'),
      polygon: gasSimulator.current.getGas('polygon'),
    });

    // Update block numbers
    setBlockNumbers(prev => ({
      arbitrum: prev.arbitrum + (Math.random() < 0.4 ? 1 : 0),
      polygon: prev.polygon + (Math.random() < 0.6 ? 1 : 0),
    }));

    // Detect arbitrage
    const arbOpps = [
      ...detectArbitrage(currentPrices, 'arbitrum'),
      ...detectArbitrage(currentPrices, 'polygon'),
    ].sort((a, b) => b.netProfit - a.netProfit).slice(0, 10);

    setOpportunities(arbOpps);

    // Simulate execution in dry run mode
    tickRef.current++;
    if (isDryRun && tickRef.current % 3 === 0 && arbOpps.length > 0) {
      const opp = arbOpps[0];
      const success = Math.random() > 0.15; // 85% success rate
      const executedOpp = {
        ...opp,
        status: success ? 'success' as const : 'failed' as const,
        netProfit: success ? opp.netProfit : -opp.gasCost * 0.1,
      };

      pnlTracker.current.addEntry(
        executedOpp.netProfit,
        executedOpp.chain,
        executedOpp.pair.join('/')
      );

      setExecutionHistory(prev => [executedOpp, ...prev].slice(0, 50));
    }
  }, [isRunning, isDryRun]);

  useEffect(() => {
    const interval = setInterval(tick, 800);
    return () => clearInterval(interval);
  }, [tick]);

  // Keyboard shortcuts
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
    <div className="min-h-screen bg-black text-green-400 font-mono overflow-hidden">
      {/* Scanline effect */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)'
        }}
      />

      <Header isRunning={isRunning} isDryRun={isDryRun} />

      {/* Tab Navigation */}
      <div className="border-b border-green-900/50 px-4">
        <div className="flex gap-1">
          {(['dashboard', 'contracts', 'docs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5'
                  : 'text-green-600 hover:text-green-400'
              }`}
            >
              {tab === 'dashboard' ? '⌘ Terminal' : tab === 'contracts' ? '◈ Contracts' : '⊞ Docs'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="p-3 pb-8 grid grid-cols-12 gap-3 h-[calc(100vh-120px)]">
          {/* Left Column - Controls & Network */}
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

          {/* Center Column - Main Data */}
          <div className="col-span-6 flex flex-col gap-3 overflow-y-auto">
            <PriceMatrix prices={prices} />
            <ArbOpportunities opportunities={opportunities} />
            <ExecutionLog history={executionHistory} />
          </div>

          {/* Right Column - PnL */}
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
      <h2 className="text-2xl text-cyan-400 mb-6">⊞ System Documentation</h2>

      <div className="space-y-6 text-sm">
        <section className="border border-green-900/50 rounded p-4">
          <h3 className="text-lg text-yellow-400 mb-3">▸ Architecture Overview</h3>
          <pre className="text-green-300 whitespace-pre-wrap leading-relaxed">
{`┌─────────────────────────────────────────────────────────────┐
│                    FLASH-X ARBITRAGE SYSTEM                   │
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
│  Chains: Arbitrum One ◈ Polygon PoS                         │
│  DEXs: Balancer V3, Uniswap V3, SushiSwap, Camelot, QS     │
└─────────────────────────────────────────────────────────────┘`}
          </pre>
        </section>

        <section className="border border-green-900/50 rounded p-4">
          <h3 className="text-lg text-yellow-400 mb-3">▸ Deployment Guide</h3>
          <div className="space-y-3 text-green-300">
            <div>
              <p className="text-cyan-400">1. Local Simulation (Dry Run):</p>
              <code className="block bg-black/50 p-2 mt-1 rounded text-xs">
                $ cp .env.example .env{'\n'}
                $ npm run simulate{'\n'}
                $ # Starts Anvil fork + scanner in paper-trade mode
              </code>
            </div>
            <div>
              <p className="text-cyan-400">2. Testnet Testing:</p>
              <code className="block bg-black/50 p-2 mt-1 rounded text-xs">
                $ forge script script/Deploy.s.sol --rpc-url $ARB_SEPOLIA_RPC --broadcast{'\n'}
                $ npm run bot -- --network arbitrum-sepolia --dry-run
              </code>
            </div>
            <div>
              <p className="text-cyan-400">3. Mainnet Live:</p>
              <code className="block bg-black/50 p-2 mt-1 rounded text-xs">
                $ forge script script/Deploy.s.sol --rpc-url $ARB_MAINNET_RPC --broadcast --verify{'\n'}
                $ npm run bot -- --network arbitrum --live
              </code>
            </div>
          </div>
        </section>

        <section className="border border-green-900/50 rounded p-4">
          <h3 className="text-lg text-yellow-400 mb-3">▸ Environment Variables (.env)</h3>
          <pre className="text-green-300 whitespace-pre-wrap text-xs bg-black/50 p-3 rounded">
{`# RPC Providers
ARB_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
ARB_WSS_URL=wss://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
POL_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
POL_WSS_URL=wss://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY

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

# Alerting
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...`}
          </pre>
        </section>

        <section className="border border-green-900/50 rounded p-4">
          <h3 className="text-lg text-yellow-400 mb-3">▸ Risk Guardrails</h3>
          <ul className="list-disc list-inside space-y-1 text-green-300">
            <li>Minimum net profit threshold enforced on-chain (reverts if unprofitable)</li>
            <li>Flash loan fee: 0 bps (Balancer V3 free flash loans)</li>
            <li>Maximum slippage tolerance: 0.5% per swap leg</li>
            <li>Atomic execution: entire tx reverts if any step fails</li>
            <li>ReentrancyGuard on all external calls</li>
            <li>Ownable access control with multi-sig recommendation</li>
            <li>Emergency sweep function for stuck tokens</li>
            <li>Gas price ceiling to prevent overpaying during congestion</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default App;
