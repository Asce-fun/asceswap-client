"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  BarChart3,
  TrendingUp,
  ShieldAlert,
  Layers,
  Wallet,
} from "lucide-react";
import { FormattedMarket, MarketData, Position, UserDashboard } from "../interface/types";
import { PositionDetails } from "../components/PositionDetails";
import { PositionCard } from "../components/PositionCard";
import { LpModal } from "../components/LpModal";
import { useRouter } from "next/navigation";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { getUserDashboard, getSwapDetail } from "@/app/blockchain/scripts/analytics";
import { MARKETS, MARKET_META } from "@/app/constants/markets";
import { extractTokensFromName } from "@/app/lib/helpers/helpers";
import { TOKEN_LOGOS } from "@/app/lib/helpers/tokenLogos";
import { PageLayout } from "@/app/components/PageLayout";
import { getMarket } from "@/app/blockchain/scripts/markets";


const PositionsPage: React.FC = () => {
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null,
  );
  const [userDetails, setuserDetails] = useState<UserDashboard | null>();
  const [loadinguserDetails, setloadinguserDetails] = useState(false);

  // LP Modal state
  const [lpModalOpen, setLpModalOpen] = useState(false);
  const [lpModalMarket, setLpModalMarket] = useState<MarketData | null>(null);
  const [lpModalDetails, setLpModalDetails] = useState<FormattedMarket | null>(null);

  const router = useRouter();
  const { primaryWallet, setShowAuthFlow } = useDynamicContext();
  const address = primaryWallet?.address;

  const fetchPositions = React.useCallback(async () => {
    if (!address) return;
    try {
      setloadinguserDetails(true);
      const res = await getUserDashboard(address);

      // Batch-fetch swap details to get fixedRatePct (not in dashboard API)
      if (res?.swaps?.length) {
        const details = await Promise.allSettled(
          res.swaps.map((s: any) => getSwapDetail(String(s.swapId)))
        );
        details.forEach((result, i) => {
          if (result.status === "fulfilled" && result.value?.fixedRatePct) {
            res.swaps[i].fixedRatePct = result.value.fixedRatePct;
          }
        });
      }

      setuserDetails(res);
    } catch (error) {
      console.error("[PositionsPage] failed to fetch dashboard:", error);
    } finally {
      setloadinguserDetails(false);
    }
  }, [address]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const marketByPairId = React.useMemo(() => {
    return Object.fromEntries(MARKETS.map((m) => [Number(m.id), m]));
  }, []);

  const handleLpCardClick = async (pairId: number) => {
    const market = marketByPairId[pairId];
    if (!market) return;
    setLpModalMarket(market);
    setLpModalOpen(true);
    try {
      const details = await getMarket(String(pairId));
      if (details) {
        setLpModalDetails(details as FormattedMarket);
      }
    } catch {
      // market details fetch failed
    }
  };

  if (!address) {
    return (
      <PageLayout showFooter={false}>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div
            className="w-16 h-16 rounded-2xl bg-[rgba(52,211,153,0.08)]
        border border-[rgba(52,211,153,0.20)]
        flex items-center justify-center mb-6 text-[#6ee7b7]"
          >
            <Wallet className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#e8e6ee] mb-3 tracking-tight">
            Connect Your Wallet
          </h2>
          <p className="text-[#9896a3] text-sm max-w-sm mb-8">
            Connect your Starknet wallet to view your positions, portfolio
            analytics, and LP activity.
          </p>
          <button
            onClick={() => setShowAuthFlow(true)}
            className="px-8 py-3 rounded-[20px]
          font-semibold text-sm transition-all duration-300
          hover:-translate-y-0.5 cursor-pointer"
            style={{
              background: "linear-gradient(135deg,#6ee7b7,#34d399)",
              color: "#030305",
              boxShadow: "0 10px 30px rgba(52,211,153,0.25)",
            }}
          >
            Connect Wallet
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showFooter={false}>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Coming Soon cards */}
        {[
          { icon: BarChart3, label: "Active Swaps" },
          { icon: TrendingUp, label: "Notional Exposure" },
          { icon: ShieldAlert, label: "Risk" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="relative p-5 rounded-2xl border border-white/10 bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px]">
            <div className="flex items-center gap-2 mb-3 text-[#9896a3]">
              <Icon className="w-4 h-4 text-[#34d399]" />
              <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-lg font-semibold text-[#5C5A66]">Coming Soon</p>
          </div>
        ))}

        {/* Positions Count */}
        <div className="relative p-5 rounded-2xl border border-white/10 bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px] hover:border-white/20 transition-all">
          <div className="absolute inset-0 bg-[#34d399]/5 blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3 text-[#9896a3]">
            <Layers className="w-4 h-4 text-[#34d399]" />
            <span className="text-[10px] font-bold uppercase tracking-wide">
              Positions Count
            </span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-[#e8e6ee]">
            {userDetails?.counts?.totalSwaps ?? 0} Swaps
          </p>
          <p className="text-xs mt-1 text-[#9896a3]">
            {userDetails?.counts?.lpPositions ?? 0} LP Markets Active
          </p>
        </div>
      </div>

      {/* Swap Positions — always show card grid */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#e8e6ee] mb-2">
            Your Positions
          </h1>
          <p className="text-sm text-[#9896a3]">
            Manage your yield derivatives and liquidity.
          </p>
        </div>
        <button
          onClick={() => router.push("/markets")}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all"
          style={{
            background: "linear-gradient(135deg,#6ee7b7,#34d399)",
            color: "#030305",
            boxShadow: "0 10px 30px rgba(52,211,153,0.30)",
          }}
        >
          <Plus className="w-5 h-5" />
          New Swap
        </button>
      </div>

      {(() => {
        const allSwaps = userDetails?.swaps ?? [];
        const activeSwaps = allSwaps.filter((s) => s.status === "ACTIVE");
        const closedSwaps = allSwaps.filter((s) => s.status !== "ACTIVE");

        return (
          <>
            {/* Active Swaps */}
            {activeSwaps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {activeSwaps.map((pos) => (
                  <PositionCard
                    key={pos.swapId}
                    position={pos}
                    onClick={() => setSelectedPosition(pos)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-[#9896a3] mb-16">No Active Swaps</div>
            )}

            {/* Closed / Settled Swaps */}
            {closedSwaps.length > 0 && (
              <div className="mb-16">
                <h2 className="text-[#9896a3] text-xs font-bold uppercase tracking-wide mb-6">
                  Settled / Expired
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {closedSwaps.map((pos) => (
                    <PositionCard
                      key={pos.swapId}
                      position={pos}
                      onClick={() => setSelectedPosition(pos)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* LP Positions — card grid */}
      <div className="space-y-6">
        <h2 className="text-[#9896a3] text-xs font-bold uppercase tracking-wide">
          Your LP Positions
        </h2>
        {userDetails?.lp?.positions?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userDetails.lp.positions.map((lp) => {
              const market = marketByPairId[lp.pairId];
              if (!market) return null;
              const tokens = extractTokensFromName(market.name);
              const meta = MARKET_META[String(lp.pairId)];
              const tokenSymbol = (meta?.collateralSymbol ?? "USDC").replace(/^mock/i, "");

              return (
                <div
                  key={lp.pairId}
                  onClick={() => handleLpCardClick(lp.pairId)}
                  className="
                    group relative cursor-pointer rounded-2xl p-px
                    bg-linear-to-br from-white/10 via-white/5 to-transparent
                    hover:from-[#34d399]/30 hover:via-[#34d399]/20
                    transition-all duration-300
                  "
                >
                  <div
                    className="
                      relative rounded-2xl p-6
                      bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px]
                      border border-[#1e1e2a]
                      shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]
                      hover:-translate-y-0.5
                      hover:shadow-[0_30px_80px_-25px_rgba(0,0,0,1)]
                      transition-all duration-300
                      overflow-hidden
                    "
                  >
                    {/* TOP GLOW */}
                    <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-[#34d399]/10 to-transparent pointer-events-none" />

                    <div className="relative z-10">
                      {/* HEADER */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex gap-1">
                          {tokens.map((token) => {
                            const Logo = TOKEN_LOGOS[token];
                            return <Logo key={token} size={32} />;
                          })}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#e8e6ee]">
                            {market.name}
                          </p>
                          <p className="text-[10px] text-[#6B7280]">
                            {market.protocol} • LP
                          </p>
                        </div>
                      </div>

                      {/* POSITION VALUE */}
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-[#6B7280] text-sm">Position Value</span>
                        <span className="text-xl font-semibold text-[#e8e6ee]">
                          {lp.shareValue.toFixed(4)} {tokenSymbol}
                        </span>
                      </div>

                      {/* POOL SHARE */}
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[#6B7280] text-sm">Pool Share</span>
                        <span className="text-sm font-medium text-[#9896a3]">
                          {lp.sharePct.toFixed(2)}%
                        </span>
                      </div>

                      {/* UTILIZATION */}
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[#6B7280] text-sm">Utilization</span>
                        <span className="text-sm font-bold text-[#34d399]">
                          {lp.utilizationPct.toFixed(1)}%
                        </span>
                      </div>

                      {/* WITHDRAW STATUS */}
                      <div className="flex justify-end">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            lp.canWithdraw
                              ? "bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20"
                              : "bg-white/5 text-[#6B7280] border-[#1e1e2a]"
                          }`}
                        >
                          {lp.canWithdraw ? "Withdrawable" : "Locked"}
                        </span>
                      </div>
                    </div>

                    {/* DECORATIVE GLOW */}
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity bg-[#34d399]" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-[#6B7280] py-10">
            No LP positions found
          </div>
        )}
      </div>

      {/* Position Details Modal */}
      {selectedPosition && (
        <PositionDetails
          position={selectedPosition}
          walletAddress={address as string}
          isOpen={!!selectedPosition}
          onClose={() => {
            setSelectedPosition(null);
            fetchPositions();
          }}
        />
      )}

      {/* LP Modal */}
      {lpModalMarket && (
        <LpModal
          isOpen={lpModalOpen}
          onClose={() => {
            setLpModalOpen(false);
            setLpModalMarket(null);
            setLpModalDetails(null);
          }}
          market={lpModalMarket}
          marketDetails={lpModalDetails}
          defaultTab="withdraw"
        />
      )}
    </PageLayout>
  );
};

export default PositionsPage;
