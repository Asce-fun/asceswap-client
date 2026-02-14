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
          <div className="w-16 h-16 rounded-2xl bg-[#8b5cf6]/10 flex items-center justify-center mb-6 text-[#a78bfa]">
            <Wallet className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
            Connect Your Wallet
          </h2>
          <p className="text-[#8A8894] text-sm max-w-sm mb-8">
            Connect your Starknet wallet to view your positions, portfolio
            analytics, and LP activity.
          </p>
          <button
            onClick={() => setShowAuthFlow(true)}
            className="px-8 py-3 rounded-[20px] bg-linear-to-br from-[#b0a0e0] to-[#6d5aad] text-[#0A0A0C] font-semibold text-sm transition-all duration-300 shadow-lg shadow-[rgba(167,139,250,0.22)] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[rgba(167,139,250,0.40)] cursor-pointer"
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
        <div className="relative p-5 rounded-2xl border border-white/10 bg-[#111114] backdrop-blur-xl hover:border-white/20 transition-all">
          <div className="absolute inset-0 bg-[#8b5cf6]/5 blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3 text-[#8A8894]">
            <BarChart3 className="w-4 h-4 text-[#a78bfa]" />
            <span className="text-[10px] font-bold uppercase tracking-wide">
              Portfolio Value
            </span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-white">
            $
            {userDetails?.portfolio.totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
          <p
            className={`text-xs mt-1 ${
              userDetails?.portfolio?.unrealizedPnl &&
              userDetails?.portfolio?.unrealizedPnl >= 0
                ? "text-[#34d399]"
                : "text-[#f43f5e]"
            }`}
          >
            {userDetails?.portfolio?.unrealizedPnl &&
            userDetails?.portfolio?.unrealizedPnl >= 0
              ? "+"
              : ""}
            {userDetails?.portfolio.unrealizedPnl.toFixed(6)} Unrealized P&L
          </p>
        </div>

        {/* Notional Exposure */}
        <div className="relative p-5 rounded-2xl border border-white/10 bg-[#111114] backdrop-blur-xl hover:border-white/20 transition-all">
          <div className="absolute inset-0 bg-[#a78bfa]/5 blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3 text-[#8A8894]">
            <TrendingUp className="w-4 h-4 text-[#c4b5fd]" />
            <span className="text-[10px] font-bold uppercase tracking-wide">
              Notional Exposure
            </span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-white">
            $
            {userDetails?.portfolio.totalNotionalExposure.toLocaleString(
              undefined,
              { minimumFractionDigits: 2 },
            )}
          </p>
          <div className="flex gap-2 mt-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#a090d4]/10 text-[#a090d4] border border-[#a090d4]/20">
              {userDetails?.counts.fixedPositions} Fixed
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8b7bc8]/10 text-[#8b7bc8] border border-[#8b7bc8]/20">
              {userDetails?.counts.floatingPositions} Floating
            </span>
          </div>
        </div>

        {/* Risk Management */}
        <div className="relative p-5 rounded-2xl border border-white/10 bg-[#111114] backdrop-blur-xl hover:border-white/20 transition-all">
          <div className="absolute inset-0 bg-[#f43f5e]/5 blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3 text-[#8A8894]">
            <ShieldAlert className="w-4 h-4 text-[#f43f5e]" />
            <span className="text-[10px] font-bold uppercase tracking-wide">
              Risk Management
            </span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-white">
            $
            {userDetails?.portfolio.totalCollateralAtRisk.toLocaleString(
              undefined,
              { minimumFractionDigits: 2 },
            )}
          </p>
          <p className="text-xs mt-1 text-[#8A8894]">Collateral at risk</p>
        </div>

        {/* Positions Count */}
        <div className="relative p-5 rounded-2xl border border-white/10 bg-[#111114] backdrop-blur-xl hover:border-white/20 transition-all">
          <div className="absolute inset-0 bg-[#34d399]/5 blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3 text-[#8A8894]">
            <Layers className="w-4 h-4 text-[#34d399]" />
            <span className="text-[10px] font-bold uppercase tracking-wide">
              Positions Count
            </span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-white">
            {userDetails?.counts.totalSwaps} Swaps
          </p>
          <p className="text-xs mt-1 text-[#8A8894]">
            {userDetails?.counts.lpPositions} LP Markets Active
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
              <p className="text-[#8A8894]">
                Manage your yield derivatives and liquidity.
              </p>
            </div>
            <button
              className="flex cursor-pointer items-center gap-2 px-6 py-3 rounded-2xl bg-linear-to-r from-[#8b5cf6] via-[#a78bfa] to-[#c4b5fd] text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-[rgba(167,139,250,0.22)] active:scale-95"
              onClick={() => {
                router.push("/markets");
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
            <h2 className="text-[#8A8894] text-xs font-bold uppercase tracking-wide">
              Your LP Positions
            </h2>
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#111114] backdrop-blur-xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
              {/* subtle top glow */}
              <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-[#8b5cf6]/10 to-transparent pointer-events-none" />
              <div className="hidden md:block">
                <table className="relative w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5 backdrop-blur-md">
                      <th className="px-6 py-4 text-[10px] font-bold text-[#8A8894] uppercase tracking-widest">
                        Asset Market
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-[#8A8894] uppercase tracking-widest text-right">
                        Position
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-[#8A8894] uppercase tracking-widest text-right">
                        APY
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
                            className="group transition-colors hover:bg-white/5"
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
                                  <p className="font-bold text-lg text-white">
                                    {market.name}
                                  </p>
                                  <p className="text-[#8A8894] text-sm">
                                    {market.protocol}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-8 text-right">
                              <p className="text-[#8A8894] text-[10px] font-bold uppercase mb-1">
                                Position
                              </p>
                              <p className="text-xl font-medium tracking-tight text-white">
                                ${lp.shareValue.toLocaleString()}
                              </p>
                              <p className="text-xs text-[#8A8894]">
                                {lp.sharePct}% pool share
                              </p>
                            </td>
                            <td className="px-6 py-8 text-right">
                              <p className="text-[#8A8894] text-[10px] font-bold uppercase mb-1">
                                Utilization
                              </p>
                              <p className="text-xl font-bold text-orange-400">
                                {lp.utilizationPct}%
                              </p>
                            </td>
                            <td className="px-6 py-8 text-right">
                              <button
                                disabled={!lp.canWithdraw}
                                className={`
                  px-6 py-2 rounded-xl font-bold text-sm transition-colors
                  ${
                    lp.canWithdraw
                      ? "border border-white/10 hover:bg-white/5"
                      : "border border-white/5 text-[#8A8894] cursor-not-allowed"
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
                          className="px-6 py-12 text-center text-[#8A8894]"
                        >
                          No LP positions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                        className="rounded-2xl border border-white/10 bg-[#111114] p-4"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex gap-1">
                            {tokens.map((token) => {
                              const Logo = TOKEN_LOGOS[token];
                              return <Logo key={token} size={28} />;
                            })}
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {market.name}
                            </p>
                            <p className="text-xs text-[#8A8894]">
                              {market.protocol}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase text-[#8A8894] mb-1">
                              Position
                            </p>
                            <p className="text-lg font-medium text-white">
                              ${lp.shareValue.toLocaleString()}
                            </p>
                            <p className="text-xs text-[#8A8894]">
                              {lp.sharePct}% pool share
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase text-[#8A8894] mb-1">
                              Utilization
                            </p>
                            <p className="text-lg font-bold text-orange-400">
                              {lp.utilizationPct}%
                            </p>
                          </div>
                        </div>
                        <button
                          disabled={!lp.canWithdraw}
                          className={`
            w-full py-2 rounded-xl text-sm font-bold transition
            ${
              lp.canWithdraw
                ? "border border-white/15 hover:bg-white/5 text-white"
                : "border border-white/5 text-[#8A8894] cursor-not-allowed"
            }
          `}
                        >
                          Withdraw
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-[#8A8894] py-10">
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
