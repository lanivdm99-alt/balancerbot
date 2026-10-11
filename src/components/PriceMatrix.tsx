import { TOKENS, CHAINS } from '../utils/constants';

interface PriceMatrixProps {
  prices: Record<string, Record<string, number>>;
}

export default function PriceMatrix({ prices }: PriceMatrixProps) {
  const allDexs = new Set<string>();
  Object.values(CHAINS).forEach(chain => chain.dexs.forEach(d => allDexs.add(d)));
  const dexList = Array.from(allDexs);

  return (
    <div className="border border-green-900/50 rounded p-3">
      <h3 className="text-xs uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
        <span>◎</span> Price Matrix
        <span className="text-[10px] text-green-700 ml-auto">Live Aggregation</span>
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-green-600 border-b border-green-900/30">
              <th className="text-left py-1 px-1">Token</th>
              {dexList.map(dex => (
                <th key={dex} className="text-right py-1 px-1">{dex.split(' ')[0]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TOKENS.map(token => {
              const tokenPrices = prices[token.symbol] || {};
              const priceValues = Object.values(tokenPrices);
              const minPrice = Math.min(...priceValues);
              const maxPrice = Math.max(...priceValues);
              const spread = maxPrice > 0 ? ((maxPrice - minPrice) / minPrice) * 10000 : 0;

              return (
                <tr key={token.symbol} className="border-b border-green-900/20 hover:bg-green-500/5">
                  <td className="py-1 px-1">
                    <span className="text-green-300 font-bold">{token.symbol}</span>
                    {spread > 5 && (
                      <span className="ml-1 text-yellow-400 text-[8px]">▲{spread.toFixed(1)}bps</span>
                    )}
                  </td>
                  {dexList.map(dex => {
                    const price = tokenPrices[dex];
                    if (!price) return <td key={dex} className="text-right py-1 px-1 text-green-800">—</td>;

                    const isMin = price === minPrice;
                    const isMax = price === maxPrice;

                    return (
                      <td
                        key={dex}
                        className={`text-right py-1 px-1 font-mono ${
                          isMin ? 'text-green-400' : isMax ? 'text-red-400' : 'text-green-500'
                        }`}
                      >
                        {price < 10 ? price.toFixed(4) : price < 100 ? price.toFixed(3) : price.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-2 text-[9px]">
        <span className="text-green-400">■ Lowest</span>
        <span className="text-red-400">■ Highest</span>
        <span className="text-yellow-400">▲ Spread &gt; 5bps</span>
      </div>
    </div>
  );
}
