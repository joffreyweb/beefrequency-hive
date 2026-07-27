import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// PATCH /api/day-messages/[id] — modifier le texte et/ou l'activation (admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  let body: { text?: unknown; isActive?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const data: { text?: string; isActive?: boolean } = {};
  if (typeof body.text === "string") data.text = body.text.trim();
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Aucun champ à modifier" }, { status: 400 });
  }

  try {
    const message = await prisma.dayMessage.update({ where: { id }, data });
    return NextResponse.json(message);
  } catch {
    return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
  }
}

// DELETE /api/day-messages/[id] — supprimer (admin) · seenBy cascade
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  try {
    await prisma.dayMessage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
  }
}
