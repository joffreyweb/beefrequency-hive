import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const url = request.nextUrl;
  const completed = url.searchParams.get("completed");
  const stoppedAt = url.searchParams.get("stoppedAt") || undefined;
  const source = url.searchParams.get("source") || undefined;
  const hasEmail = url.searchParams.get("hasEmail");

  const where: Record<string, unknown> = {};
  if (completed === "true") where.completed = true;
  if (completed === "false") where.completed = false;
  if (stoppedAt) where.funnelStep = stoppedAt;
  if (source) where.source = source;
  if (hasEmail === "true") where.email = { not: null };
  if (hasEmail === "false") where.email = null;

  const visitors = await prisma.visitorProfile.findMany({
    where,
    orderBy: { lastSeen: "desc" },
    take: 200,
  });

  return NextResponse.json({ visitors, total: visitors.length });
}
