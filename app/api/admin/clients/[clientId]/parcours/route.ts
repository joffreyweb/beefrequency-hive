import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { getActiveParcours } from "@/lib/parcours-instance";

// POST /api/admin/clients/[clientId]/parcours
// Cycle de vie d'un parcours — refonte Parcours (Étape 2B-β).
//   { action: "close" }   → passe le parcours ACTIF en TERMINÉ (jamais client.status).
//   { action: "restart" } → clôture l'actif s'il y en a un, puis crée un NOUVEAU parcours
//                           actif « à blanc ». L'ancien reste intact dans l'historique.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;

  let body: { action?: string; parcoursType?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, parcoursType: true },
  });
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const active = await getActiveParcours(clientId);

  // ── CLÔTURER ─────────────────────────────────────────────────────────
  if (body.action === "close") {
    if (!active) {
      return NextResponse.json({ error: "Aucun parcours actif à clôturer" }, { status: 400 });
    }
    await prisma.clientParcours.update({
      where: { id: active.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    // On NE touche PAS client.status ni user.blocked → le client garde tout son accès.
    return NextResponse.json({ ok: true, closedParcoursId: active.id });
  }

  // ── DÉMARRER UN NOUVEAU PARCOURS ─────────────────────────────────────
  if (body.action === "restart") {
    const newType = (body.parcoursType as never) ?? client.parcoursType;

    const result = await prisma.$transaction(async (tx) => {
      // 1) Clôturer l'actif éventuel (jamais de suppression → historique préservé).
      if (active) {
        await tx.clientParcours.update({
          where: { id: active.id },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
      }
      // 2) Numéro d'ordre du nouveau parcours.
      const count = await tx.clientParcours.count({ where: { clientId } });
      // 3) Créer le nouveau parcours ACTIF « à blanc » (date posée ensuite par l'admin).
      const created = await tx.clientParcours.create({
        data: {
          clientId,
          parcoursType: newType,
          detoxStartDate: null,
          programTotalDays: null,
          status: "ACTIVE",
          seq: count + 1,
          startedAt: new Date(),
        },
      });
      // 4) Remettre les scalaires Client au miroir du nouveau parcours (repart à zéro).
      //    L'ancien parcours (ses phases/check-ins) reste rattaché à SON instance.
      await tx.client.update({
        where: { id: clientId },
        data: {
          parcoursType: newType,
          detoxStartDate: null,
          programTotalDays: null,
          colisEnvoye: false,
          colisEnvoyeAt: null,
          produitsRecus: false,
          produitsRecusAt: null,
        },
      });
      return created;
    });

    return NextResponse.json({ ok: true, newParcoursId: result.id });
  }

  return NextResponse.json(
    { error: "action invalide (attendu : close | restart)" },
    { status: 400 },
  );
}
