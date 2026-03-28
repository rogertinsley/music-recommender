import { NextResponse } from "next/server";
import { clients } from "@/lib/clients";
import { getArtistPageData } from "@/lib/artist/service";
import { withCache } from "@/lib/utils/cache";

export type { ArtistPageData } from "@/lib/artist/service";

const CACHE_TTL = 6 * 60 * 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const artistName = decodeURIComponent(name);
  const cacheKey = `artist-page:${artistName.toLowerCase()}`;

  const data = await withCache(cacheKey, CACHE_TTL, () =>
    getArtistPageData(artistName, clients, process.env.LASTFM_USERNAME ?? "")
  );

  return NextResponse.json(data);
}
