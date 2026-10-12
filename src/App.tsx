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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contracts' | 'setup' | 'docs'>('dashboard');
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
    <div className="min-h-screen bg-black overflow-hidden">
      <Header isRunning={isRunning} isDryRun={isDryRun} />

      <div className="border-b-2 border-pink-500 px-4">
        <div className="flex gap-1">
          {(['dashboard', 'contracts', 'setup', 'docs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm uppercase tracking-wider transition-all font-bold ${
                activeTab === tab
                  ? 'btn-cyan text-xs'
                  : 'shock-cyan hover:bg-cyan-500/10'
              }`}
            >
              {tab === 'dashboard' ? '⌘ Terminal' : tab === 'contracts' ? '◈ Contracts' : tab === 'setup' ? '⚙ Setup' : '⊞ Docs'}
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
      {activeTab === 'setup' && <SetupGuide />}
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

function SetupGuide() {
  return (
    <div className="p-6 max-w-4xl mx-auto overflow-y-auto h-[calc(100vh-120px)]">
      <h2 className="text-2xl shock-cyan font-bold mb-6">⚙ Setup Guide</h2>

      <div className="space-y-6 text-sm">
        <section className="box-green p-4">
          <h3 className="text-lg shock-yellow font-bold mb-3">✓ What You Have</h3>
          <div className="space-y-2 shock-cyan">
            <div className="flex items-center gap-2">
              <span className="shock-green font-bold">✓</span>
              <span>Polygon PoS RPC Endpoint (Alchemy)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="shock-green font-bold">✓</span>
              <span>FLASH-X Terminal Dashboard (this UI)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="shock-green font-bold">✓</span>
              <span>Smart Contract Code (FlashArbX.sol)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="shock-green font-bold">✓</span>
              <span>Scanner Engine Code (Scanner.ts)</span>
            </div>
          </div>
        </section>

        <section className="box-pink p-4">
          <h3 className="text-lg shock-yellow font-bold mb-3">⚠ What You Still Need</h3>
          <div className="space-y-4">
            <div>
              <p className="shock-pink font-bold mb-2">1. Arbitrum RPC Endpoint</p>
              <div className="shock-cyan text-xs space-y-1">
                <p>Get from Alchemy or Infura:</p>
                <code className="block bg-black p-2 rounded border border-pink-500">
                  https://www.alchemy.com/<br/>
                  https://www.infura.io/
                </code>
                <p className="shock-yellow mt-2">You need both HTTP and WebSocket endpoints</p>
              </div>
            </div>

            <div>
              <p className="shock-pink font-bold mb-2">2. Private Key (Hot Wallet)</p>
              <div className="shock-cyan text-xs space-y-1">
                <p className="shock-yellow">⚠️ USE A DEDICATED WALLET - Never your main wallet!</p>
                <p>Generate with Foundry:</p>
                <code className="block bg-black p-2 rounded border border-pink-500">
                  cast wallet new
                </code>
                <p className="mt-2">Fund with 0.1-0.5 ETH for gas (Arbitrum + Polygon)</p>
              </div>
            </div>

            <div>
              <p className="shock-pink font-bold mb-2">3. Flashbots Signer Key</p>
              <div className="shock-cyan text-xs space-y-1">
                <p>Register at Flashbots for private transactions:</p>
                <code className="block bg-black p-2 rounded border border-pink-500">
                  https://flashbots.net
                </code>
                <p className="mt-2">Get your auth signer key from the dashboard</p>
              </div>
            </div>

            <div>
              <p className="shock-pink font-bold mb-2">4. Deploy Smart Contract</p>
              <div className="shock-cyan text-xs space-y-1">
                <p>Install Foundry:</p>
                <code className="block bg-black p-2 rounded border border-pink-500">
                  curl -L https://foundry.paradigm.xyz | bash<br/>
                  foundryup
                </code>
                <p className="mt-2">Deploy to Arbitrum:</p>
                <code className="block bg-black p-2 rounded border border-pink-500">
                  forge script script/Deploy.s.sol \<br/>
                  &nbsp;&nbsp;--rpc-url $ARB_RPC_URL \<br/>
                  &nbsp;&nbsp;--broadcast \<br/>
                  &nbsp;&nbsp;--verify
                </code>
                <p className="mt-2">Deploy to Polygon:</p>
                <code className="block bg-black p-2 rounded border border-pink-500">
                  forge script script/Deploy.s.sol \<br/>
                  &nbsp;&nbsp;--rpc-url $POL_RPC_URL \<br/>
                  &nbsp;&nbsp;--broadcast \<br/>
                  &nbsp;&nbsp;--verify
                </code>
              </div>
            </div>

            <div>
              <p className="shock-pink font-bold mb-2">5. Configure .env File</p>
              <div className="shock-cyan text-xs space-y-1">
                <p>Copy the template:</p>
                <code className="block bg-black p-2 rounded border border-pink-500">
                  cp .env.example .env
                </code>
                <p className="mt-2">Edit .env with your values:</p>
                <code className="block bg-black p-2 rounded border border-pink-500">
                  nano .env
                </code>
                <p className="mt-2 shock-yellow">Fill in: ARB_RPC_URL, PRIVATE_KEY, FLASHBOTS_AUTH_SIGNER, contract addresses</p>
              </div>
            </div>
          </div>
        </section>

        <section className="box-cyan p-4">
          <h3 className="text-lg shock-yellow font-bold mb-3">🚀 Quick Start Commands</h3>
          <div className="space-y-3 shock-cyan text-xs">
            <div>
              <p className="shock-green font-bold">Step 1: Install Dependencies</p>
              <code className="block bg-black p-2 rounded border border-cyan-500 mt-1">
                npm install
              </code>
            </div>
            <div>
              <p className="shock-green font-bold">Step 2: Start in Dry Run Mode</p>
              <code className="block bg-black p-2 rounded border border-cyan-500 mt-1">
                npm run dev
              </code>
              <p className="shock-yellow mt-1">This starts the dashboard in simulation mode (no real transactions)</p>
            </div>
            <div>
              <p className="shock-green font-bold">Step 3: Test on Testnet</p>
              <code className="block bg-black p-2 rounded border border-cyan-500 mt-1">
                npm run bot -- --network arbitrum-sepolia --dry-run
              </code>
            </div>
            <div>
              <p className="shock-green font-bold">Step 4: Go Live (⚠️ RISK)</p>
              <code className="block bg-black p-2 rounded border border-cyan-500 mt-1">
                npm run bot -- --network arbitrum --live --flashbots
              </code>
              <p className="shock-pink mt-1">Only after thorough testing!</p>
            </div>
          </div>
        </section>

        <section className="box-yellow p-4">
          <h3 className="text-lg shock-pink font-bold mb-3">💰 Cost Breakdown</h3>
          <div className="space-y-2 shock-cyan text-xs">
            <div className="flex justify-between border-b border-yellow-500/30 pb-1">
              <span>Alchemy/Infura RPC (Arbitrum + Polygon)</span>
              <span className="shock-green font-bold">FREE - $49/month</span>
            </div>
            <div className="flex justify-between border-b border-yellow-500/30 pb-1">
              <span>Smart Contract Deployment (Arbitrum)</span>
              <span className="shock-green font-bold">~$0.50 ETH</span>
            </div>
            <div className="flex justify-between border-b border-yellow-500/30 pb-1">
              <span>Smart Contract Deployment (Polygon)</span>
              <span className="shock-green font-bold">~$2 MATIC</span>
            </div>
            <div className="flex justify-between border-b border-yellow-500/30 pb-1">
              <span>Hot Wallet Funding (gas)</span>
              <span className="shock-green font-bold">0.1-0.5 ETH</span>
            </div>
            <div className="flex justify-between border-b border-yellow-500/30 pb-1">
              <span>Flashbots (private transactions)</span>
              <span className="shock-green font-bold">FREE</span>
            </div>
            <div className="flex justify-between pt-2 shock-yellow font-bold">
              <span>Total Initial Cost</span>
              <span>~$500-1000 USD</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function DocsViewer() {
  return (
    <div className="p-6 max-w-4xl mx-auto overflow-y-auto h-[calc(100vh-120px)]">
      <h2 className="text-2xl shock-cyan font-bold mb-6">⊞ System Documentation</h2>

      <div className="space-y-6 text-sm">
        <section className="box-pink p-4">
          <h3 className="text-lg shock-yellow font-bold mb-3">▸ Architecture Overview</h3>
          <pre className="shock-cyan whitespace-pre-wrap leading-relaxed text-xs">
{`┌─────────────────────────────────────────────────────────────┐
│              FLASH-X ARBITRAGE SYSTEM v3.0                    │
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

        <section className="box-cyan p-4">
          <h3 className="text-lg shock-yellow font-bold mb-3">▸ Advanced Bot Strategies</h3>
          <div className="space-y-3 shock-cyan">
            <div>
              <p className="shock-pink font-bold">1. Flashbots MEV-Share Integration:</p>
              <code className="block bg-black p-2 mt-1 rounded text-xs border border-cyan-500">
                - Private transaction pools (no public mempool exposure){'\n'}
                - Backrunning strategy: place txs after price-moving trades{'\n'}
                - Optimal validator tips: 75-90% of profit in competitive env{'\n'}
                - Bundle submission with flash loan protection
              </code>
            </div>
            <div>
              <p className="shock-pink font-bold">2. Optimal Trade Sizing (AMM Math):</p>
              <code className="block bg-black p-2 mt-1 rounded text-xs border border-cyan-500">
                - Square root formula for optimal trade amount{'\n'}
                - profit = (spread - fees) * tradeSize - gasCost{'\n'}
                - tradeSize = sqrt(reserve_in * reserve_out * fee^2){'\n'}
                - Liquidity-weighted sizing to minimize slippage
              </code>
            </div>
            <div>
              <p className="shock-pink font-bold">3. Multi-Strategy Scanner:</p>
              <code className="block bg-black p-2 mt-1 rounded text-xs border border-cyan-500">
                - Simple 2-hop arbitrage (buy low, sell high){'\n'}
                - Triangular arbitrage (A→B→C→A cycles){'\n'}
                - Cross-chain arbitrage (Arbitrum ↔ Polygon){'\n'}
                - Flashbots bundles with MEV-Share kickback
              </code>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
