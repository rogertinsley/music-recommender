import { NextResponse } from "next/server";
import { clients } from "@/lib/clients";
import { getArtistImages } from "@/lib/artist-image/service";
import { withCache } from "@/lib/utils/cache";

const CACHE_TTL = 14 * 24 * 60 * 60; // 2 weeks

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  if (!name) return NextResponse.json(null);

  const cacheKey = `artist-image:${name.toLowerCase()}`;

  let images: Awaited<ReturnType<typeof getArtistImages>>;
  try {
    images = await withCache(cacheKey, CACHE_TTL, () =>
      getArtistImages(name, clients)
    );
  } catch {
    // MusicBrainz error — don't cache, retry next request
    return NextResponse.json(null);
  }

  return NextResponse.json(images);
}
