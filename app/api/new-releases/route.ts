import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const releases = await prisma.newRelease.findMany({
    orderBy: [{ releaseDate: "desc" }, { playCount: "desc" }],
  });

  const lastRunAt = releases[0]?.createdAt ?? null;

  return NextResponse.json({ releases, lastRunAt });
}
