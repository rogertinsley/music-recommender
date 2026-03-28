import { describe, it, expect, vi, beforeEach } from "vitest";
import { FanartTVClient } from "./client";

const API_KEY = "test-api-key";

function mockFetch(data: unknown, ok = true) {
  return vi.spyOn(global, "fetch").mockResolvedValueOnce({
    ok,
    json: async () => data,
  } as Response);
}

function mockFetchStatus(status: number) {
  return vi.spyOn(global, "fetch").mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({}),
  } as Response);
}

describe("FanartTVClient", () => {
  let client: FanartTVClient;

  beforeEach(() => {
    client = new FanartTVClient(API_KEY);
    vi.restoreAllMocks();
  });

  it("returns null when artist has no Fanart.tv entry", async () => {
    mockFetchStatus(404);

    const images = await client.getArtistImages("unknown-mbid");

    expect(images).toBeNull();
  });

  it("returns null for individual image types that are missing", async () => {
    mockFetch({
      artistbackground: [{ url: "https://fanart.tv/bg.jpg" }],
    });

    const images = await client.getArtistImages("mbid-123");

    expect(images).toEqual({
      background: "https://fanart.tv/bg.jpg",
      thumbnail: null,
      logo: null,
    });
  });

  it("returns background, thumbnail and logo URLs when all are present", async () => {
    mockFetch({
      artistbackground: [{ url: "https://fanart.tv/bg.jpg" }],
      artistthumb: [{ url: "https://fanart.tv/thumb.jpg" }],
      musiclogo: [{ url: "https://fanart.tv/logo.png" }],
    });

    const images = await client.getArtistImages("mbid-123");

    expect(images).toEqual({
      background: "https://fanart.tv/bg.jpg",
      thumbnail: "https://fanart.tv/thumb.jpg",
      logo: "https://fanart.tv/logo.png",
    });
  });
});
