"use client";

import { useState, useMemo } from "react";
import { Calculator, UploadCloud, ShieldCheck, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { BACKEND_URL } from "../config";

export default function SmeDashboard() {
  const [amount, setAmount] = useState<string>("");
  const [maturityDays, setMaturityDays] = useState<string>("30");
  const [payor, setPayor] = useState<string>("Tata Motors");
  const [irn, setIrn] = useState<string>("IRN-1001-GSTIN-001");
  const [isProcessing, setIsProcessing] = useState(false);

  // Discount Formula: P = F * (1 - d * (t / 365))
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
      const verifyLoading = toast.loading("Verifying IRN with GST Oracle...");
      
      const res = await fetch(`${BACKEND_URL}/verify-invoice`, {
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
      
      const mintLoading = toast.loading("Minting Fractionalized ASA...");
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
    <div className="grid grid-cols-2 gap-8 items-start" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
      
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel" 
        style={{ padding: '2rem', borderRadius: 'var(--radius-2xl)', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
      >
        <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
           <h2 className="font-display text-xl font-semibold flex items-center gap-2">
             <UploadCloud size={24} color="var(--accent-indigo-light)" />
             Tokenize New Invoice
           </h2>
           <div style={{ 
             background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', 
             padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '0.5rem' 
           }}>
              <ShieldCheck size={16} color="var(--accent-indigo-light)" />
              <span className="text-sm font-medium" style={{ color: 'var(--accent-indigo-light)' }}>
                Trust Score: <span className="font-bold text-white">94/100</span>
              </span>
           </div>
        </div>

        <div className="flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <label className="text-sm font-medium text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Invoice Reference Number (IRN)</label>
            <input 
              type="text" 
              value={irn}
              onChange={(e) => setIrn(e.target.value)}
              className="premium-input font-mono text-sm"
              placeholder="e.g. IRN-123-GSTIN-456"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Face Value (₹)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="premium-input font-mono"
                placeholder="100000"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Days to Maturity</label>
              <input 
                type="number" 
                value={maturityDays}
                onChange={(e) => setMaturityDays(e.target.value)}
                className="premium-input font-mono"
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <label className="text-sm font-medium text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Anchor Payor (Corporate)</label>
            <select 
              value={payor}
              onChange={(e) => setPayor(e.target.value)}
              className="premium-input"
              style={{ padding: '0.8rem 1rem' }}
            >
              <option>Tata Motors</option>
              <option>Reliance Retail</option>
              <option>Adani Ports</option>
            </select>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <button 
              onClick={handleTokenize}
              disabled={isProcessing}
              className="premium-btn btn-primary w-full"
              style={{ marginTop: '1rem', padding: '1rem' }}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                   <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-spin" />
                   Processing via Oracle...
                </span>
              ) : (
                <>
                   Tokenize & Lock Stake <ArrowRight size={18} />
                </>
              )}
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Column: Quote Generator */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel relative overflow-hidden"
        style={{ 
          padding: '2.5rem', borderRadius: 'var(--radius-2xl)', 
          background: 'linear-gradient(145deg, rgba(30,27,75,0.4) 0%, rgba(15,23,42,0.4) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.2)' 
        }}
      >
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'var(--accent-purple)', filter: 'blur(100px)', opacity: 0.2, borderRadius: '50%' }} />
        
        <h2 className="font-display text-xl font-semibold flex items-center gap-2" style={{ marginBottom: '2rem', zIndex: 1, position: 'relative' }}>
          <Calculator size={24} color="var(--accent-purple)" />
          Liquid Quote
        </h2>

        <div className="flex flex-col gap-6" style={{ zIndex: 1, position: 'relative' }}>
          <div className="flex justify-between items-end" style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-muted font-medium">Invoice Face Value</span>
            <span className="text-2xl font-mono font-medium">
              ₹ {metrics.p > 0 ? parseFloat(amount).toLocaleString() : "0.00"}
            </span>
          </div>

          <div className="flex justify-between items-end" style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-muted font-medium">Discount Rate & Fee</span>
            <div className="text-right">
               <div className="text-sm font-mono text-red" style={{ marginBottom: '0.25rem' }}>- {(discountRate * 100).toFixed(1)}% APY</div>
               <span className="text-xl font-mono text-red font-medium">
                 ₹ {metrics.fee > 0 ? metrics.fee.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}
               </span>
            </div>
          </div>

          <div className="flex justify-between items-end" style={{ paddingTop: '1rem' }}>
            <span className="text-lg font-medium" style={{ color: 'var(--accent-indigo-light)' }}>Instant Liquidity</span>
            <motion.span 
              key={metrics.p}
              initial={{ scale: 1.1, textShadow: '0 0 20px rgba(16, 185, 129, 0.8)' }}
              animate={{ scale: 1, textShadow: '0 0 0px rgba(16, 185, 129, 0)' }}
              className="text-4xl font-bold font-mono text-gradient text-gradient-success"
            >
              ₹ {metrics.p > 0 ? metrics.p.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"}
            </motion.span>
          </div>
          
          <div style={{ 
            marginTop: '2rem', background: 'rgba(0,0,0,0.3)', padding: '1rem 1.5rem', 
            borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'flex-start', gap: '1rem',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <ShieldCheck size={28} color="var(--accent-emerald-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p className="text-xs text-muted" style={{ lineHeight: 1.6 }}>
              By tokenizing, you agree to lock a 5% security stake in ALGO to guarantee authenticity. MBR rent is reclaimed upon maturity. No Double-Discounting permitted due to on-chain Box Storage isolation.
            </p>
          </div>
        </div>
      </motion.div>
      
    </div>
  );
}
