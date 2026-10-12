interface SpeedIndicatorProps {
  scanDuration: number;
  poolCount: number;
}

export default function SpeedIndicator({ scanDuration, poolCount }: SpeedIndicatorProps) {
  const poolsPerSecond = scanDuration > 0 ? Math.round((poolCount / scanDuration) * 1000) : 0;
  
  const getSpeedColor = () => {
    if (poolsPerSecond > 100) return 'shock-green';
    if (poolsPerSecond > 50) return 'shock-cyan';
    if (poolsPerSecond > 20) return 'shock-yellow';
    return 'shock-pink';
  };

  return (
    <div className="box-cyan p-3">
      <h3 className="text-xs uppercase tracking-wider shock-pink mb-2 flex items-center gap-2 font-bold">
        <span>⚡</span> Scanner Speed
      </h3>
      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span className="shock-cyan">Scan Time:</span>
          <span className={`${getSpeedColor()} font-bold`}>{scanDuration}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="shock-cyan">Pools Scanned:</span>
          <span className="shock-green font-bold">{poolCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="shock-cyan">Speed:</span>
          <span className={`${getSpeedColor()} font-bold`}>{poolsPerSecond} pools/sec</span>
        </div>
      </div>
      <div className="mt-2 h-1 bg-black rounded-full overflow-hidden border border-cyan-500">
        <div 
          className={`h-full transition-all duration-300 ${
            poolsPerSecond > 100 ? 'bg-green-500' :
            poolsPerSecond > 50 ? 'bg-cyan-500' :
            poolsPerSecond > 20 ? 'bg-yellow-500' : 'bg-pink-500'
          }`}
          style={{ width: `${Math.min(100, poolsPerSecond)}%` }}
        />
      </div>
    </div>
  );
}
