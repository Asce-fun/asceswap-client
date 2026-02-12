import React, { useState, useEffect } from "react";
import { ArrowLeft, Share2, RefreshCw, Lock, Sparkles } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FormattedMarket, Position, PositionSide, SwapDetail } from "../interface/types";
import { MOCK_CHART_DATA } from "../constants/constants";
import numberFormatter from "../blockchain/utils/numberFormatter";
import { getSwapDetail } from "../blockchain/scripts/analytics";
import { earlyExitSwap } from "../blockchain/scripts/write/earlyexit";
import { Dialog } from "./Dialog";
import { TransferDialogContent } from "./TranferDialogContent";
import { getMarket } from "../blockchain/scripts/markets";

interface PositionDetailsProps {
  position: Position;
  walletAddress: string;
  onBack: () => void;
}

export const PositionDetails: React.FC<PositionDetailsProps> = ({
  position,
  walletAddress,
  onBack,
}) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [swapDetails, setswapDetails] = useState<SwapDetail | null>();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
    const [marketDetails, setMarketDetails] = useState<FormattedMarket | null>(
      null,
    );
  useEffect(() => {
    if (position?.swapId) {
      const fetchSwapDetail = async () => {
        const res = await getSwapDetail(String(position?.swapId));
        setswapDetails(res as any);
      };
      fetchSwapDetail();
    }
  }, [position?.swapId]);

  const formatDate = (date?: Date | null) => {
    if (!date || isNaN(date.getTime())) return "--";

    return date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const elapsedPct = swapDetails?.time?.progressPct ?? 0;
  const elapsedPctDisplay = Math.round(elapsedPct * 100) / 100;

  const earlyExit = async () => {
    try {
      setLoading(true);
      const txHash = await earlyExitSwap({
        asceSwapAddress: process.env.NEXT_PUBLIC_ASCESWAP_ADDRESS!,
        oracleAddress:marketDetails?.oracle as string,
        swapId: position.swapId,
      });

      setTxHash(txHash);
    } catch (error: any) {
      setError(error?.message ?? "Tx failed");
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
      const fetchData = async () => {
        const res = await getMarket(String(position.pairId));
        if (res) {
          setMarketDetails(res as any);
        }
      };
      if(position?.pairId){
        fetchData();
      }
    }, [position.pairId]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={onBack}
        className="flex cursor-pointer items-center gap-2 text-[#8A8894] hover:text-white mb-8 group transition-colors"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform cursor-pointer" />
        Back to Dashboard
      </button>

      <div className="bg-[#111114] border border-white/5 rounded-2xl p-8 mb-8">
        <div className="flex justify-between items-start mb-12">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl font-bold tracking-tight">
                Swap Position #{position.swapId}
              </h1>
              <span className="px-3 py-1 rounded-lg bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">
                {position.status}
              </span>
            </div>
            <p className="text-[#8A8894] text-sm">
              Minted {formatDate(swapDetails?.time?.startTime as any)} •{" "}
              <span className="font-mono">{`${walletAddress.slice(0, 5)}...${walletAddress.slice(-4)}`}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/5 text-sm font-medium hover:bg-white/5 transition-colors">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/5 text-sm font-medium hover:bg-white/5 transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Chart Section */}
        <div className="h-75 w-full mb-12 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_CHART_DATA}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(180,175,200,0.06)"
              />
              <XAxis dataKey="time" hide />
              <YAxis domain={[3, 7]} hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111114",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                }}
                itemStyle={{ color: "#8b5cf6" }}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#colorRate)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="fixed"
                stroke="#4b5563"
                strokeDasharray="5 5"
                fillOpacity={0}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="absolute top-4 right-12 text-xs text-[#8A8894] flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-[#8b5cf6]"></span> Current Float:
              4.85%
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-zinc-600 border-dashed border-t"></span>{" "}
              5.2% FIXED
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-y-12 gap-x-8 pb-12 border-b border-white/5/50">
          <div>
            <p className="text-[#8A8894] text-xs font-bold uppercase tracking-widest mb-3">
              SIDE
            </p>
            <div className="flex items-center gap-2 text-xl font-medium">
              <Lock className="w-5 h-5 text-[#a78bfa]" />{" "}
              {position.side === PositionSide.FIXED ? "Fixed" : "Float"}
            </div>
          </div>
          <div>
            <p className="text-[#8A8894] text-xs font-bold uppercase tracking-widest mb-3">
              LOCKED RATE
            </p>
            <p className="text-xl font-medium">
              {position.side === "FIXED"
                ? swapDetails?.fixedRatePct
                : swapDetails?.floatingRatePct}
              %
            </p>
          </div>
          <div>
            <p className="text-[#8A8894] text-xs font-bold uppercase tracking-widest mb-3">
              YOUR P&L
            </p>
            <p
              className={`text-xl font-medium ${position.pnl >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              ${position.pnl >= 0 ? "+" : ""}
              {position.pnl}
            </p>
          </div>
          <div>
            <p className="text-[#8A8894] text-xs font-bold uppercase tracking-widest mb-3">
              Market Tvl
            </p>
            <p className="text-xl font-medium">
              ${numberFormatter(swapDetails?.market.tvl)}
            </p>
          </div>
          <div>
            <p className="text-[#8A8894] text-xs font-bold uppercase tracking-widest mb-3">
              NOTIONAL SIZE
            </p>
            <p className="text-xl font-medium">
              ${numberFormatter(position.notional)}
            </p>
          </div>
          <div>
            <p className="text-[#8A8894] text-xs font-bold uppercase tracking-widest mb-3">
              COLLATERAL
            </p>
            <p className="text-xl font-medium">
              ${numberFormatter(position.collateral)}
            </p>
          </div>
          <div>
            <p className="text-[#8A8894] text-xs font-bold uppercase tracking-widest mb-3">
              Leverage
            </p>
            <p className="text-xl font-medium">
              {numberFormatter(
                swapDetails?.leverage ? swapDetails?.leverage * 100 : 0,
              )}
              %
            </p>
          </div>
          <div>
            <p className="text-[#8A8894] text-xs font-bold uppercase tracking-widest mb-3">
              HEALTH FACTOR
            </p>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-24 bg-white/5 rounded-full">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: "75%" }}
                />
              </div>
              <span className="text-xl font-medium text-green-500">
                {position.healthFactorPct}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="py-12 border-b border-white/5/50">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[#E4E2E8] font-medium mb-1">
                Position Maturity
              </p>
              <p className="text-[#8A8894] text-sm">
                {elapsedPctDisplay}% elapsed
              </p>
            </div>
            <p className="text-[#a78bfa] font-semibold">
              {position.remainingDays} days left
            </p>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-1000"
              style={{ width: `${elapsedPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-3 text-[10px] text-[#5C5A66] font-bold uppercase tracking-wider">
            <span>Start: {formatDate(swapDetails?.time.startTime as any)}</span>
            <span>
              End: {formatDate(swapDetails?.time.expirationTime as any)}
            </span>
          </div>
        </div>

        {/* Gemini Insights */}
        {/* <div className="mt-12 p-6 bg-[#8b5cf6]/5 rounded-2xl border border-blue-500/10">
          <div className="flex items-center gap-2 mb-4 text-blue-400">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold uppercase tracking-widest text-xs">AI Yield Insights</h3>
          </div>
          {loadingInsights ? (
            <div className="space-y-3">
              <div className="h-4 bg-white/5/50 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-white/5/50 rounded animate-pulse w-1/2" />
            </div>
          ) : (
            <ul className="space-y-3 list-disc list-inside text-sm text-zinc-400">
              {insights.map((insight, idx) => (
                <li key={idx} className="leading-relaxed">{insight}</li>
              ))}
            </ul>
          )}
        </div> */}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-12">
          <button
            className="flex-1 py-4 px-6 cursor-pointer rounded-2xl bg-linear-to-r from-[#8b5cf6] via-[#a78bfa] to-[#c4b5fd] text-white font-bold text-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2"
            onClick={() => {
              earlyExit();
            }}
          >
            Early Exit <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>
          <button
            className="flex-1 py-4 px-6 cursor-pointer rounded-2xl bg-[#18181C] text-white font-bold text-lg border border-white/10 hover:bg-[#202024] transition-colors flex items-center justify-center gap-2"
            onClick={() => {
              setShowTransferDialog(true);
            }}
          >
            Transfer NFT <Lock className="w-5 h-5" />
          </button>
        </div>
        <Dialog
          isOpen={showTransferDialog}
          onClose={() => setShowTransferDialog(false)}
        >
          <TransferDialogContent
            position={position}
            tokenId={String(position.swapId)}
            onClose={() => setShowTransferDialog(false)}
            theme={"dark"}
          />
        </Dialog>
      </div>
    </div>
  );
};
