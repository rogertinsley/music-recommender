import { NextResponse } from "next/server";
import { clients } from "@/lib/clients";
import { triggerImmediatePoll } from "@/lib/poller/now-playing";

type Action = "playOrPause" | "playNext" | "playLast";

export async function POST(request: Request) {
  const { action } = (await request.json()) as { action: Action };

  if (!["playOrPause", "playNext", "playLast"].includes(action)) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }

  await clients.eversolo.control(action);
  triggerImmediatePoll();
  return NextResponse.json({ ok: true });
}
