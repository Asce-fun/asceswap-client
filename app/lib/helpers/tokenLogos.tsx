import { TokenSymbol } from "../../interface/types";

import USDCLogo from "../../assets/icons/coins/usdc";
import ETHLogo from "../../assets/icons/coins/eth";
import BTCLogo from "../../assets/icons/coins/btc";
import USDTLogo from "../../assets/icons/coins/usdt";
import STRKLogo from "../../assets/icons/coins/strk";


export const TOKEN_LOGOS: Record<TokenSymbol, React.FC<{ size?: number }>> = {
  STRK: ({ size = 16 }) => (
    <STRKLogo
      {...({ height: size, width: size } as {
        height: number;
        width: number;
      })}
    />
  ),

  USDC: ({ size = 16 }) => (
    <USDCLogo
      {...({ height: size, width: size } as {
        height: number;
        width: number;
      })}
    />
  ),

  ETH: ({ size = 16 }) => (
    <ETHLogo
      {...({ height: size, width: size } as {
        height: number;
        width: number;
      })}
    />
  ),

  BTC: ({ size = 16 }) => (
    <BTCLogo
      {...({ height: size, width: size } as {
        height: number;
        width: number;
      })}
    />
  ),

  USDT: ({ size = 16 }) => (
    <USDTLogo
      {...({ height: size, width: size } as {
        height: number;
        width: number;
      })}
    />
  ),
};

