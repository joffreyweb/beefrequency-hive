import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireClient();
    if (isErrorResponse(auth)) return auth;

    const { newPassword } = await request.json();

    // Le client est déjà authentifié par sa session (requireClient) : cette
    // session EST la preuve d'identité. On ne demande donc PAS l'ancien mot de
    // passe — sinon un client qui l'a oublié serait bloqué (aucun email requis).
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "passwordTooShort" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: auth.session.userId },
      data: { password: hashed },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erreur change-password:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
