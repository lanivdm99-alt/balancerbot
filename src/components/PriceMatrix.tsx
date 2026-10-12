import { TOKENS, CHAINS } from '../utils/constants';

interface PriceMatrixProps {
  prices: Record<string, Record<string, number>>;
}

export default function PriceMatrix({ prices }: PriceMatrixProps) {
  const allDexs = new Set<string>();
  Object.values(CHAINS).forEach(chain => chain.dexs.forEach(d => allDexs.add(d)));
  const dexList = Array.from(allDexs);

  return (
    <div className="box-cyan p-3">
      <h3 className="text-xs uppercase tracking-wider shock-pink mb-3 flex items-center gap-2 font-bold">
        <span>◎</span> Price Matrix
        <span className="text-[10px] shock-pink ml-auto">Live Aggregation</span>
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="shock-pink border-b border-cyan-500 font-bold">
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
                <tr key={token.symbol} className="border-b border-cyan-500/30 hover:bg-cyan-500/10">
                  <td className="py-1 px-1">
                    <span className="shock-cyan font-bold">{token.symbol}</span>
                    {spread > 5 && (
                      <span className="ml-1 shock-yellow text-[8px] font-bold">▲{spread.toFixed(1)}bps</span>
                    )}
                  </td>
                  {dexList.map(dex => {
                    const price = tokenPrices[dex];
                    if (!price) return <td key={dex} className="text-right py-1 px-1 text-white/30">—</td>;

                    const isMin = price === minPrice;
                    const isMax = price === maxPrice;

                    return (
                      <td
                        key={dex}
                        className={`text-right py-1 px-1 font-mono font-bold ${
                          isMin ? 'shock-green' : isMax ? 'shock-pink' : 'shock-cyan'
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

      <div className="flex gap-4 mt-2 text-[9px]">
        <span className="shock-green font-bold">■ Lowest</span>
        <span className="shock-pink font-bold">■ Highest</span>
        <span className="shock-yellow font-bold">▲ Spread &gt; 5bps</span>
      </div>
    </div>
  );
}
