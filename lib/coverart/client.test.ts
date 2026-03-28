import { describe, it, expect, vi, beforeEach } from "vitest";
import { CoverArtArchiveClient } from "./client";

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

describe("CoverArtArchiveClient", () => {
  let client: CoverArtArchiveClient;

  beforeEach(() => {
    client = new CoverArtArchiveClient();
    vi.restoreAllMocks();
  });

  it("returns null when release has no cover art", async () => {
    mockFetchStatus(404);

    const url = await client.getAlbumArt("unknown-mbid");

    expect(url).toBeNull();
  });

  it("returns null when no image is marked as front cover", async () => {
    mockFetch({
      images: [
        {
          front: false,
          image: "https://coverartarchive.org/release/abc/back.jpg",
        },
      ],
    });

    const url = await client.getAlbumArt("mbid-abc");

    expect(url).toBeNull();
  });

  it("returns the front cover URL when available", async () => {
    mockFetch({
      images: [
        {
          front: true,
          image: "https://coverartarchive.org/release/abc/front.jpg",
        },
        {
          front: false,
          image: "https://coverartarchive.org/release/abc/back.jpg",
        },
      ],
    });

    const url = await client.getAlbumArt("mbid-abc");

    expect(url).toBe("https://coverartarchive.org/release/abc/front.jpg");
  });
});
