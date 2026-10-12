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
    <div className="box-pink p-3">
      <h3 className="text-xs uppercase tracking-wider shock-cyan mb-3 flex items-center gap-2 font-bold">
        <span>⌘</span> Control Panel
      </h3>

      <div className="space-y-2">
        <button
          onClick={onToggleRunning}
          className={`w-full px-3 py-2 rounded text-xs font-bold uppercase tracking-wider ${
            isRunning ? 'btn-cyan' : 'btn-pink'
          }`}
        >
          {isRunning ? '⏸ Pause [P]' : '▶ Resume [P]'}
        </button>

        <button
          onClick={onToggleDryRun}
          className={`w-full px-3 py-2 rounded text-xs font-bold uppercase tracking-wider ${
            isDryRun ? 'btn-cyan' : 'btn-pink'
          }`}
        >
          {isDryRun ? '◈ Dry Run [D]' : '⚡ Live Mode [D]'}
        </button>

        <button
          onClick={onKillSwitch}
          className="w-full px-3 py-2 rounded btn-red text-xs font-bold uppercase tracking-wider"
        >
          ☠ KILL SWITCH [K]
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-pink-500">
        <p className="text-[10px] shock-pink uppercase tracking-wider mb-1 font-bold">Hotkeys</p>
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <span className="shock-cyan">[P] Pause/Resume</span>
          <span className="shock-cyan">[D] Toggle Mode</span>
          <span className="shock-cyan">[K] Kill Switch</span>
          <span className="shock-cyan">[S] Stats</span>
        </div>
      </div>
    </div>
  );
}
