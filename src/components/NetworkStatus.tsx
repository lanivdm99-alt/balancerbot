import { CHAINS } from '../utils/constants';

interface NetworkStatusProps {
  blockNumbers: { arbitrum: number; polygon: number };
  gasPrices: { arbitrum: number; polygon: number };
}

export default function NetworkStatus({ blockNumbers, gasPrices }: NetworkStatusProps) {
  return (
    <div className="fluffy-box-cyan p-3">
      <h3 className="text-xs uppercase tracking-wider neon-fluffy-pink mb-3 flex items-center gap-2">
        <span>◈</span> Network Status
      </h3>

      <div className="space-y-3">
        {Object.entries(CHAINS).map(([key, chain]) => (
          <div key={key} className="border border-cyan-500/30 rounded-lg p-2 bg-black/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold neon-fluffy-cyan">
                {chain.name}
              </span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-pink-400">Block:</span>
                <span className="text-cyan-300 ml-1 font-mono">
                  #{blockNumbers[key as keyof typeof blockNumbers].toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-pink-400">Gas:</span>
                <span className={`ml-1 font-mono ${
                  gasPrices[key as keyof typeof gasPrices] > 50 ? 'neon-fluffy-pink' :
                  gasPrices[key as keyof typeof gasPrices] > 20 ? 'neon-fluffy-yellow' :
                  'neon-fluffy-green'
                }`}>
                  {gasPrices[key as keyof typeof gasPrices].toFixed(2)} Gwei
                </span>
              </div>
            </div>
            <div className="mt-1 text-[9px] text-pink-400">
              DEXs: {chain.dexs.join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
