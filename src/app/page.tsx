"use client";

import { useWallet } from "@txnlab/use-wallet-react";
import { useState } from "react";
import SmeDashboard from "@/components/SmeDashboard";
import InvestorMarketplace from "@/components/InvestorMarketplace";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useEffect } from "react";

export default function Home() {
  const { wallets, activeAccount } = useWallet();
  const [view, setView] = useState<"sme" | "investor">("sme");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-gray-900 text-white font-sans selection:bg-purple-500/30">
      <header className="flex items-center justify-between px-8 py-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-lg">
            D
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Decantral
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-gray-800 p-1 rounded-lg flex text-sm font-medium">
            <button
              onClick={() => setView("sme")}
              className={`px-4 py-2 rounded-md transition-all ${
                view === "sme" ? "bg-gray-700 text-white shadow" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              SME Portal
            </button>
            <button
              onClick={() => setView("investor")}
              className={`px-4 py-2 rounded-md transition-all ${
                view === "investor" ? "bg-gray-700 text-white shadow" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Investor Market
            </button>
          </div>

          <div className="relative group">
            <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-lg font-medium shadow-lg shadow-indigo-600/20 whitespace-nowrap min-w-[140px]">
              {mounted && activeAccount ? (
                <span className="font-mono flex items-center justify-center">
                  {activeAccount.address.slice(0, 6)}...{activeAccount.address.slice(-4)}
                </span>
              ) : (
                <span className="flex items-center justify-center">Connect Wallet</span>
              )}
            </button>
            
            {/* Simple dropdown for providers */}
            {mounted && !activeAccount && wallets && (
              <div className="absolute right-0 mt-2 w-48 p-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {wallets.map((wallet: any) => (
                  <button
                    key={wallet.id}
                    onClick={wallet.connect}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-700 rounded-lg flex items-center gap-3 transition-colors"
                  >
                    <img src={wallet.metadata.icon} alt={wallet.metadata.name} className="w-5 h-5 rounded-sm" />
                    <span>{wallet.metadata.name}</span>
                  </button>
                ))}
              </div>
            )}

            {mounted && activeAccount && wallets && (
               <div className="absolute right-0 mt-2 w-48 p-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button
                    onClick={wallets[0].disconnect}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
               </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-12 flex-1 w-full">
        {!mounted ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-gray-500 animate-pulse flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
              Loading Decantral Core...
            </div>
          </div>
        ) : (
          view === "sme" ? (
             <ErrorBoundary fallbackMessage="Oracle verification or SME Dashboard rendering failed.">
                <SmeDashboard />
             </ErrorBoundary>
          ) : (
             <ErrorBoundary fallbackMessage="Indexer request failed. Could not load secondary markets.">
                <InvestorMarketplace />
             </ErrorBoundary>
          )
        )}
      </div>

      <footer className="border-t border-gray-800 bg-gray-900/80 py-4 px-8 flex justify-between items-center text-xs text-gray-500 font-mono">
        <div className="flex gap-4">
           <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Indexer: Online</span>
           <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Oracle: Online</span>
        </div>
        <div>
           Decantral Systems © 2026
        </div>
      </footer>
    </main>
  );
}
