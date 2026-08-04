import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/cron/parcours-close
// Auto-clôture des parcours arrivés à terme. À appeler par cron (1×/jour).
// Règle : un parcours ACTIF dont la durée est écoulée
//   (detoxStartDate + (programTotalDays ?? 103) jours < aujourd'hui) passe en COMPLETED.
//   → Même définition que le backfill de l'Étape 1 (cohérence).
// Ne touche JAMAIS client.status / user.blocked → le client garde tout son accès.
// Sécurité : header x-cron-secret (même schéma que /api/cron/reactivation).

const DEFAULT_TOTAL_DAYS = 103;

export async function POST(req: Request) {
  const authHeader = req.headers.get("x-cron-secret");
  if (authHeader !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const now = new Date();

  const active = await prisma.clientParcours.findMany({
    where: { status: "ACTIVE", detoxStartDate: { not: null } },
    select: { id: true, detoxStartDate: true, programTotalDays: true },
  });

  const toClose = active.filter((p) => {
    if (!p.detoxStartDate) return false;
    const total = p.programTotalDays ?? DEFAULT_TOTAL_DAYS;
    const end = new Date(p.detoxStartDate);
    end.setDate(end.getDate() + total);
    return end < now; // fin de durée dépassée
  });

  const closed: string[] = [];
  for (const p of toClose) {
    await prisma.clientParcours.update({
      where: { id: p.id },
      data: { status: "COMPLETED", completedAt: now },
    });
    closed.push(p.id);
  }

  return NextResponse.json({ ok: true, checked: active.length, closed: closed.length });
}
