interface FlashLoanPanelProps {
  providers: Record<string, {
    name: string;
    address: string;
    fee: number;
    maxAmount: string;
  }>;
}

export default function FlashLoanPanel({ providers }: FlashLoanPanelProps) {
  return (
    <div className="box-green p-3">
      <h3 className="text-xs uppercase tracking-wider shock-yellow mb-3 flex items-center gap-2 font-bold">
        <span>💰</span> Free Flash Loans
      </h3>

      <div className="space-y-2">
        {Object.entries(providers).map(([key, provider]) => (
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
    </div>
  );
}
