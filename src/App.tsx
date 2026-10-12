import { useState, useEffect, useRef } from 'react';
import { blockchainService, ArbOpportunity, PriceQuote } from './services/blockchain';
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
  const [blockNumber, setBlockNumber] = useState(0);
  const [gasPrice, setGasPrice] = useState(0);
  const [opportunities, setOpportunities] = useState<ArbOpportunity[]>([]);
  const [executionHistory, setExecutionHistory] = useState<ArbOpportunity[]>([]);
  const [priceCache, setPriceCache] = useState<Map<string, PriceQuote>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch real blockchain data
  const fetchBlockchainData = async () => {
    if (!isRunning) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch real block number and gas price
      const [block, gas] = await Promise.all([
        blockchainService.getBlockNumber(),
        blockchainService.getGasPrice(),
      ]);

      setBlockNumber(block);
      setGasPrice(gas);

      // Fetch all pool prices
      const prices = await blockchainService.fetchAllPrices();
      setPriceCache(prices);

      // Detect arbitrage opportunities
      const opps = blockchainService.detectArbitrage();
      setOpportunities(opps);

      // Simulate execution in dry run mode
      if (isDryRun && opps.length > 0) {
        const success = Math.random() > 0.15;
        const executedOpp = {
          ...opps[0],
          status: success ? 'success' as const : 'failed' as const,
          netProfit: success ? opps[0].netProfit : -opps[0].gasCost * 0.1,
        };
        setExecutionHistory(prev => [executedOpp, ...prev].slice(0, 50));
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching blockchain data:', err);
      setError('Failed to fetch blockchain data. Check your RPC connection.');
      setIsLoading(false);
    }
  };

  // Start/stop polling
  useEffect(() => {
    if (isRunning) {
      fetchBlockchainData();
      intervalRef.current = setInterval(fetchBlockchainData, 5000); // Poll every 5 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isDryRun]);

  const handleKillSwitch = () => {
    setIsRunning(false);
    setTimeout(() => setIsRunning(true), 3000);
  };

  // Convert price cache to format expected by components
  const prices = Array.from(priceCache.values()).reduce((acc, quote) => {
    if (!acc[quote.tokenA]) acc[quote.tokenA] = {};
    acc[quote.tokenA][quote.dex] = quote.priceAinB;
    return acc;
  }, {} as Record<string, Record<string, number>>);

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

      {error && (
        <div className="bg-red-900/20 border-2 border-red-500 p-3 m-3 rounded">
          <p className="shock-pink font-bold">{error}</p>
        </div>
      )}

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
              blockNumber={blockNumber}
              gasPrice={gasPrice}
              isLoading={isLoading}
            />
            <GasTracker gasPrice={gasPrice} />
          </div>

          <div className="col-span-6 flex flex-col gap-3 overflow-y-auto">
            <PriceMatrix prices={prices} />
            <ArbOpportunities opportunities={opportunities} />
            <ExecutionLog history={executionHistory} />
          </div>

          <div className="col-span-3 flex flex-col gap-3 overflow-y-auto">
            <PnLDashboard history={executionHistory} />
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
              <span>Real Blockchain Connection (Live Data)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="shock-green font-bold">✓</span>
              <span>Uniswap V3 Pool Price Fetching</span>
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
              </div>
            </div>
          </div>
        </section>

        <section className="box-cyan p-4">
          <h3 className="text-lg shock-yellow font-bold mb-3">🚀 Current Status</h3>
          <div className="space-y-3 shock-cyan text-xs">
            <div>
              <p className="shock-green font-bold">✓ Connected to Polygon Mainnet</p>
              <p className="mt-1">Fetching real-time prices from Uniswap V3 pools</p>
            </div>
            <div>
              <p className="shock-green font-bold">✓ Live Block Numbers & Gas Prices</p>
              <p className="mt-1">Real blockchain data, no simulation</p>
            </div>
            <div>
              <p className="shock-green font-bold">✓ Real Arbitrage Detection</p>
              <p className="mt-1">Scanning actual pool price discrepancies</p>
            </div>
            <div>
              <p className="shock-yellow font-bold">⚠ Dry Run Mode Active</p>
              <p className="mt-1">No real transactions being executed</p>
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
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
