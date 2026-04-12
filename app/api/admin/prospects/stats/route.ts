import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const prospects = await prisma.prospect.findMany({
    select: { status: true, temperature: true, source: true, score: true },
  });

  const byStatus: Record<string, number> = {};
  const byTemperature: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  let totalScore = 0;

  for (const p of prospects) {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    byTemperature[p.temperature] = (byTemperature[p.temperature] || 0) + 1;
    bySource[p.source] = (bySource[p.source] || 0) + 1;
    totalScore += p.score;
  }

  return NextResponse.json({
    total: prospects.length,
    averageScore: prospects.length > 0 ? Math.round(totalScore / prospects.length) : 0,
    byStatus,
    byTemperature,
    bySource,
  });
}
