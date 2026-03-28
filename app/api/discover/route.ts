import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clients } from "@/lib/clients";
import { redis } from "@/lib/redis";

const LASTFM_PLACEHOLDER = "2a96cbd8b46e442fc41c2b86b821562f";
const IMAGE_CACHE_TTL = 24 * 60 * 60;

async function getArtistThumbnail(name: string): Promise<string | null> {
  const cacheKey = `artist-image:${name.toLowerCase()}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    const parsed = JSON.parse(cached) as { thumbnail?: string | null } | null;
    return parsed?.thumbnail ?? null;
  }

  // Not cached — fetch from MusicBrainz + Fanart (rate-limited)
  let mbid: string | null;
  try {
    mbid = await clients.musicBrainz.searchArtist(name);
  } catch {
    // MusicBrainz error (e.g. rate limit) — don't cache, try again next time
    return null;
  }
  if (!mbid) {
    // Artist genuinely not found — cache null so we don't keep looking
    await redis.setex(cacheKey, IMAGE_CACHE_TTL, JSON.stringify(null));
    return null;
  }
  const images = await clients.fanartTV.getArtistImages(mbid).catch(() => null);
  await redis.setex(cacheKey, IMAGE_CACHE_TTL, JSON.stringify(images));
  return images?.thumbnail ?? null;
}

export async function GET() {
  const [releases, recommendations, recentTracks] = await Promise.allSettled([
    prisma.newRelease.findMany({
      orderBy: [{ releaseDate: "desc" }, { playCount: "desc" }],
      take: 20,
    }),
    prisma.recommendation.findMany({
      orderBy: { score: "desc" },
      take: 12,
    }),
    clients.lastfm.getRecentTracks(process.env.LASTFM_USERNAME ?? "", 15),
  ]);

  const releasesData = releases.status === "fulfilled" ? releases.value : [];
  const rawRecommendations =
    recommendations.status === "fulfilled" ? recommendations.value : [];
  const recentTracksData =
    recentTracks.status === "fulfilled"
      ? recentTracks.value.map((t) => ({
          ...t,
          albumArtUrl: t.albumArtUrl?.includes(LASTFM_PLACEHOLDER)
            ? null
            : t.albumArtUrl,
          scrobbledAt: t.scrobbledAt?.toISOString() ?? null,
        }))
      : [];

  // Fetch artist thumbnails one at a time (MusicBrainz rate-limited to 1 req/s).
  // Redis-cached artists return instantly; uncached ones wait their turn in the queue.
  const recommendationsData: Array<
    (typeof rawRecommendations)[0] & { thumbnail: string | null }
  > = [];
  for (const rec of rawRecommendations) {
    recommendationsData.push({
      ...rec,
      thumbnail: await getArtistThumbnail(rec.artistName),
    });
  }

  return NextResponse.json({
    releases: releasesData,
    recommendations: recommendationsData,
    recentTracks: recentTracksData,
  });
}
