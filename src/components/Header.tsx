interface HeaderProps {
  isRunning: boolean;
  isDryRun: boolean;
}

export default function Header({ isRunning, isDryRun }: HeaderProps) {
  return (
    <div className="border-b border-pink-500/30 px-4 py-2 relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-transparent to-cyan-500/5" />
      
      <div className="flex items-center justify-between relative z-10">
        {/* ASCII Logo with neon effect */}
        <div className="flex items-center gap-4">
          <pre className="text-[10px] leading-none hidden sm:block neon-fluffy-pink">
{`███████╗██╗      █████╗ ███████╗  ██████╗  ╔═╗╔═╗╔═╗
██╔════╝██║     ██╔══██╗██╔════╝  ██╔══██╗ ║╠═╝║╠═╝╚═╗
█████╗  ██║     ███████║███████╗  ██████╔╝ ║╚═╗║╚═╗╔═╝
██╔══╝  ██║     ██╔══██║╚════██║  ██╔══██╗ ╚═══╝╚══╝╚═╝
██║     ███████╗██║  ██║███████║  ██║  ██║
╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝  ╚═╝  ╚═╝`}
          </pre>
          <div className="sm:hidden">
            <span className="text-xl font-bold neon-fluffy-pink">FLASH-X</span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all ${
            isRunning ? 'fluffy-box-green' : 'fluffy-box-pink'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className={`text-xs font-bold ${isRunning ? 'neon-fluffy-green' : 'neon-fluffy-pink'}`}>
              {isRunning ? 'SCANNING' : 'PAUSED'}
            </span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all ${
            isDryRun ? 'fluffy-box-cyan' : 'fluffy-box-pink'
          }`}>
            <span className={`text-xs font-bold ${isDryRun ? 'neon-fluffy-cyan' : 'neon-fluffy-pink'}`}>
              {isDryRun ? '◈ DRY RUN' : '⚡ LIVE'}
            </span>
          </div>

          <div className="text-xs">
            <span className="neon-fluffy-purple">v3.0</span>
            <span className="text-pink-400"> | </span>
            <span className="neon-fluffy-cyan">Flashbots</span>
          </div>
        </div>
      </div>
    </div>
  );
}
