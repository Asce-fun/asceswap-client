import React, { useState } from "react";
import {
  Send,
  ShieldAlert,
  Info,
  ChevronRight,
  User,
  Hash,
  Box,
  AlertCircle,
} from "lucide-react";
import { MarketData, Position } from "../interface/types";
import { transferSwapNFT } from "../blockchain/scripts/write/transferPosition";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { MARKETS } from "../constants/markets";
import { TOKEN_LOGOS } from "../lib/helpers/tokenLogos";
import { extractTokensFromName } from "../lib/helpers/helpers";

interface TransferDialogContentProps {
  position: Position;
  tokenId: string;
  onClose: () => void;
  theme?: any;
}

export const TransferDialogContent: React.FC<TransferDialogContentProps> = ({
  position,
  tokenId,
  onClose,
  theme = "dark",
}) => {
  const [recipient, setRecipient] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const { primaryWallet } = useDynamicContext();
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isDark = theme === "dark";
  const address = primaryWallet?.address;
  const marketByPairId = React.useMemo(() => {
    return Object.fromEntries(MARKETS.map((m) => [Number(m.id), m]));
  }, []);
  const market = marketByPairId[position.pairId];
  const tokens = extractTokensFromName(market.name);
  const handleTransfer = async () => {
    try {
      setLoading(true);
      const txHash = await transferSwapNFT({
        asceSwapAddress: process.env.NEXT_PUBLIC_ASCESWAP_ADDRESS!,
        from: address!!,
        to: recipient,
        tokenId: position.swapId,
      });

      setTxHash(txHash);
    } catch (error: any) {
      setError(error?.message ?? "Tx failed");
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div
        className={`p-12 text-center space-y-6 ${isDark ? "bg-[rgba(12,12,18,0.6)]" : "bg-white"}`}
      >
        <div className="w-20 h-20 bg-[#34d399]/20 rounded-full flex items-center justify-center mx-auto border border-[#34d399]/50">
          <Send className="w-10 h-10 text-[#34d399]" />
        </div>
        <div className="space-y-2">
          <h2
            className={`text-2xl font-black tracking-tighter ${isDark ? "text-[#e8e6ee]" : "text-slate-900"}`}
          >
            Transfer Initiated
          </h2>
          <p className="text-sm text-[#9896a3] font-medium">
            Position NFT #{tokenId} is being moved to {recipient.slice(0, 6)}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col transition-colors duration-300 ${isDark ? "bg-[rgba(12,12,18,0.6)] text-[#E4E2E8]" : "bg-white text-slate-900"}`}
    >
      {/* Header Section */}
      <div
        className={`p-8 pb-10 border-b bg-linear-to-br from-[#8b5cf6]/10 via-transparent to-transparent ${isDark ? "border-[#1e1e2a]" : "border-slate-100"}`}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 rounded-full bg-[#8b5cf6] shadow-lg shadow-[rgba(167,139,250,0.40)]" />
            <h2
              className={`text-3xl font-black tracking-tighter leading-none ${isDark ? "text-[#e8e6ee]" : "text-slate-900"}`}
            >
              Transfer Position
            </h2>
          </div>
          <p
            className={`text-[10px] font-black uppercase tracking-[0.25em] ml-4 ${isDark ? "text-[#9896a3]" : "text-[#9896a3]"}`}
          >
            NFT OWNERSHIP MIGRATION <span className="mx-2 opacity-20">•</span>{" "}
            {market.name}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <div
            className={`p-4 rounded-2xl border ${isDark ? "bg-black/40 border-[#1e1e2a]" : "bg-slate-50 border-slate-100"}`}
          >
            <div className="text-[9px] font-black text-[#9896a3] uppercase tracking-widest mb-1 flex items-center gap-1">
              <Hash className="w-3 h-3" /> Swap ID
            </div>
            <div
              className={`text-lg font-mono font-bold ${isDark ? "text-[#e8e6ee]" : "text-slate-800"}`}
            >
              #{tokenId}
            </div>
          </div>
          <div
            className={`p-4 rounded-2xl border ${isDark ? "bg-black/40 border-[#1e1e2a]" : "bg-slate-50 border-slate-100"}`}
          >
            <div className="text-[9px] font-black text-[#9896a3] uppercase tracking-widest mb-1 flex items-center gap-1">
              <Box className="w-3 h-3" /> Asset
            </div>
            <div
              className={`text-lg font-mono font-bold ${isDark ? "text-[#e8e6ee]" : "text-slate-800"}`}
            >
              <div className="flex items-center gap-1">
                {tokens.map((token) => {
                  const Logo = TOKEN_LOGOS[token];
                  return (
                    <div className="flex gap-1">
                      <Logo key={token} size={24} />
                      {token}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Recipient Input */}
        <div className="space-y-3">
          <label
            className={`text-[10px] font-black uppercase tracking-[0.2em] block ml-1 ${isDark ? "text-[#9896a3]" : "text-[#9896a3]"}`}
          >
            Recipient Starknet Address
          </label>
          <div className={`relative group`}>
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <User
                className={`w-5 h-5 ${isDark ? "text-[#5C5A66]" : "text-[#9896a3]"}`}
              />
            </div>
            <input
              type="text"
              placeholder="0x0123...abc"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className={`w-full py-5 pl-14 pr-6 rounded-2xl border font-mono text-sm transition-all focus:ring-0 outline-none ${
                isDark
                  ? "bg-white/2 border-[#1e1e2a] focus:border-[#8b5cf6]/50 text-white placeholder:text-[#5C5A66]"
                  : "bg-slate-50 border-slate-200 focus:border-[#8b5cf6] text-slate-900 placeholder:text-[#9896a3]"
              }`}
            />
          </div>
        </div>

        {/* Informational Warning Box */}
        <div
          className={`p-6 rounded-[2rem] border flex gap-5 ${isDark ? "bg-orange-500/3 border-orange-500/10" : "bg-orange-50 border-orange-100"}`}
        >
          <div
            className={`p-3 rounded-2xl h-fit ${isDark ? "bg-orange-500/10 text-orange-400" : "bg-orange-100 text-orange-600"}`}
          >
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h4
              className={`text-xs font-black uppercase tracking-tight ${isDark ? "text-[#E4E2E8]" : "text-slate-900"}`}
            >
              Critical Ownership Action
            </h4>
            <p
              className={`text-[11px] leading-relaxed font-medium ${isDark ? "text-[#9896a3]" : "text-[#5C5A66]"}`}
            >
              Transferring this position moves the underlying collateral and all
              future yield accruals to the new address. Ensure the recipient
              address is correct, as this action{" "}
              <span className="text-orange-500 font-bold underline decoration-2 underline-offset-2">
                cannot be reversed
              </span>{" "}
              on-chain.
            </p>
          </div>
        </div>

        {/* Details List */}
        <div
          className={`p-5 rounded-2xl border space-y-3 ${isDark ? "bg-black/20 border-[#1e1e2a]" : "bg-slate-50 border-slate-100"}`}
        >
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
            <span className="text-[#9896a3]">Gas Estimate</span>
            <span className={isDark ? "text-[#9896a3]" : "text-slate-700"}>
              ~0.00042 STRK
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
            <span className="text-[#9896a3]">Platform Fee</span>
            <span className="text-[#34d399]">Free</span>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex gap-4 pt-2">
          <button
            onClick={onClose}
            className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] transition-all border ${isDark ? "text-[#9896a3] hover:text-[#e8e6ee] hover:bg-white/5 border-[#1e1e2a]" : "text-[#9896a3] hover:text-slate-900 hover:bg-slate-100 border-slate-100"}`}
          >
            Cancel
          </button>
          <button
            disabled={!recipient || isTransferring}
            onClick={handleTransfer}
            className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl transition-all flex items-center justify-center gap-3 group/btn disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark
                ? "bg-linear-to-r from-[#8b5cf6] via-[#a78bfa] to-[#c4b5fd] text-white shadow-[rgba(167,139,250,0.22)]"
                : "bg-linear-to-r from-[#8b5cf6] via-[#a78bfa] to-[#c4b5fd] text-white"
            }`}
          >
            {isTransferring ? "Processing..." : "Confirm Transfer"}
            {!isTransferring && (
              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
