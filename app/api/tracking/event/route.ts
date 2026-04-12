import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FUNNEL_ORDER = [
  "landing", "form_start", "form_email", "form_submit",
  "onboarding_1", "onboarding_2", "onboarding_3", "onboarding_4", "onboarding_5",
  "completed",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, step, page, source, medium, campaign, referrer, device, browser, country, language, duration, email, visitorId } = body;

    if (!sessionId || !step) {
      return NextResponse.json({ error: "sessionId and step required" }, { status: 400 });
    }

    // Create funnel event
    await prisma.funnelEvent.create({
      data: {
        sessionId,
        visitorId: visitorId || null,
        email: email || null,
        step,
        page: page || null,
        source: source || null,
        medium: medium || null,
        campaign: campaign || null,
        referrer: referrer || null,
        device: device || null,
        browser: browser || null,
        country: country || null,
        language: language || null,
        duration: duration || null,
      },
    });

    // Upsert VisitorProfile
    const existing = await prisma.visitorProfile.findUnique({
      where: { sessionId },
    });

    if (existing) {
      const currentIdx = FUNNEL_ORDER.indexOf(existing.funnelStep);
      const newIdx = FUNNEL_ORDER.indexOf(step);
      const shouldUpdate = newIdx > currentIdx;

      await prisma.visitorProfile.update({
        where: { sessionId },
        data: {
          lastSeen: new Date(),
          totalVisits: { increment: 1 },
          pagesViewed: page ? { push: page } : undefined,
          ...(shouldUpdate ? { funnelStep: step } : {}),
          ...(source && !existing.source ? { source } : {}),
          ...(medium && !existing.medium ? { medium } : {}),
          ...(campaign && !existing.campaign ? { campaign } : {}),
          ...(referrer && !existing.referrer ? { referrer } : {}),
          ...(email && !existing.email ? { email } : {}),
          ...(step === "completed" ? { completed: true } : {}),
        },
      });
    } else {
      await prisma.visitorProfile.create({
        data: {
          sessionId,
          email: email || null,
          funnelStep: step,
          source: source || null,
          medium: medium || null,
          campaign: campaign || null,
          referrer: referrer || null,
          pagesViewed: page ? [page] : [],
          completed: step === "completed",
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Tracking event error:", error);
    return NextResponse.json({ ok: true }); // Silent fail for tracking
  }
}
