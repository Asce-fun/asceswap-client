// components/MintMockTokenModal.tsx
import React, { useState } from "react";
import { Droplet, X } from "lucide-react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { mintMockToken } from "../blockchain/scripts/write/mintMockToken";
import { Portal } from "./Portal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MintMockTokenModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { primaryWallet } = useDynamicContext();
  const account = primaryWallet?.address;

  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetStates = () => {
    setLoading(false);
    setError(null);
    setTxHash(null);
  };

  const handleMint = async () => {
    if (!account) {
      setError("Wallet not connected");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const hash = await mintMockToken(
        process.env.NEXT_PUBLIC_MOCK_ERC20_ADDRESS as string,
        6
      );

      setTxHash(hash);
    } catch (error) {
      setError("Mint failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      {/* Backdrop */}
      <div className="fixed inset-0 z-9999 bg-black/40 backdrop-blur-sm flex items-center justify-center">
        {/* Modal */}
        <div className="relative w-105 rounded-2xl bg-[#0e1110] border border-[#1FD6A3]/20 p-6 space-y-6 shadow-xl">

          {/* Close */}
          <button
            onClick={() => {
              resetStates();
              onClose();
            }}
            className="absolute top-4 right-4 text-white/40 hover:text-[#1FD6A3] p-1 rounded-full hover:bg-[#1FD6A3]/10 transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1FD6A3]/10 flex items-center justify-center border border-[#1FD6A3]/20">
              <Droplet className="w-5 h-5 text-[#1FD6A3]" />
            </div>
            <div>
              <h3 className="text-white font-semibold tracking-tight">
                Mint Test Tokens
              </h3>
              <p className="text-xs text-white/50">
                MockERC20 faucet
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 text-xs space-y-3">
            <div>
              <span className="text-white/40">Recipient</span>
              <div className="font-mono text-[11px] text-white/70 break-all mt-1">
                {account ?? "--"}
              </div>
            </div>

            <div>
              <span className="text-white/40">Amount</span>
              <div className="font-semibold text-white mt-1">
                10,000 Mock tokens
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-xs">{error}</div>
          )}

          {txHash && (
            <div className="text-[#1FD6A3] text-xs break-all">
              Success
              <br />
              {txHash}
            </div>
          )}

          <button
            onClick={handleMint}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#1FD6A3] 
                       hover:bg-[#19c495] 
                       disabled:opacity-50 
                       text-black font-semibold text-xs 
                       uppercase tracking-wider 
                       transition-all"
          >
            {loading ? "Minting..." : "Mint 10,000 Mock Tokens"}
          </button>

        </div>
      </div>
    </Portal>
  );
};
