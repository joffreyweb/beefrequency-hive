import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";

// GET — Retourne le ClientIntake du client connecté (ou null)
export async function GET() {
  try {
    const clientResult = await requireClient();
    if (isErrorResponse(clientResult)) return clientResult;

    const client = await prisma.client.findUnique({
      where: { userId: clientResult.session.userId },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ intake: null });
    }

    const intake = await prisma.clientIntake.findUnique({
      where: { clientId: client.id },
    });

    return NextResponse.json({ intake: intake ?? null });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST — Crée ou met à jour le ClientIntake et déclenche l'analyse
export async function POST(request: Request) {
  try {
    const clientResult = await requireClient();
    if (isErrorResponse(clientResult)) return clientResult;

    const client = await prisma.client.findUnique({
      where: { userId: clientResult.session.userId },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Profil client introuvable" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      birthDate,
      birthTime,
      birthPlace,
      birthCountry,
      postalAddress,
      city,
      postalCode,
      country,
      hdType,
      intention,
    } = body;

    // Validation des champs requis (intention est optionnelle)
    const requiredFields = {
      firstName,
      lastName,
      birthDate,
      birthPlace,
      birthCountry,
      postalAddress,
      city,
      postalCode,
      country,
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value || (typeof value === "string" && !value.trim())) {
        return NextResponse.json(
          { error: `Le champ ${key} est requis` },
          { status: 400 }
        );
      }
    }

    // Validation de l'intention (minimum 50 caractères si renseignée)
    if (intention && intention.trim().length > 0 && intention.trim().length < 50) {
      return NextResponse.json(
        { error: "L'intention doit contenir au moins 50 caractères" },
        { status: 400 }
      );
    }

    // Upsert du ClientIntake
    await prisma.clientIntake.upsert({
      where: { clientId: client.id },
      create: {
        clientId: client.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: new Date(birthDate),
        birthTime: birthTime?.trim() || null,
        birthPlace: birthPlace.trim(),
        birthCountry: birthCountry.trim(),
        postalAddress: postalAddress.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        intention: intention?.trim() || "",
        submittedAt: new Date(),
      },
      update: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: new Date(birthDate),
        birthTime: birthTime?.trim() || null,
        birthPlace: birthPlace.trim(),
        birthCountry: birthCountry.trim(),
        postalAddress: postalAddress.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        intention: intention?.trim() || "",
        submittedAt: new Date(),
      },
    });

    // Met à jour le flag onboardingCompleted et le type HD si renseigné
    await prisma.client.update({
      where: { id: client.id },
      data: {
        onboardingCompleted: true,
        ...(hdType ? { hdType } : {}),
      },
    });

    // Upsert du ClientAnalysis avec status PENDING
    await prisma.clientAnalysis.upsert({
      where: { clientId: client.id },
      create: {
        clientId: client.id,
        status: "PENDING",
      },
      update: {
        status: "PENDING",
      },
    });

    // Déclenche l'analyse IA de manière asynchrone (fire and forget)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    fetch(`${baseUrl}/api/analysis/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: client.id }),
    }).catch(() => {
      // Fire and forget — on ignore les erreurs réseau
    });

    // Pose un cookie pour que le middleware autorise l'accès /client/*
    const response = NextResponse.json({ success: true });
    response.cookies.set("onboarding_completed", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 an
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
