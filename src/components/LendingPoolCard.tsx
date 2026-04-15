import React from 'react';

interface LendingPoolCardProps {
  poolName: string;
  apyRate: number;
  utilizationRate: number;
  activeInvoices: number;
  totalLiquidity: number;
  allowedPayors: string[];
  onExpand: () => void;
}

export default function LendingPoolCard({
  poolName,
  apyRate,
  utilizationRate,
  activeInvoices,
  totalLiquidity,
  allowedPayors,
  onExpand
}: LendingPoolCardProps) {
  
  let barColor = 'bg-red-500';
  if (utilizationRate < 70) {
    barColor = 'bg-green-500';
  } else if (utilizationRate <= 90) {
    barColor = 'bg-amber-500';
  }

  let borderClass = 'border border-gray-700'; 
  if (poolName === 'Anchor Grade Pool') {
    borderClass = 'border-2 border-green-500';
  } else if (poolName === 'Open Market Pool') {
    borderClass = 'border border-amber-500';
  }

  return (
    <div className={`bg-gray-900 rounded-xl p-6 flex flex-col gap-4 shadow-xl ${borderClass}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-2xl font-bold text-white font-display leading-tight">{poolName}</h3>
        <div className="text-right flex-shrink-0 ml-4">
          <span className="text-3xl font-mono font-bold text-green-400">{apyRate.toFixed(1)}%</span>
          <p className="text-xs text-gray-500 font-mono tracking-wide uppercase mt-0.5">Yield APY</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-2">
         <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-800">
            <span className="block text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Total Liquidity</span>
            <span className="font-mono text-lg text-gray-100 font-medium">₹{totalLiquidity.toLocaleString('en-IN')}</span>
         </div>
         <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-800">
            <span className="block text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Active Invoices</span>
            <span className="font-mono text-lg text-gray-100 font-medium">{activeInvoices}</span>
         </div>
      </div>

      <div className="mb-2">
        <p className="text-xs text-gray-500 font-mono mb-2 tracking-wider uppercase font-semibold">Allowed Payors</p>
        <div className="flex flex-wrap gap-2">
          {allowedPayors.map(payor => (
            <span key={payor} className="px-2.5 py-1 bg-gray-800 text-gray-300 text-[10px] uppercase font-bold rounded-full border border-gray-700">
              {payor}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-2">
        <div className="w-full bg-gray-800/80 h-2.5 rounded-full overflow-hidden border border-gray-700/50">
          <div 
            className={`h-full rounded-full ${barColor} shadow-[0_0_8px_currentColor] transition-all duration-1000 ease-out`} 
            style={{ width: `${Math.min(100, Math.max(0, utilizationRate))}%` }} 
          />
        </div>
        <div className="flex justify-end mt-2">
          <span className="text-[11px] text-gray-400 font-mono font-medium">{utilizationRate.toFixed(1)}% utilized</span>
        </div>
      </div>

      <button 
        onClick={onExpand}
        className="mt-4 w-full py-3.5 px-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors border border-gray-700 font-sans shadow-sm flex items-center justify-center gap-2 group"
      >
        View invoices
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
