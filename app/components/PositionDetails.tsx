"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Lock, Waves, ArrowRight, Send, Check, Copy, ExternalLink, AlertTriangle } from "lucide-react";
import { ChartData, FormattedMarket, Position, PositionSide, SwapDetail } from "../interface/types";
import numberFormatter from "../blockchain/utils/numberFormatter";
import { getSwapDetail } from "../blockchain/scripts/analytics";
import { earlyExitSwap } from "../blockchain/scripts/write/earlyexit";
import { settleSwap } from "../blockchain/scripts/write/settleSwap";
import { transferSwapNFT } from "../blockchain/scripts/write/transferPosition";
import { getMarket } from "../blockchain/scripts/markets";
import { MARKETS, MARKET_META } from "../constants/markets";
import { getOracleRateHistory } from "../blockchain/scripts/oracleContract";
import { FullModal } from "./FullModal";
import { extractTokensFromName } from "../lib/helpers/helpers";
import { TOKEN_LOGOS } from "../lib/helpers/tokenLogos";
import { getProtocolLogo } from "./SwapCard";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useRef } from "react";
import { getStarknetAccount } from "../blockchain/utils/getStarknetAccount";

interface PositionDetailsProps {
  position: Position;
  walletAddress: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PositionDetails: React.FC<PositionDetailsProps> = ({
  position,
  walletAddress,
  isOpen,
  onClose,
}) => {
  const [swapDetails, setswapDetails] = useState<SwapDetail | null>();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [marketDetails, setMarketDetails] = useState<FormattedMarket | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  // Inline transfer state
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferTxHash, setTransferTxHash] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  const { primaryWallet } = useDynamicContext();

  const meta = MARKET_META[String(position.pairId)];
  const market = MARKETS.find((m) => m.id === String(position.pairId));
  const tokenSymbol = (meta?.collateralSymbol ?? "USDC").replace(/^mock/i, "");
  const collateralTokens = extractTokensFromName(meta?.collateralSymbol ?? "USDC");
  const isActive = position.status === "ACTIVE";
  const isExpired = position.remainingSeconds === 0;
  const isFixed = position.side === PositionSide.FIXED;

  useEffect(() => {
    if (position?.swapId && isOpen) {
      setTxHash(null);
      setError(null);
      setTransferRecipient("");
      setTransferTxHash(null);
      setTransferError(null);
      const fetchSwapDetail = async () => {
        const res = await getSwapDetail(String(position?.swapId));
        setswapDetails(res as any);
      };
      fetchSwapDetail();
    }
  }, [position?.swapId, isOpen]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await getMarket(String(position.pairId));
      if (res) setMarketDetails(res as any);
    };
    if (position?.pairId && isOpen) fetchData();
  }, [position.pairId, isOpen]);

  const formatDate = (date?: Date | null) => {
    if (!date || isNaN(date.getTime())) return "--";
    return date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const elapsedPct = swapDetails?.time?.progressPct ?? 0;

  const handleAction = async () => {
    try {
      setLoading(true);
      setError(null);
      const account = await getStarknetAccount(primaryWallet);
      let hash: string;
      if (isExpired) {
        hash = await settleSwap({
          asceSwapAddress: process.env.NEXT_PUBLIC_ASCESWAP_ADDRESS!,
          pairId: position.pairId,
          swapId: position.swapId,
          account,
        });
      } else {
        hash = await earlyExitSwap({
          asceSwapAddress: process.env.NEXT_PUBLIC_ASCESWAP_ADDRESS!,
          pairId: position.pairId,
          swapId: position.swapId,
          account,
        });
      }
      setTxHash(hash);
    } catch (error: any) {
      setError(error?.message ?? "Tx failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const handleTransfer = async () => {
    try {
      setTransferLoading(true);
      setTransferError(null);
      const account = await getStarknetAccount(primaryWallet);
      const hash = await transferSwapNFT({
        asceSwapAddress: process.env.NEXT_PUBLIC_ASCESWAP_ADDRESS!,
        from: primaryWallet?.address!,
        to: transferRecipient,
        tokenId: position.swapId,
        account,
      });
      setTransferTxHash(hash);
    } catch (err: any) {
      setTransferError(err?.message ?? "Transfer failed");
    } finally {
      setTransferLoading(false);
    }
  };

  const pnlColor = position.pnl >= 0 ? "text-[#34d399]" : "text-[#f87171]";

  return (
    <FullModal isOpen={isOpen} onClose={onClose} maxWidth="1080px">
      <div
        className="flex flex-col h-full"
        style={{ maxHeight: "calc(100vh - 48px)" }}
      >
        {/* ========== HEADER ========== */}
        <div className="px-6 pt-5 pb-4 border-b border-white/[0.04] shrink-0">
          <div className="flex items-center gap-3 pr-10">
            {(() => {
              const protocol = market?.protocol;
              if (protocol) {
                const PL = getProtocolLogo(protocol);
                return <PL size={40} />;
              }
              return (
                <div className="w-10 h-10 rounded-full bg-[#34d399]/10 border border-[#34d399]/20 flex items-center justify-center">
                  {isFixed ? <Lock className="w-5 h-5 text-[#34d399]" /> : <Waves className="w-5 h-5 text-[#34d399]" />}
                </div>
              );
            })()}
            <div>
              <h2 className="text-lg font-semibold text-[#e8e6ee] tracking-tight">
                {market?.name ?? `Swap #${position.swapId}`}
              </h2>
              <p className="text-[11px] text-[#9896a3] flex items-center gap-1">
                {isFixed ? "Fixed" : "Float"} Side • #{position.swapId}
                {collateralTokens.map((token) => {
                  const Logo = TOKEN_LOGOS[token];
                  return <Logo key={token} size={14} />;
                })}
                {tokenSymbol}
              </p>
            </div>
            <div className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full border mr-8 ${
              isActive
                ? isExpired
                  ? "border-amber-400/20 bg-amber-400/5"
                  : "border-[#34d399]/20 bg-[#34d399]/5"
                : position.status === "LIQUIDATED"
                  ? "border-[#f87171]/20 bg-[#f87171]/5"
                  : "border-white/10 bg-white/5"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                isActive
                  ? isExpired ? "bg-amber-400" : "bg-[#34d399] animate-pulse"
                  : position.status === "LIQUIDATED" ? "bg-[#f87171]" : "bg-[#9896a3]"
              }`} />
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                isActive
                  ? isExpired ? "text-amber-400" : "text-[#34d399]"
                  : position.status === "LIQUIDATED" ? "text-[#f87171]" : "text-[#9896a3]"
              }`}>
                {isActive ? (isExpired ? "Expired" : "Active") : position.status === "EXITEDEARLY" ? "Exited" : position.status}
              </span>
            </div>
          </div>
        </div>

        {/* ========== RATE STRIP ========== */}
        <div className="px-6 py-3 border-b border-white/[0.04] flex flex-wrap items-center justify-between gap-4 shrink-0 bg-[rgba(12,12,18,0.5)]">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[10px] font-semibold text-[#9896a3] uppercase tracking-wider mb-0.5">
                Fixed Rate
              </div>
              <span className="font-mono text-2xl font-bold text-[#e8e6ee] tracking-tighter">
                {(swapDetails?.fixedRatePct ?? position.fixedRatePct)?.toFixed(2) ?? "—"}%
              </span>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-[#9896a3] uppercase tracking-wider mb-0.5">
                Current Float
              </div>
              <span className="font-mono text-2xl font-bold text-[#e8e6ee] tracking-tighter">
                {swapDetails?.floatingRatePct?.toFixed(2) ?? "—"}%
              </span>
            </div>
            {swapDetails?.spreadPct !== undefined && (
              <div>
                <div className="text-[10px] font-semibold text-[#9896a3] uppercase tracking-wider mb-0.5">
                  Spread
                </div>
                <span className={`font-mono text-2xl font-bold tracking-tighter ${swapDetails.spreadPct >= 0 ? "text-[#34d399]" : "text-[#f87171]"}`}>
                  {swapDetails.spreadPct >= 0 ? "+" : ""}{swapDetails.spreadPct.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold text-[#9896a3] uppercase tracking-wider mb-0.5">
              {isActive ? "P&L" : "Final P&L"}
            </div>
            <div className={`font-mono text-2xl font-bold tracking-tighter ${pnlColor}`}>
              {position.pnl >= 0 ? "+" : ""}{position.pnl.toFixed(4)} {tokenSymbol}
            </div>
          </div>
        </div>

        {/* ========== TWO-COLUMN BODY ========== */}
        <div className="relative flex-1 overflow-hidden grid grid-cols-1 min-[960px]:grid-cols-[1fr_320px]">
          {/* ===== LEFT COLUMN: Chart + Stat Cards + Maturity ===== */}
          <div className="overflow-y-auto p-6 space-y-4 border-r border-white/[0.04]">
            {/* Chart */}
            <PositionChart
              oracleAddress={meta?.oracleAddress ?? ""}
              isOpen={isOpen}
              fixedRatePct={swapDetails?.fixedRatePct}
            />

            {/* Stat Cards Grid — SwapModal style */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-0.5">Side</div>
                <div className="text-[11px] font-semibold text-[#e8e6ee]">{isFixed ? "Fixed Taker" : "Float Taker"}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-0.5">Notional</div>
                <div className="text-[11px] font-mono font-semibold text-[#e8e6ee]">{numberFormatter(position.notional)} {tokenSymbol}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-0.5">Collateral</div>
                <div className="text-[11px] font-mono font-semibold text-[#e8e6ee]">{numberFormatter(position.collateral)} {tokenSymbol}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-0.5">Leverage</div>
                <div className="text-[11px] font-mono font-semibold text-[#e8e6ee]">{swapDetails?.leverage ? `${swapDetails.leverage.toFixed(1)}x` : "—"}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-0.5">Req. Margin</div>
                <div className="text-[11px] font-mono font-semibold text-[#e8e6ee]">{swapDetails?.requiredMargin !== undefined ? `${numberFormatter(swapDetails.requiredMargin)} ${tokenSymbol}` : "—"}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-0.5">Projected P&L</div>
                <div className={`text-[11px] font-mono font-semibold ${swapDetails?.pnl?.projected !== undefined ? (swapDetails.pnl.projected >= 0 ? "text-[#34d399]" : "text-[#f87171]") : "text-[#e8e6ee]"}`}>
                  {swapDetails?.pnl?.projected !== undefined ? `${swapDetails.pnl.projected >= 0 ? "+" : ""}${swapDetails.pnl.projected.toFixed(4)} ${tokenSymbol}` : "—"}
                </div>
              </div>
            </div>

            {/* Position Maturity */}
            <div className={`bg-[rgba(17,17,24,0.7)] border rounded-[14px] p-4 space-y-2.5 ${isExpired ? "border-[#34d399]/30" : "border-[#1e1e2a]"}`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[0.6rem] tracking-[0.1em] uppercase text-[#5c5a66]">
                  Position Maturity
                </span>
                {isExpired ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono font-semibold text-[#34d399]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                    Ready to Settle
                  </span>
                ) : (
                  <span className="text-[11px] font-mono font-semibold text-[#9896a3]">
                    {position.remainingLabel ?? `${position.remainingDays}d left`}
                  </span>
                )}
              </div>
              <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#34d399] transition-all duration-1000"
                  style={{ width: `${isExpired ? 100 : elapsedPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-[#5C5A66]">
                <span>{formatDate(swapDetails?.time?.startTime as any)}</span>
                <span className="text-[#9896a3]">{isExpired ? "100" : Math.round(elapsedPct)}% elapsed</span>
                <span>{formatDate(swapDetails?.time?.expirationTime as any)}</span>
              </div>
            </div>
          </div>

          {/* ===== RIGHT COLUMN: P&L, Health, Actions, Transfer ===== */}
          <div className="flex flex-col overflow-y-auto bg-gradient-to-b from-[rgba(12,12,18,0.7)] to-transparent">
            <div className="p-5 space-y-3 flex-1 flex flex-col">
              {/* P&L Card */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-1">Current P&L</div>
                <div className={`font-mono text-lg font-bold ${pnlColor}`}>
                  {position.pnl >= 0 ? "+" : ""}{position.pnl.toFixed(4)} {tokenSymbol}
                </div>
              </div>

              {/* Health Factor Card */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-1">Health Factor</div>
                <div className={`font-mono text-lg font-bold ${position.healthFactorPct > 50 ? "text-[#34d399]" : "text-[#f87171]"}`}>
                  {position.healthFactorPct.toFixed(1)}%
                </div>
              </div>

              {/* Early Exit Preview */}
              {isActive && !isExpired && swapDetails?.fees && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] space-y-1.5">
                  <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wider">
                    Early Exit Preview
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#9896a3]">Exit Fee</span>
                    <span className="font-mono font-semibold text-[#e8e6ee]">
                      {swapDetails.fees.earlyExitFee.toFixed(4)} {tokenSymbol}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#9896a3]">Exit Payout</span>
                    <span className={`font-mono font-semibold ${swapDetails.fees.earlyExitPayout >= 0 ? "text-[#34d399]" : "text-[#f87171]"}`}>
                      {swapDetails.fees.earlyExitPayout.toFixed(4)} {tokenSymbol}
                    </span>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="text-red-400 text-xs p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  {error}
                </div>
              )}

              {/* Success */}
              {txHash && (
                <div className="p-3 rounded-xl bg-[#34d399]/[0.04] border border-[#34d399]/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#34d399]/10 border border-[#34d399]/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#34d399]" />
                    </div>
                    <p className="text-xs font-semibold text-[#e8e6ee]">
                      {isExpired ? "Swap Settled" : "Early Exit Complete"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                    <span className="font-mono text-[10px] text-white/50 truncate">
                      {`${txHash.slice(0, 10)}...${txHash.slice(-8)}`}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => handleCopy(txHash, "txHash")}
                        className="p-1 rounded-md hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedField === "txHash" ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <a
                        href={`https://sepolia.voyager.online/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-md hover:bg-white/[0.05] text-white/40 hover:text-[#34d399] transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button — only for active positions */}
              {isActive ? (
                <>
                  {txHash ? (
                    <button
                      onClick={onClose}
                      className="w-full py-3 rounded-xl font-semibold text-xs uppercase tracking-[0.15em]
                       transition-all active:scale-[0.98] cursor-pointer
                       bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08]
                       text-[#e8e6ee] flex items-center justify-center gap-2"
                    >
                      Close
                    </button>
                  ) : isExpired ? (
                    <button
                      disabled={loading}
                      onClick={handleAction}
                      className="w-full py-3 rounded-xl bg-[#34d399] text-[#060608] font-bold text-sm
                       hover:bg-[#6ee7b7] active:bg-[#059669]
                       disabled:bg-[rgba(17,17,24,0.7)] disabled:text-[#5c5a66] disabled:cursor-not-allowed
                       transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? "Settling..." : "Settle Swap"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      disabled={loading}
                      onClick={handleAction}
                      className="w-full py-3 rounded-xl font-bold text-sm
                       transition-all active:scale-[0.98] cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed
                       border-2 border-rose-500/40 text-rose-400 hover:bg-rose-500/10
                       flex items-center justify-center gap-2"
                    >
                      {loading ? "Exiting..." : "Early Exit"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {/* ─── Inline Transfer NFT ─── */}
                  <div className="pt-2 border-t border-white/[0.04] space-y-2">
                    <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wider">
                      Transfer Position NFT
                    </div>
                    {transferTxHash ? (
                      <div className="p-3 rounded-xl bg-[#34d399]/[0.04] border border-[#34d399]/20 space-y-2">
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#34d399]" />
                          <span className="text-xs font-semibold text-[#e8e6ee]">Transfer Initiated</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                          <span className="font-mono text-[10px] text-white/50 truncate">
                            {`${transferTxHash.slice(0, 10)}...${transferTxHash.slice(-8)}`}
                          </span>
                          <a
                            href={`https://sepolia.voyager.online/tx/${transferTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md hover:bg-white/[0.05] text-white/40 hover:text-[#34d399] transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="0x0123...recipient"
                            value={transferRecipient}
                            onChange={(e) => setTransferRecipient(e.target.value)}
                            className="flex-1 py-2.5 px-3 rounded-xl border font-mono text-[11px] transition-all focus:ring-0 outline-none
                             bg-white/[0.02] border-white/[0.08] focus:border-[#34d399]/40 text-[#e8e6ee] placeholder:text-[#5C5A66]"
                          />
                          <button
                            disabled={!transferRecipient || transferLoading}
                            onClick={handleTransfer}
                            className="px-4 py-2.5 rounded-xl text-[11px] font-semibold
                             transition-all active:scale-[0.98] cursor-pointer
                             disabled:opacity-40 disabled:cursor-not-allowed
                             bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08]
                             text-[#e8e6ee] flex items-center gap-1.5 shrink-0"
                          >
                            {transferLoading ? "..." : <><Send className="w-3 h-3" /> Send</>}
                          </button>
                        </div>
                        {transferError && (
                          <div className="text-red-400 text-[10px] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {transferError}
                          </div>
                        )}
                        <p className="text-[9px] text-[#5C5A66] leading-relaxed">
                          Transfers the swap NFT to another address. This action is irreversible.
                        </p>
                      </>
                    )}
                  </div>
                </>
              ) : (
                /* Settled/Closed position — just show a close button */
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                    <span className="text-[11px] text-[#9896a3]">
                      This position has been {position.status === "SETTLED" ? "settled" : position.status === "LIQUIDATED" ? "liquidated" : "exited early"}.
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full py-3 rounded-xl font-semibold text-xs uppercase tracking-[0.15em]
                     transition-all active:scale-[0.98] cursor-pointer
                     bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08]
                     text-[#e8e6ee] flex items-center justify-center gap-2"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FullModal>
  );
};


/* ─────────────────────── PositionChart ─────────────────────── */

function PositionChart({
  oracleAddress,
  isOpen,
  fixedRatePct,
}: {
  oracleAddress: string;
  isOpen: boolean;
  fixedRatePct?: number;
}) {
  const [points, setPoints] = useState<{ x: number; y: number; label: string; rate: number; fullDate: string }[]>([]);
  const [fixedY, setFixedY] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!isOpen || !oracleAddress) return;
    let cancelled = false;

    async function load() {
      try {
        const history = await getOracleRateHistory(oracleAddress, 168);
        if (cancelled || !history || history.length === 0) return;

        const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
        const rates = sorted.map(h => h.rateBps / 100);
        const allRates = fixedRatePct !== undefined ? [...rates, fixedRatePct] : rates;
        const minRate = Math.min(...allRates);
        const maxRate = Math.max(...allRates);
        const range = maxRate - minRate || 1;

        const W = 600, H = 200, PAD_X = 40, PAD_Y = 20;
        const plotW = W - PAD_X * 2;
        const plotH = H - PAD_Y * 2;

        const pts = sorted.map((entry, i) => {
          const x = PAD_X + (i / Math.max(sorted.length - 1, 1)) * plotW;
          const y = PAD_Y + plotH - ((entry.rateBps / 100 - minRate) / range) * plotH;
          const d = new Date(entry.timestamp * 1000);
          return {
            x, y,
            label: `${d.getMonth() + 1}/${d.getDate()}`,
            rate: entry.rateBps / 100,
            fullDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
          };
        });

        if (!cancelled) {
          setPoints(pts);
          if (fixedRatePct !== undefined) {
            setFixedY(PAD_Y + plotH - ((fixedRatePct - minRate) / range) * plotH);
          }
        }
      } catch {
        // oracle history unavailable
      }
    }

    load();
    return () => { cancelled = true; };
  }, [oracleAddress, isOpen, fixedRatePct]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || points.length === 0) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 600;

      let closest = 0;
      let minDist = Infinity;
      for (let i = 0; i < points.length; i++) {
        const dist = Math.abs(points[i].x - mouseX);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      }
      setHoverIdx(closest);
    },
    [points],
  );

  const handleMouseLeave = useCallback(() => {
    setHoverIdx(null);
  }, []);

  if (points.length === 0) {
    return (
      <div className="relative rounded-xl bg-white/[0.015] border border-[#34d399]/10 overflow-hidden flex items-center justify-center" style={{ height: 200 }}>
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
          Loading chart...
        </div>
      </div>
    );
  }

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = linePath + ` L${points[points.length - 1].x},180 L${points[0].x},180 Z`;
  const hp = hoverIdx !== null ? points[hoverIdx] : null;

  return (
    <div className="relative rounded-xl bg-white/[0.015] border border-[#34d399]/10 overflow-hidden">
      {/* Legend */}
      <div className="absolute top-3 right-3 text-[10px] text-[#9896a3] flex gap-3 z-10">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#34d399]" /> Float
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#9896a3] border-dashed border-t" /> Fixed
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 600 200"
        className="w-full cursor-crosshair"
        style={{ height: 200 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="posChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[50, 90, 130, 170].map((y) => (
          <line key={y} x1="40" y1={y} x2="560" y2={y} stroke="rgba(52,211,153,0.06)" strokeDasharray="4 4" />
        ))}

        {/* Area + line */}
        <path d={areaPath} fill="url(#posChartGrad)" />
        <path d={linePath} fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" opacity="0.9" />

        {/* Fixed rate dashed line */}
        {fixedY !== null && (
          <line x1="40" y1={fixedY} x2="560" y2={fixedY} stroke="#9896a3" strokeWidth="1" strokeDasharray="6 4" opacity="0.6" />
        )}

        {/* Last point dot */}
        {hoverIdx === null && points.length > 0 && (
          <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3.5" fill="#34d399" />
        )}

        {/* Hover crosshair */}
        {hp && (
          <>
            <line x1={hp.x} y1="20" x2={hp.x} y2="180" stroke="rgba(52,211,153,0.3)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={hp.x} cy={hp.y} r="4.5" fill="#0c0c12" stroke="#34d399" strokeWidth="2" />
          </>
        )}
      </svg>

      {/* Tooltip */}
      {hp && (
        <div
          className="absolute pointer-events-none z-20 px-3 py-2 rounded-lg bg-[#0c0c12] border border-[#34d399]/20 shadow-xl"
          style={{
            left: `${(hp.x / 600) * 100}%`,
            top: `${(hp.y / 200) * 100}%`,
            transform: `translate(${hp.x > 400 ? "-110%" : "10%"}, -120%)`,
          }}
        >
          <div className="text-[10px] text-white/50 mb-0.5">{hp.fullDate}</div>
          <div className="font-mono font-bold text-sm text-[#34d399]">{hp.rate.toFixed(2)}%</div>
          {fixedRatePct !== undefined && (
            <div className="text-[10px] text-[#9896a3] mt-0.5">
              Fixed: {fixedRatePct.toFixed(2)}% • Spread: <span className={hp.rate - fixedRatePct >= 0 ? "text-[#34d399]" : "text-[#f87171]"}>{(hp.rate - fixedRatePct) >= 0 ? "+" : ""}{(hp.rate - fixedRatePct).toFixed(2)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
