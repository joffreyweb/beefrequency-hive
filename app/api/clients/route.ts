import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { generateAllCartes } from "@/lib/generateCartes";

// GET /api/clients — Liste tous les clients (admin uniquement)
export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(clients);
}

// POST /api/clients — Créer un client manuellement (admin uniquement)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { userId, offerType, notes } = body;

    // Validation minimale
    if (!userId || !offerType) {
      return NextResponse.json(
        { error: "userId et offerType sont requis" },
        { status: 400 }
      );
    }

    // Vérifie que l'utilisateur existe et n'a pas déjà un profil client
    const existingClient = await prisma.client.findUnique({
      where: { userId },
    });
    if (existingClient) {
      return NextResponse.json(
        { error: "Ce utilisateur a déjà un profil client" },
        { status: 409 }
      );
    }

    const client = await prisma.client.create({
      data: {
        userId,
        offerType,
        notes: notes || null,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    // Trigger card generation in background (non-blocking)
    generateAllCartes(client.id).catch(console.error);

    return NextResponse.json(client, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la création du client" },
      { status: 500 }
    );
  }
}
