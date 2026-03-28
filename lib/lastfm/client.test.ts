import { describe, it, expect, vi, beforeEach } from "vitest";
import { LastFMClient } from "./client";

const API_KEY = "test-api-key";

function mockFetch(data: unknown) {
  return vi.spyOn(global, "fetch").mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  } as Response);
}

describe("LastFMClient", () => {
  let client: LastFMClient;

  beforeEach(() => {
    client = new LastFMClient(API_KEY);
    vi.restoreAllMocks();
  });

  describe("getAlbumInfo", () => {
    it("returns album metadata", async () => {
      mockFetch({
        album: {
          name: "OK Computer",
          artist: "Radiohead",
          mbid: "mbid-ok-computer",
        },
      });

      const album = await client.getAlbumInfo("Radiohead", "OK Computer");

      expect(album).toEqual({
        name: "OK Computer",
        artist: "Radiohead",
        mbid: "mbid-ok-computer",
      });
    });

    it("returns null when album is not found", async () => {
      mockFetch({ error: 6, message: "Album not found" });

      const album = await client.getAlbumInfo("Unknown", "Unknown Album");

      expect(album).toBeNull();
    });
  });

  describe("getArtistInfo", () => {
    it("returns bio, tags and listener count", async () => {
      mockFetch({
        artist: {
          name: "Radiohead",
          mbid: "mbid-456",
          stats: { listeners: "5000000" },
          bio: { summary: "Radiohead are an English rock band." },
          tags: { tag: [{ name: "alternative rock" }, { name: "art rock" }] },
        },
      });

      const info = await client.getArtistInfo("Radiohead");

      expect(info).toEqual({
        name: "Radiohead",
        mbid: "mbid-456",
        bio: "Radiohead are an English rock band.",
        tags: ["alternative rock", "art rock"],
        listeners: 5000000,
      });
    });

    it("returns null bio when bio summary is missing", async () => {
      mockFetch({
        artist: {
          name: "Radiohead",
          mbid: "",
          stats: { listeners: "5000000" },
          bio: { summary: "" },
          tags: { tag: [] },
        },
      });

      const info = await client.getArtistInfo("Radiohead");

      expect(info?.bio).toBeNull();
    });

    it("returns null when artist is not found", async () => {
      mockFetch({ error: 6, message: "Artist not found" });

      const info = await client.getArtistInfo("no-such-artist");

      expect(info).toBeNull();
    });
  });

  describe("getSimilarArtists", () => {
    it("returns similar artists with match scores", async () => {
      mockFetch({
        similarartists: {
          artist: [
            { name: "Thom Yorke", match: "0.85" },
            { name: "Portishead", match: "0.72" },
          ],
        },
      });

      const similar = await client.getSimilarArtists("Radiohead");

      expect(similar).toEqual([
        { name: "Thom Yorke", match: 0.85 },
        { name: "Portishead", match: 0.72 },
      ]);
    });

    it("returns empty array for unknown artist", async () => {
      mockFetch({ similarartists: { artist: [] } });

      const similar = await client.getSimilarArtists("unknown-artist-xyz");

      expect(similar).toEqual([]);
    });
  });

  describe("getTopTags", () => {
    it("returns tags with counts", async () => {
      mockFetch({
        toptags: {
          tag: [
            { name: "alternative rock", count: "150" },
            { name: "electronic", count: "90" },
          ],
        },
      });

      const tags = await client.getTopTags("testuser");

      expect(tags).toEqual([
        { name: "alternative rock", count: 150 },
        { name: "electronic", count: 90 },
      ]);
    });
  });

  describe("getTopArtists", () => {
    it("returns ranked artists with play counts", async () => {
      mockFetch({
        topartists: {
          artist: [
            { name: "Radiohead", playcount: "1200", "@attr": { rank: "1" } },
            { name: "Portishead", playcount: "800", "@attr": { rank: "2" } },
          ],
        },
      });

      const artists = await client.getTopArtists("testuser", "overall");

      expect(artists).toEqual([
        { name: "Radiohead", playCount: 1200, rank: 1 },
        { name: "Portishead", playCount: 800, rank: 2 },
      ]);
    });

    it("returns empty array when user has no scrobbles", async () => {
      mockFetch({ topartists: { artist: [] } });

      const artists = await client.getTopArtists("testuser", "overall");

      expect(artists).toEqual([]);
    });
  });

  describe("getNowPlaying", () => {
    it("returns null when nothing is playing", async () => {
      mockFetch({
        recenttracks: {
          track: [
            {
              name: "Creep",
              artist: { "#text": "Radiohead" },
              album: { "#text": "Pablo Honey", mbid: "" },
            },
          ],
        },
      });

      const track = await client.getNowPlaying("testuser");

      expect(track).toBeNull();
    });

    it("returns the current track when a song is nowplaying", async () => {
      mockFetch({
        recenttracks: {
          track: [
            {
              "@attr": { nowplaying: "true" },
              name: "Exit Music (For a Film)",
              artist: { "#text": "Radiohead" },
              album: { "#text": "OK Computer", mbid: "abc-123" },
            },
          ],
        },
      });

      const track = await client.getNowPlaying("testuser");

      expect(track).toEqual({
        trackName: "Exit Music (For a Film)",
        artistName: "Radiohead",
        albumName: "OK Computer",
        albumMbid: "abc-123",
      });
    });
  });
});
