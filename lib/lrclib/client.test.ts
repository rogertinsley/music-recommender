import { describe, it, expect, vi, beforeEach } from "vitest";
import { LRCLIBClient } from "./client";

function mockFetch(status: number, data?: unknown) {
  return vi.spyOn(global, "fetch").mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as Response);
}

describe("LRCLIBClient", () => {
  let client: LRCLIBClient;

  beforeEach(() => {
    client = new LRCLIBClient();
    vi.restoreAllMocks();
  });

  describe("getLyrics", () => {
    it("returns synced lyrics parsed from LRC format", async () => {
      mockFetch(200, {
        syncedLyrics:
          "[00:12.34] First line\n[00:15.67] Second line\n[02:30.00] Chorus",
        plainLyrics: "First line\nSecond line\nChorus",
        instrumental: false,
      });

      const result = await client.getLyrics("Radiohead", "Creep");

      expect(result?.synced).toEqual([
        { timeMs: 12340, text: "First line" },
        { timeMs: 15670, text: "Second line" },
        { timeMs: 150000, text: "Chorus" },
      ]);
      expect(result?.plain).toBe("First line\nSecond line\nChorus");
    });

    it("returns null synced when track has no synced lyrics", async () => {
      mockFetch(200, {
        syncedLyrics: null,
        plainLyrics: "Some plain text",
        instrumental: false,
      });

      const result = await client.getLyrics("Artist", "Track");

      expect(result?.synced).toBeNull();
      expect(result?.plain).toBe("Some plain text");
    });

    it("returns null when track is not found", async () => {
      mockFetch(404);

      const result = await client.getLyrics("Unknown", "Unknown");

      expect(result).toBeNull();
    });

    it("returns null for instrumental tracks", async () => {
      mockFetch(200, {
        syncedLyrics: null,
        plainLyrics: null,
        instrumental: true,
      });

      const result = await client.getLyrics("Artist", "Instrumental");

      expect(result).toBeNull();
    });

    it("includes album and duration in request when provided", async () => {
      const spy = mockFetch(200, {
        syncedLyrics: "[00:01.00] line",
        plainLyrics: "line",
        instrumental: false,
      });

      await client.getLyrics("Radiohead", "Creep", "Pablo Honey", 238);

      const url = new URL(spy.mock.calls[0][0] as string);
      expect(url.searchParams.get("album_name")).toBe("Pablo Honey");
      expect(url.searchParams.get("duration")).toBe("238");
    });
  });
});
