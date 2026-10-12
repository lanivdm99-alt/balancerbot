interface NetworkStatusProps {
  blockNumber: number;
  gasPrice: number;
  isLoading: boolean;
}

export default function NetworkStatus({ blockNumber, gasPrice, isLoading }: NetworkStatusProps) {
  return (
    <div className="box-cyan p-3">
      <h3 className="text-xs uppercase tracking-wider shock-pink mb-3 flex items-center gap-2 font-bold">
        <span>◈</span> Polygon Network
        {isLoading && <span className="shock-yellow text-[10px] animate-pulse">● SYNCING</span>}
      </h3>

      <div className="border border-cyan-500 rounded p-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold shock-cyan">
            Polygon PoS
          </span>
          <span className="w-2 h-2 rounded-full bg-green-500" />
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <span className="shock-pink font-bold">Block:</span>
            <span className="shock-cyan ml-1 font-mono">
              #{blockNumber.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="shock-pink font-bold">Gas:</span>
            <span className={`ml-1 font-mono font-bold ${
              gasPrice > 100 ? 'shock-pink' :
              gasPrice > 50 ? 'shock-yellow' :
              'shock-green'
            }`}>
              {gasPrice.toFixed(2)} Gwei
            </span>
          </div>
        </div>
        <div className="mt-1 text-[9px] shock-pink">
          RPC: Alchemy (Connected)
        </div>
        <div className="mt-1 text-[9px] shock-cyan">
          DEXs: Uniswap V3, QuickSwap V3
        </div>
      </div>
    </div>
  );
}
