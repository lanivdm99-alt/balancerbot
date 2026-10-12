interface PerformanceMetricsProps {
  metrics: {
    scanCount: number;
    avgScanTime: string;
    totalPools: number;
    opportunitiesDetected: number;
    lastUpdate: number;
  };
}

export default function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
  const timeSinceUpdate = metrics.lastUpdate > 0 
    ? Math.floor((Date.now() - metrics.lastUpdate) / 1000)
    : 0;

  return (
    <div className="box-purple p-3">
      <h3 className="text-xs uppercase tracking-wider shock-pink mb-3 font-bold">
        ⚡ Performance Metrics
      </h3>
      
      <div className="space-y-2 text-[10px]">
        <div className="flex justify-between items-center">
          <span className="shock-cyan">Total Scans:</span>
          <span className="shock-green font-bold">{metrics.scanCount}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="shock-cyan">Avg Scan Time:</span>
          <span className={`font-bold ${
            Number(metrics.avgScanTime) < 1000 ? 'shock-green' :
            Number(metrics.avgScanTime) < 3000 ? 'shock-yellow' : 'shock-pink'
          }`}>
            {metrics.avgScanTime}ms
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="shock-cyan">Active Pools:</span>
          <span className="shock-green font-bold">{metrics.totalPools}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="shock-cyan">Opportunities:</span>
          <span className="shock-yellow font-bold">{metrics.opportunitiesDetected}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="shock-cyan">Last Update:</span>
          <span className={`font-bold ${
            timeSinceUpdate < 5 ? 'shock-green' :
            timeSinceUpdate < 10 ? 'shock-yellow' : 'shock-pink'
          }`}>
            {timeSinceUpdate}s ago
          </span>
        </div>
      </div>

      {/* Performance Bar */}
      <div className="mt-3 pt-2 border-t border-purple-500/30">
        <div className="flex justify-between text-[9px] mb-1">
          <span className="shock-pink">Speed Rating</span>
          <span className="shock-green font-bold">
            {Number(metrics.avgScanTime) < 1000 ? '⚡ ULTRA' :
             Number(metrics.avgScanTime) < 2000 ? '🚀 FAST' :
             Number(metrics.avgScanTime) < 3000 ? '✓ GOOD' : '⚠ SLOW'}
          </span>
        </div>
        <div className="h-1 bg-black rounded-full overflow-hidden border border-purple-500">
          <div 
            className={`h-full transition-all duration-300 ${
              Number(metrics.avgScanTime) < 1000 ? 'bg-green-500' :
              Number(metrics.avgScanTime) < 2000 ? 'bg-cyan-500' :
              Number(metrics.avgScanTime) < 3000 ? 'bg-yellow-500' : 'bg-pink-500'
            }`}
            style={{ 
              width: `${Math.min(100, Math.max(0, 100 - (Number(metrics.avgScanTime) / 50)))}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
}
