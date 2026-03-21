import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  requireAuth,
  isErrorResponse,
} from "@/lib/api-utils";

// GET — Prescriptions (admin : toutes avec filtre clientId, client : les siennes)
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { session } = auth;

    if (session.role === "ADMIN") {
      // Admin — toutes les prescriptions, filtrage optionnel par clientId
      const clientId = request.nextUrl.searchParams.get("clientId");

      const prescriptions = await prisma.elixirPrescription.findMany({
        where: clientId ? { clientId } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          elixir: { select: { name: true, description: true, dosage: true } },
          client: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      });

      return NextResponse.json({ prescriptions });
    }

    // Client — ses propres prescriptions avec détails élixir
    const client = await prisma.client.findUnique({
      where: { userId: session.userId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Profil client introuvable" },
        { status: 404 }
      );
    }

    const prescriptions = await prisma.elixirPrescription.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
      include: {
        elixir: {
          select: { name: true, description: true, dosage: true, duration: true },
        },
      },
    });

    return NextResponse.json({ prescriptions });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Prescrire un élixir à un client (admin uniquement)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const {
      clientId,
      elixirId,
      dosage,
      quantity,
      dailyDose,
      startDate,
      endDate,
      reorderUrl,
      stockAlertDays,
      notes,
    } = await request.json();

    // Validation des champs obligatoires
    if (!clientId || !elixirId) {
      return NextResponse.json(
        { error: "clientId et elixirId sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que le client et l'élixir existent
    const [client, elixir] = await Promise.all([
      prisma.client.findUnique({ where: { id: clientId } }),
      prisma.elixir.findUnique({ where: { id: elixirId } }),
    ]);

    if (!client) {
      return NextResponse.json(
        { error: "Client introuvable" },
        { status: 404 }
      );
    }
    if (!elixir) {
      return NextResponse.json(
        { error: "Élixir introuvable" },
        { status: 404 }
      );
    }

    // Calcul automatique de endDate si quantity et dailyDose sont fournis
    // endDate explicite a priorité
    const parsedStartDate = startDate ? new Date(startDate) : new Date();
    let computedEndDate: Date | null = null;

    if (endDate) {
      // endDate explicite a priorité
      computedEndDate = new Date(endDate);
    } else if (quantity && dailyDose && dailyDose > 0) {
      // Calcul automatique : startDate + (quantity / dailyDose) jours
      const totalDays = Math.ceil(quantity / dailyDose);
      computedEndDate = new Date(
        parsedStartDate.getTime() + totalDays * 86400000
      );
    }

    const prescription = await prisma.elixirPrescription.create({
      data: {
        clientId,
        elixirId,
        dosage: dosage || null,
        quantity: quantity ?? null,
        dailyDose: dailyDose ?? null,
        startDate: parsedStartDate,
        endDate: computedEndDate,
        reorderUrl: reorderUrl || null,
        stockAlertDays: stockAlertDays ?? 7,
        notes: notes || null,
      },
      include: {
        elixir: { select: { name: true } },
        client: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json({ prescription }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
