import { ArbOpportunity } from '../utils/simulation';

interface ExecutionLogProps {
  history: ArbOpportunity[];
}

export default function ExecutionLog({ history }: ExecutionLogProps) {
  return (
    <div className="fluffy-box-yellow p-3">
      <h3 className="text-xs uppercase tracking-wider neon-fluffy-pink mb-3 flex items-center gap-2">
        <span>▸</span> Execution Matrix
        <span className="ml-auto text-[10px] text-pink-400">
          {history.filter(h => h.status === 'success').length}W / {history.filter(h => h.status === 'failed').length}L
        </span>
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-pink-400 border-b border-yellow-500/30">
              <th className="text-left py-1 px-1">Status</th>
              <th className="text-left py-1 px-1">Chain</th>
              <th className="text-left py-1 px-1">Pair</th>
              <th className="text-left py-1 px-1">Strategy</th>
              <th className="text-left py-1 px-1">Route</th>
              <th className="text-right py-1 px-1">Flash $</th>
              <th className="text-right py-1 px-1">Net P&L</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-cyan-400">
                  Awaiting execution signals...
                </td>
              </tr>
            ) : (
              history.slice(0, 15).map((entry) => (
                <tr key={entry.id} className="border-b border-yellow-500/20 hover:bg-yellow-500/10">
                  <td className="py-1 px-1">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      entry.status === 'success'
                        ? 'bg-green-500/20 neon-fluffy-green'
                        : entry.status === 'failed'
                        ? 'bg-pink-500/20 neon-fluffy-pink'
                        : 'bg-yellow-500/20 neon-fluffy-yellow'
                    }`}>
                      {entry.status === 'success' ? '✓' : entry.status === 'failed' ? '✗' : '◌'}
                      {entry.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-1 px-1">
                    <span className={`px-1 rounded text-[8px] ${
                      entry.chain === 'arbitrum' ? 'neon-fluffy-cyan' : 'neon-fluffy-pink'
                    }`}>
                      {entry.chain === 'arbitrum' ? 'ARB' : 'POL'}
                    </span>
                  </td>
                  <td className="py-1 px-1 text-cyan-300 font-bold">
                    {entry.pair.join('/')}
                  </td>
                  <td className="py-1 px-1">
                    <span className={`text-[8px] px-1 rounded ${
                      entry.strategy === 'flashbots' ? 'bg-purple-500/20 neon-fluffy-purple' :
                      entry.strategy === 'triangular' ? 'bg-yellow-500/20 neon-fluffy-yellow' :
                      'bg-green-500/20 neon-fluffy-green'
                    }`}>
                      {entry.strategy}
                    </span>
                  </td>
                  <td className="py-1 px-1 text-pink-400">
                    {entry.buyDex.split(' ')[0]}→{entry.sellDex.split(' ')[0]}
                  </td>
                  <td className="py-1 px-1 text-right text-cyan-300 font-mono">
                    ${entry.flashLoanAmount.toFixed(2)}
                  </td>
                  <td className={`py-1 px-1 text-right font-mono font-bold ${
                    entry.netProfit >= 0 ? 'neon-fluffy-green' : 'neon-fluffy-pink'
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
