"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const VAULT_DFW_TOKEN = {
  symbol: "DFW",
  price: "$2.47",
  change: "+5.2%",
  marketCap: "$12.4M",
  volume: "$892K",
};

const TICKER_ITEMS = [
  { symbol: "DFW", price: "$2.47", change: "+5.2%" },
  { symbol: "BTC", price: "$112,340", change: "-1.8%" },
  { symbol: "ETH", price: "$4,521", change: "+2.4%" },
  { symbol: "SOL", price: "$214", change: "+8.7%" },
  { symbol: "APT", price: "$18.90", change: "-3.1%" },
  { symbol: "ARB", price: "$1.24", change: "+12.6%" },
  { symbol: "OP", price: "$3.45", change: "-0.8%" },
  { symbol: "LINK", price: "$24.10", change: "+4.3%" },
  { symbol: "UNI", price: "$12.80", change: "-2.1%" },
  { symbol: "AAVE", price: "$312", change: "+6.9%" },
  { symbol: "MKR", price: "$2,890", change: "-1.2%" },
  { symbol: "CRV", price: "$0.98", change: "+15.4%" },
];

export default function TickerWidget() {
  const [currentPrice, setCurrentPrice] = useState(VAULT_DFW_TOKEN.price);
  const [currentChange, setCurrentChange] = useState(VAULT_DFW_TOKEN.change);

  useEffect(() => {
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.5) * 0.1;
      const newPrice = (parseFloat(VAULT_DFW_TOKEN.price.slice(1)) + delta).toFixed(2);
      setCurrentPrice(`$${newPrice}`);
      setCurrentChange(delta >= 0 ? `+${(delta * 10).toFixed(1)}%` : `${(delta * 10).toFixed(1)}%`);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-[#C9A84C]/30 bg-[#0D0D0D]/90 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[5px] uppercase text-[#C9A84C]/70 font-cinzel">Vault DFW Token</p>
            <p className="text-3xl font-bold text-white mt-1">{VAULT_DFW_TOKEN.symbol}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gold-400">{currentPrice}</p>
            <p className={`text-sm ${currentChange.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{currentChange}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div><p className="text-gray-400 text-xs">Market Cap</p><p className="text-white">{VAULT_DFW_TOKEN.marketCap}</p></div>
          <div><p className="text-gray-400 text-xs">Volume</p><p className="text-white">{VAULT_DFW_TOKEN.volume}</p></div>
          <div><p className="text-gray-400 text-xs">24h High</p><p className="text-emerald-400">$2.58</p></div>
          <div><p className="text-gray-400 text-xs">24h Low</p><p className="text-red-400">$2.31</p></div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-dark-600 bg-dark-900/60 py-3">
        <div className="flex animate-[scroll_30s_linear_infinite]">
          {TICKER_ITEMS.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-6 whitespace-nowrap">
              <span className="text-sm font-bold text-white">{item.symbol}</span>
              <span className="text-xs text-gray-400">{item.price}</span>
              <span className={`text-xs ${item.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{item.change}</span>
            </span>
          ))}
          {TICKER_ITEMS.map((item, i) => (
            <span key={`dup-${i}`} className="inline-flex items-center gap-2 px-6 whitespace-nowrap">
              <span className="text-sm font-bold text-white">{item.symbol}</span>
              <span className="text-xs text-gray-400">{item.price}</span>
              <span className={`text-xs ${item.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{item.change}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}