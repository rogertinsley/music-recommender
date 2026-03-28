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
        userPlayCount: undefined,
      });
    });

    it("returns userPlayCount when username is provided", async () => {
      mockFetch({
        artist: {
          name: "Radiohead",
          mbid: "mbid-456",
          stats: { listeners: "5000000", userplaycount: "342" },
          bio: { summary: "Radiohead are an English rock band." },
          tags: { tag: [] },
        },
      });

      const info = await client.getArtistInfo("Radiohead", "testuser");

      expect(info?.userPlayCount).toBe(342);
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

  describe("getTopTracks", () => {
    it("returns top tracks with play counts and ranks", async () => {
      mockFetch({
        toptracks: {
          track: [
            { name: "Creep", playcount: "5000", "@attr": { rank: "1" } },
            {
              name: "Karma Police",
              playcount: "4200",
              "@attr": { rank: "2" },
            },
          ],
        },
      });

      const tracks = await client.getTopTracks("Radiohead");

      expect(tracks).toEqual([
        { name: "Creep", playCount: 5000, rank: 1 },
        { name: "Karma Police", playCount: 4200, rank: 2 },
      ]);
    });

    it("returns empty array when artist has no tracks", async () => {
      mockFetch({ toptracks: { track: [] } });

      const tracks = await client.getTopTracks("Unknown Artist");

      expect(tracks).toEqual([]);
    });
  });

  describe("getTopAlbums", () => {
    it("returns top albums with mbid and ranks", async () => {
      mockFetch({
        topalbums: {
          album: [
            {
              name: "OK Computer",
              mbid: "mbid-ok",
              "@attr": { rank: "1" },
            },
            {
              name: "Kid A",
              mbid: "",
              "@attr": { rank: "2" },
            },
          ],
        },
      });

      const albums = await client.getTopAlbums("Radiohead");

      expect(albums).toEqual([
        { name: "OK Computer", mbid: "mbid-ok", rank: 1 },
        { name: "Kid A", mbid: null, rank: 2 },
      ]);
    });

    it("returns empty array when artist has no albums", async () => {
      mockFetch({ topalbums: { album: [] } });

      const albums = await client.getTopAlbums("Unknown Artist");

      expect(albums).toEqual([]);
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

  describe("getRecentTracks", () => {
    it("returns scrobbled tracks with date and album art", async () => {
      mockFetch({
        recenttracks: {
          track: [
            {
              name: "Creep",
              artist: { "#text": "Radiohead" },
              album: { "#text": "Pablo Honey" },
              image: [
                { "#text": "small.jpg", size: "small" },
                { "#text": "large.jpg", size: "extralarge" },
              ],
              date: { uts: "1711620000" },
            },
            {
              name: "Karma Police",
              artist: { "#text": "Radiohead" },
              album: { "#text": "OK Computer" },
              image: [{ "#text": "", size: "extralarge" }],
              date: { uts: "1711616400" },
            },
          ],
        },
      });

      const tracks = await client.getRecentTracks("testuser", 2);

      expect(tracks).toEqual([
        {
          trackName: "Creep",
          artistName: "Radiohead",
          albumName: "Pablo Honey",
          albumArtUrl: "large.jpg",
          scrobbledAt: new Date(1711620000 * 1000),
        },
        {
          trackName: "Karma Police",
          artistName: "Radiohead",
          albumName: "OK Computer",
          albumArtUrl: null,
          scrobbledAt: new Date(1711616400 * 1000),
        },
      ]);
    });

    it("skips the now-playing track (no date)", async () => {
      mockFetch({
        recenttracks: {
          track: [
            {
              "@attr": { nowplaying: "true" },
              name: "Exit Music",
              artist: { "#text": "Radiohead" },
              album: { "#text": "OK Computer" },
              image: [],
            },
            {
              name: "Creep",
              artist: { "#text": "Radiohead" },
              album: { "#text": "Pablo Honey" },
              image: [],
              date: { uts: "1711620000" },
            },
          ],
        },
      });

      const tracks = await client.getRecentTracks("testuser", 10);

      expect(tracks).toHaveLength(1);
      expect(tracks[0].trackName).toBe("Creep");
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
