import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const recommendations = await prisma.recommendation.findMany({
    orderBy: { score: "desc" },
    take: 50,
  });
  return NextResponse.json({
    recommendations,
    lastRunAt: recommendations[0]?.createdAt ?? null,
  });
}
