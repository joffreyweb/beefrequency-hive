import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

const FUNNEL_STEPS = [
  "landing", "form_start", "form_email", "form_submit",
  "onboarding_1", "onboarding_2", "onboarding_3", "onboarding_4", "onboarding_5",
  "completed",
];

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const url = request.nextUrl;
  const source = url.searchParams.get("source") || undefined;
  const campaign = url.searchParams.get("campaign") || undefined;
  const daysBack = parseInt(url.searchParams.get("days") || "30");

  const since = new Date(Date.now() - daysBack * 86400000);

  const where: Record<string, unknown> = { createdAt: { gte: since } };
  if (source) where.source = source;
  if (campaign) where.campaign = campaign;

  // Count unique sessions per step
  const events = await prisma.funnelEvent.findMany({
    where,
    select: { step: true, sessionId: true },
  });

  // Deduplicate: count unique sessions per step
  const stepSessions: Record<string, Set<string>> = {};
  for (const step of FUNNEL_STEPS) {
    stepSessions[step] = new Set();
  }
  for (const e of events) {
    if (stepSessions[e.step]) {
      stepSessions[e.step].add(e.sessionId);
    }
  }

  const steps = FUNNEL_STEPS.map((step, i) => {
    const count = stepSessions[step].size;
    const prevCount = i > 0 ? stepSessions[FUNNEL_STEPS[i - 1]].size : count;
    const conversionRate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
    const dropoffRate = prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : 0;

    return { step, count, conversionRate, dropoffRate };
  });

  // Overall conversion
  const totalLanding = stepSessions["landing"].size;
  const totalCompleted = stepSessions["completed"].size;
  const overallRate = totalLanding > 0 ? Math.round((totalCompleted / totalLanding) * 100) : 0;

  // Top drop-off step
  let maxDropoff = { step: "", rate: 0 };
  for (const s of steps) {
    if (s.dropoffRate > maxDropoff.rate && s.step !== "landing") {
      maxDropoff = { step: s.step, rate: s.dropoffRate };
    }
  }

  return NextResponse.json({
    steps,
    summary: { totalLanding, totalCompleted, overallRate, topDropoff: maxDropoff },
    period: { days: daysBack, since: since.toISOString() },
  });
}
