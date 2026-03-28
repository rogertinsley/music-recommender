"use client";

import { useEffect, useState } from "react";
import type { NowPlayingTrack } from "@/lib/lastfm/types";

const POLL_INTERVAL_MS = 30_000;

export function NowPlayingView() {
  const [track, setTrack] = useState<NowPlayingTrack | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrack = async () => {
      try {
        const res = await fetch("/api/now-playing");
        const data: NowPlayingTrack | null = await res.json();
        setTrack(data);
      } catch {
        // keep previous state on error
      } finally {
        setLoading(false);
      }
    };

    void fetchTrack();
    const interval = setInterval(fetchTrack, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500 text-sm animate-pulse">Loading…</p>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
          <span className="text-2xl">♪</span>
        </div>
        <p className="text-zinc-500 text-sm">Nothing playing</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 px-6 text-center">
      <div className="w-48 h-48 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
        <span className="text-6xl">♪</span>
      </div>
      <div className="flex flex-col gap-1 max-w-lg">
        <h1 className="text-2xl font-bold text-white leading-tight">
          {track.trackName}
        </h1>
        <p className="text-lg text-zinc-300">{track.artistName}</p>
        {track.albumName && (
          <p className="text-sm text-zinc-500 mt-1">{track.albumName}</p>
        )}
      </div>
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Now Playing
      </span>
    </div>
  );
}
