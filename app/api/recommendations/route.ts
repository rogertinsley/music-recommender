import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const recommendations = await prisma.recommendation.findMany({
    orderBy: { score: "desc" },
    take: 50,
  });

  const lastRunAt = recommendations[0]?.createdAt ?? null;

  return NextResponse.json({ recommendations, lastRunAt });
}
