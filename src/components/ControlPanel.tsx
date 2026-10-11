interface ControlPanelProps {
  isRunning: boolean;
  isDryRun: boolean;
  onToggleRunning: () => void;
  onToggleDryRun: () => void;
  onKillSwitch: () => void;
}

export default function ControlPanel({
  isRunning,
  isDryRun,
  onToggleRunning,
  onToggleDryRun,
  onKillSwitch,
}: ControlPanelProps) {
  return (
    <div className="border border-green-900/50 rounded p-3">
      <h3 className="text-xs uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
        <span>⌘</span> Control Panel
      </h3>

      <div className="space-y-2">
        {/* Pause/Resume */}
        <button
          onClick={onToggleRunning}
          className={`w-full px-3 py-2 rounded border text-xs font-bold uppercase tracking-wider transition-all ${
            isRunning
              ? 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10'
              : 'border-green-500/50 text-green-400 hover:bg-green-500/10'
          }`}
        >
          {isRunning ? '⏸ Pause [P]' : '▶ Resume [P]'}
        </button>

        {/* Dry Run Toggle */}
        <button
          onClick={onToggleDryRun}
          className={`w-full px-3 py-2 rounded border text-xs font-bold uppercase tracking-wider transition-all ${
            isDryRun
              ? 'border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10'
              : 'border-red-500/50 text-red-400 hover:bg-red-500/10'
          }`}
        >
          {isDryRun ? '◈ Dry Run [D]' : '⚡ Live Mode [D]'}
        </button>

        {/* Kill Switch */}
        <button
          onClick={onKillSwitch}
          className="w-full px-3 py-2 rounded border border-red-600 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-500/20 transition-all animate-pulse"
        >
          ☠ KILL SWITCH [K]
        </button>
      </div>

      {/* Hotkey Legend */}
      <div className="mt-3 pt-3 border-t border-green-900/30">
        <p className="text-[10px] text-green-700 uppercase tracking-wider mb-1">Hotkeys</p>
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <span className="text-green-600">[P] Pause/Resume</span>
          <span className="text-green-600">[D] Toggle Mode</span>
          <span className="text-green-600">[K] Kill Switch</span>
          <span className="text-green-600">[S] Stats</span>
        </div>
      </div>
    </div>
  );
}
