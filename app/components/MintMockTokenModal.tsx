// components/MintMockTokenModal.tsx
import React, { useState } from "react";
import { Droplet } from "lucide-react";
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
  const resetStates=()=>{
    setLoading(false)
    setError(null)
    setTxHash(null)
  }
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
        6,
      );

      setTxHash(hash);
    } catch (error) {
      console.log(error, "err");
      setError("Mint failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      {/* Backdrop */}
      <div className="fixed inset-0 z-9999 bg-black/70 backdrop-blur-sm flex items-center justify-center">
        {/* Modal */}
        <div className="relative w-105 rounded-2xl bg-[#0b0f1a] border border-white/10 p-6 space-y-6 shadow-2xl">
          {/* Close */}
          <button
            onClick={()=>{
                resetStates()
                onClose()
            }}
            className="absolute cursor-pointer top-4 right-4 text-slate-400 hover:text-white"
          >
            ✕
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Droplet className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Mint Test Tokens</h3>
              <p className="text-xs text-slate-400">
                MockERC20 faucet
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-xl bg-black/40 p-4 text-xs space-y-2">
            <div>
              <span className="text-slate-500">Recipient</span>
              <div className="font-mono text-[11px] text-slate-300 break-all">
                {account ?? "--"}
              </div>
            </div>

            <div>
              <span className="text-slate-500">Amount</span>
              <div className="font-bold text-white">10,000 Mock tokens</div>
            </div>
          </div>

          {error && <div className="text-red-400 text-xs">{error}</div>}

          {txHash && (
            <div className="text-green-400 text-xs break-all">
              Success
              <br />
              {txHash}
            </div>
          )}

          <button
            onClick={handleMint}
            disabled={loading}
            className="w-full cursor-pointer py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-black font-black text-xs uppercase tracking-widest"
          >
            {loading ? "Minting..." : "Mint 10,000 Mock Tokens"}
          </button>
        </div>
      </div>
    </Portal>
  );
};
