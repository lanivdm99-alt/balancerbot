import { useState, useEffect } from 'react';

interface GasTrackerProps {
  gasPrice: number;
}

export default function GasTracker({ gasPrice }: GasTrackerProps) {
  const [history, setHistory] = useState<number[]>(Array(20).fill(30));

  useEffect(() => {
    setHistory(prev => [...prev.slice(1), gasPrice]);
  }, [gasPrice]);

  const maxGas = Math.max(...history, 50);

  return (
    <div className="box-yellow p-3">
      <h3 className="text-xs uppercase tracking-wider shock-green mb-3 flex items-center gap-2 font-bold">
        <span>⚡</span> Gas Tracker
      </h3>

      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="shock-pink font-bold">Polygon Gas</span>
          <span className={`font-mono font-bold ${
            gasPrice > 100 ? 'shock-pink' :
            gasPrice > 50 ? 'shock-yellow' : 'shock-green'
          }`}>
            {gasPrice.toFixed(2)} Gwei
          </span>
        </div>
        <div className="h-8 flex items-end gap-[1px] bg-black rounded p-1 border border-yellow-500">
          {history.map((val, i) => (
            <div
              key={i}
              className="flex-1 rounded-t transition-all duration-300"
              style={{
                height: `${(val / maxGas) * 100}%`,
                backgroundColor: val > 100 ? '#ff0066' : val > 50 ? '#ffff00' : '#00ff41',
                opacity: 0.5 + (i / history.length) * 0.5,
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
            style={{ left: `${Math.min((gasPrice / 200) * 100, 98)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
