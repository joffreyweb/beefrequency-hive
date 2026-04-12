import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

type AlertLevel = "yellow" | "orange" | "red";

function getAlertLevel(days: number): AlertLevel {
  if (days >= 7) return "red";
  if (days >= 5) return "orange";
  return "yellow";
}

export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const clients = await prisma.client.findMany({
    where: { status: "ACTIVE", onboardingCompleted: true },
    include: {
      user: { select: { name: true, email: true } },
      intake: { select: { firstName: true } },
      dailyCheckins: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true },
      },
      journalEntries: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  const now = Date.now();

  const inactive = clients
    .map((c) => {
      const lastCheckin = c.dailyCheckins[0]?.date
        ? new Date(c.dailyCheckins[0].date).getTime()
        : 0;
      const lastJournal = c.journalEntries[0]?.createdAt
        ? new Date(c.journalEntries[0].createdAt).getTime()
        : 0;
      const lastActivity = Math.max(lastCheckin, lastJournal);
      const daysSince = lastActivity > 0
        ? Math.floor((now - lastActivity) / 86400000)
        : 999;

      return {
        clientId: c.id,
        name: c.intake?.firstName || c.user.name || "Client",
        email: c.user.email,
        daysSinceActivity: daysSince,
        lastActivityDate: lastActivity > 0 ? new Date(lastActivity).toISOString() : null,
        alertLevel: getAlertLevel(daysSince) as AlertLevel,
      };
    })
    .filter((c) => c.daysSinceActivity >= 3)
    .sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);

  return NextResponse.json({ clients: inactive });
}
