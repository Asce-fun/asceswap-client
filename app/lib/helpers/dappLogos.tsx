import { ProtocolSymbol } from "../../interface/types";

import EkuboLogo from "../../assets/icons/dapps/ekubo";
import VesuLogo from "../../assets/icons/dapps/vesu";
import NostraLogo from "../../assets/icons/dapps/nostra";

export const PROTOCOL_LOGOS: Record<
  ProtocolSymbol,
  React.FC<{ size?: number }>
> = {
  Ekubo: ({ size = 16 }) => <EkuboLogo size={size} />,

  Vesu: ({ size = 16 }) => <VesuLogo size={size} />,

  Nostra: ({ size = 16 }) => <NostraLogo size={size} />,
};
