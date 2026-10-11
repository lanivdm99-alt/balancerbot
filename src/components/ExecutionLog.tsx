import { ArbOpportunity } from '../utils/simulation';

interface ExecutionLogProps {
  history: ArbOpportunity[];
}

export default function ExecutionLog({ history }: ExecutionLogProps) {
  return (
    <div className="border border-green-900/50 rounded p-3">
      <h3 className="text-xs uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
        <span>▸</span> Execution Matrix
        <span className="ml-auto text-[10px] text-green-700">
          {history.filter(h => h.status === 'success').length}W / {history.filter(h => h.status === 'failed').length}L
        </span>
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-green-600 border-b border-green-900/30">
              <th className="text-left py-1 px-1">Status</th>
              <th className="text-left py-1 px-1">Chain</th>
              <th className="text-left py-1 px-1">Pair</th>
              <th className="text-left py-1 px-1">Route</th>
              <th className="text-right py-1 px-1">Flash $</th>
              <th className="text-right py-1 px-1">Gas</th>
              <th className="text-right py-1 px-1">Net P&L</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-green-700">
                  Awaiting execution signals...
                </td>
              </tr>
            ) : (
              history.slice(0, 15).map((entry) => (
                <tr key={entry.id} className="border-b border-green-900/20 hover:bg-green-500/5">
                  <td className="py-1 px-1">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      entry.status === 'success'
                        ? 'bg-green-500/20 text-green-400'
                        : entry.status === 'failed'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {entry.status === 'success' ? '✓' : entry.status === 'failed' ? '✗' : '◌'}
                      {entry.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-1 px-1">
                    <span className={`px-1 rounded text-[8px] ${
                      entry.chain === 'arbitrum' ? 'text-[#28a0f0]' : 'text-[#8247e5]'
                    }`}>
                      {entry.chain === 'arbitrum' ? 'ARB' : 'POL'}
                    </span>
                  </td>
                  <td className="py-1 px-1 text-green-300 font-bold">
                    {entry.pair.join('/')}
                  </td>
                  <td className="py-1 px-1 text-green-600">
                    {entry.buyDex.split(' ')[0]}→{entry.sellDex.split(' ')[0]}
                  </td>
                  <td className="py-1 px-1 text-right text-green-500 font-mono">
                    ${entry.flashLoanAmount.toFixed(2)}
                  </td>
                  <td className="py-1 px-1 text-right text-yellow-600 font-mono">
                    ${entry.gasCost.toFixed(5)}
                  </td>
                  <td className={`py-1 px-1 text-right font-mono font-bold ${
                    entry.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {entry.netProfit >= 0 ? '+' : ''}{entry.netProfit.toFixed(5)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
