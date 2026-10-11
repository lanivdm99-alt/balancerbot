interface StatusBarProps {
  isRunning: boolean;
  isDryRun: boolean;
  opportunities: number;
  executions: number;
  pnl: number;
}

export default function StatusBar({ isRunning, isDryRun, opportunities, executions, pnl }: StatusBarProps) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-green-900/50 bg-black/95 px-4 py-1 flex items-center justify-between text-[10px] z-40">
      <div className="flex items-center gap-4">
        <span className={`flex items-center gap-1 ${isRunning ? 'text-green-400' : 'text-red-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          {isRunning ? 'ACTIVE' : 'HALTED'}
        </span>
        <span className={isDryRun ? 'text-yellow-400' : 'text-red-400'}>
          {isDryRun ? '◈ SIMULATION' : '⚡ LIVE EXECUTION'}
        </span>
        <span className="text-green-700">|</span>
        <span className="text-green-500">
          Opps: <span className="text-cyan-400">{opportunities}</span>
        </span>
        <span className="text-green-500">
          Execs: <span className="text-cyan-400">{executions}</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-green-500">
          PnL: <span className={`font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {pnl >= 0 ? '+' : ''}${pnl.toFixed(4)}
          </span>
        </span>
        <span className="text-green-700">|</span>
        <span className="text-green-600">Balancer V3 ◈ Multi-Chain</span>
        <span className="text-green-700">|</span>
        <span className="text-green-500 font-mono">{timeStr} UTC</span>
      </div>
    </div>
  );
}
