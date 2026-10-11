import { ArbOpportunity } from '../utils/simulation';

interface ArbOpportunitiesProps {
  opportunities: ArbOpportunity[];
}

export default function ArbOpportunities({ opportunities }: ArbOpportunitiesProps) {
  return (
    <div className="border border-green-900/50 rounded p-3">
      <h3 className="text-xs uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
        <span>⚡</span> Arbitrage Opportunities
        <span className="ml-auto text-[10px] text-green-700">
          {opportunities.length} detected
        </span>
      </h3>

      {opportunities.length === 0 ? (
        <div className="text-center py-4 text-green-700 text-xs">
          <div className="text-2xl mb-2">⏳</div>
          Scanning for cross-DEX price discrepancies...
        </div>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className={`flex items-center justify-between p-2 rounded border text-[10px] transition-all ${
                opp.netProfit > 0.01
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-yellow-500/30 bg-yellow-500/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`px-1 rounded text-[8px] font-bold ${
                  opp.chain === 'arbitrum' ? 'bg-[#28a0f0]/20 text-[#28a0f0]' : 'bg-[#8247e5]/20 text-[#8247e5]'
                }`}>
                  {opp.chain === 'arbitrum' ? 'ARB' : 'POL'}
                </span>
                <span className="text-green-300 font-bold">
                  {opp.pair[0]}/{opp.pair[1]}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-green-600">
                  {opp.buyDex.split(' ')[0]} → {opp.sellDex.split(' ')[0]}
                </span>
                <span className="text-yellow-400">{opp.spreadBps.toFixed(1)}bps</span>
                <span className={`font-bold ${opp.netProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
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
