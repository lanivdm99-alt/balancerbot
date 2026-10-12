import { useState, useEffect, useRef } from 'react';
import { blockchainService } from './services/scanner';
import {
  ArbOpportunity,
  PriceQuote,
  FLASH_LOAN_PROVIDERS,
  DEXS,
  TOKENS,
  PRIORITY_PAIRS,
  GAME_CONFIG,
  GameState,
  INITIAL_GAME_STATE,
} from './services/blockchain';

const CONTRACT_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FlashArbX is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct ArbParams {
        address tokenA;
        address tokenB;
        address buyRouter;
        address sellRouter;
        uint256 amountIn;
        uint256 minProfit;
        bytes buyCalldata;
        bytes sellCalldata;
    }

    address public constant UNISWAP_V3_FLASH = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public mevShareRecipient;
    uint256 public minProfitThreshold;
    uint256 public maxGasPrice;
    uint256 public totalTrades;
    uint256 public totalProfit;
    mapping(address => bool) public authorizedBots;

    event ArbitrageExecuted(address indexed tokenA, address indexed tokenB, uint256 amountIn, uint256 profit);
    event BotAuthorized(address indexed bot, bool authorized);

    modifier onlyAuthorized() {
        require(authorizedBots[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(address _mevShareRecipient, uint256 _minProfit, uint256 _maxGas) Ownable(msg.sender) {
        mevShareRecipient = _mevShareRecipient;
        minProfitThreshold = _minProfit;
        maxGasPrice = _maxGas;
        authorizedBots[msg.sender] = true;
    }

    function executeArbitrage(ArbParams calldata params) external onlyAuthorized nonReentrant {
        require(params.amountIn > 0, "Amount must be > 0");
        require(params.minProfit >= minProfitThreshold, "Below min profit");
        require(tx.gasprice <= maxGasPrice, "Gas too high");

        uint256 balanceBefore = IERC20(params.tokenA).balanceOf(address(this));

        IUniswapV3Flash(UNISWAP_V3_FLASH).flash(
            address(this), params.tokenA, params.tokenB, params.amountIn, abi.encode(params)
        );

        uint256 balanceAfter = IERC20(params.tokenA).balanceOf(address(this));
        uint256 profit = balanceAfter - balanceBefore;
        require(profit >= params.minProfit, "Insufficient profit");

        if (mevShareRecipient != address(0) && profit > 0) {
            IERC20(params.tokenA).safeTransfer(mevShareRecipient, profit * 90 / 100);
        }

        totalTrades++;
        totalProfit += profit;
        emit ArbitrageExecuted(params.tokenA, params.tokenB, params.amountIn, profit);
    }

    function uniswapV3FlashCallback(uint256 fee0, uint256, bytes calldata data) external {
        require(msg.sender == UNISWAP_V3_FLASH, "Unauthorized");
        ArbParams memory params = abi.decode(data, (ArbParams));
        
        (bool s1, ) = params.buyRouter.call(params.buyCalldata);
        require(s1, "Buy failed");
        (bool s2, ) = params.sellRouter.call(params.sellCalldata);
        require(s2, "Sell failed");
        
        IERC20(params.tokenA).safeTransfer(UNISWAP_V3_FLASH, params.amountIn + fee0);
    }

    function setBotAuthorization(address bot, bool auth) external onlyOwner {
        authorizedBots[bot] = auth;
        emit BotAuthorized(bot, auth);
    }

    function emergencyWithdraw(address token) external onlyOwner {
        IERC20(token).safeTransfer(owner(), IERC20(token).balanceOf(address(this)));
    }
}

interface IUniswapV3Flash {
    function flash(address recipient, address token0, address token1, uint256 amount0, bytes calldata data) external;
}`;

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [blockNumber, setBlockNumber] = useState(0);
  const [gasPrice, setGasPrice] = useState(0);
  const [opportunities, setOpportunities] = useState<ArbOpportunity[]>([]);
  const [priceCache, setPriceCache] = useState<Map<string, PriceQuote>>(new Map());
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [tradeLog, setTradeLog] = useState<ArbOpportunity[]>([]);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'achievement' } | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'achievement' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Connect Bitget Wallet
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).bitkeep?.ethereum) {
      try {
        const provider = (window as any).bitkeep.ethereum;
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          const balance = await blockchainService.getWalletBalance(accounts[0]);
          setWalletBalance(balance);
          setWalletConnected(true);
          setShowWalletModal(false);
          showNotification('Bitget Wallet Connected!', 'success');
        }
      } catch (err) {
        showNotification('Failed to connect wallet', 'error');
      }
    } else if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const provider = (window as any).ethereum;
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          const balance = await blockchainService.getWalletBalance(accounts[0]);
          setWalletBalance(balance);
          setWalletConnected(true);
          setShowWalletModal(false);
          showNotification('Wallet Connected!', 'success');
        }
      } catch (err) {
        showNotification('Failed to connect wallet', 'error');
      }
    } else {
      showNotification('No wallet detected. Install Bitget Wallet!', 'error');
    }
  };

  // Check achievements
  const checkAchievements = (state: GameState): GameState => {
    const newState = { ...state };
    const newAchievements: string[] = [];

    const checks: { id: string; condition: boolean; message: string }[] = [
      { id: 'first_trade', condition: state.totalTrades >= 1, message: '🎯 First Blood!' },
      { id: 'ten_wins', condition: state.streak >= 10, message: '🔥 Hot Streak!' },
      { id: 'profit_10', condition: state.capital >= 10, message: '💰 Double Down!' },
      { id: 'profit_50', condition: state.capital >= 50, message: '💎 Half Way!' },
      { id: 'profit_100', condition: state.capital >= 100, message: '👑 Century Club!' },
      { id: 'big_fish', condition: state.biggestWin >= 0.50, message: '🐋 Big Fish!' },
      { id: 'speed_demon', condition: state.tradesThisMinute >= 5, message: '⚡ Speed Demon!' },
      { id: 'scanner', condition: state.poolsScanned >= 1000, message: '🔍 Pool Scanner!' },
      { id: 'arbitrum_unlock', condition: state.arbitrumUnlocked, message: '🌐 Multi-Chain Unlocked!' },
    ];

    for (const check of checks) {
      if (check.condition && !state.unlockedAchievements.includes(check.id)) {
        newState.unlockedAchievements = [...newState.unlockedAchievements, check.id];
        newAchievements.push(check.message);
      }
    }

    // Unlock Arbitrum at $100
    if (state.capital >= GAME_CONFIG.unlockArbitrumAt && !state.arbitrumUnlocked) {
      newState.arbitrumUnlocked = true;
      showNotification('🌐 ARBITRUM UNLOCKED! Multi-chain mode activated!', 'achievement');
    }

    if (newAchievements.length > 0) {
      showNotification(newAchievements[0], 'achievement');
    }

    return newState;
  };

  // Calculate level from XP
  const getLevel = (xp: number) => {
    let level = GAME_CONFIG.levels[0];
    for (const l of GAME_CONFIG.levels) {
      if (xp >= l.xpRequired) level = l;
    }
    return level;
  };

  // Fetch blockchain data
  const fetchData = async () => {
    if (!isRunning || !walletConnected) return;

    try {
      const [block, gas] = await Promise.all([
        blockchainService.getBlockNumber(),
        blockchainService.getGasPrice(),
      ]);

      setBlockNumber(block);
      setGasPrice(gas);

      // Update wallet balance
      if (walletAddress) {
        const balance = await blockchainService.getWalletBalance(walletAddress);
        setWalletBalance(balance);
      }

      // Fetch prices
      const prices = await blockchainService.fetchAllPrices((current, total) => {
        setScanProgress({ current, total });
      });
      setPriceCache(prices);

      // Update pools scanned
      setGameState(prev => ({
        ...prev,
        poolsScanned: prev.poolsScanned + prices.size,
      }));

      // Detect opportunities
      const opps = blockchainService.detectArbitrage();
      setOpportunities(opps);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  // Execute a trade (simulated for now)
  const executeTrade = (opp: ArbOpportunity) => {
    if (!walletConnected) {
      showNotification('Connect your wallet first!', 'error');
      return;
    }

    const success = Math.random() > 0.2; // 80% success rate
    const profit = success ? opp.netProfit : -opp.gasCost;
    
    const executedOpp = {
      ...opp,
      status: success ? 'success' as const : 'failed' as const,
      netProfit: profit,
    };

    setTradeLog(prev => [executedOpp, ...prev].slice(0, 50));

    setGameState(prev => {
      let newState = {
        ...prev,
        capital: prev.capital + profit,
        totalTrades: prev.totalTrades + 1,
        wins: success ? prev.wins + 1 : prev.wins,
        losses: !success ? prev.losses + 1 : prev.losses,
        streak: success ? prev.streak + 1 : 0,
        bestStreak: success ? Math.max(prev.bestStreak, prev.streak + 1) : prev.bestStreak,
        biggestWin: profit > prev.biggestWin ? profit : prev.biggestWin,
        xp: prev.xp + (success ? GAME_CONFIG.xpPerWin : GAME_CONFIG.xpPerTrade / 2),
        tradesThisMinute: prev.tradesThisMinute + 1,
        lastTradeTime: Date.now(),
      };

      // Big win bonus XP
      if (profit > 0.10) {
        newState.xp += GAME_CONFIG.xpPerBigWin;
      }

      // Calculate level
      const currentLevel = getLevel(newState.xp);
      newState.level = currentLevel.level;

      // Check achievements
      newState = checkAchievements(newState);

      return newState;
    });

    // Reset trades per minute counter every minute
    setTimeout(() => {
      setGameState(prev => ({ ...prev, tradesThisMinute: 0 }));
    }, 60000);

    if (success) {
      showNotification(`+$${profit.toFixed(4)} profit!`, 'success');
    } else {
      showNotification(`-$${Math.abs(profit).toFixed(4)} gas burned`, 'error');
    }
  };

  // Start/stop scanning
  useEffect(() => {
    if (isRunning && walletConnected) {
      fetchData();
      intervalRef.current = setInterval(fetchData, 5000);
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
  }, [isRunning, walletConnected]);

  const currentLevel = getLevel(gameState.xp);
  const nextLevel = GAME_CONFIG.levels.find(l => l.level === currentLevel.level + 1);
  const xpProgress = nextLevel 
    ? ((gameState.xp - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)) * 100
    : 100;

  const prices = Array.from(priceCache.values()).reduce((acc, quote) => {
    if (!acc[quote.tokenA]) acc[quote.tokenA] = {};
    acc[quote.tokenA][quote.dex] = quote.priceAinB;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  return (
    <div className="min-h-screen bg-black overflow-hidden text-white">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border-2 font-bold animate-pulse ${
          notification.type === 'success' ? 'border-green-500 bg-green-500/20 shock-green' :
          notification.type === 'error' ? 'border-pink-500 bg-pink-500/20 shock-pink' :
          'border-yellow-500 bg-yellow-500/20 shock-yellow'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="border-b-2 border-pink-500 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <pre className="text-[10px] leading-none hidden sm:block shock-pink font-bold">
{`███████╗██╗      █████╗ ███████╗  ██████╗  ╔═╗╔═╗╔═╗
██╔════╝██║     ██╔══██╗██╔════╝  ██╔══██╗ ║╠═╝║╠═╝╚═╗
█████╗  ██║     ███████║███████╗  ██████╔╝ ║╚═╗║╚═╗╔═╝
██╔══╝  ██║     ██╔══██║╚════██║  ██╔══██╗ ╚═══╝╚══╝╚═╝
██║     ███████╗██║  ██║███████║  ██║  ██║
╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝  ╚═╝  ╚═╝`}
            </pre>
            <div className="sm:hidden">
              <span className="text-xl font-bold shock-pink">FLASH-X</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Level Badge */}
            <div className="px-3 py-1 border-2 rounded" style={{ borderColor: currentLevel.color }}>
              <span className="text-xs font-bold" style={{ color: currentLevel.color }}>
                LVL {currentLevel.level} {currentLevel.name}
              </span>
            </div>

            {/* Capital */}
            <div className="px-3 py-1 border-2 border-green-500 rounded">
              <span className="text-xs font-bold shock-green">
                💎 ${gameState.capital.toFixed(2)}
              </span>
            </div>

            {/* Wallet */}
            {walletConnected ? (
              <div className="px-3 py-1 border-2 border-cyan-500 rounded">
                <span className="text-xs font-bold shock-cyan">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
            ) : (
              <button
                onClick={() => setShowWalletModal(true)}
                className="px-3 py-1 btn-pink text-xs"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="box-cyan p-6 max-w-md w-full mx-4">
            <h2 className="text-xl shock-cyan font-bold mb-4">🔗 Connect Wallet</h2>
            <p className="shock-yellow text-sm mb-4">
              Link your Bitget Wallet to start trading
            </p>
            <button
              onClick={connectWallet}
              className="w-full btn-cyan py-3 text-sm font-bold mb-2"
            >
              🦊 Connect Bitget Wallet
            </button>
            <button
              onClick={() => setShowWalletModal(false)}
              className="w-full py-2 text-xs shock-pink hover:underline"
            >
              Cancel
            </button>
            <p className="text-[10px] shock-pink mt-4">
              ⚠️ Make sure your wallet is on Polygon network
            </p>
          </div>
        </div>
      )}

      {/* Contract Modal */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="box-purple p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl shock-purple font-bold">📜 FlashArbX Contract</h2>
              <button
                onClick={() => setShowContractModal(false)}
                className="shock-pink text-xl hover:scale-110 transition-transform"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="box-cyan p-3">
                <h3 className="shock-cyan font-bold mb-2">🚀 Deploy to Polygon</h3>
                <p className="text-xs shock-yellow mb-2">
                  Copy this Solidity code and deploy using Foundry or Remix
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(CONTRACT_CODE);
                      showNotification('Contract code copied!', 'success');
                    }}
                    className="btn-cyan px-4 py-2 text-xs"
                  >
                    📋 Copy Code
                  </button>
                  <a
                    href="https://remix.ethereum.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-green px-4 py-2 text-xs"
                  >
                    🔗 Open Remix
                  </a>
                </div>
              </div>

              <div className="bg-black border-2 border-purple-500 rounded p-4 overflow-x-auto">
                <pre className="text-[10px] shock-green whitespace-pre-wrap font-mono">
                  {CONTRACT_CODE}
                </pre>
              </div>

              <div className="box-yellow p-3">
                <h3 className="shock-yellow font-bold mb-2">⚙️ Deployment Command</h3>
                <code className="text-[10px] shock-cyan block bg-black p-2 rounded">
                  forge create --rpc-url $POLYGON_RPC --private-key $PRIVATE_KEY --constructor-args 0xYOUR_ADDRESS 10000000000000000 50000000000 contracts/FlashArbX.sol:FlashArbX
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      {!walletConnected ? (
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-3xl shock-cyan font-bold mb-4">Welcome to FLASH-X</h2>
            <p className="shock-yellow mb-6">The Ultimate Flash Loan Arbitrage Game</p>
            <button
              onClick={() => setShowWalletModal(true)}
              className="btn-pink px-8 py-3 text-lg font-bold"
            >
              🚀 START GAME - Connect Wallet
            </button>
            <div className="mt-8 text-sm shock-cyan">
              <p>Starting Capital: <span className="shock-green font-bold">$4.00</span></p>
              <p>Chain: <span className="shock-green font-bold">Polygon PoS</span></p>
              <p>Flash Loans: <span className="shock-green font-bold">FREE</span></p>
              <p className="mt-2 shock-yellow">🔒 Arbitrum unlocks at $100</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 pb-8 grid grid-cols-12 gap-3 h-[calc(100vh-80px)]">
          {/* Left Column - Game Stats */}
          <div className="col-span-3 flex flex-col gap-3 overflow-y-auto">
            {/* Game Panel */}
            <div className="box-purple p-3">
              <h3 className="text-xs uppercase tracking-wider shock-yellow mb-3 font-bold">
                🎮 Game Stats
              </h3>
              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between">
                  <span className="shock-cyan">Level:</span>
                  <span className="font-bold" style={{ color: currentLevel.color }}>
                    {currentLevel.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="shock-cyan">XP:</span>
                  <span className="shock-green font-bold">{gameState.xp}</span>
                </div>
                <div className="h-1 bg-black rounded-full overflow-hidden border border-purple-500">
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ 
                      width: `${xpProgress}%`,
                      backgroundColor: currentLevel.color,
                    }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="shock-cyan">Streak:</span>
                  <span className="shock-yellow font-bold">🔥 {gameState.streak}</span>
                </div>
                <div className="flex justify-between">
                  <span className="shock-cyan">Best Streak:</span>
                  <span className="shock-green font-bold">{gameState.bestStreak}</span>
                </div>
                <div className="flex justify-between">
                  <span className="shock-cyan">Win Rate:</span>
                  <span className="shock-green font-bold">
                    {gameState.totalTrades > 0 
                      ? ((gameState.wins / gameState.totalTrades) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="shock-cyan">Biggest Win:</span>
                  <span className="shock-green font-bold">${gameState.biggestWin.toFixed(4)}</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="box-pink p-3">
              <h3 className="text-xs uppercase tracking-wider shock-cyan mb-3 font-bold">
                ⌘ Controls
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`w-full px-3 py-2 rounded text-xs font-bold ${
                    isRunning ? 'btn-pink' : 'btn-cyan'
                  }`}
                >
                  {isRunning ? '⏸ Pause' : '▶ Start Scanner'}
                </button>
                <button
                  onClick={() => setShowContractModal(true)}
                  className="w-full px-3 py-2 rounded btn-green text-xs font-bold"
                >
                  📜 View Contract
                </button>
                <button
                  onClick={() => setWalletConnected(false)}
                  className="w-full px-3 py-2 rounded btn-red text-xs font-bold"
                >
                  🔌 Disconnect
                </button>
              </div>
            </div>

            {/* Network */}
            <div className="box-cyan p-3">
              <h3 className="text-xs uppercase tracking-wider shock-pink mb-2 font-bold">
                🌐 Network
              </h3>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="shock-cyan">Polygon:</span>
                  <span className="shock-green font-bold">✓ Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="shock-cyan">Block:</span>
                  <span className="shock-green font-mono">#{blockNumber.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="shock-cyan">Gas:</span>
                  <span className="shock-yellow font-mono">{gasPrice.toFixed(2)} Gwei</span>
                </div>
                <div className="flex justify-between">
                  <span className="shock-cyan">Wallet:</span>
                  <span className="shock-green font-mono">{walletBalance.toFixed(4)} MATIC</span>
                </div>
                <div className="mt-2 pt-2 border-t border-cyan-500/30">
                  <div className="flex justify-between">
                    <span className="shock-pink">Arbitrum:</span>
                    {gameState.arbitrumUnlocked ? (
                      <span className="shock-green font-bold">✓ UNLOCKED</span>
                    ) : (
                      <span className="shock-yellow font-bold">🔒 ${GAME_CONFIG.unlockArbitrumAt - gameState.capital > 0 ? (GAME_CONFIG.unlockArbitrumAt - gameState.capital).toFixed(2) : '0'} to unlock</span>
                    )}
                  </div>
                  {!gameState.arbitrumUnlocked && (
                    <div className="mt-1 h-1 bg-black rounded-full overflow-hidden border border-yellow-500">
                      <div 
                        className="h-full bg-yellow-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, (gameState.capital / GAME_CONFIG.unlockArbitrumAt) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="box-yellow p-3">
              <h3 className="text-xs uppercase tracking-wider shock-pink mb-2 font-bold">
                🏆 Achievements ({gameState.unlockedAchievements.length}/{GAME_CONFIG.achievements.length})
              </h3>
              <div className="space-y-1">
                {GAME_CONFIG.achievements.map(ach => {
                  const unlocked = gameState.unlockedAchievements.includes(ach.id);
                  return (
                    <div
                      key={ach.id}
                      className={`text-[10px] p-1 rounded border ${
                        unlocked ? 'border-green-500 bg-green-500/10' : 'border-gray-700 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span>{ach.icon}</span>
                        <span className={unlocked ? 'shock-green font-bold' : 'text-gray-500'}>
                          {ach.name}
                        </span>
                      </div>
                      <div className="text-[9px] text-gray-400 ml-5">{ach.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center Column - Live Data */}
          <div className="col-span-6 flex flex-col gap-3 overflow-y-auto">
            {/* Scanner Progress */}
            {isRunning && scanProgress.total > 0 && (
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

            {/* Opportunities */}
            <div className="box-green p-3">
              <h3 className="text-xs uppercase tracking-wider shock-pink mb-3 font-bold">
                ⚡ Live Opportunities ({opportunities.length})
              </h3>
              {opportunities.length === 0 ? (
                <div className="text-center py-4 shock-cyan text-xs">
                  {isRunning ? 'Scanning for price discrepancies...' : 'Start scanner to find opportunities'}
                </div>
              ) : (
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {opportunities.map((opp) => (
                    <div
                      key={opp.id}
                      className="flex items-center justify-between p-2 rounded border border-green-500/50 hover:bg-green-500/10"
                    >
                      <div className="text-[10px]">
                        <div className="shock-cyan font-bold">
                          {opp.pair[0]}/{opp.pair[1]}
                        </div>
                        <div className="shock-pink text-[9px]">
                          {opp.buyDex} → {opp.sellDex}
                        </div>
                        <div className="shock-yellow text-[9px]">
                          {opp.spreadBps.toFixed(1)}bps spread
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="shock-green font-bold text-sm">
                          +${opp.netProfit.toFixed(4)}
                        </div>
                        <button
                          onClick={() => executeTrade(opp)}
                          className="mt-1 px-2 py-1 btn-green text-[9px]"
                        >
                          EXECUTE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price Matrix */}
            <div className="box-cyan p-3">
              <h3 className="text-xs uppercase tracking-wider shock-pink mb-2 font-bold">
                ◎ Live Prices
              </h3>
              <div className="overflow-x-auto max-h-48 overflow-y-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="shock-pink border-b border-cyan-500 font-bold">
                      <th className="text-left py-1 px-1">Token</th>
                      {Object.keys(DEXS).map(dex => (
                        <th key={dex} className="text-right py-1 px-1">{DEXS[dex].name.split(' ')[0]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(prices).slice(0, 10).map(([token, dexPrices]) => (
                      <tr key={token} className="border-b border-cyan-500/20">
                        <td className="py-1 px-1 shock-cyan font-bold">{token}</td>
                        {Object.keys(DEXS).map(dex => {
                          const price = dexPrices[DEXS[dex].name];
                          return (
                            <td key={dex} className="text-right py-1 px-1 shock-green font-mono">
                              {price ? (price < 10 ? price.toFixed(4) : price.toFixed(2)) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trade Log */}
            <div className="box-yellow p-3">
              <h3 className="text-xs uppercase tracking-wider shock-pink mb-2 font-bold">
                ▸ Trade Log ({tradeLog.length})
              </h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {tradeLog.length === 0 ? (
                  <div className="text-center py-4 shock-cyan text-[10px]">
                    No trades yet. Execute an opportunity to start!
                  </div>
                ) : (
                  tradeLog.map((trade, i) => (
                    <div key={i} className="flex justify-between text-[10px] p-1 border-b border-yellow-500/20">
                      <span className="shock-cyan">{trade.pair.join('/')}</span>
                      <span className="shock-pink">{trade.buyDex}→{trade.sellDex}</span>
                      <span className={trade.status === 'success' ? 'shock-green font-bold' : 'shock-pink font-bold'}>
                        {trade.status === 'success' ? '✓' : '✗'} {trade.netProfit >= 0 ? '+' : ''}${trade.netProfit.toFixed(4)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Flash Loans & Info */}
          <div className="col-span-3 flex flex-col gap-3 overflow-y-auto">
            {/* Capital */}
            <div className="box-green p-3">
              <h3 className="text-xs uppercase tracking-wider shock-yellow mb-2 font-bold">
                💎 Capital
              </h3>
              <div className="text-center mb-2">
                <div className="text-3xl font-bold shock-green">
                  ${gameState.capital.toFixed(2)}
                </div>
                <div className="text-[10px] shock-cyan">
                  Started: ${GAME_CONFIG.startingCapital.toFixed(2)}
                </div>
                <div className={`text-sm font-bold ${
                  gameState.capital >= GAME_CONFIG.startingCapital ? 'shock-green' : 'shock-pink'
                }`}>
                  {gameState.capital >= GAME_CONFIG.startingCapital ? '+' : ''}
                  ${(gameState.capital - GAME_CONFIG.startingCapital).toFixed(2)}
                </div>
              </div>
              <div className="text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span className="shock-cyan">Trades:</span>
                  <span className="shock-green font-bold">{gameState.totalTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="shock-cyan">Wins:</span>
                  <span className="shock-green font-bold">{gameState.wins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="shock-cyan">Losses:</span>
                  <span className="shock-pink font-bold">{gameState.losses}</span>
                </div>
              </div>
            </div>

            {/* Flash Loans */}
            <div className="box-green p-3">
              <h3 className="text-xs uppercase tracking-wider shock-yellow mb-2 font-bold">
                💰 Free Flash Loans
              </h3>
              <div className="space-y-1">
                {Object.entries(FLASH_LOAN_PROVIDERS).map(([key, provider]) => (
                  <div key={key} className="text-[10px] border border-green-500/30 rounded p-1">
                    <div className="flex justify-between">
                      <span className="shock-green font-bold">{provider.name}</span>
                      <span className={provider.fee === 0 ? 'shock-green' : 'shock-yellow'}>
                        {provider.fee === 0 ? 'FREE' : `${provider.fee}bps`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DEX Coverage */}
            <div className="box-purple p-3">
              <h3 className="text-xs uppercase tracking-wider shock-pink mb-2 font-bold">
                🔄 DEX Coverage
              </h3>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="shock-cyan">Tokens:</span>
                  <span className="shock-green font-bold">{Object.keys(TOKENS).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="shock-cyan">Pairs:</span>
                  <span className="shock-green font-bold">{PRIORITY_PAIRS.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="shock-cyan">DEXs:</span>
                  <span className="shock-green font-bold">{Object.keys(DEXS).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="shock-cyan">Pools Scanned:</span>
                  <span className="shock-green font-bold">{gameState.poolsScanned}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
