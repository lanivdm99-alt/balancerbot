interface FlashLoanPanelProps {
  providers: Record<string, {
    name: string;
    address: string;
    fee: number;
    maxAmount: string;
    status: 'active' | 'deprecated';
  }>;
}

export default function FlashLoanPanel({ providers }: FlashLoanPanelProps) {
  const activeProviders = Object.entries(providers).filter(([_, p]) => p.status === 'active');
  const deprecatedProviders = Object.entries(providers).filter(([_, p]) => p.status === 'deprecated');

  return (
    <div className="box-green p-3">
      <h3 className="text-xs uppercase tracking-wider shock-yellow mb-3 flex items-center gap-2 font-bold">
        <span>💰</span> Flash Loans
        <span className="ml-auto text-[9px] shock-green">{activeProviders.length} Active</span>
      </h3>

      <div className="space-y-2">
        {activeProviders.map(([key, provider]) => (
          <div key={key} className="border border-green-500/30 rounded p-2 text-[10px]">
            <div className="flex justify-between items-center">
              <span className="shock-green font-bold">{provider.name}</span>
              <span className={provider.fee === 0 ? 'shock-green font-bold' : 'shock-yellow'}>
                {provider.fee === 0 ? 'FREE' : `${provider.fee}bps`}
              </span>
            </div>
            <div className="mt-1 shock-cyan text-[9px]">
              Max: {provider.maxAmount}
            </div>
          </div>
        ))}
      </div>

      {deprecatedProviders.length > 0 && (
        <div className="mt-2 pt-2 border-t border-pink-500/30">
          <p className="text-[9px] shock-pink font-bold mb-1">⚠ Deprecated</p>
          {deprecatedProviders.map(([key, provider]) => (
            <div key={key} className="text-[9px] text-gray-500 line-through">
              {provider.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
