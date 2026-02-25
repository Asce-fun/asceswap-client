import { ProtocolSymbol } from "../../interface/types";

import EkuboLogo from "../../assets/icons/dapps/ekubo";
import VesuLogo from "../../assets/icons/dapps/vesu";
import NostraLogo from "../../assets/icons/dapps/nostra";
import EndureFiLogo from "../../assets/icons/dapps/endurefi";
import TrovesLogo from "../../assets/icons/dapps/troves";
import USLogo from "../../assets/icons/dapps/us";
import ParadexLogo from "../../assets/icons/dapps/paradex";

export const PROTOCOL_LOGOS: Partial<
  Record<ProtocolSymbol, React.FC<{ size?: number }>>
> = {
  Ekubo: ({ size = 16 }) => <EkuboLogo size={size} />,
  Vesu: ({ size = 16 }) => <VesuLogo size={size} />,
  Nostra: ({ size = 16 }) => <NostraLogo size={size} />,
  "Endur.fi": ({ size = 16 }) => <EndureFiLogo size={size} />,
  Troves: ({ size = 16 }) => <TrovesLogo size={size} />,
  US: ({ size = 16 }) => <USLogo size={size} />,
  Paradex: ({ size = 16 }) => <ParadexLogo size={size} />,
  Asceswap: ({ size = 16 }) => <VesuLogo size={size} />,
};
