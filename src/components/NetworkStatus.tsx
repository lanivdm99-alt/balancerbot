import { CHAINS } from '../utils/constants';

interface NetworkStatusProps {
  blockNumbers: { arbitrum: number; polygon: number };
  gasPrices: { arbitrum: number; polygon: number };
}

export default function NetworkStatus({ blockNumbers, gasPrices }: NetworkStatusProps) {
  return (
    <div className="box-cyan p-3">
      <h3 className="text-xs uppercase tracking-wider shock-pink mb-3 flex items-center gap-2 font-bold">
        <span>◈</span> Network Status
      </h3>

      <div className="space-y-3">
        {Object.entries(CHAINS).map(([key, chain]) => (
          <div key={key} className="border border-cyan-500 rounded p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold shock-cyan">
                {chain.name}
              </span>
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="shock-pink font-bold">Block:</span>
                <span className="shock-cyan ml-1 font-mono">
                  #{blockNumbers[key as keyof typeof blockNumbers].toLocaleString()}
                </span>
              </div>
              <div>
                <span className="shock-pink font-bold">Gas:</span>
                <span className={`ml-1 font-mono font-bold ${
                  gasPrices[key as keyof typeof gasPrices] > 50 ? 'shock-pink' :
                  gasPrices[key as keyof typeof gasPrices] > 20 ? 'shock-yellow' :
                  'shock-green'
                }`}>
                  {gasPrices[key as keyof typeof gasPrices].toFixed(2)} Gwei
                </span>
              </div>
            </div>
            <div className="mt-1 text-[9px] shock-pink">
              DEXs: {chain.dexs.join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
