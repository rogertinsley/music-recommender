import { describe, it, expect } from "vitest";
import { recommend } from "./engine";

describe("recommend", () => {
  it("higher play count source artist produces a higher score", () => {
    const results = recommend({
      topArtists: [
        { name: "Radiohead", playCount: 1000, tags: [] },
        { name: "Blur", playCount: 100, tags: [] },
      ],
      similarArtistsMap: {
        Radiohead: [{ name: "Portishead", match: 0.8 }],
        Blur: [{ name: "Pulp", match: 0.8 }],
      },
      userTopTags: [],
    });

    const portishead = results.find((r) => r.artistName === "Portishead")!;
    const pulp = results.find((r) => r.artistName === "Pulp")!;
    expect(portishead.score).toBeGreaterThan(pulp.score);
  });

  it("adds a tag bonus and populates matchingTags when source artist shares user tags", () => {
    const results = recommend({
      topArtists: [
        {
          name: "Radiohead",
          playCount: 1000,
          tags: ["alternative rock", "art rock"],
        },
        { name: "Blur", playCount: 1000, tags: [] },
      ],
      similarArtistsMap: {
        Radiohead: [{ name: "Portishead", match: 0.5 }],
        Blur: [{ name: "Pulp", match: 0.5 }],
      },
      userTopTags: ["alternative rock", "post-rock"],
    });

    const portishead = results.find((r) => r.artistName === "Portishead")!;
    const pulp = results.find((r) => r.artistName === "Pulp")!;

    expect(portishead.score).toBeGreaterThan(pulp.score);
    expect(portishead.matchingTags).toEqual(["alternative rock"]);
    expect(pulp.matchingTags).toEqual([]);
  });

  it("excludes artists in topArtists above the default threshold", () => {
    const results = recommend({
      topArtists: [{ name: "Radiohead", playCount: 1000, tags: [] }],
      similarArtistsMap: {
        Radiohead: [
          { name: "Radiohead", match: 1.0 },
          { name: "Portishead", match: 0.8 },
        ],
      },
      userTopTags: [],
    });

    expect(results.map((r) => r.artistName)).not.toContain("Radiohead");
    expect(results.map((r) => r.artistName)).toContain("Portishead");
  });

  it("includes a known artist when their play count is below excludeThreshold", () => {
    const results = recommend({
      topArtists: [
        { name: "Radiohead", playCount: 1000, tags: [] },
        { name: "Portishead", playCount: 5, tags: [] },
      ],
      similarArtistsMap: {
        Radiohead: [{ name: "Portishead", match: 0.9 }],
        Portishead: [],
      },
      userTopTags: [],
      excludeThreshold: 10,
    });

    expect(results.map((r) => r.artistName)).toContain("Portishead");
  });

  it("deduplicates — same artist from two sources keeps the higher score", () => {
    const results = recommend({
      topArtists: [
        { name: "Radiohead", playCount: 1000, tags: [] },
        { name: "Blur", playCount: 200, tags: [] },
      ],
      similarArtistsMap: {
        Radiohead: [{ name: "Portishead", match: 0.9 }],
        Blur: [{ name: "Portishead", match: 0.9 }],
      },
      userTopTags: [],
    });

    const portisheadEntries = results.filter(
      (r) => r.artistName === "Portishead"
    );
    expect(portisheadEntries).toHaveLength(1);
    expect(portisheadEntries[0].sourceArtist).toBe("Radiohead");
  });

  it("returns empty array when topArtists is empty", () => {
    const results = recommend({
      topArtists: [],
      similarArtistsMap: {},
      userTopTags: [],
    });

    expect(results).toEqual([]);
  });

  it("returns empty array when all candidates are already known", () => {
    const results = recommend({
      topArtists: [
        { name: "Radiohead", playCount: 1000, tags: [] },
        { name: "Portishead", playCount: 800, tags: [] },
      ],
      similarArtistsMap: {
        Radiohead: [{ name: "Portishead", match: 0.9 }],
        Portishead: [{ name: "Radiohead", match: 0.8 }],
      },
      userTopTags: [],
    });

    expect(results).toEqual([]);
  });

  it("ranks results by descending score", () => {
    const results = recommend({
      topArtists: [{ name: "Radiohead", playCount: 1000, tags: [] }],
      similarArtistsMap: {
        Radiohead: [
          { name: "Portishead", match: 0.9 },
          { name: "Massive Attack", match: 0.5 },
        ],
      },
      userTopTags: [],
    });

    expect(results.map((r) => r.artistName)).toEqual([
      "Portishead",
      "Massive Attack",
    ]);
  });
});
