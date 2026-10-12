import { useState, useEffect } from 'react';

interface BotStats {
  name: string;
  speed: number; // ms per scan
  successRate: number; // percentage
  profit: number; // USD
  trades: number;
  color: string;
  isYou: boolean;
}

// Simulated competing bots
const COMPETITOR_BOTS = [
  { name: 'FlashBot Pro', baseSpeed: 3500, color: '#ff0066' },
  { name: 'ArbMaster', baseSpeed: 4200, color: '#00ffff' },
  { name: 'MEV Hunter', baseSpeed: 2800, color: '#ff00ff' },
  { name: 'GasOptimizer', baseSpeed: 5100, color: '#ffff00' },
  { name: 'PoolSniper', baseSpeed: 3900, color: '#00ff41' },
  { name: 'SwapKing', baseSpeed: 4500, color: '#bf00ff' },
];

export default function BotLeaderboard({ yourStats }: { yourStats: { speed: number; successRate: number; profit: number; trades: number } }) {
  const [leaderboard, setLeaderboard] = useState<BotStats[]>([]);
  const [raceProgress, setRaceProgress] = useState<Map<string, number>>(new Map());
  const [showRace, setShowRace] = useState(false);

  // Generate leaderboard with some randomness
  useEffect(() => {
    const generateLeaderboard = () => {
      const bots: BotStats[] = COMPETITOR_BOTS.map(bot => {
        // Add some variance to make it realistic
        const speedVariance = (Math.random() - 0.5) * 1000;
        const speed = Math.max(1500, bot.baseSpeed + speedVariance);
        
        return {
          name: bot.name,
          speed: Math.round(speed),
          successRate: 60 + Math.random() * 30, // 60-90%
          profit: Math.random() * 50, // $0-50
          trades: Math.floor(Math.random() * 100),
          color: bot.color,
          isYou: false,
        };
      });

      // Add your bot
      bots.push({
        name: 'FLASH-X (You)',
        speed: yourStats.speed,
        successRate: yourStats.successRate,
        profit: yourStats.profit,
        trades: yourStats.trades,
        color: '#00ffff',
        isYou: true,
      });

      // Sort by speed (fastest first)
      bots.sort((a, b) => a.speed - b.speed);

      setLeaderboard(bots);
    };

    generateLeaderboard();
    const interval = setInterval(generateLeaderboard, 5000);
    return () => clearInterval(interval);
  }, [yourStats]);

  // Simulate race animation
  useEffect(() => {
    if (!showRace) return;

    const interval = setInterval(() => {
      setRaceProgress(prev => {
        const newProgress = new Map(prev);
        leaderboard.forEach(bot => {
          const current = newProgress.get(bot.name) || 0;
          // Speed affects progress (faster = more progress)
          const increment = (10000 / bot.speed) * (0.5 + Math.random() * 0.5);
          newProgress.set(bot.name, Math.min(100, current + increment));
        });
        return newProgress;
      });
    }, 100);

    // Reset after 10 seconds
    const timeout = setTimeout(() => {
      setShowRace(false);
      setRaceProgress(new Map());
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [showRace, leaderboard]);

  const yourRank = leaderboard.findIndex(bot => bot.isYou) + 1;
  const isWinning = yourRank === 1;

  return (
    <div className="box-cyan p-3">
      <h3 className="text-xs uppercase tracking-wider shock-pink mb-3 font-bold flex items-center justify-between">
        <span>🏆 Bot Leaderboard</span>
        <button
          onClick={() => setShowRace(!showRace)}
          className="text-[10px] px-2 py-1 btn-cyan"
        >
          {showRace ? '🏁 Racing...' : '🏁 Start Race'}
        </button>
      </h3>

      {/* Your Position */}
      <div className={`mb-3 p-2 rounded border-2 ${
        isWinning ? 'border-green-500 bg-green-500/10' : 'border-yellow-500 bg-yellow-500/10'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs shock-cyan font-bold">Your Position</div>
            <div className={`text-2xl font-bold ${isWinning ? 'shock-green' : 'shock-yellow'}`}>
              #{yourRank} {isWinning ? '👑' : ''}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] shock-cyan">Speed</div>
            <div className="text-sm shock-green font-bold">{yourStats.speed}ms</div>
          </div>
        </div>
      </div>

      {/* Race Visualization */}
      {showRace && (
        <div className="mb-3 p-2 bg-black/50 rounded border border-cyan-500">
          <div className="text-[10px] shock-yellow font-bold mb-2">🏁 RACE IN PROGRESS</div>
          <div className="space-y-1">
            {leaderboard.map((bot, idx) => (
              <div key={bot.name} className="flex items-center gap-2">
                <div className="w-6 text-[10px] shock-cyan">#{idx + 1}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-[9px] mb-0.5">
                    <span style={{ color: bot.color }} className={bot.isYou ? 'font-bold' : ''}>
                      {bot.name}
                    </span>
                    <span className="shock-cyan">{bot.speed}ms</span>
                  </div>
                  <div className="h-1 bg-black rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-100"
                      style={{
                        width: `${raceProgress.get(bot.name) || 0}%`,
                        backgroundColor: bot.color,
                        boxShadow: `0 0 5px ${bot.color}`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {leaderboard.map((bot, idx) => (
          <div
            key={bot.name}
            className={`flex items-center justify-between p-2 rounded text-[10px] ${
              bot.isYou ? 'border-2 border-cyan-500 bg-cyan-500/10' : 'border border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 text-center font-bold" style={{ color: bot.color }}>
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
              </div>
              <div>
                <div className="font-bold" style={{ color: bot.color }}>
                  {bot.name}
                </div>
                <div className="text-[9px] text-gray-400">
                  {bot.trades} trades • {bot.successRate.toFixed(1)}% win
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold shock-green">${bot.profit.toFixed(2)}</div>
              <div className="text-[9px] shock-cyan">{bot.speed}ms</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="mt-3 pt-3 border-t border-cyan-500/30 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[9px] shock-cyan">Your Speed</div>
          <div className="text-xs shock-green font-bold">{yourStats.speed}ms</div>
        </div>
        <div>
          <div className="text-[9px] shock-cyan">Avg Speed</div>
          <div className="text-xs shock-yellow font-bold">
            {Math.round(leaderboard.reduce((sum, b) => sum + b.speed, 0) / leaderboard.length)}ms
          </div>
        </div>
        <div>
          <div className="text-[9px] shock-cyan">Fastest</div>
          <div className="text-xs shock-pink font-bold">
            {leaderboard[0]?.speed || 0}ms
          </div>
        </div>
      </div>
    </div>
  );
}
