import { NextResponse } from "next/server";
import { clients } from "@/lib/clients";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get("artist");
  if (!artist) return NextResponse.json({ inLibrary: false });

  const inLibrary = await clients.eversolo.isArtistInLibrary(artist);
  return NextResponse.json({ inLibrary });
}
