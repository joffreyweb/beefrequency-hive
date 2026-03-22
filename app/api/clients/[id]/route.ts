import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/clients/[id] — Détails d'un client avec toutes ses relations (admin uniquement)
export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await context.params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      journalEntries: {
        where: { isPrivate: false },
        orderBy: { createdAt: "desc" },
      },
      elixirPrescriptions: {
        orderBy: { createdAt: "desc" },
        include: { elixir: true },
      },
      protocols: { orderBy: { createdAt: "desc" } },
      sessions: { orderBy: { scheduledAt: "desc" } },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  return NextResponse.json(client);
}

// PATCH /api/clients/[id] — Met à jour les notes, statut, nextSessionDate (admin uniquement)
export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const { notes, status, nextSessionDate, hdType, timezone } = body;

    // Vérifie que le client existe
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Client introuvable" },
        { status: 404 }
      );
    }

    // Construction dynamique des données à mettre à jour
    const data: Record<string, unknown> = {};
    if (notes !== undefined) data.notes = notes;
    if (status !== undefined) data.status = status;
    if (nextSessionDate !== undefined) {
      data.nextSessionDate = nextSessionDate
        ? new Date(nextSessionDate)
        : null;
    }
    if (hdType !== undefined) data.hdType = hdType || null;
    if (timezone !== undefined) data.timezone = timezone || "Europe/Paris";

    const updated = await prisma.client.update({
      where: { id },
      data,
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
