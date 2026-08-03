import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { ensureClientPhases } from "@/lib/parcours-phases";
import { syncActiveParcours } from "@/lib/parcours-instance";

// PATCH /api/admin/clients/[clientId]/parcours-stage — Mettre a jour les etapes du parcours
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;
  const body = await request.json();

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.colisEnvoye !== undefined) {
    updateData.colisEnvoye = Boolean(body.colisEnvoye);
    if (body.colisEnvoye) updateData.colisEnvoyeAt = new Date();
  }

  if (body.produitsRecus !== undefined) {
    updateData.produitsRecus = Boolean(body.produitsRecus);
    if (body.produitsRecus) updateData.produitsRecusAt = new Date();
  }

  // detoxStartDate = source de date canonique du parcours (pilote les 7 phases)
  if (body.detoxStartDate !== undefined) {
    updateData.detoxStartDate = body.detoxStartDate ? new Date(body.detoxStartDate) : null;
  }

  // Subscription fields
  if (body.totalSessions !== undefined) {
    updateData.totalSessions = parseInt(body.totalSessions) || 0;
  }
  if (body.usedSessionsManual !== undefined) {
    updateData.usedSessionsManual = body.usedSessionsManual === null ? null : (parseInt(body.usedSessionsManual) || 0);
  }
  if (body.subscriptionNotes !== undefined) {
    updateData.subscriptionNotes = body.subscriptionNotes || null;
  }

  await prisma.client.update({
    where: { id: clientId },
    data: updateData,
  });

  // Miroir sur l'instance de parcours active (refonte — Étape 2A).
  if (body.detoxStartDate !== undefined) {
    await syncActiveParcours(clientId, {
      detoxStartDate: updateData.detoxStartDate as Date | null,
    });
  }

  // Auto-création des 7 phases si une detoxStartDate vient d'être posée (idempotent).
  let phasesCreated = 0;
  if (body.detoxStartDate) {
    try {
      const res = await ensureClientPhases(clientId);
      phasesCreated = res.created;
    } catch (err) {
      console.error("[parcours-stage] ensureClientPhases:", err);
    }
  }

  return NextResponse.json({ success: true, phasesCreated });
}
