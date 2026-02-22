// components/MintMockTokenModal.tsx
import React, { useState, useEffect } from "react";
import { Droplet, X, Check, ExternalLink, Copy } from "lucide-react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { mintMockToken } from "../blockchain/scripts/write/mintMockToken";
import { getStarknetAccount } from "../blockchain/utils/getStarknetAccount";
import { Portal } from "./Portal";
import { MARKETS, MARKET_META } from "../constants/markets";
import { getMarket } from "../blockchain/scripts/markets";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface TokenOption {
  symbol: string;
  address: string;
  decimals: number;
}

export const MintMockTokenModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { primaryWallet } = useDynamicContext();
  const account = primaryWallet?.address;

  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenOption[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenOption | null>(null);
  const [copied, setCopied] = useState(false);

  // Resolve unique token addresses from on-chain market data
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function fetchTokens() {
      const seen = new Map<string, TokenOption>();

      for (const market of MARKETS) {
        try {
          const details = await getMarket(market.id);
          if (details && !cancelled) {
            const addr = (details as any).collateralToken;
            const meta = MARKET_META[market.id];
            if (addr && !seen.has(addr)) {
              seen.set(addr, {
                symbol: meta?.collateralSymbol ?? 'Unknown',
                address: addr,
                decimals: meta?.decimals ?? (details as any).decimals ?? 6,
              });
            }
          }
        } catch {
          // Skip failed fetches
        }
      }

      if (!cancelled) {
        const tokenList = Array.from(seen.values());
        setTokens(tokenList);
        if (tokenList.length > 0 && !selectedToken) {
          setSelectedToken(tokenList[0]);
        }
      }
    }

    fetchTokens();
    return () => { cancelled = true; };
  }, [isOpen]);

  if (!isOpen) return null;

  const resetStates = () => {
    setLoading(false);
    setError(null);
    setTxHash(null);
    setCopied(false);
  };

  const displaySymbol = (sym: string) => sym.replace(/^mock/i, "");

  const handleMint = async () => {
    if (!account) {
      setError("Wallet not connected");
      return;
    }
    if (!selectedToken) {
      setError("No token selected");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const walletAccount = await getStarknetAccount(primaryWallet);
      const hash = await mintMockToken(selectedToken.address, walletAccount);
      setTxHash(hash);
    } catch (error) {
      setError("Mint failed — check console for details");
      console.error("[MintMockToken]", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncHex = (hex: string) =>
    hex ? `${hex.slice(0, 10)}...${hex.slice(-8)}` : "—";

  return (
    <Portal>
      <div className="fixed inset-0 z-9999 bg-black/40 backdrop-blur-sm flex items-center justify-center">
        <div className="relative w-105 rounded-2xl bg-[rgba(12,12,18,0.7)] backdrop-blur-[16px] border border-[#34d399]/20 p-6 space-y-5 shadow-xl">

          {/* Close */}
          <button
            onClick={() => { resetStates(); onClose(); }}
            className="absolute top-4 right-4 text-white/40 hover:text-[#34d399] p-1 rounded-full hover:bg-[#34d399]/10 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#34d399]/10 flex items-center justify-center border border-[#34d399]/20">
              <Droplet className="w-5 h-5 text-[#34d399]" />
            </div>
            <div>
              <h3 className="text-[#e8e6ee] font-semibold tracking-tight">
                Testnet Faucet
              </h3>
              <p className="text-xs text-white/50">
                Mint mock tokens to try out the protocol
              </p>
            </div>
          </div>

          {/* Token Selector */}
          <div className="space-y-2">
            <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
              Select Token
            </span>
            <div className="grid grid-cols-3 gap-2">
              {tokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => { setSelectedToken(token); setTxHash(null); setError(null); }}
                  className={`py-3 px-3 rounded-xl text-[11px] font-bold uppercase tracking-wider
                    transition-all cursor-pointer border ${
                    selectedToken?.address === token.address
                      ? "bg-[#34d399]/10 border-[#34d399]/30 text-[#34d399]"
                      : "bg-white/[0.02] border-[#1e1e2a] text-white/50 hover:text-white/70 hover:bg-white/[0.04]"
                  }`}
                >
                  {displaySymbol(token.symbol)}
                </button>
              ))}
              {tokens.length === 0 && (
                <div className="col-span-3 text-center text-xs text-white/30 py-4">
                  Loading tokens...
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="rounded-xl bg-white/[0.03] border border-[#1e1e2a] p-4 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/40">Recipient</span>
              <span className="font-mono text-[11px] text-white/70">
                {account ? truncHex(account) : "--"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/40">Token</span>
              <span className="font-semibold text-[#e8e6ee]">
                {selectedToken ? displaySymbol(selectedToken.symbol) : "--"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/40">Amount</span>
              <span className="font-semibold text-[#e8e6ee]">
                Contract faucet amount
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-red-400 text-xs p-3 rounded-lg bg-red-500/5 border border-red-500/10">
              {error}
            </div>
          )}

          {/* Success */}
          {txHash && (
            <div className="p-4 rounded-xl bg-[#34d399]/[0.04] border border-[#34d399]/20 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#34d399]/10 border border-[#34d399]/20 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-[#34d399]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#e8e6ee]">Tokens Minted</p>
                  <p className="text-[10px] text-white/40">{displaySymbol(selectedToken?.symbol ?? "")} sent to your wallet</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-[#1e1e2a]">
                <span className="font-mono text-[10px] text-white/50 truncate">{truncHex(txHash)}</span>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={handleCopy}
                    className="p-1 rounded-md hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3" />}
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

          {/* Mint Button */}
          <button
            onClick={handleMint}
            disabled={loading || !selectedToken}
            className="w-full py-3.5 rounded-xl bg-[#34d399]
                       hover:bg-[#19c495]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-black font-semibold text-xs
                       uppercase tracking-wider
                       transition-all cursor-pointer
                       active:scale-[0.98]"
          >
            {loading ? "Minting..." : `Mint ${selectedToken ? displaySymbol(selectedToken.symbol) : "Tokens"}`}
          </button>

        </div>
      </div>
    </Portal>
  );
};
