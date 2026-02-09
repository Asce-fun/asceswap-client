"use client";
import React, { useEffect, useState } from "react";

import {
  Plus,
  Coins,
  BarChart3,
  TrendingUp,
  ShieldAlert,
  Layers,
} from "lucide-react";
import { MOCK_POSITIONS, MOCK_LP_POSITIONS } from "../../constants/constants";
import { Position, UserDashboard } from "../../interface/types";
import { PositionDetails } from "../../components/PositionDetails";
import { Header } from "../../components/Header";
import { PositionCard } from "../../components/PositionCard";
import { useParams, useRouter } from "next/navigation";
import { Footer } from "@/app/components/Footer";
import { getUserDashboard } from "@/app/blockchain/scripts/analytics";
import { MARKETS } from "@/app/page";
import { extractTokensFromName } from "@/app/lib/helpers/helpers";
import { TOKEN_LOGOS } from "@/app/lib/helpers/tokenLogos";

const App: React.FC = () => {
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null,
  );
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [userDetails, setuserDetails] = useState<UserDashboard | null>();
  const [loadinguserDetails, setloadinguserDetails] = useState(false);
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const initialTheme = savedTheme ? savedTheme === "dark" : true;
    setIsDark(initialTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark, mounted]);

  const toggleTheme = () => setIsDark((prev) => !prev);
  const router = useRouter();
  const params = useParams();

  /**
   * Because you used [...address] (catch-all route),
   * Next.js returns it as string[] | undefined
   */
  const addressParam = params?.address;
  const address = Array.isArray(addressParam) ? addressParam[0] : addressParam;

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
        console.log(error, "err in fetching details");
      } finally {
        setloadinguserDetails(false);
      }
    }
  }, [address]);

  const marketByPairId = React.useMemo(() => {
    return Object.fromEntries(MARKETS.map((m) => [Number(m.id), m]));
  }, []);
  console.log(userDetails, "ud");
  if (!mounted) return <div className="min-h-screen bg-[#020617]" />;
  return (
    <div className="min-h-screen font-sans text-slate-900 dark:text-slate-200 transition-colors duration-500 bg-white dark:bg-[#080a0e]">
      <div className="fixed inset-0 z-0 bg-grid pointer-events-none opacity-80 dark:opacity-70"></div>

      {/* Background Blobs - Deep Blue and Purple, refined for contrast */}
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 dark:bg-blue-600/5 blur-[150px] rounded-full pointer-events-none animate-pulse-slow"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 dark:bg-purple-600/5 blur-[150px] rounded-full pointer-events-none animate-pulse-slow"></div>
      <Header isDark={isDark} toggleTheme={toggleTheme} />
      <main className="max-w-7xl mx-auto px-8 py-12">
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Portfolio Value */}
            <div
              className="
  relative p-5 rounded-2xl
  border border-white/10
  bg-linear-to-br from-zinc-800/70 via-zinc-900/60 to-black/70
  backdrop-blur-xl
  shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]
  hover:border-white/20
  transition-all
"
            >
              <div className="absolute inset-0 bg-blue-500/5 blur-2xl pointer-events-none" />

              <div className="flex items-center gap-2 mb-3 text-zinc-400">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
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
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {userDetails?.portfolio?.unrealizedPnl &&
                userDetails?.portfolio?.unrealizedPnl >= 0
                  ? "+"
                  : ""}
                {userDetails?.portfolio.unrealizedPnl.toFixed(6)} Unrealized P&L
              </p>
            </div>

            {/* Notional 
Exposure */}
            <div
              className="
  relative p-5 rounded-2xl
  border border-white/10
  bg-linear-to-br from-zinc-800/70 via-zinc-900/60 to-black/70
  backdrop-blur-xl
  shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]
  hover:border-white/20
  transition-all
"
            >
              <div className="absolute inset-0 bg-purple-500/5 blur-2xl pointer-events-none" />

              <div className="flex items-center gap-2 mb-3 text-zinc-400">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
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
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {userDetails?.counts.fixedPositions} Fixed
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {userDetails?.counts.floatingPositions} Floating
                </span>
              </div>
            </div>

            {/* Risk Management */}
            <div
              className="
  relative p-5 rounded-2xl
  border border-white/10
  bg-linear-to-br from-zinc-800/70 via-zinc-900/60 to-black/70
  backdrop-blur-xl
  shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]
  hover:border-white/20
  transition-all
"
            >
              <div className="absolute inset-0 bg-red-500/5 blur-2xl pointer-events-none" />

              <div className="flex items-center gap-2 mb-3 text-zinc-400">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
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

              <p className="text-xs mt-1 text-zinc-500">Collateral at risk</p>
            </div>

            {/* Positions Count */}
            <div
              className="
  relative p-5 rounded-2xl
  border border-white/10
  bg-linear-to-br from-zinc-800/70 via-zinc-900/60 to-black/70
  backdrop-blur-xl
  shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]
  hover:border-white/20
  transition-all
"
            >
              <div className="absolute inset-0 bg-emerald-500/5 blur-2xl pointer-events-none" />

              <div className="flex items-center gap-2 mb-3 text-zinc-400">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                  Positions Count
                </span>
              </div>

              <p className="text-2xl font-semibold tracking-tight text-white">
                {userDetails?.counts.totalSwaps} Swaps
              </p>

              <p className="text-xs mt-1 text-zinc-500">
                {userDetails?.counts.lpPositions} LP Markets Active
              </p>
            </div>
          </div>
        </>

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
                <p className="text-zinc-500">
                  Manage your yield derivatives and liquidity.
                </p>
              </div>
              <button
                className="flex cursor-pointer items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                onClick={() => {
                  router.push("/");
                }}
              >
                <Plus className="w-5 h-5" />
                New Swap
              </button>
            </div>

            {userDetails?.swaps ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {userDetails?.swaps.length>0? userDetails?.swaps.map((pos) => (
                  <PositionCard
                    key={pos.swapId}
                    position={pos}
                    onClick={() => setSelectedPosition(pos)}
                  />
                )):<div>No Swaps Found</div>}
              </div>
            ) : (
              <div>No Swaps Found</div>
            )}

            <div className="space-y-6">
              <h2 className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">
                Your LP Positions
              </h2>
              <div
                className="
      relative overflow-hidden rounded-3xl
      border border-white/5
      bg-[#0b0f16]/85
      backdrop-blur-xl
      shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]
    "
              >
                {/* subtle top glow */}
                <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-blue-500/10 to-transparent pointer-events-none" />
                <div className="hidden md:block">
                  <table className="relative w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5 backdrop-blur-md">
                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          Asset Market
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">
                          Position
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">
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
                          if (!market) return null; // safety

                          return (
                            <tr
                              key={lp.pairId}
                              className="group transition-colors hover:bg-white/5"
                            >
                              {/* MARKET */}
                              <td className="px-6 py-8">
                                <div className="flex items-center gap-4">
                                  <div className="flex -space-x-3">
                                    {/* token icons – placeholder logic */}
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
                                    <p className="text-zinc-500 text-sm">
                                      {market.protocol}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* POSITION */}
                              <td className="px-6 py-8 text-right">
                                <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">
                                  Position
                                </p>
                                <p className="text-xl font-medium tracking-tight text-white">
                                  ${lp.shareValue.toLocaleString()}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {lp.sharePct}% pool share
                                </p>
                              </td>

                              {/* APY / UTILIZATION */}
                              <td className="px-6 py-8 text-right">
                                <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">
                                  Utilization
                                </p>
                                <p className="text-xl font-bold text-orange-400">
                                  {lp.utilizationPct}%
                                </p>
                              </td>

                              {/* ACTION */}
                              <td className="px-6 py-8 text-right">
                                <button
                                  disabled={!lp.canWithdraw}
                                  className={`
                    px-6 py-2 rounded-xl font-bold text-sm transition-colors
                    ${
                      lp.canWithdraw
                        ? "border border-white/10 hover:bg-white/5"
                        : "border border-white/5 text-zinc-500 cursor-not-allowed"
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
                            className="px-6 py-12 text-center text-zinc-500"
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
                          className="rounded-2xl border border-white/10 bg-linear-to-br from-zinc-800/70 via-zinc-900/60 to-black/70 p-4"
                        >
                          {/* Header */}
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
                              <p className="text-xs text-zinc-500">
                                {market.protocol}
                              </p>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">
                                Position
                              </p>
                              <p className="text-lg font-medium text-white">
                                ${lp.shareValue.toLocaleString()}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {lp.sharePct}% pool share
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">
                                Utilization
                              </p>
                              <p className="text-lg font-bold text-orange-400">
                                {lp.utilizationPct}%
                              </p>
                            </div>
                          </div>

                          {/* Action */}
                          <button
                            disabled={!lp.canWithdraw}
                            className={`
              w-full py-2 rounded-xl text-sm font-bold transition
              ${
                lp.canWithdraw
                  ? "border border-white/15 hover:bg-white/5 text-white"
                  : "border border-white/5 text-zinc-500 cursor-not-allowed"
              }
            `}
                          >
                            Withdraw
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-zinc-500 py-10">
                      No LP positions found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
