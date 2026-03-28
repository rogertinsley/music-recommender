import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { MusicBrainzClient } from "@/lib/musicbrainz/client";
import { FanartTVClient } from "@/lib/fanart/client";

const CACHE_TTL = 24 * 60 * 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  if (!name) return NextResponse.json(null);

  const cacheKey = `artist-image:${name.toLowerCase()}`;
  const cached = await redis.get(cacheKey);
  if (cached) return NextResponse.json(JSON.parse(cached));

  const musicBrainz = new MusicBrainzClient();
  const fanartTV = new FanartTVClient(process.env.FANART_TV_API_KEY ?? "");

  const mbid = await musicBrainz.searchArtist(name).catch(() => null);
  if (!mbid) {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(null));
    return NextResponse.json(null);
  }

  const images = await fanartTV.getArtistImages(mbid).catch(() => null);
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(images));
  return NextResponse.json(images);
}
