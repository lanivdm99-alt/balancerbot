import { useState, useEffect } from 'react';
import { blockchainService } from '../services/scanner';
import { getFlashbotsService, FLASHBOTS_CONFIG } from '../services/flashbots';
import { getMempoolService } from '../services/mempool';
import { getStrategyEngine, STRATEGIES } from '../services/strategies';
import { getRiskManager, DEFAULT_RISK_LIMITS } from '../services/risk';
import { getPersistenceService } from '../services/persistence';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  details?: string;
  error?: string;
}

export default function TestHarness() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState(0);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');

  const runTest = async (testName: string, testFn: () => Promise<{ success: boolean; details?: string; error?: string }>): Promise<TestResult> => {
    const startTime = Date.now();
    const result: TestResult = {
      name: testName,
      status: 'running',
    };

    setTests(prev => [...prev.filter(t => t.name !== testName), result]);

    try {
      const { success, details, error } = await testFn();
      const duration = Date.now() - startTime;

      result.status = success ? 'passed' : 'failed';
      result.duration = duration;
      result.details = details;
      result.error = error;
    } catch (err) {
      result.status = 'failed';
      result.duration = Date.now() - startTime;
      result.error = err instanceof Error ? err.message : 'Unknown error';
    }

    setTests(prev => prev.map(t => t.name === testName ? result : t));
    return result;
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setOverallStatus('running');
    setTests([]);
    setCurrentTest(0);

    const testResults: TestResult[] = [];

    // Test 1: RPC Connection
    setCurrentTest(1);
    testResults.push(await runTest('RPC Connection', async () => {
      try {
        const blockNumber = await blockchainService.getBlockNumber();
        if (blockNumber > 0) {
          return { success: true, details: `Connected. Block #${blockNumber.toLocaleString()}` };
        }
        return { success: false, error: 'Block number is 0' };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Connection failed' };
      }
    }));

    // Test 2: Gas Price Fetch
    setCurrentTest(2);
    testResults.push(await runTest('Gas Price Fetch', async () => {
      try {
        const gasPrice = await blockchainService.getGasPrice();
        if (gasPrice > 0) {
          return { success: true, details: `${gasPrice.toFixed(2)} Gwei` };
        }
        return { success: false, error: 'Gas price is 0' };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Fetch failed' };
      }
    }));

    // Test 3: Pool Discovery
    setCurrentTest(3);
    testResults.push(await runTest('Pool Discovery', async () => {
      try {
        const prices = await blockchainService.fetchAllPrices();
        const poolCount = prices.size;
        if (poolCount > 0) {
          return { success: true, details: `Found ${poolCount} pools` };
        }
        return { success: false, error: 'No pools found' };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Discovery failed' };
      }
    }));

    // Test 4: Arbitrage Detection
    setCurrentTest(4);
    testResults.push(await runTest('Arbitrage Detection', async () => {
      try {
        const opportunities = blockchainService.detectArbitrage();
        return { 
          success: true, 
          details: `Found ${opportunities.length} opportunities` 
        };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Detection failed' };
      }
    }));

    // Test 5: Flashbots Service
    setCurrentTest(5);
    testResults.push(await runTest('Flashbots Service', async () => {
      try {
        const flashbots = getFlashbotsService(blockchainService.getProvider());
        const isConnected = flashbots.isConnected();
        return { 
          success: true, 
          details: isConnected ? 'Wallet connected' : 'Service initialized (no wallet)' 
        };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Service failed' };
      }
    }));

    // Test 6: Mempool Service
    setCurrentTest(6);
    testResults.push(await runTest('Mempool Service', async () => {
      try {
        const mempool = getMempoolService();
        const stats = mempool.getStats();
        return { 
          success: true, 
          details: `Service ready. ${stats.pendingCount} pending txs` 
        };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Service failed' };
      }
    }));

    // Test 7: Strategy Engine
    setCurrentTest(7);
    testResults.push(await runTest('Strategy Engine', async () => {
      try {
        const engine = getStrategyEngine();
        const strategies = engine.getAllStrategies();
        const enabled = strategies.filter(s => s.enabled).length;
        return { 
          success: true, 
          details: `${enabled}/${strategies.length} strategies enabled` 
        };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Engine failed' };
      }
    }));

    // Test 8: Risk Manager
    setCurrentTest(8);
    testResults.push(await runTest('Risk Manager', async () => {
      try {
        const risk = getRiskManager();
        const metrics = risk.getMetrics();
        const limits = risk.getLimits();
        return { 
          success: true, 
          details: `Limits: $${limits.maxDailyLoss}/day, ${limits.maxGasPrice} Gwei max` 
        };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Manager failed' };
      }
    }));

    // Test 9: Persistence
    setCurrentTest(9);
    testResults.push(await runTest('Persistence', async () => {
      try {
        const persistence = getPersistenceService();
        const usage = persistence.getStorageUsage();
        return { 
          success: true, 
          details: `Storage: ${(usage.used / 1024).toFixed(2)} KB / ${(usage.total / 1024 / 1024).toFixed(1)} MB` 
        };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Persistence failed' };
      }
    }));

    // Test 10: Risk Check
    setCurrentTest(10);
    testResults.push(await runTest('Risk Check', async () => {
      try {
        const risk = getRiskManager();
        const check = risk.checkTrade(100, 30, 1000);
        if (check.allowed) {
          return { 
            success: true, 
            details: check.warning ? `Allowed with warning: ${check.warning}` : 'Trade allowed' 
          };
        }
        return { success: false, error: check.reason || 'Trade not allowed' };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Check failed' };
      }
    }));

    setIsRunning(false);
    setCurrentTest(0);

    const allPassed = testResults.every(t => t.status === 'passed');
    setOverallStatus(allPassed ? 'passed' : 'failed');
  };

  const passedCount = tests.filter(t => t.status === 'passed').length;
  const failedCount = tests.filter(t => t.status === 'failed').length;
  const totalCount = tests.length;

  return (
    <div className="box-cyan p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg shock-cyan font-bold">🧪 Test Harness</h3>
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className={`px-4 py-2 rounded text-sm font-bold ${
            isRunning ? 'btn-pink' : 'btn-cyan'
          }`}
        >
          {isRunning ? '⏳ Running...' : '▶ Run All Tests'}
        </button>
      </div>

      {/* Overall Status */}
      {overallStatus !== 'idle' && (
        <div className={`mb-4 p-3 rounded border-2 ${
          overallStatus === 'passed' ? 'border-green-500 bg-green-500/10' :
          overallStatus === 'failed' ? 'border-pink-500 bg-pink-500/10' :
          'border-cyan-500 bg-cyan-500/10'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold">
                {overallStatus === 'passed' ? '✅ All Tests Passed' :
                 overallStatus === 'failed' ? '❌ Some Tests Failed' :
                 '⏳ Running Tests...'}
              </div>
              <div className="text-xs shock-cyan mt-1">
                {passedCount}/{totalCount} passed • {failedCount} failed
              </div>
            </div>
            {overallStatus === 'passed' && (
              <div className="text-3xl">🎉</div>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isRunning && (
        <div className="mb-4">
          <div className="flex justify-between text-xs shock-cyan mb-1">
            <span>Test {currentTest} of {10}</span>
            <span>{Math.round((currentTest / 10) * 100)}%</span>
          </div>
          <div className="h-2 bg-black rounded-full overflow-hidden border border-cyan-500">
            <div 
              className="h-full bg-cyan-500 transition-all duration-300"
              style={{ width: `${(currentTest / 10) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {tests.length === 0 ? (
          <div className="text-center py-8 shock-cyan text-sm">
            Click "Run All Tests" to verify all systems
          </div>
        ) : (
          tests.map((test, idx) => (
            <div
              key={idx}
              className={`p-3 rounded border ${
                test.status === 'passed' ? 'border-green-500 bg-green-500/5' :
                test.status === 'failed' ? 'border-pink-500 bg-pink-500/5' :
                test.status === 'running' ? 'border-cyan-500 bg-cyan-500/5' :
                'border-gray-700 bg-gray-900/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {test.status === 'passed' ? '✅' :
                     test.status === 'failed' ? '❌' :
                     test.status === 'running' ? '⏳' : '⏸️'}
                  </span>
                  <span className="text-sm font-bold shock-cyan">{test.name}</span>
                </div>
                {test.duration && (
                  <span className="text-xs shock-yellow">{test.duration}ms</span>
                )}
              </div>
              {test.details && (
                <div className="mt-1 text-xs shock-green ml-7">{test.details}</div>
              )}
              {test.error && (
                <div className="mt-1 text-xs shock-pink ml-7">{test.error}</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* System Info */}
      <div className="mt-4 pt-4 border-t border-cyan-500/30">
        <div className="text-xs shock-cyan space-y-1">
          <div className="flex justify-between">
            <span>Flashbots Relay:</span>
            <span className="shock-green">{FLASHBOTS_CONFIG.RELAY_URLS.bloXroute}</span>
          </div>
          <div className="flex justify-between">
            <span>Strategies:</span>
            <span className="shock-green">{STRATEGIES.filter(s => s.enabled).length} enabled</span>
          </div>
          <div className="flex justify-between">
            <span>Risk Limits:</span>
            <span className="shock-green">${DEFAULT_RISK_LIMITS.maxDailyLoss}/day</span>
          </div>
        </div>
      </div>
    </div>
  );
}
