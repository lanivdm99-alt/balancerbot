interface HeaderProps {
  isRunning: boolean;
  isDryRun: boolean;
}

export default function Header({ isRunning, isDryRun }: HeaderProps) {
  return (
    <div className="border-b-2 border-pink-500 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* ASCII Logo */}
        <div className="flex items-center gap-4">
          <pre className="text-[10px] leading-none hidden sm:block shock-pink font-bold">
{`███████╗██╗      █████╗ ███████╗  ██████╗  ╔═╗╔═╗╔═╗
██╔════╝██║     ██╔══██╗██╔════╝  ██╔══██╗ ║╠═╝║╠═╝╚═╗
█████╗  ██║     ███████║███████╗  ██████╔╝ ║╚═╗║╚═╗╔═╝
██╔══╝  ██║     ██╔══██║╚════██║  ██╔══██╗ ╚═══╝╚══╝╚═╝
██║     ███████╗██║  ██║███████║  ██║  ██║
╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝  ╚═╝  ╚═╝`}
          </pre>
          <div className="sm:hidden">
            <span className="text-xl font-bold shock-pink">FLASH-X</span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded border-2 ${
            isRunning ? 'border-green-500 bg-black' : 'border-pink-500 bg-black'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500' : 'bg-pink-500'}`} />
            <span className={`text-xs font-bold ${isRunning ? 'status-active' : 'status-paused'}`}>
              {isRunning ? 'SCANNING' : 'PAUSED'}
            </span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1 rounded border-2 ${
            isDryRun ? 'border-cyan-500 bg-black' : 'border-yellow-500 bg-black'
          }`}>
            <span className={`text-xs font-bold ${isDryRun ? 'status-dry' : 'status-live'}`}>
              {isDryRun ? '◈ DRY RUN' : '⚡ LIVE'}
            </span>
          </div>

          <div className="text-xs">
            <span className="shock-purple font-bold">v3.0</span>
            <span className="text-white"> | </span>
            <span className="shock-cyan font-bold">Flashbots</span>
          </div>
        </div>
      </div>
    </div>
  );
}
