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
    <div className="fluffy-box-pink p-3">
      <h3 className="text-xs uppercase tracking-wider neon-fluffy-cyan mb-3 flex items-center gap-2">
        <span>⌘</span> Control Panel
      </h3>

      <div className="space-y-2">
        <button
          onClick={onToggleRunning}
          className={`w-full px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            isRunning
              ? 'neon-button-cyan'
              : 'neon-button-pink'
          }`}
        >
          {isRunning ? '⏸ Pause [P]' : '▶ Resume [P]'}
        </button>

        <button
          onClick={onToggleDryRun}
          className={`w-full px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            isDryRun
              ? 'neon-button-cyan'
              : 'neon-button-pink'
          }`}
        >
          {isDryRun ? '◈ Dry Run [D]' : '⚡ Live Mode [D]'}
        </button>

        <button
          onClick={onKillSwitch}
          className="w-full px-3 py-2 rounded-lg neon-button-red text-xs font-bold uppercase tracking-wider"
        >
          ☠ KILL SWITCH [K]
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-pink-500/30">
        <p className="text-[10px] text-pink-400 uppercase tracking-wider mb-1">Hotkeys</p>
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <span className="text-cyan-300">[P] Pause/Resume</span>
          <span className="text-cyan-300">[D] Toggle Mode</span>
          <span className="text-cyan-300">[K] Kill Switch</span>
          <span className="text-cyan-300">[S] Stats</span>
        </div>
      </div>
    </div>
  );
}
