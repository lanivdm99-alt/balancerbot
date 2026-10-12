import { PnLTracker } from '../utils/simulation';
import { useState, useEffect } from 'react';

interface PnLDashboardProps {
  tracker: PnLTracker;
}

export default function PnLDashboard({ tracker }: PnLDashboardProps) {
  const [stats, setStats] = useState(tracker.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(tracker.getStats());
    }, 800);
    return () => clearInterval(interval);
  }, [tracker]);

  const profitHistory = stats.entries.slice(-30);
  const maxProfit = Math.max(...profitHistory.map(e => Math.abs(e.profit)), 0.001);

  return (
    <div className="box-pink p-3">
      <h3 className="text-xs uppercase tracking-wider shock-cyan mb-3 flex items-center gap-2 font-bold">
        <span>◈</span> PnL Dashboard
      </h3>

      <div className="text-center mb-4 p-3 rounded border border-pink-500">
        <div className="text-[10px] shock-pink uppercase tracking-wider font-bold">Cumulative P&L</div>
        <div className={`text-2xl font-bold font-mono ${
          stats.cumulative >= 0 ? 'shock-green' : 'shock-pink'
        }`}>
          {stats.cumulative >= 0 ? '+' : ''}${stats.cumulative.toFixed(4)}
        </div>
        <div className="text-[10px] shock-pink mt-1">
          Last 24 rounds: <span className={stats.last24hProfit >= 0 ? 'shock-green font-bold' : 'shock-pink font-bold'}>
            {stats.last24hProfit >= 0 ? '+' : ''}${stats.last24hProfit.toFixed(4)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2 rounded border border-pink-500 text-center">
          <div className="text-[10px] shock-pink font-bold">High Score</div>
          <div className="text-sm font-bold shock-yellow font-mono">
            ${stats.highScore.toFixed(4)}
          </div>
        </div>
        <div className="p-2 rounded border border-pink-500 text-center">
          <div className="text-[10px] shock-pink font-bold">Win Rate</div>
          <div className="text-sm font-bold shock-cyan font-mono">
            {stats.winRate.toFixed(1)}%
          </div>
        </div>
        <div className="p-2 rounded border border-pink-500 text-center">
          <div className="text-[10px] shock-pink font-bold">Wins</div>
          <div className="text-sm font-bold shock-green font-mono">{stats.wins}</div>
        </div>
        <div className="p-2 rounded border border-pink-500 text-center">
          <div className="text-[10px] shock-pink font-bold">Losses</div>
          <div className="text-sm font-bold shock-pink font-mono">{stats.losses}</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-[10px] shock-pink mb-1 font-bold">Profit History</div>
        <div className="h-20 flex items-center gap-[1px] bg-black rounded p-1 relative border border-pink-500">
          <div className="absolute left-0 right-0 top-1/2 border-t border-pink-500/50" />
          {profitHistory.map((entry, i) => {
            const height = (Math.abs(entry.profit) / maxProfit) * 45;
            const isPositive = entry.profit >= 0;
            return (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all duration-300"
                style={{
                  height: `${height}%`,
                  backgroundColor: isPositive ? '#00ff41' : '#ff0066',
                  opacity: 0.4 + (i / profitHistory.length) * 0.6,
                  marginTop: isPositive ? 'auto' : undefined,
                  alignSelf: isPositive ? 'flex-end' : 'flex-start',
                }}
              />
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-[10px] shock-pink mb-1 font-bold">Recent Trades</div>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {stats.entries.slice(-8).reverse().map((entry, i) => (
            <div key={i} className="flex justify-between text-[10px] py-0.5 border-b border-pink-500/30">
              <span className="shock-cyan">{entry.pair}</span>
              <span className="shock-pink">{entry.chain}</span>
              <span className={`font-mono font-bold ${entry.profit >= 0 ? 'shock-green' : 'shock-pink'}`}>
                {entry.profit >= 0 ? '+' : ''}{entry.profit.toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
