import { useState, useEffect } from 'react';

interface GasTrackerProps {
  gasPrices: { arbitrum: number; polygon: number };
}

export default function GasTracker({ gasPrices }: GasTrackerProps) {
  const [history, setHistory] = useState<{ arb: number[]; poly: number[] }>({
    arb: Array(20).fill(0.1),
    poly: Array(20).fill(30),
  });

  useEffect(() => {
    setHistory(prev => ({
      arb: [...prev.arb.slice(1), gasPrices.arbitrum],
      poly: [...prev.poly.slice(1), gasPrices.polygon],
    }));
  }, [gasPrices]);

  const maxArb = Math.max(...history.arb, 0.2);
  const maxPoly = Math.max(...history.poly, 50);

  return (
    <div className="border border-green-900/50 rounded p-3">
      <h3 className="text-xs uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
        <span>⚡</span> Gas Tracker
      </h3>

      {/* Arbitrum Gas Chart */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-[#28a0f0]">ARB Gas</span>
          <span className="text-green-400">{gasPrices.arbitrum.toFixed(3)} Gwei</span>
        </div>
        <div className="h-8 flex items-end gap-[1px] bg-black/50 rounded p-1">
          {history.arb.map((val, i) => (
            <div
              key={i}
              className="flex-1 rounded-t transition-all duration-300"
              style={{
                height: `${(val / maxArb) * 100}%`,
                backgroundColor: val > 0.15 ? '#ef4444' : val > 0.12 ? '#eab308' : '#22c55e',
                opacity: 0.5 + (i / history.arb.length) * 0.5,
              }}
            />
          ))}
        </div>
      </div>

      {/* Polygon Gas Chart */}
      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-[#8247e5]">POL Gas</span>
          <span className={`font-mono ${
            gasPrices.polygon > 50 ? 'text-red-400' :
            gasPrices.polygon > 30 ? 'text-yellow-400' : 'text-green-400'
          }`}>
            {gasPrices.polygon.toFixed(1)} Gwei
          </span>
        </div>
        <div className="h-8 flex items-end gap-[1px] bg-black/50 rounded p-1">
          {history.poly.map((val, i) => (
            <div
              key={i}
              className="flex-1 rounded-t transition-all duration-300"
              style={{
                height: `${(val / maxPoly) * 100}%`,
                backgroundColor: val > 50 ? '#ef4444' : val > 35 ? '#eab308' : '#22c55e',
                opacity: 0.5 + (i / history.poly.length) * 0.5,
              }}
            />
          ))}
        </div>
      </div>

      {/* Gas Gauge */}
      <div className="mt-3 pt-2 border-t border-green-900/30">
        <div className="flex justify-between text-[10px] text-green-700">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
        <div className="h-2 mt-1 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 relative">
          <div
            className="absolute top-0 w-2 h-2 bg-white rounded-full shadow-lg shadow-white/50 transition-all duration-500"
            style={{ left: `${Math.min((gasPrices.polygon / 100) * 100, 98)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
