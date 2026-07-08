"use client";

import {
  Disc3,
  Loader2,
  Music4,
  Sparkles,
  Wallet,
  Waves,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  ENERGY_LABELS,
  MAX_MOOD_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_TITLE_LENGTH,
  tempoCardAbi,
  tempoCardContractAddress,
} from "@/lib/tempo-card";

const ENERGY_STOPS = [1, 2, 3, 4, 5] as const;

function shortAddress(address?: Address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(createdAt?: bigint) {
  if (!createdAt) return "--";
  return new Date(Number(createdAt) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function energyWidth(energy: number) {
  return `${Math.max(12, Math.min(100, energy * 20))}%`;
}

function bpmGlow(bpm: number) {
  if (bpm < 90) return "#8fe5ff";
  if (bpm < 125) return "#7ef7bd";
  if (bpm < 155) return "#ffd36d";
  return "#ff7d9d";
}

export function TempoCardApp() {
  const [cardIdInput, setCardIdInput] = useState("1");
  const [title, setTitle] = useState("Midnight Drive");
  const [mood, setMood] = useState("Neon calm");
  const [bpm, setBpm] = useState(124);
  const [energy, setEnergy] = useState<(typeof ENERGY_STOPS)[number]>(4);
  const [note, setNote] = useState(
    "A clean late-night rhythm card for builders who want to post a vibe, tempo, and note on Base.",
  );
  const [status, setStatus] = useState(
    "Publish one rhythm card with BPM, mood, and a short scene note.",
  );
  const [walletStatus, setWalletStatus] = useState("");

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync, isPending: disconnecting } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const {
    data: hash,
    writeContract,
    isPending: writing,
    error: writeError,
  } = useWriteContract();
  const { isLoading: confirming, isSuccess: confirmed } =
    useWaitForTransactionReceipt({ hash });

  const availableConnectors = useMemo(
    () =>
      connectors
        .filter((item) => item.type !== "mock")
        .sort((a, b) => {
          const score = (item: (typeof connectors)[number]) => {
            if (item.id === "baseAccount" || item.name === "Base Account") {
              return 0;
            }
            if (item.type === "injected") return 1;
            return 2;
          };

          return score(a) - score(b);
        }),
    [connectors],
  );

  async function connectWallet() {
    const errors: string[] = [];
    setWalletStatus("Opening wallet...");

    for (const item of availableConnectors) {
      try {
        await connectAsync({ connector: item, chainId: base.id });
        setWalletStatus("");
        return;
      } catch (error) {
        errors.push(
          error instanceof Error
            ? `${item.name}: ${error.message}`
            : `${item.name}: connection failed`,
        );
      }
    }

    setWalletStatus(
      errors[0] ??
        "No wallet connector is available. Open this app inside Base App or install a wallet.",
    );
  }

  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
      setWalletStatus("Wallet disconnected. Tap Connect to reconnect.");
    } catch (error) {
      setWalletStatus(
        error instanceof Error ? error.message : "Could not disconnect wallet.",
      );
    }
  }
  const parsedCardId = BigInt(Math.max(1, Number(cardIdInput || "1")));

  const cardQuery = useReadContract({
    abi: tempoCardAbi,
    address: tempoCardContractAddress,
    functionName: "getCard",
    args: [parsedCardId],
    query: {
      enabled: Boolean(tempoCardContractAddress),
      refetchInterval: 12000,
    },
  });

  const totalQuery = useReadContract({
    abi: tempoCardAbi,
    address: tempoCardContractAddress,
    functionName: "nextCardId",
    query: {
      enabled: Boolean(tempoCardContractAddress),
      refetchInterval: 12000,
    },
  });

  const cardTuple = cardQuery.data as
    | readonly [Address, string, string, bigint, bigint, string, bigint]
    | undefined;

  const liveCard = useMemo(
    () =>
      cardTuple
        ? {
            creator: cardTuple[0],
            title: cardTuple[1],
            mood: cardTuple[2],
            bpm: cardTuple[3],
            energy: cardTuple[4],
            note: cardTuple[5],
            createdAt: cardTuple[6],
          }
        : undefined,
    [cardTuple],
  );

  const totalCards = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const displayTitle = liveCard?.title ?? title;
  const displayMood = liveCard?.mood ?? mood;
  const displayBpm = Number(liveCard?.bpm ?? BigInt(bpm));
  const displayEnergy = Number(liveCard?.energy ?? BigInt(energy));
  const displayNote = liveCard?.note ?? note;
  const glow = bpmGlow(displayBpm);

  const canPublish =
    Boolean(tempoCardContractAddress) &&
    isConnected &&
    chainId === base.id &&
    title.trim().length > 0 &&
    title.trim().length <= MAX_TITLE_LENGTH &&
    mood.trim().length > 0 &&
    mood.trim().length <= MAX_MOOD_LENGTH &&
    note.trim().length > 0 &&
    note.trim().length <= MAX_NOTE_LENGTH;

  const statusText = confirmed
    ? "Tempo card confirmed on Base."
    : writeError
      ? writeError.message
      : status;

  function publishCard() {
    if (!tempoCardContractAddress) return;
    setStatus("Confirm the tempo card in your wallet.");
    writeContract({
      address: tempoCardContractAddress,
      abi: tempoCardAbi,
      functionName: "publishCard",
      args: [title.trim(), mood.trim(), BigInt(bpm), BigInt(energy), note.trim()],
      chainId: base.id,
    });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(123,227,255,0.22),transparent_32%),radial-gradient(circle_at_80%_22%,rgba(255,94,145,0.16),transparent_24%),linear-gradient(180deg,#050816_0%,#090d1d_38%,#04050b_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[440px] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent)] opacity-50" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-white/12 bg-white/8 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#b3c9ff]">
                <Disc3 className="h-4 w-4" />
                Tempo Card
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Post a rhythm card on Base.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#d3dcff] sm:text-base">
                Capture a mood, BPM, and short scene note in a glossy player-style card
                that feels more like a track drop than a plain post.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              <div className="grid grid-cols-3 gap-2 text-left">
                <div className="min-w-[92px] rounded-[18px] border border-white/10 bg-black/25 px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa4d8]">
                    Cards
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">{totalCards}</p>
                </div>
                <div className="min-w-[92px] rounded-[18px] border border-white/10 bg-black/25 px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa4d8]">
                    BPM
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">{displayBpm}</p>
                </div>
                <div className="min-w-[92px] rounded-[18px] border border-white/10 bg-black/25 px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa4d8]">
                    Energy
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">{displayEnergy}/5</p>
                </div>
              </div>

              {isConnected ? (
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-white/12 bg-white/10 px-3 py-2 text-sm font-semibold text-white">
                    {shortAddress(address)}
                  </span>
                  <button
                    className="rounded-full border border-white/12 bg-white px-4 py-2 text-sm font-black text-[#060814]"
                    onClick={disconnectWallet}
                  >{disconnecting ? "Disconnecting" : "Disconnect"}</button>
                </div>
              ) : (
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white px-4 py-2 text-sm font-black text-[#060814] disabled:opacity-60"
                  disabled={availableConnectors.length === 0 || connecting}
                  onClick={connectWallet}
                >
                  {connecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                  Connect wallet
                </button>
              )}
            {walletStatus ? (
            <p className="w-full text-right text-xs font-semibold opacity-75">
              {walletStatus}
            </p>
          ) : null}
        </div>
          </div>
        </header>

        <div className="mt-4 grid flex-1 gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))] p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-[18px] border border-white/10 bg-black/25 text-[#88f0ff]">
                <Music4 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Compose card</h2>
                <p className="text-sm text-[#b8c7f2]">Make the vibe obvious in one glance.</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8fa4d8]">
                  Track title
                </span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={MAX_TITLE_LENGTH}
                  className="mt-2 w-full rounded-[18px] border border-white/10 bg-black/25 px-4 py-3 text-base font-semibold text-white outline-none placeholder:text-[#7384b7]"
                  placeholder="Midnight Drive"
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8fa4d8]">
                  Mood tag
                </span>
                <input
                  value={mood}
                  onChange={(event) => setMood(event.target.value)}
                  maxLength={MAX_MOOD_LENGTH}
                  className="mt-2 w-full rounded-[18px] border border-white/10 bg-black/25 px-4 py-3 text-base font-semibold text-white outline-none placeholder:text-[#7384b7]"
                  placeholder="Neon calm"
                />
              </label>

              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8fa4d8]">
                    BPM
                  </span>
                  <span className="text-sm font-black text-white">{bpm}</span>
                </div>
                <input
                  type="range"
                  min={70}
                  max={180}
                  step={1}
                  value={bpm}
                  onChange={(event) => setBpm(Number(event.target.value))}
                  className="mt-3 h-2 w-full accent-[#82e8ff]"
                />
              </label>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8fa4d8]">
                  Energy
                </span>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {ENERGY_STOPS.map((value) => {
                    const active = value === energy;
                    return (
                      <button
                        key={value}
                        className={`rounded-[16px] border px-0 py-3 text-sm font-black transition ${
                          active
                            ? "border-transparent bg-white text-[#050816]"
                            : "border-white/10 bg-black/25 text-[#b8c7f2]"
                        }`}
                        onClick={() => setEnergy(value)}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-[#90a2d6]">{ENERGY_LABELS[energy - 1]}</p>
              </div>

              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8fa4d8]">
                  Scene note
                </span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={MAX_NOTE_LENGTH}
                  rows={4}
                  className="mt-2 w-full rounded-[18px] border border-white/10 bg-black/25 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-[#7384b7]"
                  placeholder="Why this rhythm fits the moment."
                />
              </label>

              {isConnected && chainId !== base.id ? (
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-[#86efff]/30 bg-[#86efff] px-4 py-3 text-sm font-black text-[#06101b] disabled:opacity-60"
                  disabled={switching}
                  onClick={() => switchChain({ chainId: base.id })}
                >
                  {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Waves className="h-4 w-4" />}
                  Switch to Base
                </button>
              ) : (
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-[#86efff]/30 bg-[linear-gradient(90deg,#82e8ff,#f48fbf)] px-4 py-3 text-sm font-black text-[#050816] shadow-[0_16px_40px_rgba(130,232,255,0.24)] disabled:opacity-60"
                  disabled={!canPublish || writing || confirming}
                  onClick={publishCard}
                >
                  {writing || confirming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Publish on Base
                </button>
              )}

              <p className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-[#d8e0ff]">
                {statusText}
              </p>
            </div>
          </aside>

          <section className="grid gap-4">
            <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-5">
              <div className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_28%),linear-gradient(160deg,#0a1024_0%,#131832_40%,#080b18_100%)] p-4 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
                  <div className="min-w-0 flex-1 rounded-[28px] border border-white/10 bg-black/20 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#90a2d6]">
                          Live card
                        </p>
                        <h3 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                          {displayTitle}
                        </h3>
                        <p className="mt-2 text-base font-semibold text-[#dce5ff]">
                          {displayMood}
                        </p>
                      </div>
                      <div
                        className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-white/12 bg-white/8"
                        style={{ boxShadow: `0 0 36px ${glow}55` }}
                      >
                        <Disc3 className="h-8 w-8" style={{ color: glow }} />
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa4d8]">
                          BPM
                        </p>
                        <p className="mt-2 text-3xl font-black text-white">{displayBpm}</p>
                      </div>
                      <div className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa4d8]">
                          Energy
                        </p>
                        <p className="mt-2 text-3xl font-black text-white">{displayEnergy}/5</p>
                      </div>
                      <div className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa4d8]">
                          Date
                        </p>
                        <p className="mt-2 text-xl font-black text-white">
                          {formatDate(liveCard?.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.24em] text-[#8fa4d8]">
                        <span>Energy bar</span>
                        <span>{ENERGY_LABELS[Math.max(0, displayEnergy - 1)]}</span>
                      </div>
                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#82e8ff,#7ef7bd,#ffd36d,#ff7d9d)]"
                          style={{ width: energyWidth(displayEnergy) }}
                        />
                      </div>
                    </div>

                    <p className="mt-6 rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-[#dbe4ff]">
                      {displayNote}
                    </p>
                  </div>

                  <div className="w-full rounded-[28px] border border-white/10 bg-black/20 p-5 lg:w-[320px]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#8fa4d8]">
                      Retrieve card
                    </p>
                    <div className="mt-4 rounded-[24px] border border-white/10 bg-white/6 p-4">
                      <label className="block">
                        <span className="text-xs font-semibold text-[#dbe4ff]">
                          Card ID
                        </span>
                        <input
                          value={cardIdInput}
                          onChange={(event) => setCardIdInput(event.target.value.replace(/\D/g, ""))}
                          className="mt-2 w-full rounded-[16px] border border-white/10 bg-black/30 px-4 py-3 text-lg font-black text-white outline-none"
                          placeholder="1"
                        />
                      </label>

                      <div className="mt-4 space-y-3 text-sm text-[#c9d5fa]">
                        <div className="rounded-[16px] border border-white/10 bg-black/25 px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa4d8]">
                            Creator
                          </p>
                          <p className="mt-2 break-all font-semibold text-white">
                            {liveCard?.creator ? shortAddress(liveCard.creator) : "--"}
                          </p>
                        </div>
                        <div className="rounded-[16px] border border-white/10 bg-black/25 px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa4d8]">
                            Contract
                          </p>
                          <p className="mt-2 break-all font-semibold text-white">
                            {tempoCardContractAddress
                              ? shortAddress(tempoCardContractAddress)
                              : "Add contract address first"}
                          </p>
                        </div>
                        <div className="rounded-[16px] border border-white/10 bg-black/25 px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8fa4d8]">
                            Status
                          </p>
                          <p className="mt-2 font-semibold text-white">
                            {cardQuery.isLoading
                              ? "Loading card..."
                              : liveCard?.creator && liveCard.creator !== "0x0000000000000000000000000000000000000000"
                                ? "Card loaded"
                                : "Waiting for published card"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(130,232,255,0.14),rgba(255,255,255,0.04))] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8fa4d8]">
                        What this app does
                      </p>
                      <ul className="mt-3 space-y-3 text-sm leading-6 text-[#e3ebff]">
                        <li>Publish one music-flavored identity card on Base.</li>
                        <li>Store BPM, mood, energy, and note fully onchain.</li>
                        <li>Load older cards by ID in the same player view.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
