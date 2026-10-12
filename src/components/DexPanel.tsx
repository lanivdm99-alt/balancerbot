interface DexPanelProps {
  dexs: Record<string, {
    name: string;
    factory: string;
    type: string;
    fees: number[];
    flashLoanFee: number;
  }>;
  tokenCount: number;
  pairCount: number;
}

export default function DexPanel({ dexs, tokenCount, pairCount }: DexPanelProps) {
  return (
    <div className="box-purple p-3">
      <h3 className="text-xs uppercase tracking-wider shock-pink mb-3 flex items-center gap-2 font-bold">
        <span>🔄</span> DEX Coverage
      </h3>

      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between shock-cyan">
          <span>Tokens:</span>
          <span className="shock-green font-bold">{tokenCount}</span>
        </div>
        <div className="flex justify-between shock-cyan">
          <span>Pairs:</span>
          <span className="shock-green font-bold">{pairCount}</span>
        </div>
        <div className="flex justify-between shock-cyan">
          <span>DEXs:</span>
          <span className="shock-green font-bold">{Object.keys(dexs).length}</span>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {Object.entries(dexs).map(([key, dex]) => (
          <div key={key} className="text-[9px] shock-pink border-t border-purple-500/30 pt-1">
            <span className="font-bold">{dex.name}</span>
            <span className="ml-1 shock-cyan">({dex.fees.length} fees)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
