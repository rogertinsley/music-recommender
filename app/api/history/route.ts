import { NextResponse } from "next/server";
import { clients } from "@/lib/clients";

const LASTFM_PLACEHOLDER = "2a96cbd8b46e442fc41c2b86b821562f";

export async function GET() {
  try {
    const tracks = await clients.lastfm.getRecentTracks(
      process.env.LASTFM_USERNAME ?? "",
      50
    );
    return NextResponse.json(
      tracks.map((t) => ({
        ...t,
        albumArtUrl: t.albumArtUrl?.includes(LASTFM_PLACEHOLDER)
          ? null
          : t.albumArtUrl,
        scrobbledAt: t.scrobbledAt?.toISOString() ?? null,
      }))
    );
  } catch {
    return NextResponse.json([]);
  }
}
