import { CHAINS } from '../utils/constants';

interface NetworkStatusProps {
  blockNumbers: { arbitrum: number; polygon: number };
  gasPrices: { arbitrum: number; polygon: number };
}

export default function NetworkStatus({ blockNumbers, gasPrices }: NetworkStatusProps) {
  return (
    <div className="border border-green-900/50 rounded p-3">
      <h3 className="text-xs uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
        <span>◈</span> Network Status
      </h3>

      <div className="space-y-3">
        {Object.entries(CHAINS).map(([key, chain]) => (
          <div key={key} className="border border-green-900/30 rounded p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold" style={{ color: chain.color }}>
                {chain.name}
              </span>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-green-700">Block:</span>
                <span className="text-green-400 ml-1 font-mono">
                  #{blockNumbers[key as keyof typeof blockNumbers].toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-green-700">Gas:</span>
                <span className={`ml-1 font-mono ${
                  gasPrices[key as keyof typeof gasPrices] > 50 ? 'text-red-400' :
                  gasPrices[key as keyof typeof gasPrices] > 20 ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {gasPrices[key as keyof typeof gasPrices].toFixed(2)} Gwei
                </span>
              </div>
            </div>
            <div className="mt-1 text-[9px] text-green-700">
              DEXs: {chain.dexs.join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
