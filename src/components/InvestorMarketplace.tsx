"use client";

import { useState } from "react";
import { TrendingUp, Clock, ShieldAlert, CheckCircle2, ChevronRight, Coins } from "lucide-react";
import toast from "react-hot-toast";

type InvoiceAsset = {
  id: string;
  payor: string;
  faceValue: number;
  availableYield: number; // APY
  matureDate: string;
  fractionAvailable: number;
  fractionTotal: number;
  creditScore: string;
};

const DUMMY_INVOICES: InvoiceAsset[] = [
  { id: "INV-1029", payor: "Tata Motors", faceValue: 150000, availableYield: 11.5, matureDate: "2026-05-15", fractionAvailable: 75000, fractionTotal: 150000, creditScore: "AA+" },
  { id: "INV-2941", payor: "Reliance Retail", faceValue: 500000, availableYield: 9.8, matureDate: "2026-06-01", fractionAvailable: 100000, fractionTotal: 500000, creditScore: "AAA" },
  { id: "INV-0872", payor: "Adani Ports", faceValue: 80000, availableYield: 14.2, matureDate: "2026-04-30", fractionAvailable: 80000, fractionTotal: 80000, creditScore: "A-" },
];

export default function InvestorMarketplace() {
  const [invoices, setInvoices] = useState<InvoiceAsset[]>([]);
  const [fundingId, setFundingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"primary" | "secondary">("primary");
  const [isLoading, setIsLoading] = useState(true);

  const [secondaryPositions, setSecondaryPositions] = useState<any[]>([]);

  import("react").then((React) => {
    React.useEffect(() => {
      // Simulate slow Indexer fetch
      const loadData = async () => {
         setIsLoading(true);
         await new Promise(r => setTimeout(r, 1500));
         setInvoices(DUMMY_INVOICES);
         setSecondaryPositions([{ id: "INV-5590", payor: "ITC Limited", positionValue: 25000, askingPrice: 24000, matureDate: "2026-05-20", creditScore: "AA" }]);
         setIsLoading(false);
      }
      loadData();
    }, []);
  });

  const handleBuy = async (invoice: InvoiceAsset) => {
    setFundingId(invoice.id);
    const t = toast.loading(`Initiating Atomic Swap for ${invoice.id}...`);
    
    try {
      // Simulate atomic transfer wallet signing process
      await new Promise(r => setTimeout(r, 2500));
      toast.dismiss(t);
      toast.success("Transaction Confirmed! Fractional ASA transferred successfully.");
      
      // Reduce the available fraction
      setInvoices(prev => prev.map(inv => {
        if (inv.id === invoice.id) {
          return { ...inv, fractionAvailable: Math.max(0, inv.fractionAvailable - 25000) }; // Example drop
        }
        return inv;
      }));
    } catch (e) {
      toast.error("Transaction failed or rejected by user.");
    } finally {
      setFundingId(null);
    }
  };

  return (
    <div className="space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Lending Markets
          </h2>
          <p className="text-gray-400 text-sm mt-1">Acquire fractionalized debt positions from verified MSMEs.</p>
        </div>
        
        <div className="flex gap-3">
           <button 
             onClick={() => setActiveTab("primary")}
             className={`text-sm px-4 py-2 rounded-lg transition-colors ${activeTab === 'primary' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50' : 'bg-gray-800 border border-gray-700 text-gray-400'}`}
           >
             Primary Issuance
           </button>
           <button 
             onClick={() => setActiveTab("secondary")}
             className={`text-sm px-4 py-2 rounded-lg transition-colors ${activeTab === 'secondary' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/50' : 'bg-gray-800 border border-gray-700 text-gray-400'}`}
           >
             Secondary Market Exit
           </button>
        </div>
      </div>

      {activeTab === "primary" ? (
      isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map((i) => (
             <div key={i} className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 min-h-[320px] animate-pulse">
                <div className="w-1/3 h-5 bg-gray-700 rounded mb-4"></div>
                <div className="w-2/3 h-8 bg-gray-700 rounded mb-6"></div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="w-full h-12 bg-gray-700 rounded"></div>
                    <div className="w-full h-12 bg-gray-700 rounded"></div>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded mb-6"></div>
                <div className="w-full h-12 bg-gray-700 rounded-xl"></div>
             </div>
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-gray-800/20 border border-dashed border-gray-700 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <Coins className="w-12 h-12 text-gray-600 mb-4" />
            <h3 className="text-xl text-gray-300 font-medium mb-2">No Active Invoices Found</h3>
            <p className="text-gray-500 max-w-sm">The Indexer did not return any fractionalized ASAs matching your criteria. Wait for SMEs to tokenize new invoices.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {invoices.map((inv) => (
          <div key={inv.id} className="bg-gray-800/40 border border-gray-700/50 hover:border-emerald-500/30 transition-colors rounded-2xl p-6 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold text-gray-500 tracking-wider">PAYOR</span>
                <h3 className="text-lg font-semibold text-gray-100">{inv.payor}</h3>
              </div>
              <div className="px-2.5 py-1 bg-gray-900 border border-emerald-500/30 rounded text-xs font-mono text-emerald-400">
                Risk Rating: {inv.creditScore}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-xs text-gray-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Yield (APY)</span>
                <p className="text-xl font-mono text-green-400 mt-1">{inv.availableYield}%</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Maturity</span>
                <p className="text-sm font-medium text-gray-200 mt-1">{inv.matureDate}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="w-full bg-gray-900 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${(inv.fractionAvailable / inv.fractionTotal) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Available: ₹ {inv.fractionAvailable.toLocaleString()}</span>
                <span>Total: ₹ {inv.fractionTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-700/50">
              <button 
                disabled={inv.fractionAvailable === 0 || fundingId === inv.id}
                onClick={() => handleBuy(inv)}
                className="w-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fundingId === inv.id ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                    Executing Swap...
                  </span>
                ) : inv.fractionAvailable === 0 ? (
                  <span className="flex items-center gap-2">
                     <CheckCircle2 className="w-4 h-4" /> Fully Funded
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                     <Coins className="w-4 h-4" /> Buy Fractional <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
      )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Secondary Market View */}
          {isLoading ? (
             <div className="bg-gray-800/40 border border-indigo-500/30 rounded-2xl p-6 min-h-[250px] animate-pulse">
                <div className="w-1/3 h-5 bg-gray-700 rounded mb-4"></div>
             </div>
          ) : secondaryPositions.length === 0 ? (
             <div className="col-span-full bg-gray-800/20 border border-dashed border-indigo-500/30 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                 <ShieldAlert className="w-12 h-12 text-indigo-500/50 mb-4" />
                 <h3 className="text-xl text-gray-300 font-medium mb-2">No Secondary Listings</h3>
                 <p className="text-gray-500">There are no existing Invoice-ASAs listed on the secondary market for exit.</p>
             </div>
          ) : (
              secondaryPositions.map((pos) => (
                 <div key={pos.id} className="bg-gray-800/40 border border-indigo-500/30 rounded-2xl p-6 relative">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-100">ASA {pos.id}</h3>
                        <span className="text-xs text-gray-400">{pos.payor}</span>
                      </div>
                      <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded-md border border-indigo-500/30">Discounted Exit</span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Position Value</span>
                        <span className="font-mono text-gray-200">₹{pos.positionValue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Asking Price</span>
                        <span className="font-mono text-indigo-400 font-bold">₹{pos.askingPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Maturity Date</span>
                        <span className="text-gray-200">{pos.matureDate}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                       <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium text-sm transition-colors">
                         Buy Position
                       </button>
                    </div>
                 </div>
              ))
          )}

          <div className="bg-gray-800/20 border border-dashed border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[250px]">
             <ShieldAlert className="w-8 h-8 text-gray-500 mb-3" />
             <h3 className="text-gray-300 font-medium mb-1">List Your Position</h3>
             <p className="text-sm text-gray-500">Need immediate liquidity? List your existing Invoice-ASAs on the secondary market at a discount.</p>
             <button className="mt-4 px-4 py-2 border border-gray-600 hover:bg-gray-700 rounded-lg text-sm transition-colors text-white">
                Create Listing
             </button>
          </div>
        </div>
      )}
      
    </div>
  );
}
