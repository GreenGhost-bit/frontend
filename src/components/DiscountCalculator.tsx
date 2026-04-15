"use client";

import React, { useState } from 'react';

export default function DiscountCalculator() {
  const [faceValue, setFaceValue] = useState<number | ''>('');
  const [discountRate, setDiscountRate] = useState<number | ''>(8);
  const [daysToMaturity, setDaysToMaturity] = useState<number | ''>(90);

  const fv = Number(faceValue) || 0;
  const dr = Number(discountRate) || 0;
  const dtm = Number(daysToMaturity) || 0;

  // Formula: P = F * (1 - (d/100) * t/365)
  const presentValue = fv * (1 - (dr / 100) * dtm / 365);
  const protocolFee = fv * 0.01;
  const netProceeds = presentValue - protocolFee;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl w-full">
      <h3 className="text-xl font-display font-bold text-white mb-6">Discount Calculator</h3>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5 tracking-wide">Invoice face value ₹</label>
          <input 
            type="number"
            value={faceValue}
            onChange={(e) => setFaceValue(e.target.value ? Number(e.target.value) : '')}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white font-mono transition-colors shadow-sm"
            placeholder="0"
            min="0"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5 tracking-wide">Annual discount rate %</label>
            <input 
              type="number"
              value={discountRate}
              onChange={(e) => setDiscountRate(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white font-mono transition-colors shadow-sm"
              placeholder="0"
              min="0"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5 tracking-wide">Days to maturity</label>
            <input 
              type="number"
              value={daysToMaturity}
              onChange={(e) => setDaysToMaturity(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white font-mono transition-colors shadow-sm"
              placeholder="0"
              min="1"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-800/40 p-5 rounded-lg border border-gray-700/50 space-y-3 mb-6">
        <div className="flex justify-between items-center pb-2.5 border-b border-gray-700/50">
          <span className="text-gray-400 text-sm font-medium">Present Value</span>
          <span className="font-mono text-gray-100">₹{Math.max(0, presentValue).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between items-center pb-2.5 border-b border-gray-700/50">
          <span className="text-gray-400 text-sm font-medium">Protocol Fee <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded ml-1">1%</span></span>
          <span className="font-mono text-red-400">-₹{protocolFee.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between items-center pt-1.5">
          <span className="text-white font-semibold text-lg">Net Proceeds</span>
          <span className="font-mono text-2xl text-green-400 font-bold">₹{Math.max(0, netProceeds).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="flex justify-center mt-2">
        <span className="text-[11px] text-gray-500 font-mono bg-gray-800/80 px-3 py-1 rounded border border-gray-700">Formula: P = F × (1 − d × t/365)</span>
      </div>
    </div>
  );
}
