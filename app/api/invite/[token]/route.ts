import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";

// GET — Verifie que le token d'invitation est valide
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invite = await prisma.inviteToken.findUnique({
      where: { token },
    });

    // Token inexistant
    if (!invite) {
      return NextResponse.json(
        { error: "Invitation introuvable" },
        { status: 404 }
      );
    }

    // Token deja utilise
    if (invite.usedAt) {
      return NextResponse.json(
        { error: "Cette invitation a deja ete utilisee" },
        { status: 410 }
      );
    }

    // Token expire
    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: "Cette invitation a expire" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      email: invite.email,
      offerType: invite.offerType,
      language: invite.language,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST — Active l'invitation : cree le User + Client, set le cookie JWT
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { name, password, language } = await request.json();

    // Validations
    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Verification du token
    const invite = await prisma.inviteToken.findUnique({
      where: { token },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invitation introuvable" },
        { status: 404 }
      );
    }

    if (invite.usedAt) {
      return NextResponse.json(
        { error: "Cette invitation a deja ete utilisee" },
        { status: 410 }
      );
    }

    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: "Cette invitation a expire" },
        { status: 410 }
      );
    }

    // Verifie qu'aucun utilisateur n'existe deja avec cet email
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte existe deja avec cet email" },
        { status: 409 }
      );
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Creation du User + Client dans une transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: invite.email.toLowerCase().trim(),
          password: hashedPassword,
          role: "CLIENT",
          name: name?.trim() || invite.email.split("@")[0],
        },
      });

      await tx.client.create({
        data: {
          userId: newUser.id,
          offerType: invite.offerType,
          status: "ACTIVE",
          language: language === "EN" ? "EN" : "FR",
        },
      });

      // Marque le token comme utilise
      await tx.inviteToken.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });

      return newUser;
    });

    // Generation du JWT et set du cookie
    const jwt = await signToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    await setAuthCookie(jwt);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
