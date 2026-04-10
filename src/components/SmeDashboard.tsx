"use client";

import { useState, useMemo } from "react";
import { Calculator, UploadCloud, ShieldCheck, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function SmeDashboard() {
  const [amount, setAmount] = useState<string>("");
  const [maturityDays, setMaturityDays] = useState<string>("30");
  const [payor, setPayor] = useState<string>("Tata Motors");
  const [irn, setIrn] = useState<string>("IRN-1001-GSTIN-001");
  const [isProcessing, setIsProcessing] = useState(false);

  // Discount Formula: P = F * (1 - d * (t / 365))
  // Assuming a baseline discount rate of 12% annually for demo.
  const discountRate = 0.12; 

  const metrics = useMemo(() => {
    const f = parseFloat(amount);
    if (!f || isNaN(f)) return { p: 0, fee: 0, t: 0 };
    const t = parseInt(maturityDays) || 30;
    const p = f * (1 - discountRate * (t / 365));
    return {
      p: p,
      fee: f - p,
      t
    };
  }, [amount, maturityDays]);

  const handleTokenize = async () => {
    if (!amount || parseFloat(amount) <= 0) return toast.error("Enter a valid invoice amount");
    setIsProcessing(true);
    
    try {
      // 1. Off-chain GST verification
      const verifyLoading = toast.loading("Verifying IRN with GST Oracle...");
      
      const res = await fetch("http://localhost:3001/verify-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ irn, amount: parseFloat(amount), maturityDate: Date.now() + parseInt(maturityDays) * 86400000 })
      });
      
      const data = await res.json();
      toast.dismiss(verifyLoading);

      if (!data.success) {
        throw new Error(data.error || "Verification failed");
      }
      
      toast.success("GST Verified! Signature obtained.");
      
      // 2. Mocking the Smart Contract call
      const mintLoading = toast.loading("Minting Fractionalized ASA...");
      
      // Here we would call the contract.ts mint_invoice method using algosdk and the signed Txn structure
      // For now, simulate delay
      await new Promise(r => setTimeout(r, 2000));
      
      toast.dismiss(mintLoading);
      toast.success("Invoice Tokenized! Your ASA is now live in the Marketplace.", { duration: 5000 });
      setAmount("");

    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-semibold flex items-center gap-2">
             <UploadCloud className="w-5 h-5 text-indigo-400" />
             Tokenize New Invoice
           </h2>
           <div className="bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-indigo-300 font-medium">Trust Score: <span className="text-white font-bold">94/100</span></span>
           </div>
        </div>

        <div className="space-y-5 flex flex-col">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Invoice Reference Number (IRN)</label>
            <input 
              type="text" 
              value={irn}
              onChange={(e) => setIrn(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-gray-600 transition-all font-mono text-sm"
              placeholder="e.g. IRN-123-GSTIN-456"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Face Value (₹)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 text-white placeholder-gray-600 font-mono"
                placeholder="100,000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Days to Maturity</label>
              <input 
                type="number" 
                value={maturityDays}
                onChange={(e) => setMaturityDays(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 text-white placeholder-gray-600 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Anchor Payor (Corporate)</label>
            <select 
              value={payor}
              onChange={(e) => setPayor(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 text-white appearance-none"
            >
              <option>Tata Motors</option>
              <option>Reliance Retail</option>
              <option>Adani Ports</option>
            </select>
          </div>

          <button 
            onClick={handleTokenize}
            disabled={isProcessing}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 px-4 rounded-xl mt-4 transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                 <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 Processing via Oracle...
              </span>
            ) : (
              <>
                 Tokenize & Lock Stake <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Column: Quote Generator */}
      <div>
        <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 relative z-10">
            <Calculator className="w-5 h-5 text-purple-400" />
            Liquid Quote
          </h2>

          <div className="space-y-6 relative z-10">
            <div className="flex justify-between items-end pb-4 border-b border-white/10">
              <span className="text-gray-400">Invoice Face Value</span>
              <span className="text-2xl font-mono">₹ {metrics.p > 0 ? parseFloat(amount).toLocaleString() : "0.00"}</span>
            </div>

            <div className="flex justify-between items-end pb-4 border-b border-white/10">
              <span className="text-gray-400">Discount Rate & Fee</span>
              <div className="text-right">
                 <div className="text-sm text-red-400 font-mono mb-1">- {(discountRate * 100).toFixed(1)}% APY</div>
                 <span className="text-xl font-mono text-red-300">₹ {metrics.fee > 0 ? metrics.fee.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}</span>
              </div>
            </div>

            <div className="flex justify-between items-end pt-2">
              <span className="text-indigo-200 font-medium text-lg">Instant Liquidity</span>
              <span className="text-4xl font-bold font-mono bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-md">
                ₹ {metrics.p > 0 ? metrics.p.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}
              </span>
            </div>
            
            <div className="mt-8 bg-black/40 rounded-xl p-4 flex items-start gap-4 border border-white/5">
              <ShieldCheck className="w-6 h-6 text-green-400 shrink-0" />
              <p className="text-xs text-gray-400 leading-relaxed">
                By tokenizing, you agree to lock a 5% security stake in ALGO to guarantee authenticity. MBR rent is reclaimed upon maturity. No Double-Discounting permitted due to on-chain Box Storage isolation.
              </p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
