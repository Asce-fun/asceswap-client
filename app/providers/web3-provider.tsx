"use client";

import React, { useEffect } from "react";
import {
  DynamicContextProvider,
  getAuthToken,
} from "@dynamic-labs/sdk-react-core";
import { StarknetWalletConnectors } from "@dynamic-labs/starknet";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, signIn, signOut } from "next-auth/react";

const queryClient = new QueryClient();
const isProd = process.env.NEXT_PUBLIC_WORK_ENVIRONMENT === "production";

const starknetMainnet = {
  chainId: "SN_MAIN",
  name: "Starknet Mainnet",
  rpcUrls: ["https://starknet-mainnet.public.blastapi.io"],
};

const starknetSepolia = {
  chainId: "SN_SEPOLIA",
  name: "Starknet Sepolia",
  rpcUrls: ["https://starknet-sepolia.public.blastapi.io"],
};

export default function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (window.location.pathname.includes("waiting-list")) {
      signOut({ redirect: false });
    }
  }, []);

  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
        walletConnectors: [StarknetWalletConnectors],
        events: {
          onAuthSuccess: async () => {
            const token = getAuthToken();
            await signIn("credentials", {
              token,
              redirect: false,
            });
          },
          onLogout: async () => {
            await signOut({ redirect: false });
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <SessionProvider basePath="/api/auth">
          {children}
        </SessionProvider>
      </QueryClientProvider>
    </DynamicContextProvider>
  );
}
