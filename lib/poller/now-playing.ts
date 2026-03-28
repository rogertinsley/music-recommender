import { LastFMClient } from "@/lib/lastfm/client";
import { redis } from "@/lib/redis";

export const NOW_PLAYING_KEY = "now-playing";
const POLL_INTERVAL_MS = 30_000;
const CACHE_TTL_SECONDS = 60;

export function startNowPlayingPoller(): void {
  const client = new LastFMClient(process.env.LASTFM_API_KEY ?? "");
  const username = process.env.LASTFM_USERNAME ?? "";

  const poll = async () => {
    try {
      const track = await client.getNowPlaying(username);
      if (track) {
        await redis.setex(
          NOW_PLAYING_KEY,
          CACHE_TTL_SECONDS,
          JSON.stringify(track)
        );
      } else {
        await redis.del(NOW_PLAYING_KEY);
      }
    } catch (err) {
      console.error("[NowPlayingPoller] poll failed:", err);
    }
  };

  void poll();
  setInterval(poll, POLL_INTERVAL_MS);
}
