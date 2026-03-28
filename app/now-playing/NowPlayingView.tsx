"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { EnrichedNowPlaying } from "@/lib/enrichment/now-playing";

const CROSSFADE_MS = 800;

function trackId(data: EnrichedNowPlaying | null): string {
  if (!data) return "__empty__";
  return `${data.artistName}::${data.trackName}`;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

async function sendControl(action: string) {
  await fetch("/api/eversolo/control", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
}

function PlayerControls({
  playState,
}: {
  playState: "playing" | "paused" | "idle";
}) {
  const [busy, setBusy] = useState(false);
  // Optimistic: flip immediately on click, SSE corrects within ~300ms
  const [optimisticState, setOptimisticState] = useState<
    "playing" | "paused" | "idle" | null
  >(null);
  const displayState = optimisticState ?? playState;

  // Clear optimistic state once SSE confirms the real state
  useEffect(() => {
    setOptimisticState(null);
  }, [playState]);

  const control = async (action: string) => {
    if (busy) return;
    setBusy(true);
    if (action === "playOrPause") {
      setOptimisticState(displayState === "playing" ? "paused" : "playing");
    }
    try {
      await sendControl(action);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-5 shrink-0">
      <button
        onClick={() => control("playLast")}
        disabled={busy}
        className="text-white/70 hover:text-white transition-colors disabled:opacity-40"
        aria-label="Previous"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
        </svg>
      </button>

      <button
        onClick={() => control("playOrPause")}
        disabled={busy}
        className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-zinc-900 hover:bg-zinc-200 transition-colors disabled:opacity-40 shrink-0"
        aria-label={displayState === "playing" ? "Pause" : "Play"}
      >
        {displayState === "playing" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <button
        onClick={() => control("playNext")}
        disabled={busy}
        className="text-white/70 hover:text-white transition-colors disabled:opacity-40"
        aria-label="Next"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 3.93V8.07L8.5 12zM16 6h2v12h-2z" />
        </svg>
      </button>
    </div>
  );
}

function AudioQualityBadge({
  format,
}: {
  format: EnrichedNowPlaying["audioFormat"];
}) {
  if (!format?.extension) return null;
  const parts = [
    format.extension.toUpperCase(),
    format.bits && format.bits !== "0" ? `${format.bits}-bit` : null,
    format.sampleRate || null,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <p className="text-xs text-zinc-500 tabular-nums shrink-0">
      {parts.join(" · ")}
    </p>
  );
}

function EqualizerBars({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width: 3,
            borderRadius: 2,
            backgroundColor: "#34d399",
            animation: playing
              ? `eq-bounce ${0.6 + i * 0.15}s ease-in-out infinite alternate`
              : "none",
            height: playing ? undefined : 4,
            minHeight: 4,
          }}
        />
      ))}
      <style>{`
        @keyframes eq-bounce {
          from { height: 4px; }
          to   { height: 16px; }
        }
      `}</style>
    </div>
  );
}

function NowPlayingCard({ data }: { data: EnrichedNowPlaying | null }) {
  const [displayMs, setDisplayMs] = useState(data?.positionMs ?? 0);
  const receivedAtRef = useRef(Date.now());

  useEffect(() => {
    receivedAtRef.current = Date.now();
    setDisplayMs(data?.positionMs ?? 0);
  }, [data?.positionMs]);

  useEffect(() => {
    if (!data || data.playState !== "playing") return;
    const startPos = data.positionMs;
    const startedAt = receivedAtRef.current;
    const id = setInterval(() => {
      setDisplayMs(startPos + (Date.now() - startedAt));
    }, 1000);
    return () => clearInterval(id);
  }, [data?.positionMs, data?.playState]);

  if (!data) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
          <span className="text-2xl">♪</span>
        </div>
        <p className="text-zinc-500 text-sm">Nothing playing</p>
      </div>
    );
  }

  const playing = data.playState === "playing";
  const pct =
    data.durationMs > 0
      ? Math.min((displayMs / data.durationMs) * 100, 100)
      : 0;

  return (
    <div className="absolute inset-0">
      {/* Full-viewport background */}
      {data.artistImages?.background ? (
        <>
          <Image
            src={data.artistImages.background}
            alt={data.artistName}
            fill
            className="object-cover object-top"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0.92) 100%)",
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-zinc-950" />
      )}

      {/* Bottom info block — sits above the progress bar */}
      <div className="absolute bottom-1 left-0 right-0 px-8 pb-6">
        <div className="flex items-center gap-5">
          {/* Album art thumbnail */}
          <div className="w-24 h-24 rounded-md overflow-hidden shrink-0 bg-zinc-800 shadow-xl">
            {data.albumArtUrl ? (
              <Image
                src={data.albumArtUrl}
                alt={data.albumName ?? data.trackName}
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xl text-zinc-600">♪</span>
              </div>
            )}
          </div>

          {/* Track info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate leading-tight">
              {data.trackName}
            </h1>
            <Link
              href={`/artist/${encodeURIComponent(data.artistName)}`}
              className="text-sm text-zinc-300 hover:text-white transition-colors truncate block"
            >
              {data.artistName}
            </Link>
            {data.albumName && (
              <p className="text-xs text-zinc-500 truncate mt-0.5">
                {data.albumName}
              </p>
            )}
          </div>

          {/* Playback controls */}
          <PlayerControls playState={data.playState} />

          {/* Audio quality + eq + time — fixed width to prevent layout shift */}
          <div className="flex items-center gap-3 shrink-0 justify-end">
            <AudioQualityBadge format={data.audioFormat} />
            <div className="flex items-center gap-2 w-28 shrink-0">
              <EqualizerBars playing={playing} />
              <span className="text-xs text-emerald-400 font-medium whitespace-nowrap">
                {playing ? "Now Playing" : "Paused"}
              </span>
            </div>
            {data.durationMs > 0 && (
              <p className="text-xs text-zinc-500 tabular-nums whitespace-nowrap">
                {formatTime(displayMs)} / {formatTime(data.durationMs)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Full-width progress bar pinned to bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="absolute inset-y-0 left-0 bg-emerald-400"
          style={{ width: `${pct}%`, transition: "width 1s linear" }}
        />
      </div>
    </div>
  );
}

export function NowPlayingView() {
  const [latest, setLatest] = useState<EnrichedNowPlaying | null>(null);
  const [displayed, setDisplayed] = useState<EnrichedNowPlaying | null>(null);
  const [loading, setLoading] = useState(true);
  const [fading, setFading] = useState(false);

  const shownIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/now-playing/stream");

    es.onmessage = (event: MessageEvent<string>) => {
      const json: EnrichedNowPlaying | null = JSON.parse(event.data);
      setLatest(json);
      setLoading(false);
    };

    return () => {
      es.close();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const incoming = trackId(latest);

    if (shownIdRef.current === null) {
      shownIdRef.current = incoming;
      setDisplayed(latest);
      return;
    }

    if (shownIdRef.current === incoming) {
      setDisplayed(latest);
      return;
    }

    shownIdRef.current = incoming;
    setFading(true);
    timerRef.current = setTimeout(() => {
      setDisplayed(latest);
      setFading(false);
    }, CROSSFADE_MS);
  }, [latest, loading]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-10 flex items-center justify-center bg-zinc-950">
        <p className="text-zinc-500 text-sm animate-pulse">Loading…</p>
      </div>
    );
  }

  const transitionStyle = `opacity ${CROSSFADE_MS}ms ease-in-out`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10, display: "grid" }}>
      {/* Incoming layer (behind) — fades in */}
      <div
        style={{
          gridArea: "1/1",
          opacity: fading ? 1 : 0,
          transition: transitionStyle,
          pointerEvents: "none",
        }}
      >
        <NowPlayingCard data={latest} />
      </div>

      {/* Displayed layer (front) — fades out */}
      <div
        style={{
          gridArea: "1/1",
          opacity: fading ? 0 : 1,
          transition: transitionStyle,
        }}
      >
        <NowPlayingCard data={displayed} />
      </div>
    </div>
  );
}
