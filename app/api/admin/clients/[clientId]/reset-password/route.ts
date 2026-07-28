import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// POST /api/admin/clients/[clientId]/reset-password
// L'admin définit un nouveau mot de passe pour un client (dépannage : client qui
// a oublié le sien). Aucun email requis — l'admin communique le mot de passe.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;

  let body: { newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Mot de passe trop court (min 8)." }, { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { userId: true },
  });
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: client.userId },
    data: { password: hashed },
  });

  return NextResponse.json({ ok: true });
}
