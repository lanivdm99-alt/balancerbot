interface CapitalPanelProps {
  startingCapital: number;
  currentCapital: number;
  gasPrice: number;
  transactionsRemaining: number;
}

export default function CapitalPanel({
  startingCapital,
  currentCapital,
  gasPrice,
  transactionsRemaining,
}: CapitalPanelProps) {
  const profit = currentCapital - startingCapital;
  const profitPercent = ((profit / startingCapital) * 100).toFixed(2);
  
  // Calculate min profitable trade
  const avgGasCost = 0.005; // $0.005 per tx on Polygon
  const minProfitAfterGas = avgGasCost * 2; // Need 2x gas to be safe
  const minProfitAfterMEV = minProfitAfterGas / 0.1; // Keep 10% after 90% MEV tip
  
  return (
    <div className="box-purple p-3">
      <h3 className="text-xs uppercase tracking-wider shock-yellow mb-3 flex items-center gap-2 font-bold">
        <span>💎</span> Capital Management
      </h3>

      <div className="space-y-2 text-[10px]">
        <div className="flex justify-between border-b border-purple-500/30 pb-1">
          <span className="shock-cyan">Starting:</span>
          <span className="shock-green font-bold">${startingCapital.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-b border-purple-500/30 pb-1">
          <span className="shock-cyan">Current:</span>
          <span className={`font-bold ${profit >= 0 ? 'shock-green' : 'shock-pink'}`}>
            ${currentCapital.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between border-b border-purple-500/30 pb-1">
          <span className="shock-cyan">P&L:</span>
          <span className={`font-bold ${profit >= 0 ? 'shock-green' : 'shock-pink'}`}>
            {profit >= 0 ? '+' : ''}${profit.toFixed(4)} ({profitPercent}%)
          </span>
        </div>
        <div className="flex justify-between border-b border-purple-500/30 pb-1">
          <span className="shock-cyan">Gas Price:</span>
          <span className="shock-yellow font-bold">{gasPrice.toFixed(2)} Gwei</span>
        </div>
        <div className="flex justify-between border-b border-purple-500/30 pb-1">
          <span className="shock-cyan">Tx Budget:</span>
          <span className="shock-green font-bold">{transactionsRemaining} left</span>
        </div>
        <div className="flex justify-between">
          <span className="shock-cyan">Min Profit:</span>
          <span className="shock-yellow font-bold">${minProfitAfterMEV.toFixed(4)}</span>
        </div>
      </div>

      {/* Growth Projection */}
      <div className="mt-3 pt-2 border-t border-purple-500/30">
        <p className="text-[9px] shock-pink font-bold mb-1">📈 Growth Targets</p>
        <div className="grid grid-cols-3 gap-1 text-[9px]">
          <div className="text-center">
            <div className="shock-cyan">$4 → $10</div>
            <div className="shock-green">+150%</div>
          </div>
          <div className="text-center">
            <div className="shock-cyan">$10 → $50</div>
            <div className="shock-green">+400%</div>
          </div>
          <div className="text-center">
            <div className="shock-cyan">$50 → $100</div>
            <div className="shock-green">+100%</div>
          </div>
        </div>
      </div>

      {/* Warning */}
      {transactionsRemaining < 50 && (
        <div className="mt-2 p-2 border border-pink-500 bg-pink-500/10 rounded">
          <p className="text-[9px] shock-pink font-bold">
            ⚠️ Low budget! Only {transactionsRemaining} transactions remaining.
          </p>
        </div>
      )}
    </div>
  );
}
