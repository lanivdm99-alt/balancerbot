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
    <div className="fixed bottom-0 left-0 right-0 border-t border-pink-500/30 bg-black/95 px-4 py-1 flex items-center justify-between text-[10px] z-40">
      <div className="flex items-center gap-4">
        <span className={`flex items-center gap-1 ${isRunning ? 'neon-fluffy-green' : 'neon-fluffy-pink'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-pink-400'}`} />
          {isRunning ? 'ACTIVE' : 'HALTED'}
        </span>
        <span className={isDryRun ? 'neon-fluffy-cyan' : 'neon-fluffy-pink'}>
          {isDryRun ? '◈ SIMULATION' : '⚡ LIVE EXECUTION'}
        </span>
        <span className="text-pink-400">|</span>
        <span className="text-pink-400">
          Opps: <span className="neon-fluffy-cyan">{opportunities}</span>
        </span>
        <span className="text-pink-400">
          Execs: <span className="neon-fluffy-cyan">{executions}</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-pink-400">
          PnL: <span className={`font-bold ${pnl >= 0 ? 'neon-fluffy-green' : 'neon-fluffy-pink'}`}>
            {pnl >= 0 ? '+' : ''}${pnl.toFixed(4)}
          </span>
        </span>
        <span className="text-pink-400">|</span>
        <span className="neon-fluffy-purple">Flashbots ◈ Multi-Chain</span>
        <span className="text-pink-400">|</span>
        <span className="neon-fluffy-cyan font-mono">{timeStr} UTC</span>
      </div>
    </div>
  );
}
