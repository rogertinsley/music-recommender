import { NextResponse } from "next/server";
import { clients } from "@/lib/clients";
import { triggerImmediatePoll } from "@/lib/poller/now-playing";

const CONTROL_ACTIONS = ["playOrPause", "playNext", "playLast"] as const;
type Action = (typeof CONTROL_ACTIONS)[number];

export async function POST(request: Request) {
  const { action } = (await request.json()) as { action: Action };

  if (!(CONTROL_ACTIONS as readonly string[]).includes(action)) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }

  await clients.eversolo.control(action);
  triggerImmediatePoll();
  return NextResponse.json({ ok: true });
}
