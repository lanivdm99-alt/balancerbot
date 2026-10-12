import { ArbOpportunity } from '../services/blockchain';

interface PnLDashboardProps {
  history: ArbOpportunity[];
}

export default function PnLDashboard({ history }: PnLDashboardProps) {
  const cumulative = history.reduce((sum, e) => sum + e.netProfit, 0);
  const wins = history.filter(e => e.status === 'success').length;
  const losses = history.filter(e => e.status === 'failed').length;
  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
  const highScore = history.reduce((max, e) => Math.max(max, e.netProfit), 0);

  const profitHistory = history.slice(-30);
  const maxProfit = Math.max(...profitHistory.map(e => Math.abs(e.netProfit)), 0.001);

  return (
    <div className="box-pink p-3">
      <h3 className="text-xs uppercase tracking-wider shock-cyan mb-3 flex items-center gap-2 font-bold">
        <span>◈</span> PnL Dashboard
      </h3>

      <div className="text-center mb-4 p-3 rounded border border-pink-500">
        <div className="text-[10px] shock-pink uppercase tracking-wider font-bold">Cumulative P&L</div>
        <div className={`text-2xl font-bold font-mono ${
          cumulative >= 0 ? 'shock-green' : 'shock-pink'
        }`}>
          {cumulative >= 0 ? '+' : ''}${cumulative.toFixed(4)}
        </div>
        <div className="text-[10px] shock-pink mt-1">
          Last 24 rounds: <span className={history.slice(-24).reduce((sum, e) => sum + e.netProfit, 0) >= 0 ? 'shock-green font-bold' : 'shock-pink font-bold'}>
            {history.slice(-24).reduce((sum, e) => sum + e.netProfit, 0) >= 0 ? '+' : ''}${history.slice(-24).reduce((sum, e) => sum + e.netProfit, 0).toFixed(4)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2 rounded border border-pink-500 text-center">
          <div className="text-[10px] shock-pink font-bold">High Score</div>
          <div className="text-sm font-bold shock-yellow font-mono">
            ${highScore.toFixed(4)}
          </div>
        </div>
        <div className="p-2 rounded border border-pink-500 text-center">
          <div className="text-[10px] shock-pink font-bold">Win Rate</div>
          <div className="text-sm font-bold shock-cyan font-mono">
            {winRate.toFixed(1)}%
          </div>
        </div>
        <div className="p-2 rounded border border-pink-500 text-center">
          <div className="text-[10px] shock-pink font-bold">Wins</div>
          <div className="text-sm font-bold shock-green font-mono">{wins}</div>
        </div>
        <div className="p-2 rounded border border-pink-500 text-center">
          <div className="text-[10px] shock-pink font-bold">Losses</div>
          <div className="text-sm font-bold shock-pink font-mono">{losses}</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-[10px] shock-pink mb-1 font-bold">Profit History</div>
        <div className="h-20 flex items-center gap-[1px] bg-black rounded p-1 relative border border-pink-500">
          <div className="absolute left-0 right-0 top-1/2 border-t border-pink-500/50" />
          {profitHistory.map((entry, i) => {
            const height = (Math.abs(entry.netProfit) / maxProfit) * 45;
            const isPositive = entry.netProfit >= 0;
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
          {history.slice(-8).reverse().map((entry, i) => (
            <div key={i} className="flex justify-between text-[10px] py-0.5 border-b border-pink-500/30">
              <span className="shock-cyan">{entry.pair.join('/')}</span>
              <span className="shock-purple">{entry.strategy}</span>
              <span className={`font-mono font-bold ${entry.netProfit >= 0 ? 'shock-green' : 'shock-pink'}`}>
                {entry.netProfit >= 0 ? '+' : ''}{entry.netProfit.toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
