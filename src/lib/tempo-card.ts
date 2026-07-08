import type { Address } from "viem";

export const MAX_TITLE_LENGTH = 32;
export const MAX_MOOD_LENGTH = 24;
export const MAX_NOTE_LENGTH = 180;

export const ENERGY_LABELS = [
  "soft pulse",
  "steady glide",
  "open-road lift",
  "peak-hour shine",
  "full afterglow",
] as const;

export const tempoCardAbi = [
  {
    type: "function",
    name: "publishCard",
    stateMutability: "nonpayable",
    inputs: [
      { name: "title", type: "string" },
      { name: "mood", type: "string" },
      { name: "bpm", type: "uint256" },
      { name: "energy", type: "uint256" },
      { name: "note", type: "string" },
    ],
    outputs: [{ name: "cardId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getCard",
    stateMutability: "view",
    inputs: [{ name: "cardId", type: "uint256" }],
    outputs: [
      { name: "creator", type: "address" },
      { name: "title", type: "string" },
      { name: "mood", type: "string" },
      { name: "bpm", type: "uint256" },
      { name: "energy", type: "uint256" },
      { name: "note", type: "string" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextCardId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export type TempoCardData = {
  creator: Address;
  title: string;
  mood: string;
  bpm: bigint;
  energy: bigint;
  note: string;
  createdAt: bigint;
};

export const tempoCardContractAddress = process.env
  .NEXT_PUBLIC_TEMPO_CARD_CONTRACT_ADDRESS as Address | undefined;
