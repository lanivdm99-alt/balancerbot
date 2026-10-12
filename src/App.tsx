import { useState, useEffect, useRef } from 'react';
import { blockchainService } from './services/scanner';
import { ArbOpportunity, PriceQuote, FLASH_LOAN_PROVIDERS, DEXS, TOKENS, PRIORITY_PAIRS } from './services/blockchain';
import SpeedIndicator from './components/SpeedIndicator';
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
import FlashLoanPanel from './components/FlashLoanPanel';
import DexPanel from './components/DexPanel';
import CapitalPanel from './components/CapitalPanel';

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
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [pnl, setPnl] = useState(0);
  const [scanDuration, setScanDuration] = useState(0);
  
  // Capital management for $4 starting capital
  const STARTING_CAPITAL = 4.00;
  const [currentCapital, setCurrentCapital] = useState(STARTING_CAPITAL);
  const [transactionsUsed, setTransactionsUsed] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch real blockchain data
  const fetchBlockchainData = async () => {
    if (!isRunning) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch block number and gas price
      const [block, gas] = await Promise.all([
        blockchainService.getBlockNumber(),
        blockchainService.getGasPrice(),
      ]);

      setBlockNumber(block);
      setGasPrice(gas);

      // Fetch all pool prices with progress
      const startTime = Date.now();
      const prices = await blockchainService.fetchAllPrices((current, total) => {
        setScanProgress({ current, total });
      });
      setPriceCache(prices);
      setScanDuration(Date.now() - startTime);

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
        setPnl(prev => prev + executedOpp.netProfit);
        
        // Update capital tracking
        setCurrentCapital(prev => prev + executedOpp.netProfit);
        setTransactionsUsed(prev => prev + 1);
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
      intervalRef.current = setInterval(fetchBlockchainData, 5000); // Poll every 5 seconds (faster!)
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
            <SpeedIndicator scanDuration={scanDuration} poolCount={priceCache.size} />
            <FlashLoanPanel providers={FLASH_LOAN_PROVIDERS} />
            <DexPanel dexs={DEXS} tokenCount={Object.keys(TOKENS).length} pairCount={PRIORITY_PAIRS.length} />
            <CapitalPanel 
              startingCapital={STARTING_CAPITAL}
              currentCapital={currentCapital}
              gasPrice={gasPrice}
              transactionsRemaining={Math.max(0, Math.floor(currentCapital / 0.005))}
            />
          </div>

          <div className="col-span-6 flex flex-col gap-3 overflow-y-auto">
            {isLoading && scanProgress.total > 0 && (
              <div className="box-cyan p-3">
                <div className="flex justify-between text-xs shock-cyan mb-1">
                  <span>Scanning pools...</span>
                  <span>{scanProgress.current}/{scanProgress.total}</span>
                </div>
                <div className="h-2 bg-black rounded-full overflow-hidden border border-cyan-500">
                  <div 
                    className="h-full bg-cyan-500 transition-all duration-300"
                    style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
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
        pnl={pnl}
        capital={currentCapital}
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
              <span>Real-time Uniswap V3 Pool Prices</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="shock-green font-bold">✓</span>
              <span>{Object.keys(DEXS).length} DEX Exchanges Monitored</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="shock-green font-bold">✓</span>
              <span>{Object.keys(TOKENS).length} Tokens Tracked</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="shock-green font-bold">✓</span>
              <span>{PRIORITY_PAIRS.length} Trading Pairs Scanned</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="shock-green font-bold">✓</span>
              <span>{Object.keys(FLASH_LOAN_PROVIDERS).length} Free Flash Loan Providers</span>
            </div>
          </div>
        </section>

        <section className="box-purple p-4">
          <h3 className="text-lg shock-yellow font-bold mb-3">💎 $4 Starting Capital Strategy</h3>
          <div className="space-y-3 shock-cyan text-xs">
            <div className="border-l-2 border-purple-500 pl-3">
              <p className="shock-green font-bold mb-1">✓ Your Budget</p>
              <p>$4.00 MATIC on Polygon PoS</p>
              <p className="shock-yellow mt-1">≈ 800 transactions @ $0.005 avg gas</p>
            </div>
            
            <div className="border-l-2 border-purple-500 pl-3">
              <p className="shock-green font-bold mb-1">✓ Flash Loans = FREE Capital</p>
              <p>Borrow up to pool liquidity (no collateral needed)</p>
              <p className="shock-yellow mt-1">Only pay gas (~$0.005) + MEV tip (90% of profit)</p>
            </div>

            <div className="border-l-2 border-purple-500 pl-3">
              <p className="shock-green font-bold mb-1">✓ Minimum Profitable Trade</p>
              <p>Need &gt; $0.01 profit after gas + MEV tip</p>
              <p className="shock-yellow mt-1">Target: $0.01-0.05 per successful trade</p>
            </div>

            <div className="border-l-2 border-purple-500 pl-3">
              <p className="shock-green font-bold mb-1">✓ Growth Path</p>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div className="text-center">
                  <div className="shock-pink font-bold">$4</div>
                  <div className="text-[9px]">Start</div>
                </div>
                <div className="text-center">
                  <div className="shock-yellow font-bold">$10</div>
                  <div className="text-[9px]">~120 trades</div>
                </div>
                <div className="text-center">
                  <div className="shock-green font-bold">$50</div>
                  <div className="text-[9px]">~600 trades</div>
                </div>
              </div>
            </div>

            <div className="border-l-2 border-pink-500 pl-3 bg-pink-500/10 p-2 rounded">
              <p className="shock-pink font-bold mb-1">⚠️ Critical Rules</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Start in DRY RUN mode (no real transactions)</li>
                <li>Only execute trades with &gt; $0.01 net profit</li>
                <li>Monitor gas prices (skip if &gt; 50 Gwei)</li>
                <li>Stop if capital drops below $1</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="box-cyan p-4">
          <h3 className="text-lg shock-yellow font-bold mb-3">💰 Free Flash Loans (2026)</h3>
          <div className="space-y-2 shock-cyan text-xs">
            {Object.entries(FLASH_LOAN_PROVIDERS).filter(([_, p]) => p.status === 'active').map(([key, provider]) => (
              <div key={key} className="flex justify-between border-b border-cyan-500/30 pb-1">
                <span className="font-bold">{provider.name}</span>
                <span className={provider.fee === 0 ? 'shock-green font-bold' : 'shock-yellow'}>
                  {provider.fee === 0 ? 'FREE (0 bps)' : `${provider.fee} bps`}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-pink-500/30">
            <p className="text-[10px] shock-pink font-bold">⚠ Deprecated (Do NOT use):</p>
            {Object.entries(FLASH_LOAN_PROVIDERS).filter(([_, p]) => p.status === 'deprecated').map(([key, provider]) => (
              <div key={key} className="text-[10px] text-gray-500 line-through mt-1">
                {provider.name} - Exploited in Nov 2025
              </div>
            ))}
          </div>
        </section>

        <section className="box-pink p-4">
          <h3 className="text-lg shock-yellow font-bold mb-3">⚠ What You Still Need for Live Trading</h3>
          <div className="space-y-4">
            <div>
              <p className="shock-pink font-bold mb-2">1. Arbitrum RPC Endpoint</p>
              <div className="shock-cyan text-xs">
                <p>Get from Alchemy or Infura for cross-chain arbitrage</p>
              </div>
            </div>
            <div>
              <p className="shock-pink font-bold mb-2">2. Private Key (Hot Wallet)</p>
              <div className="shock-cyan text-xs">
                <p className="shock-yellow">⚠️ USE A DEDICATED WALLET - Never your main wallet!</p>
                <code className="block bg-black p-2 rounded border border-pink-500 mt-1">cast wallet new</code>
              </div>
            </div>
            <div>
              <p className="shock-pink font-bold mb-2">3. Flashbots Signer Key</p>
              <div className="shock-cyan text-xs">
                <p>Register at https://flashbots.net for private transactions</p>
              </div>
            </div>
            <div>
              <p className="shock-pink font-bold mb-2">4. Deploy Smart Contract</p>
              <div className="shock-cyan text-xs">
                <code className="block bg-black p-2 rounded border border-pink-500">
                  forge script script/Deploy.s.sol --rpc-url $POL_RPC_URL --broadcast --verify
                </code>
              </div>
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
          <h3 className="text-lg shock-yellow font-bold mb-3">▸ Multi-DEX Architecture</h3>
          <div className="space-y-2 shock-cyan text-xs">
            <p className="font-bold">Supported DEXs on Polygon:</p>
            {Object.entries(DEXS).map(([key, dex]) => (
              <div key={key} className="border-b border-pink-500/30 pb-1">
                <span className="shock-pink font-bold">{dex.name}</span>
                <span className="ml-2">Fee tiers: {dex.fees.map(f => `${f/10000}%`).join(', ')}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="box-cyan p-4">
          <h3 className="text-lg shock-yellow font-bold mb-3">▸ Free Flash Loan Providers</h3>
          <div className="space-y-2 shock-cyan text-xs">
            {Object.entries(FLASH_LOAN_PROVIDERS).map(([key, provider]) => (
              <div key={key} className="border-b border-cyan-500/30 pb-2">
                <p className="shock-green font-bold">{provider.name} - {provider.fee === 0 ? 'FREE' : `${provider.fee} bps`}</p>
                <p className="mt-1">Contract: {provider.address}</p>
                <p>Max Amount: {provider.maxAmount}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="box-green p-4">
          <h3 className="text-lg shock-yellow font-bold mb-3">▸ Trading Pairs ({PRIORITY_PAIRS.length})</h3>
          <div className="grid grid-cols-3 gap-2 shock-cyan text-xs">
            {PRIORITY_PAIRS.map(([a, b], i) => (
              <div key={i} className="border border-green-500/30 rounded p-1 text-center">
                {a}/{b}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
