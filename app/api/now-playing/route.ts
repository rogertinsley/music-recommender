import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { NOW_PLAYING_KEY } from "@/lib/poller/now-playing";

export async function GET() {
  const data = await redis.get(NOW_PLAYING_KEY);
  if (!data) return NextResponse.json(null);
  return NextResponse.json(JSON.parse(data));
}
