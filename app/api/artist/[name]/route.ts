import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { clients } from "@/lib/clients";
import { getArtistPageData } from "@/lib/artist/service";

export type { ArtistPageData } from "@/lib/artist/service";

const CACHE_TTL = 6 * 60 * 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const artistName = decodeURIComponent(name);

  const cacheKey = `artist-page:${artistName.toLowerCase()}`;
  const cached = await redis.get(cacheKey);
  if (cached) return NextResponse.json(JSON.parse(cached));

  const data = await getArtistPageData(
    artistName,
    clients,
    process.env.LASTFM_USERNAME ?? ""
  );

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
  return NextResponse.json(data);
}
