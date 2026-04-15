"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Clock, ShieldAlert, CheckCircle2, ChevronRight, Coins } from "lucide-react";
import toast from "react-hot-toast";
import { useWallet } from "@txnlab/use-wallet-react";
import algosdk from "algosdk";
import { motion, AnimatePresence } from "framer-motion";
import { ALGOD_SERVER, ORACLE_ADDRESS, BACKEND_URL, APP_ID } from "../config";

type InvoiceAsset = {
  id: string;
  payor: string;
  faceValue: number;
  availableYield: number; // APY
  matureDate: string;
  fractionAvailable: number;
  fractionTotal: number;
  creditScore: string;
  presentValue?: number;
  status?: string;
  assetId?: number;
};

const DUMMY_INVOICES: InvoiceAsset[] = [
  { id: "INV-1029", payor: "Tata Motors", faceValue: 150000, availableYield: 11.5, matureDate: "2026-05-15", fractionAvailable: 75000, fractionTotal: 150000, creditScore: "AA+", presentValue: 145000, status: "SETTLED", assetId: 104520 },
  { id: "INV-2941", payor: "Reliance Retail", faceValue: 500000, availableYield: 9.8, matureDate: "2026-06-01", fractionAvailable: 100000, fractionTotal: 500000, creditScore: "AAA", presentValue: 480000, status: "FUNDED", assetId: 104521 },
  { id: "INV-0872", payor: "Adani Ports", faceValue: 80000, availableYield: 14.2, matureDate: "2026-04-30", fractionAvailable: 80000, fractionTotal: 80000, creditScore: "A-", presentValue: 78000, status: "ACTIVE", assetId: 104522 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function InvestorMarketplace() {
  const [invoices, setInvoices] = useState<InvoiceAsset[]>([]);
  const [fundingId, setFundingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"primary" | "secondary">("primary");
  const [isLoading, setIsLoading] = useState(true);

  const { activeAccount, signTransactions } = useWallet();
  const MOCK_USDC_BALANCE = activeAccount ? 245000 : 0;
  const portfolioYield = activeAccount ? "+14.2%" : "0.0%";

  const [secondaryPositions, setSecondaryPositions] = useState<any[]>([]);
  const [poolStats, setPoolStats] = useState({ totalLiquidity: 0, aggregateApy: 0, activeCount: 0 });

  useEffect(() => {
    const fetchPools = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/pools`);
        const data = await response.json();
        if (Array.isArray(data)) {
          let tLiquidity = 0;
          let sumApy = 0;
          let activePos = 0;
          data.forEach((pool: any) => {
            tLiquidity += pool.totalLiquidity || 0;
            sumApy += (pool.apy || 0) * (pool.totalLiquidity || 0);
            if (Array.isArray(pool.invoices)) {
               activePos += pool.invoices.filter((inv: any) => inv.status === 'FUNDED').length;
            } else {
               activePos += pool.activeCount || 0;
            }
          });
          const avgApy = tLiquidity > 0 ? sumApy / tLiquidity : 0;
          setPoolStats({ totalLiquidity: tLiquidity, aggregateApy: avgApy, activeCount: activePos });
        }
      } catch (e) {
        console.error("Failed to fetch pool stats", e);
      }
    };
    fetchPools();
    const interval = setInterval(fetchPools, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadData = async () => {
       setIsLoading(true);
       await new Promise(r => setTimeout(r, 1000));
       setInvoices(DUMMY_INVOICES);
       setSecondaryPositions([{ id: "INV-5590", payor: "ITC Limited", positionValue: 25000, askingPrice: 24000, matureDate: "2026-05-20", creditScore: "AA" }]);
       setIsLoading(false);
    }
    loadData();
  }, [activeTab]); // simulate reload on tab switch for effect

  const handleBuy = async (invoice: InvoiceAsset) => {
    if (!activeAccount) {
      toast.error("Authentication Error: Connect Algorand Wallet to trade.", { icon: "🔒" });
      return;
    }

    setFundingId(invoice.id);
    const t = toast.loading(`Initiating Algorand Swap for ${invoice.id}...`);
    
    try {
      const algodClient = new algosdk.Algodv2('', ALGOD_SERVER, 443);
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      const pVal = invoice.presentValue || invoice.faceValue;
      const amountInMicroAlgos = Math.floor(pVal * 1000000);

      // Algorand V3 compliant transaction mapping
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: activeAccount.address,
        receiver: ORACLE_ADDRESS, 
        amount: amountInMicroAlgos,                 
        note: new TextEncoder().encode(invoice.id),
        suggestedParams
      });

      toast.loading("Awaiting cryptographic signature from your Pera wallet...", { id: t });
      const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
      const signedTxns = await signTransactions([encodedTxn]);

      // Filter nulls and assert type for sendRawTransaction
      const rawTxns = signedTxns.filter((t): t is Uint8Array => t !== null);

      toast.loading("Submitting to Algorand network...", { id: t });
      const result = await algodClient.sendRawTransaction(rawTxns).do();
      // Safely support either txId or txid based on SDK version
      const txId = (result as any).txId || (result as any).txid || "unknown";
      
      await fetch(`${BACKEND_URL}/api/invoices/${invoice.id}/status`, {
        method: "POST"
      });

      toast.success(`Transaction confirmed! Funding complete.`, { id: t });
      
      setInvoices(prev => prev.map(inv => {
        if (inv.id === invoice.id) {
          return { ...inv, fractionAvailable: 0 }; 
        }
        return inv;
      }));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message && e.message.includes("User rejected") 
        ? "Transaction rejected by user in wallet." 
        : e?.message || "Transaction failed.", { id: t });
    } finally {
      setFundingId(null);
    }
  };

  const handleClaimYield = async (invoice: InvoiceAsset) => {
    if (!activeAccount) {
      toast.error("Authentication Error: Connect Algorand Wallet.", { icon: "🔒" });
      return;
    }

    setFundingId(invoice.id);
    const t = toast.loading(`Initiating ASA Burn for Yield Settlement...`);
    
    try {
      const algodClient = new algosdk.Algodv2('', ALGOD_SERVER, 443);
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      const contractAddress = algosdk.getApplicationAddress(APP_ID);

      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: activeAccount.address,
        receiver: contractAddress, 
        amount: 25000, // Mock ASA holding
        assetIndex: invoice.assetId || 100000,
        note: new TextEncoder().encode(`BURN ASA: ${invoice.id}`),
        suggestedParams
      });

      toast.loading("Awaiting cryptographic signature to burn ASA...", { id: t });
      const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
      const signedTxns = await signTransactions([encodedTxn]);

      const rawTxns = signedTxns.filter((tx): tx is Uint8Array => tx !== null);

      toast.loading("Submitting asset transfer to network...", { id: t });
      await algodClient.sendRawTransaction(rawTxns).do();
      
      const response = await fetch(`${BACKEND_URL}/api/invoices/${invoice.id}/yield-amount`);
      const data = await response.json();

      toast.success(`Yield Claim Successful! \n Payout Processed: $${data.yieldPayout?.toLocaleString()}`, { 
        id: t, 
        duration: 8000,
        icon: '💰'
      });
      
      setInvoices(prev => prev.map(inv => {
        if (inv.id === invoice.id) {
          return { ...inv, status: 'CLAIMED' }; 
        }
        return inv;
      }));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message && e.message.includes("User rejected") 
        ? "Transaction rejected by user in wallet." 
        : e?.message || "Yield claim failed.", { id: t });
    } finally {
      setFundingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Stats Header Bar */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0">
         <div className="flex items-center gap-3 mb-4 mt-2">
            <h2 className="text-xl font-bold font-display text-gray-900 dark:text-white">Protocol Overview</h2>
            <span className="bg-red-500/20 text-red-500 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse tracking-widest">LIVE</span>
         </div>
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl flex flex-col border border-transparent dark:border-gray-800">
               <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">Total Liquidity</span>
               <span className="font-mono text-xl text-green-600 dark:text-green-400 font-medium">₹{poolStats.totalLiquidity.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl flex flex-col border border-transparent dark:border-gray-800">
               <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">Aggregate APY</span>
               <span className="font-mono text-xl text-green-600 dark:text-green-400 font-medium">+{poolStats.aggregateApy.toFixed(1)}%</span>
            </div>
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl flex flex-col border border-transparent dark:border-gray-800">
               <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">Active Positions</span>
               <span className="font-mono text-xl text-gray-900 dark:text-white font-medium">{poolStats.activeCount}</span>
            </div>
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl flex flex-col border border-transparent dark:border-gray-800">
               <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">Network</span>
               <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 animate-pulse"></span>
                  <span className="font-mono text-lg text-gray-900 dark:text-white font-medium tracking-tight">TESTNET</span>
               </div>
            </div>
         </div>
      </div>
      
      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="font-display text-3xl font-bold text-gradient text-gradient-success">
            Lending Markets
          </h2>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>Acquire fractionalized debt positions from verified MSMEs.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: 'var(--radius-xl)' }}>
           <button 
             onClick={() => setActiveTab("primary")}
             className="font-medium"
             style={{
               padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-lg)', transition: 'all 0.2s', fontSize: '0.875rem',
               color: activeTab === 'primary' ? 'var(--accent-emerald-light)' : 'var(--text-secondary)',
               background: activeTab === 'primary' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
               border: activeTab === 'primary' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent'
             }}
           >
             Primary Issuance
           </button>
           <button 
             onClick={() => setActiveTab("secondary")}
             className="font-medium"
             style={{
               padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-lg)', transition: 'all 0.2s', fontSize: '0.875rem',
               color: activeTab === 'secondary' ? 'var(--accent-indigo-light)' : 'var(--text-secondary)',
               background: activeTab === 'secondary' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
               border: activeTab === 'secondary' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent'
             }}
           >
             Secondary Market Exit
           </button>
        </div>
      </div>

      {activeAccount ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem',
            padding: '2rem 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' 
          }}
        >
          <div className="flex flex-col">
            <span className="text-xs font-mono text-muted" style={{ marginBottom: '0.5rem', letterSpacing: '1px' }}>AVAILABLE LIQUIDITY (USDC)</span>
            <span className="text-3xl font-mono font-bold">${MOCK_USDC_BALANCE.toLocaleString()}</span>
          </div>
          <div className="flex flex-col" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
            <span className="text-xs font-mono text-muted" style={{ marginBottom: '0.5rem', letterSpacing: '1px' }}>ACTIVE POSITIONS</span>
            <span className="text-3xl font-mono font-bold">$25,000</span>
          </div>
          <div className="flex flex-col" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
            <span className="text-xs font-mono text-muted" style={{ marginBottom: '0.5rem', letterSpacing: '1px' }}>AGGREGATE APY</span>
            <span className="text-3xl font-mono font-bold text-gradient text-gradient-success">{portfolioYield}</span>
          </div>
        </motion.div>
      ) : (
        <div className="glass-panel flex flex-col items-center justify-center text-center" style={{ padding: '3rem', borderRadius: 'var(--radius-2xl)' }}>
            <ShieldAlert size={40} color="var(--text-tertiary)" style={{ marginBottom: '1rem' }} />
            <h3 className="font-semibold text-lg" style={{ marginBottom: '0.5rem' }}>Unauthenticated Terminal</h3>
            <p className="text-muted" style={{ maxWidth: '400px' }}>Connect your Algorand wallet to access liquidity metrics and initiate fractional positions on the Decantral market.</p>
        </div>
      )}

      {activeTab === "primary" ? (
      isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {[1,2,3].map((i) => (
             <div key={i} className="glass-panel animate-pulse" style={{ height: '320px', borderRadius: 'var(--radius-2xl)', padding: '1.5rem' }}>
                <div style={{ width: '30%', height: '20px', background: 'var(--border-color)', borderRadius: '4px', marginBottom: '1rem' }}></div>
                <div style={{ width: '60%', height: '32px', background: 'var(--border-color)', borderRadius: '4px', marginBottom: '1.5rem' }}></div>
                <div style={{ width: '100%', height: '80px', background: 'var(--border-color)', borderRadius: '8px', marginBottom: '1.5rem' }}></div>
                <div style={{ width: '100%', height: '48px', background: 'var(--border-color)', borderRadius: 'var(--radius-lg)' }}></div>
             </div>
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center text-center" style={{ padding: '4rem', borderRadius: 'var(--radius-2xl)', borderStyle: 'dashed' }}>
            <Coins size={48} color="var(--text-tertiary)" style={{ marginBottom: '1rem' }} />
            <h3 className="text-xl font-medium mb-2">No Active Invoices Found</h3>
            <p className="text-muted max-w-sm">The Indexer did not return any fractionalized ASAs matching your criteria. Wait for SMEs to tokenize new invoices.</p>
        </div>
      ) : (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}
      >
        {invoices.map((inv) => (
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -8, boxShadow: 'var(--shadow-glow-emerald)' }}
            key={inv.id} 
            className="glass-panel relative overflow-hidden" 
            style={{ borderRadius: 'var(--radius-2xl)', padding: '1.5rem', transition: 'all 0.3s ease' }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'var(--accent-emerald)', filter: 'blur(60px)', opacity: 0.1, pointerEvents: 'none' }} />
            
            <div className="flex justify-between items-start" style={{ marginBottom: '1.5rem' }}>
              <div>
                <span className="text-xs font-bold text-muted" style={{ letterSpacing: '1px' }}>PAYOR</span>
                <h3 className="font-display text-xl font-bold" style={{ color: 'white', marginTop: '0.25rem' }}>{inv.payor}</h3>
              </div>
              <div style={{ padding: '0.3rem 0.6rem', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald-light)' }}>
                Risk: {inv.creditScore}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1.5rem' }}>
              <div>
                <span className="text-xs text-muted flex items-center gap-2"><TrendingUp size={14} /> Yield (APY)</span>
                <p className="text-xl font-mono font-bold" style={{ color: 'var(--accent-emerald-light)', marginTop: '0.25rem' }}>{inv.availableYield}%</p>
              </div>
              <div>
                <span className="text-xs text-muted flex items-center gap-2"><Clock size={14} /> Maturity</span>
                <p className="text-sm font-medium" style={{ color: 'white', marginTop: '0.25rem' }}>{inv.matureDate}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2" style={{ marginBottom: '1.5rem' }}>
              <div style={{ width: '100%', background: 'rgba(0,0,0,0.5)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(inv.fractionAvailable / inv.fractionTotal) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{ background: 'linear-gradient(90deg, var(--accent-emerald), #06b6d4)', height: '100%', borderRadius: '4px' }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>Available: ₹{inv.fractionAvailable.toLocaleString()}</span>
                <span>Total: ₹{inv.fractionTotal.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <button 
                disabled={inv.fractionAvailable === 0 || fundingId === inv.id}
                onClick={() => handleBuy(inv)}
                className="premium-btn w-full"
                style={{ 
                   background: inv.fractionAvailable === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(16, 185, 129, 0.1)',
                   color: inv.fractionAvailable === 0 ? 'var(--text-tertiary)' : 'var(--accent-emerald-light)',
                   border: inv.fractionAvailable === 0 ? '1px solid transparent' : '1px solid rgba(16, 185, 129, 0.3)',
                   cursor: inv.fractionAvailable === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {fundingId === inv.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span style={{ width: '16px', height: '16px', border: '2px solid rgba(16, 185, 129, 0.3)', borderTopColor: 'var(--accent-emerald)', borderRadius: '50%' }} className="animate-spin" />
                    Executing Swap...
                  </span>
                ) : inv.fractionAvailable === 0 ? (
                  <span className="flex items-center justify-center gap-2">
                     <CheckCircle2 size={16} /> Fully Funded
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 hover:gap-3" style={{ transition: 'gap 0.2s' }}>
                     <Coins size={16} /> Buy Fractional <ChevronRight size={16} />
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
      )
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {isLoading ? (
             <div className="glass-panel animate-pulse" style={{ height: '250px', borderRadius: 'var(--radius-2xl)', padding: '1.5rem' }}>
                <div style={{ width: '40%', height: '24px', background: 'var(--border-color)', borderRadius: '4px', marginBottom: '1rem' }}></div>
             </div>
          ) : secondaryPositions.length === 0 ? (
             <div className="glass-panel flex flex-col items-center justify-center text-center" style={{ gridColumn: '1 / -1', padding: '4rem', borderRadius: 'var(--radius-2xl)', borderStyle: 'dashed' }}>
                 <ShieldAlert size={48} color="var(--accent-indigo-glow)" style={{ marginBottom: '1rem' }} />
                 <h3 className="text-xl font-medium mb-2">No Secondary Listings</h3>
                 <p className="text-muted">There are no existing Invoice-ASAs listed on the secondary market for exit.</p>
             </div>
          ) : (
              secondaryPositions.map((pos) => (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   whileHover={{ y: -8, boxShadow: 'var(--shadow-glow-indigo)' }}
                   key={pos.id} 
                   className="glass-panel relative" 
                   style={{ padding: '1.5rem', borderRadius: 'var(--radius-2xl)' }}
                 >
                    <div className="flex justify-between items-start" style={{ marginBottom: '1rem' }}>
                      <div>
                        <h3 className="font-display font-semibold text-lg text-white">ASA {pos.id}</h3>
                        <span className="text-xs text-muted">{pos.payor}</span>
                      </div>
                      <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo-light)', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                        Discounted Exit
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-3" style={{ marginBottom: '1.5rem' }}>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Position Value</span>
                        <span className="font-mono text-white text-md">₹{pos.positionValue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Asking Price</span>
                        <span className="font-mono text-indigo font-bold text-md">₹{pos.askingPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Maturity Date</span>
                        <span className="text-white text-md">{pos.matureDate}</span>
                      </div>
                    </div>

                    <button className="premium-btn btn-primary w-full">
                      Buy Position
                    </button>
                 </motion.div>
              ))
          )}

          <div className="glass-panel flex flex-col items-center justify-center text-center" style={{ minHeight: '250px', padding: '1.5rem', borderRadius: 'var(--radius-2xl)', borderStyle: 'dashed' }}>
             <ShieldAlert size={32} color="var(--text-tertiary)" style={{ marginBottom: '1rem' }} />
             <h3 className="font-medium text-white mb-2">List Your Position</h3>
             <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>Need immediate liquidity? List your existing Invoice-ASAs on the secondary market at a discount.</p>
             <button className="premium-btn btn-outline">
                Create Listing
             </button>
          </div>
        </div>
      )}
      
    </div>
  );
}
