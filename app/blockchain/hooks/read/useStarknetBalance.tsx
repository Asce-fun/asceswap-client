import { useBalance } from "@starknet-react/core";

interface UseStarknetBalanceParams {
  address?: `0x${string}`;
  watch?: boolean;
}

export const useStarknetBalance = ({
  address,
  watch = true,
}: UseStarknetBalanceParams) => {
  const { data, error, isLoading } = useBalance({
    address,
    watch,
  });

  return {
    balance: data,
    error,
    isLoading,
    formatted:
      data && data.decimals !== undefined
        ? (Number(data.value) / 10 ** data.decimals).toString()
        : undefined,
    symbol: data?.symbol,
    decimals: data?.decimals,
  };
};
