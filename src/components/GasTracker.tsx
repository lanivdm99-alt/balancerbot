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
    <div className="box-yellow p-3">
      <h3 className="text-xs uppercase tracking-wider shock-green mb-3 flex items-center gap-2 font-bold">
        <span>⚡</span> Gas Tracker
      </h3>

      <div className="mb-3">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="shock-cyan font-bold">ARB Gas</span>
          <span className="shock-green font-bold">{gasPrices.arbitrum.toFixed(3)} Gwei</span>
        </div>
        <div className="h-8 flex items-end gap-[1px] bg-black rounded p-1 border border-yellow-500">
          {history.arb.map((val, i) => (
            <div
              key={i}
              className="flex-1 rounded-t transition-all duration-300"
              style={{
                height: `${(val / maxArb) * 100}%`,
                backgroundColor: val > 0.15 ? '#ff0066' : val > 0.12 ? '#ffff00' : '#00ff41',
                opacity: 0.5 + (i / history.arb.length) * 0.5,
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="shock-pink font-bold">POL Gas</span>
          <span className={`font-mono font-bold ${
            gasPrices.polygon > 50 ? 'shock-pink' :
            gasPrices.polygon > 30 ? 'shock-yellow' : 'shock-green'
          }`}>
            {gasPrices.polygon.toFixed(1)} Gwei
          </span>
        </div>
        <div className="h-8 flex items-end gap-[1px] bg-black rounded p-1 border border-yellow-500">
          {history.poly.map((val, i) => (
            <div
              key={i}
              className="flex-1 rounded-t transition-all duration-300"
              style={{
                height: `${(val / maxPoly) * 100}%`,
                backgroundColor: val > 50 ? '#ff0066' : val > 35 ? '#ffff00' : '#00ff41',
                opacity: 0.5 + (i / history.poly.length) * 0.5,
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-yellow-500">
        <div className="flex justify-between text-[10px] shock-pink font-bold">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
        <div className="h-2 mt-1 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-pink-500 relative">
          <div
            className="absolute top-0 w-2 h-2 bg-white rounded-full transition-all duration-500"
            style={{ left: `${Math.min((gasPrices.polygon / 100) * 100, 98)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
