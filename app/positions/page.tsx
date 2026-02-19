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
import { Position, UserDashboard } from "../interface/types";
import { PositionDetails } from "../components/PositionDetails";
import { PositionCard } from "../components/PositionCard";
import { useRouter } from "next/navigation";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { getUserDashboard } from "@/app/blockchain/scripts/analytics";
import { MARKETS } from "@/app/constants/markets";
import { extractTokensFromName } from "@/app/lib/helpers/helpers";
import { TOKEN_LOGOS } from "@/app/lib/helpers/tokenLogos";
import { PageLayout } from "@/app/components/PageLayout";

const PositionsPage: React.FC = () => {
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null,
  );
  const [userDetails, setuserDetails] = useState<UserDashboard | null>();
  const [loadinguserDetails, setloadinguserDetails] = useState(false);

  const router = useRouter();
  const { primaryWallet, setShowAuthFlow } = useDynamicContext();
  const address = primaryWallet?.address;

  useEffect(() => {
    if (address) {
      try {
        const fetchDetails = async () => {
          setloadinguserDetails(true);
          const res = await getUserDashboard(address);
          setuserDetails(res);
        };
        fetchDetails();
      } catch (error) {
      } finally {
        setloadinguserDetails(false);
      }
    }
  }, [address]);

  const marketByPairId = React.useMemo(() => {
    return Object.fromEntries(MARKETS.map((m) => [Number(m.id), m]));
  }, []);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Portfolio Value */}
        <div className="relative p-5 rounded-2xl border border-white/10 bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px] hover:border-white/20 transition-all">
          <div className="absolute inset-0 bg-[#8b5cf6]/5 blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3 text-[#9896a3]">
            <BarChart3 className="w-4 h-4 text-[#a78bfa]" />
            <span className="text-[10px] font-bold uppercase tracking-wide">
              Portfolio Value
            </span>
          </div>
          <p className="text-lg font-semibold tracking-tight text-white/30">
            Coming Soon
          </p>
          <p className="text-[10px] mt-1 text-white/20">
            Requires oracle price feeds
          </p>
        </div>

        {/* Notional Exposure */}
        <div className="relative p-5 rounded-2xl border border-white/10 bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px] hover:border-white/20 transition-all">
          <div className="absolute inset-0 bg-[#a78bfa]/5 blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3 text-[#9896a3]">
            <TrendingUp className="w-4 h-4 text-[#c4b5fd]" />
            <span className="text-[10px] font-bold uppercase tracking-wide">
              Notional Exposure
            </span>
          </div>
          <p className="text-lg font-semibold tracking-tight text-white/30">
            Coming Soon
          </p>
          <p className="text-[10px] mt-1 text-white/20">
            Requires oracle price feeds
          </p>
        </div>

        {/* Risk Management */}
        <div className="relative p-5 rounded-2xl border border-white/10 bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px] hover:border-white/20 transition-all">
          <div className="absolute inset-0 bg-[#f87171]/5 blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3 text-[#9896a3]">
            <ShieldAlert className="w-4 h-4 text-[#f87171]" />
            <span className="text-[10px] font-bold uppercase tracking-wide">
              Risk Management
            </span>
          </div>
          <p className="text-lg font-semibold tracking-tight text-white/30">
            Coming Soon
          </p>
          <p className="text-[10px] mt-1 text-white/20">
            Requires oracle price feeds
          </p>
        </div>

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
            {userDetails?.counts.totalSwaps ?? 0} Swaps
          </p>
          <p className="text-xs mt-1 text-[#9896a3]">
            {userDetails?.counts.lpPositions ?? 0} LP Markets Active
          </p>
        </div>
      </div>

      {selectedPosition ? (
        <PositionDetails
          position={selectedPosition}
          walletAddress={address as string}
          onBack={() => setSelectedPosition(null)}
        />
      ) : (
        <>
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                Your Positions
              </h1>
              <p className="text-[#9896a3]">
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

          {userDetails?.swaps ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {userDetails?.swaps.length > 0 ? (
                userDetails?.swaps.map((pos) => (
                  <PositionCard
                    key={pos.swapId}
                    position={pos}
                    onClick={() => setSelectedPosition(pos)}
                  />
                ))
              ) : (
                <div>No Swaps Found</div>
              )}
            </div>
          ) : (
            <div>No Swaps Found</div>
          )}

          <div className="space-y-6">
            <h2 className="text-[#9896a3] text-xs font-bold uppercase tracking-wide">
              Your LP Positions
            </h2>
            <div className="relative overflow-hidden rounded-2xl border border-[#1e1e2a] bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
              {/* subtle top glow */}
              <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-[#8b5cf6]/10 to-transparent pointer-events-none" />
              <div
                className="relative overflow-hidden rounded-2xl 
                border border-[#1e1e2a] 
                bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px]
                backdrop-blur-xl 
                shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9),
                        0_0_80px_-30px_rgba(52,211,153,0.25)]"
              >
                {/* Mint top glow */}
                <div
                  className="absolute inset-x-0 top-0 h-32 
                  bg-gradient-to-b 
                  from-[#34d399]/10 
                  to-transparent 
                  pointer-events-none"
                />

                <div className="hidden md:block">
                  <table className="relative w-full text-left">
                    <thead>
                      <tr className="border-b border-[#1e1e2a] bg-white/[0.03] backdrop-blur-md">
                        <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                          Asset Market
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest text-right">
                          Position
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest text-right">
                          Utilization
                        </th>
                        <th className="px-6 py-4" />
                      </tr>
                    </thead>

                    <tbody>
                      {userDetails?.lp?.positions?.length ? (
                        userDetails.lp.positions.map((lp) => {
                          const market = marketByPairId[lp.pairId];
                          const tokens = extractTokensFromName(market.name);
                          if (!market) return null;

                          return (
                            <tr
                              key={lp.pairId}
                              className="group transition-colors hover:bg-white/[0.04]"
                            >
                              <td className="px-6 py-8">
                                <div className="flex items-center gap-4">
                                  <div className="flex -space-x-3">
                                    <div className="flex items-center gap-1">
                                      {tokens.map((token) => {
                                        const Logo = TOKEN_LOGOS[token];
                                        return <Logo key={token} size={40} />;
                                      })}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="font-bold text-lg text-[#e8e6ee]">
                                      {market.name}
                                    </p>
                                    <p className="text-white/40 text-sm">
                                      {market.protocol}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-8 text-right">
                                <p className="text-white/40 text-[10px] font-bold uppercase mb-1">
                                  Position
                                </p>
                                <p className="text-xl font-semibold tracking-tight text-[#e8e6ee]">
                                  ${lp.shareValue.toLocaleString()}
                                </p>
                                <p className="text-xs text-white/30">
                                  {lp.sharePct}% pool share
                                </p>
                              </td>

                              <td className="px-6 py-8 text-right">
                                <p className="text-white/40 text-[10px] font-bold uppercase mb-1">
                                  Utilization
                                </p>
                                <p className="text-xl font-bold text-[#34d399]">
                                  {lp.utilizationPct}%
                                </p>
                              </td>

                              <td className="px-6 py-8 text-right">
                                <button
                                  disabled={!lp.canWithdraw}
                                  className={`
                      px-6 py-2 rounded-xl font-bold text-sm transition-all
                      ${
                        lp.canWithdraw
                          ? "border border-[#34d399]/40 text-[#34d399] hover:bg-[#34d399]/10"
                          : "border border-[#1e1e2a] text-white/30 cursor-not-allowed"
                      }
                    `}
                                >
                                  Withdraw
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-12 text-center text-white/40"
                          >
                            No LP positions found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="md:hidden space-y-4">
                {userDetails?.lp?.positions?.length ? (
                  userDetails.lp.positions.map((lp) => {
                    const market = marketByPairId[lp.pairId];
                    if (!market) return null;
                    const tokens = extractTokensFromName(market.name);

                    return (
                      <div
                        key={lp.pairId}
                        className="
            relative overflow-hidden
            rounded-2xl
            border border-[#1e1e2a]
            bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px]
            p-4
            shadow-[0_20px_60px_-25px_rgba(0,0,0,0.9)]
          "
                      >
                        {/* subtle top glow */}
                        <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-[#34d399]/10 to-transparent pointer-events-none" />

                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex gap-1">
                              {tokens.map((token) => {
                                const Logo = TOKEN_LOGOS[token];
                                return <Logo key={token} size={28} />;
                              })}
                            </div>

                            <div>
                              <p className="font-semibold text-[#e8e6ee]">
                                {market.name}
                              </p>
                              <p className="text-xs text-[#6B7280]">
                                {market.protocol}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-[10px] font-bold uppercase text-[#6B7280] mb-1">
                                Position
                              </p>
                              <p className="text-lg font-medium text-[#e8e6ee]">
                                ${lp.shareValue.toLocaleString()}
                              </p>
                              <p className="text-xs text-[#6B7280]">
                                {lp.sharePct}% pool share
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-[10px] font-bold uppercase text-[#6B7280] mb-1">
                                Utilization
                              </p>
                              <p className="text-lg font-bold text-[#34d399]">
                                {lp.utilizationPct}%
                              </p>
                            </div>
                          </div>

                          <button
                            disabled={!lp.canWithdraw}
                            className={`
                w-full py-2 rounded-xl text-sm font-bold transition-all duration-200
                ${
                  lp.canWithdraw
                    ? "border border-[#34d399]/30 bg-[#34d399]/5 text-[#34d399] hover:bg-[#34d399]/10 hover:border-[#34d399]/50"
                    : "border border-[#1e1e2a] text-[#4B5563] cursor-not-allowed"
                }
              `}
                          >
                            Withdraw
                          </button>
                        </div>

                        {/* decorative glow */}
                        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#34d399] blur-3xl opacity-10" />
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-[#6B7280] py-10">
                    No LP positions found
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </PageLayout>
  );
};

export default PositionsPage;
