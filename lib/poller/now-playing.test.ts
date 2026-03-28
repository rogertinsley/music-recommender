import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/clients", () => ({
  clients: {
    lastfm: { getNowPlaying: vi.fn(), getArtistInfo: vi.fn() },
    musicBrainz: { searchArtist: vi.fn(), searchRelease: vi.fn() },
    fanartTV: { getArtistImages: vi.fn() },
    coverArt: { getAlbumArt: vi.fn(), getAlbumArtByReleaseGroup: vi.fn() },
  },
}));

vi.mock("@/lib/redis", () => ({
  redis: { setex: vi.fn(), del: vi.fn() },
}));

import { clients } from "@/lib/clients";
import { redis } from "@/lib/redis";
import { startNowPlayingPoller, NOW_PLAYING_KEY } from "./now-playing";

const lastfm = clients.lastfm as Record<string, ReturnType<typeof vi.fn>>;
const musicBrainz = clients.musicBrainz as Record<
  string,
  ReturnType<typeof vi.fn>
>;
const fanartTV = clients.fanartTV as Record<string, ReturnType<typeof vi.fn>>;
const coverArt = clients.coverArt as Record<string, ReturnType<typeof vi.fn>>;
const redisMock = redis as Record<string, ReturnType<typeof vi.fn>>;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.LASTFM_USERNAME = "testuser";
});

describe("startNowPlayingPoller", () => {
  it("deletes the Redis key when nothing is playing", async () => {
    lastfm.getNowPlaying.mockResolvedValue(null);

    startNowPlayingPoller();
    await vi.waitFor(() => expect(redisMock.del).toHaveBeenCalled());

    expect(redisMock.del).toHaveBeenCalledWith(NOW_PLAYING_KEY);
    expect(redisMock.setex).not.toHaveBeenCalled();
  });

  it("stores enriched track in Redis when a song is playing", async () => {
    lastfm.getNowPlaying.mockResolvedValue({
      trackName: "Creep",
      artistName: "Radiohead",
      albumName: "Pablo Honey",
      albumMbid: null,
    });
    lastfm.getArtistInfo.mockResolvedValue({
      bio: "Radiohead are a band.",
      tags: [],
      listeners: 0,
    });
    musicBrainz.searchArtist.mockResolvedValue("mbid-rh");
    musicBrainz.searchRelease.mockResolvedValue(null);
    fanartTV.getArtistImages.mockResolvedValue(null);
    coverArt.getAlbumArt.mockResolvedValue(null);
    coverArt.getAlbumArtByReleaseGroup.mockResolvedValue(null);

    startNowPlayingPoller();
    await vi.waitFor(() => expect(redisMock.setex).toHaveBeenCalled());

    const [key, ttl, json] = redisMock.setex.mock.calls[0];
    const stored = JSON.parse(json);
    expect(key).toBe(NOW_PLAYING_KEY);
    expect(ttl).toBe(60);
    expect(stored.trackName).toBe("Creep");
    expect(stored.artistName).toBe("Radiohead");
  });
});
