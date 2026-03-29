import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

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

  if (body.detoxStartDate !== undefined) {
    updateData.detoxStartDate = body.detoxStartDate ? new Date(body.detoxStartDate) : null;
  }

  if (body.programmeStartDate !== undefined) {
    updateData.programmeStartDate = body.programmeStartDate ? new Date(body.programmeStartDate) : null;
  }

  await prisma.client.update({
    where: { id: clientId },
    data: updateData,
  });

  return NextResponse.json({ success: true });
}
