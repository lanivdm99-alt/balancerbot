import { ArbOpportunity } from '../services/blockchain';

interface ExecutionLogProps {
  history: ArbOpportunity[];
}

export default function ExecutionLog({ history }: ExecutionLogProps) {
  return (
    <div className="box-yellow p-3">
      <h3 className="text-xs uppercase tracking-wider shock-pink mb-3 flex items-center gap-2 font-bold">
        <span>▸</span> Execution Matrix
        <span className="ml-auto text-[10px] shock-pink">
          {history.filter(h => h.status === 'success').length}W / {history.filter(h => h.status === 'failed').length}L
        </span>
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="shock-pink border-b border-yellow-500 font-bold">
              <th className="text-left py-1 px-1">Status</th>
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
                <td colSpan={6} className="text-center py-4 shock-cyan">
                  Awaiting execution signals...
                </td>
              </tr>
            ) : (
              history.slice(0, 15).map((entry) => (
                <tr key={entry.id} className="border-b border-yellow-500/30 hover:bg-yellow-500/10">
                  <td className="py-1 px-1">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      entry.status === 'success'
                        ? 'shock-green'
                        : entry.status === 'failed'
                        ? 'shock-pink'
                        : 'shock-yellow'
                    }`}>
                      {entry.status === 'success' ? '✓' : entry.status === 'failed' ? '✗' : '◌'}
                      {entry.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-1 px-1 shock-cyan font-bold">
                    {entry.pair.join('/')}
                  </td>
                  <td className="py-1 px-1">
                    <span className="text-[8px] px-1 rounded shock-purple font-bold">
                      {entry.strategy}
                    </span>
                  </td>
                  <td className="py-1 px-1 shock-pink">
                    {entry.buyDex}→{entry.sellDex}
                  </td>
                  <td className="py-1 px-1 text-right shock-cyan font-mono">
                    ${entry.flashLoanAmount.toFixed(2)}
                  </td>
                  <td className={`py-1 px-1 text-right font-mono font-bold ${
                    entry.netProfit >= 0 ? 'shock-green' : 'shock-pink'
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
