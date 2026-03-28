import { NextRequest, NextResponse } from "next/server";
import { clients } from "@/lib/clients";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const artist = searchParams.get("artist");
  const title = searchParams.get("title");
  const album = searchParams.get("album") ?? undefined;
  const durationParam = searchParams.get("duration");
  const duration = durationParam ? parseFloat(durationParam) : undefined;

  if (!artist || !title) {
    return NextResponse.json(
      { error: "artist and title required" },
      { status: 400 }
    );
  }

  const lyrics = await clients.lrclib.getLyrics(artist, title, album, duration);
  return NextResponse.json(lyrics);
}
