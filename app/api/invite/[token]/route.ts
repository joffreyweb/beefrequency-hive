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
    console.log("[invite GET] token reçu:", token);
    console.log("[invite GET] DATABASE_URL définie:", !!process.env.DATABASE_URL);

    const invite = await prisma.inviteToken.findUnique({
      where: { token },
    });
    console.log("[invite GET] résultat DB:", invite ? `found (id=${invite.id})` : "null");

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

    // Vérifie si l'utilisateur existe déjà (pré-créé par admin)
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
      select: { name: true, client: { select: { isLegacy: true } } },
    });

    return NextResponse.json({
      email: invite.email,
      offerType: invite.offerType,
      language: invite.language,
      isLegacy: existingUser?.client?.isLegacy || false,
      existingUser: existingUser
        ? { name: existingUser.name }
        : null,
    });
  } catch (err) {
    console.error("[invite GET] erreur:", err);
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
    const { name, password, turnstileToken } = await request.json();

    // Vérification Turnstile (si configuré)
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      if (!turnstileToken) {
        return NextResponse.json(
          { error: "Verification CAPTCHA requise" },
          { status: 400 }
        );
      }

      const verifyRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret: turnstileSecret,
            response: turnstileToken,
          }),
        }
      );
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return NextResponse.json(
          { error: "Verification CAPTCHA echouee" },
          { status: 403 }
        );
      }
    }

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
    console.log("[invite POST] token reçu:", token);
    const invite = await prisma.inviteToken.findUnique({
      where: { token },
    });
    console.log("[invite POST] résultat DB:", invite ? `found (id=${invite.id})` : "null");

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

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Vérifie si un utilisateur existe déjà (créé par admin via create-client)
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
      include: { client: true },
    });

    let user;

    if (existingUser) {
      // L'utilisateur existe déjà (pré-créé par l'admin) → on met à jour le mot de passe
      user = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            password: hashedPassword,
            lastLoginAt: new Date(),
            ...(name?.trim() ? { name: name.trim() } : {}),
          },
        });

        // S'assurer que le Client record existe
        if (!existingUser.client) {
          await tx.client.create({
            data: {
              userId: existingUser.id,
              offerType: invite.offerType,
              status: "ACTIVE",
              language: invite.language || "FR",
            },
          });
        }

        // Marque le token comme utilisé
        await tx.inviteToken.update({
          where: { id: invite.id },
          data: { usedAt: new Date() },
        });

        return updated;
      });
    } else {
      // Nouveau compte — création complète
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: invite.email.toLowerCase().trim(),
            password: hashedPassword,
            role: "CLIENT",
            name: name?.trim() || invite.email.split("@")[0],
            lastLoginAt: new Date(),
          },
        });

        await tx.client.create({
          data: {
            userId: newUser.id,
            offerType: invite.offerType,
            status: "ACTIVE",
            language: invite.language || "FR",
          },
        });

        // Marque le token comme utilisé
        await tx.inviteToken.update({
          where: { id: invite.id },
          data: { usedAt: new Date() },
        });

        return newUser;
      });
    }

    // Generation du JWT
    const jwt = await signToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    // Check if legacy or onboarding completed
    const clientRecord = await prisma.client.findUnique({
      where: { userId: user.id },
      select: { onboardingCompleted: true, isLegacy: true },
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Set JWT cookie on the response object (unified approach)
    const expiresIn = parseInt(process.env.JWT_EXPIRES_IN || "7", 10) || 7;
    response.cookies.set("token", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expiresIn * 86400,
      path: "/",
    });

    // Set onboarding cookie if legacy or already completed
    if (clientRecord?.onboardingCompleted || clientRecord?.isLegacy) {
      response.cookies.set("onboarding_completed", "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return response;
  } catch (err) {
    console.error("[invite POST] erreur:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
