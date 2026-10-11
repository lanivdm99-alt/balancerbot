interface HeaderProps {
  isRunning: boolean;
  isDryRun: boolean;
}

export default function Header({ isRunning, isDryRun }: HeaderProps) {
  return (
    <div className="border-b border-green-900/50 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* ASCII Logo */}
        <div className="flex items-center gap-4">
          <pre className="text-[10px] leading-none text-cyan-400 hidden sm:block">
{`███████╗██╗      █████╗ ███████╗  ██████╗  ╔═╗╔═╗╔═╗
██╔════╝██║     ██╔══██╗██╔════╝  ██╔══██╗ ║╠═╝║╠═╝╚═╗
█████╗  ██║     ███████║███████╗  ██████╔╝ ║╚═╗║╚═╗╔═╝
██╔══╝  ██║     ██╔══██║╚════██║  ██╔══██╗ ╚═══╝╚══╝╚═╝
██║     ███████╗██║  ██║███████║  ██║  ██║
╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝  ╚═╝  ╚═╝`}
          </pre>
          <div className="sm:hidden">
            <span className="text-xl font-bold text-cyan-400">FLASH-X</span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded border ${
            isRunning ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className={`text-xs ${isRunning ? 'text-green-400' : 'text-red-400'}`}>
              {isRunning ? 'SCANNING' : 'PAUSED'}
            </span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1 rounded border ${
            isDryRun ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-red-500/50 bg-red-500/10'
          }`}>
            <span className={`text-xs font-bold ${isDryRun ? 'text-yellow-400' : 'text-red-400'}`}>
              {isDryRun ? '◈ DRY RUN' : '⚡ LIVE'}
            </span>
          </div>

          <div className="text-xs text-green-600">
            <span className="text-green-500">v2.1.0</span> | Balancer V3
          </div>
        </div>
      </div>
    </div>
  );
}
