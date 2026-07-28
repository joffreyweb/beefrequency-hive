import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/cron/kdrive-archive — cron quotidien.
// Ré-exporte les FLUX (messages, journal, check-ins, cartes) de chaque client ACTIF
// vers son dossier kDrive. Les pièces « sign-once » (documents, notes, charte, RGPD,
// questionnaire, Clarity) sont déjà archivées à l'événement — inutile de les rejouer ici.
// Auth : header x-cron-secret (même pattern que les autres crons). Route dans publicPaths.
export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const clients = await prisma.client.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  const { archiveFluxForClient } = await import("@/lib/kdrive-archive");

  let archived = 0;
  for (const c of clients) {
    try {
      await archiveFluxForClient(c.id);
      archived++;
    } catch (e) {
      console.error("[cron kdrive] client", c.id, e);
    }
  }

  return NextResponse.json({ ok: true, clients: clients.length, archived });
}
