import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { NOW_PLAYING_KEY } from "@/lib/poller/now-playing";
import type { EnrichedNowPlaying } from "@/lib/enrichment/now-playing";

export async function GET() {
  const raw = await redis.get(NOW_PLAYING_KEY);
  const data: EnrichedNowPlaying | null = raw ? JSON.parse(raw) : null;
  return NextResponse.json(data);
}
