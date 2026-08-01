import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReactivationEmail } from "@/lib/mailer";

// POST /api/cron/reactivation
// Relance automatique des clients inactifs. À appeler par cron (ex: 1×/jour).
// Règles (validées par Joffrey) :
//   - inactif depuis >= 5 jours (check-ins + journal ; repli sur la date d'inscription
//     si le client n'a JAMAIS été actif, pour ne pas relancer un nouvel inscrit)
//   - ne pas re-relancer avant 7 jours depuis la dernière relance
//   - canal : email seul (« On pense à toi »)
// Sécurité : header x-cron-secret (même schéma que /api/session-reminders).

const DAY = 86400000;
const INACTIVE_DAYS = 5;
const COOLDOWN_DAYS = 7;

export async function POST(req: Request) {
  const authHeader = req.headers.get("x-cron-secret");
  if (authHeader !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const now = Date.now();

  const clients = await prisma.client.findMany({
    where: { status: "ACTIVE", onboardingCompleted: true },
    include: {
      user: { select: { email: true } },
      intake: { select: { firstName: true } },
      dailyCheckins: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
      journalEntries: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
  });

  const sent: string[] = [];
  let checked = 0;

  for (const c of clients) {
    checked++;

    const lastCheckin = c.dailyCheckins[0]?.date ? new Date(c.dailyCheckins[0].date).getTime() : 0;
    const lastJournal = c.journalEntries[0]?.createdAt ? new Date(c.journalEntries[0].createdAt).getTime() : 0;
    const lastActivity = Math.max(lastCheckin, lastJournal);
    // Repli : jamais actif → on compte depuis l'inscription (pas 999j → pas de spam au nouvel inscrit)
    const ref = lastActivity > 0 ? lastActivity : new Date(c.createdAt).getTime();
    const daysSince = Math.floor((now - ref) / DAY);
    if (daysSince < INACTIVE_DAYS) continue;

    // Anti-doublon : pas de relance si une a été envoyée il y a moins de COOLDOWN_DAYS
    const lastReac = (c as { lastReactivationAt: Date | null }).lastReactivationAt;
    if (lastReac) {
      const sinceRelance = (now - new Date(lastReac).getTime()) / DAY;
      if (sinceRelance < COOLDOWN_DAYS) continue;
    }

    if (!c.user?.email) continue;

    try {
      await sendReactivationEmail({
        to: c.user.email,
        firstName: c.intake?.firstName || undefined,
        language: (c.language as "FR" | "EN") || "FR",
      });
      await prisma.client.update({
        where: { id: c.id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { lastReactivationAt: new Date(), reactivationCount: { increment: 1 } } as any,
      });
      sent.push(c.intake?.firstName || c.user.email);
    } catch (e) {
      console.error("Relance échouée pour", c.id, e);
    }
  }

  return NextResponse.json({ ok: true, checked, sent: sent.length, clients: sent });
}
