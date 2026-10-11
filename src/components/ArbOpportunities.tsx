import { ArbOpportunity } from '../utils/simulation';

interface ArbOpportunitiesProps {
  opportunities: ArbOpportunity[];
}

export default function ArbOpportunities({ opportunities }: ArbOpportunitiesProps) {
  return (
    <div className="fluffy-box-green p-3">
      <h3 className="text-xs uppercase tracking-wider neon-fluffy-pink mb-3 flex items-center gap-2">
        <span>⚡</span> Arbitrage Opportunities
        <span className="ml-auto text-[10px] text-pink-400">
          {opportunities.length} detected
        </span>
      </h3>

      {opportunities.length === 0 ? (
        <div className="text-center py-4 text-cyan-400 text-xs">
          <div className="text-2xl mb-2 neon-fluffy-cyan">⏳</div>
          Scanning for cross-DEX price discrepancies...
        </div>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className={`flex items-center justify-between p-2 rounded-lg border text-[10px] transition-all ${
                opp.netProfit > 0.01
                  ? 'border-green-500/50 bg-green-500/10'
                  : 'border-yellow-500/50 bg-yellow-500/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`px-1 rounded text-[8px] font-bold ${
                  opp.chain === 'arbitrum' ? 'bg-cyan-500/20 neon-fluffy-cyan' : 'bg-pink-500/20 neon-fluffy-pink'
                }`}>
                  {opp.chain === 'arbitrum' ? 'ARB' : 'POL'}
                </span>
                <span className="text-cyan-300 font-bold">
                  {opp.pair[0]}/{opp.pair[1]}
                </span>
                <span className={`text-[8px] px-1 rounded ${
                  opp.strategy === 'flashbots' ? 'bg-purple-500/20 neon-fluffy-purple' :
                  opp.strategy === 'triangular' ? 'bg-yellow-500/20 neon-fluffy-yellow' :
                  'bg-green-500/20 neon-fluffy-green'
                }`}>
                  {opp.strategy}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-pink-400">
                  {opp.buyDex.split(' ')[0]} → {opp.sellDex.split(' ')[0]}
                </span>
                <span className="neon-fluffy-yellow">{opp.spreadBps.toFixed(1)}bps</span>
                <span className={`font-bold ${opp.netProfit > 0 ? 'neon-fluffy-green' : 'neon-fluffy-pink'}`}>
                  ${opp.netProfit.toFixed(4)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
