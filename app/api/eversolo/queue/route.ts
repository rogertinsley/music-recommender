import { NextResponse } from "next/server";
import { clients } from "@/lib/clients";

export async function GET() {
  const queue = await clients.eversolo.getPlayQueue();
  return NextResponse.json(queue);
}
