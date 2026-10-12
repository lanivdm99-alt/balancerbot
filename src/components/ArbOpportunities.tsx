import { ArbOpportunity } from '../services/blockchain';

interface ArbOpportunitiesProps {
  opportunities: ArbOpportunity[];
}

export default function ArbOpportunities({ opportunities }: ArbOpportunitiesProps) {
  return (
    <div className="box-green p-3">
      <h3 className="text-xs uppercase tracking-wider shock-pink mb-3 flex items-center gap-2 font-bold">
        <span>⚡</span> Real Arbitrage Opportunities
        <span className="ml-auto text-[10px] shock-pink">
          {opportunities.length} detected
        </span>
      </h3>

      {opportunities.length === 0 ? (
        <div className="text-center py-4 shock-cyan text-xs">
          <div className="text-2xl mb-2">⏳</div>
          Scanning all DEX pools for price discrepancies...
        </div>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className={`flex flex-col p-2 rounded border text-[10px] ${
                opp.netProfit > 0.01
                  ? 'border-green-500 bg-green-500/5'
                  : 'border-yellow-500 bg-yellow-500/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="shock-cyan font-bold">
                    {opp.pair[0]}/{opp.pair[1]}
                  </span>
                  <span className="shock-purple text-[8px] font-bold">
                    {opp.strategy}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="shock-yellow font-bold">{opp.spreadBps.toFixed(1)}bps</span>
                  <span className={`font-bold ${opp.netProfit > 0 ? 'shock-green' : 'shock-pink'}`}>
                    ${opp.netProfit.toFixed(4)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1 text-[9px]">
                <span className="shock-pink">
                  {opp.buyDex} → {opp.sellDex}
                </span>
                <span className="shock-green">
                  💰 {opp.flashLoanProvider} ({opp.flashLoanFee === 0 ? 'FREE' : `${opp.flashLoanFee}bps`})
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[9px] shock-cyan">
                <span>Flash: ${opp.flashLoanAmount.toFixed(2)}</span>
                <span>Gas: ${opp.gasCost.toFixed(4)}</span>
                <span>Conf: {(opp.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
