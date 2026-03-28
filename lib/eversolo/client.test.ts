import { describe, it, expect, vi, beforeEach } from "vitest";
import { EversoloClient } from "./client";

function mockFetch(data: unknown, ok = true) {
  return vi.spyOn(global, "fetch").mockResolvedValueOnce({
    ok,
    json: async () => data,
  } as Response);
}

describe("EversoloClient", () => {
  let client: EversoloClient;

  beforeEach(() => {
    client = new EversoloClient("192.168.1.1");
    vi.restoreAllMocks();
  });

  describe("getState", () => {
    it("parses track from playingMusic path", async () => {
      mockFetch({
        state: 3,
        duration: 240000,
        position: 60000,
        playingMusic: {
          title: "Creep",
          artist: "Radiohead",
          album: "Pablo Honey",
          albumArtBig: "http://example.com/art.jpg",
          extension: "flac",
          sampleRate: "44100",
          bits: "16",
          channels: 2,
        },
      });

      const { track, playState } = await client.getState();

      expect(playState).toBe("playing");
      expect(track).toMatchObject({
        title: "Creep",
        artist: "Radiohead",
        album: "Pablo Honey",
        durationMs: 240000,
        positionMs: 60000,
        albumArtUrl: "http://example.com/art.jpg",
        audioFormat: {
          extension: "flac",
          sampleRate: "44100",
          bits: "16",
          channels: 2,
        },
      });
    });

    it("falls back to everSoloPlayInfo when playingMusic is absent", async () => {
      mockFetch({
        state: 3,
        duration: 180000,
        position: 30000,
        everSoloPlayInfo: {
          everSoloPlayAudioInfo: {
            songName: "OK Computer",
            artistName: "Radiohead",
            albumName: "OK Computer",
            albumArt: "http://example.com/art2.jpg",
          },
        },
      });

      const { track, playState } = await client.getState();

      expect(playState).toBe("playing");
      expect(track).toMatchObject({
        title: "OK Computer",
        artist: "Radiohead",
        album: "OK Computer",
        albumArtUrl: "http://example.com/art2.jpg",
        audioFormat: null,
      });
    });

    it("returns null track when neither path has data", async () => {
      mockFetch({ state: 0 });

      const { track, playState } = await client.getState();

      expect(track).toBeNull();
      expect(playState).toBe("idle");
    });

    it("maps state 4 to paused", async () => {
      mockFetch({
        state: 4,
        playingMusic: { title: "Song", artist: "Artist", album: "" },
      });

      const { playState } = await client.getState();
      expect(playState).toBe("paused");
    });

    it("throws on HTTP error", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      } as Response);

      await expect(client.getState()).rejects.toThrow("HTTP 503");
    });
  });

  describe("isArtistInLibrary", () => {
    it("returns true when total > 0", async () => {
      mockFetch({ total: 3 });
      expect(await client.isArtistInLibrary("Radiohead")).toBe(true);
    });

    it("returns false when total is 0", async () => {
      mockFetch({ total: 0 });
      expect(await client.isArtistInLibrary("Unknown Artist")).toBe(false);
    });

    it("returns false on HTTP error", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);
      expect(await client.isArtistInLibrary("Radiohead")).toBe(false);
    });

    it("returns false on network failure", async () => {
      vi.spyOn(global, "fetch").mockRejectedValueOnce(
        new Error("Network error")
      );
      expect(await client.isArtistInLibrary("Radiohead")).toBe(false);
    });
  });

  describe("control", () => {
    it("posts to the correct endpoint", async () => {
      const spy = vi
        .spyOn(global, "fetch")
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as Response);

      await client.control("playOrPause");

      expect(spy).toHaveBeenCalledWith(
        "http://192.168.1.1:9529/ZidooMusicControl/v2/playOrPause",
        { method: "POST" }
      );
    });

    it("throws on HTTP error", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response);

      await expect(client.control("playNext")).rejects.toThrow("HTTP 500");
    });
  });
});
