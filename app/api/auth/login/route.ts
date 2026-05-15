import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60;
  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case "s": return value;
    case "m": return value * 60;
    case "h": return value * 3600;
    case "d": return value * 86400;
    default: return 7 * 86400;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, turnstileToken } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Vérification Turnstile (si configuré)
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      if (!turnstileToken) {
        return NextResponse.json(
          { error: "Vérification de sécurité requise" },
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
          { error: "Vérification de sécurité échouée" },
          { status: 403 }
        );
      }
    }

    // Recherche utilisateur (case-insensitive pour defense in depth)
    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: "insensitive" } },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    // Vérification mot de passe
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    // Mise à jour de la dernière connexion
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Génération JWT
    const token = await signToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    // Cookie config — unified on the response object
    const isSecure = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax" as const,
      path: "/",
    };

    // Build response with ALL cookies on the same object
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // JWT cookie
    response.cookies.set("token", token, {
      ...cookieOptions,
      maxAge: parseDuration(JWT_EXPIRES_IN),
    });

    // Onboarding cookie (CLIENT only)
    if (user.role === "CLIENT") {
      const client = await prisma.client.findUnique({
        where: { userId: user.id },
        select: { onboardingCompleted: true },
      });
      if (client?.onboardingCompleted) {
        response.cookies.set("onboarding_completed", "1", {
          ...cookieOptions,
          maxAge: 60 * 60 * 24 * 365,
        });
      }
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
