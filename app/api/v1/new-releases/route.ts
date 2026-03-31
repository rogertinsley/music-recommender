import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const releases = await prisma.newRelease.findMany({
    orderBy: [{ releaseDate: "desc" }, { playCount: "desc" }],
  });
  return NextResponse.json({
    releases,
    lastRunAt: releases[0]?.createdAt ?? null,
  });
}
