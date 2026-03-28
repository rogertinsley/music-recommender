import { clients } from "@/lib/clients";
import { enrichNowPlaying } from "@/lib/enrichment/now-playing";
import { redis } from "@/lib/redis";

export const NOW_PLAYING_KEY = "now-playing";
const POLL_INTERVAL_MS = 3_000;
const CACHE_TTL_SECONDS = 30;

function trackKey(artist: string, title: string): string {
  return `${artist}:::${title}`;
}

// Pipeline: EverSolo → enrichNowPlaying (Last.FM + MusicBrainz + Fanart + CoverArt)
//           → Redis (30s TTL) → SSE stream → browser
//
// Enrichment is cached in memory by track key so it only runs on track change,
// not on every 3s poll. scheduledPoll is exposed so the control API can force
// an immediate poll after a playback command.
let scheduledPoll: (() => Promise<void>) | null = null;
let cachedTrackKey: string | null = null;
let cachedEnrichment: Awaited<ReturnType<typeof enrichNowPlaying>> | null =
  null;

export function triggerImmediatePoll(): void {
  setTimeout(() => scheduledPoll?.(), 300);
}

export function startNowPlayingPoller(): void {
  const {
    lastfm,
    musicBrainzEnrichment: musicBrainz,
    fanartTV,
    coverArt,
    eversolo,
  } = clients;

  const poll = async () => {
    try {
      const { track, playState } = await eversolo.getState();

      if (!track || playState === "idle") {
        cachedTrackKey = null;
        cachedEnrichment = null;
        await redis.del(NOW_PLAYING_KEY);
        return;
      }

      const key = trackKey(track.artist, track.title);

      if (key !== cachedTrackKey || !cachedEnrichment) {
        const nowPlayingTrack = {
          trackName: track.title,
          artistName: track.artist,
          albumName: track.album || null,
          albumMbid: null,
        };
        cachedEnrichment = await enrichNowPlaying(
          nowPlayingTrack,
          lastfm,
          musicBrainz,
          fanartTV,
          coverArt
        );
        cachedTrackKey = key;
      }

      const data = {
        ...cachedEnrichment,
        albumArtUrl: track.albumArtUrl ?? cachedEnrichment.albumArtUrl,
        positionMs: track.positionMs,
        durationMs: track.durationMs,
        playState,
        audioFormat: track.audioFormat,
      };

      await redis.setex(
        NOW_PLAYING_KEY,
        CACHE_TTL_SECONDS,
        JSON.stringify(data)
      );
    } catch (err) {
      console.error("[NowPlayingPoller] poll failed:", err);
    }
  };

  scheduledPoll = poll;
  void poll();
  setInterval(poll, POLL_INTERVAL_MS);
}
