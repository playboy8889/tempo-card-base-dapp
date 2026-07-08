"use client";

import { Attribution } from "ox/erc8021";
import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { baseAccount, injected } from "wagmi/connectors";

export const supportedChains = [base, baseSepolia] as const;

export const builderCode =
  process.env.NEXT_PUBLIC_BUILDER_CODE ?? "bc_er98t6o5";

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [
    baseAccount({
      appName: "Tempo Card",
    }),
    injected(),
  ],
  dataSuffix: builderCode
    ? Attribution.toDataSuffix({ codes: [builderCode] })
    : undefined,
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
});
