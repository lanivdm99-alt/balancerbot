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
    <div className="fixed bottom-0 left-0 right-0 border-t-2 border-pink-500 bg-black px-4 py-1 flex items-center justify-between text-[10px] z-40">
      <div className="flex items-center gap-4">
        <span className={`flex items-center gap-1 font-bold ${isRunning ? 'status-active' : 'status-paused'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-500' : 'bg-pink-500'}`} />
          {isRunning ? 'ACTIVE' : 'HALTED'}
        </span>
        <span className={`font-bold ${isDryRun ? 'status-dry' : 'status-live'}`}>
          {isDryRun ? '◈ SIMULATION' : '⚡ LIVE EXECUTION'}
        </span>
        <span className="shock-pink">|</span>
        <span className="shock-pink">
          Opps: <span className="shock-cyan font-bold">{opportunities}</span>
        </span>
        <span className="shock-pink">
          Execs: <span className="shock-cyan font-bold">{executions}</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="shock-pink">
          PnL: <span className={`font-bold ${pnl >= 0 ? 'shock-green' : 'shock-pink'}`}>
            {pnl >= 0 ? '+' : ''}${pnl.toFixed(4)}
          </span>
        </span>
        <span className="shock-pink">|</span>
        <span className="shock-purple font-bold">Flashbots ◈ Multi-Chain</span>
        <span className="shock-pink">|</span>
        <span className="shock-cyan font-mono font-bold">{timeStr} UTC</span>
      </div>
    </div>
  );
}
