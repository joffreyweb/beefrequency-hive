import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// PATCH /api/admin/clients/[clientId]/block — Bloquer/Débloquer un client
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;
  const { blocked } = await request.json();

  if (typeof blocked !== "boolean") {
    return NextResponse.json({ error: "blocked (boolean) requis" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { userId: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: client.userId },
    data: { blocked },
  });

  return NextResponse.json({ success: true, blocked });
}
