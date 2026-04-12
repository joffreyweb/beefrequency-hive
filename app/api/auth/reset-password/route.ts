import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token et mot de passe requis" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caract\u00e8res" }, { status: 400 });
    }

    const reset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!reset) {
      return NextResponse.json({ error: "Lien invalide" }, { status: 400 });
    }

    if (new Date() > reset.expiresAt) {
      await prisma.passwordReset.delete({ where: { id: reset.id } });
      return NextResponse.json({ error: "Lien expir\u00e9" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: reset.userId },
      data: { password: hashed },
    });

    // Delete all tokens for this user
    await prisma.passwordReset.deleteMany({ where: { userId: reset.userId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
