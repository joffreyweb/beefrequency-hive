import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// Ordre de tri pour l'urgence : red → amber → green
const URGENCY_ORDER: Record<string, number> = { red: 0, amber: 1, green: 2 };

// GET — Retourne les actions en attente (non complétées), triées par urgence puis date
export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const actions = await prisma.pendingAction.findMany({
      where: { completedAt: null },
      include: {
        client: {
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Tri par urgence (red > amber > green) puis par createdAt desc
    actions.sort((a, b) => {
      const urgencyDiff =
        (URGENCY_ORDER[a.urgency] ?? 2) - (URGENCY_ORDER[b.urgency] ?? 2);
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return NextResponse.json({ actions });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Créer une action manuellement (admin uniquement)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { clientId, type, title, description, urgency } =
      await request.json();

    // Validation des champs obligatoires
    if (!type || !title) {
      return NextResponse.json(
        { error: "type et title sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que le type est valide
    const validTypes = ["RECAP", "ELIXIR", "SESSION", "SYMPTOM", "CUSTOM"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Type d'action invalide" },
        { status: 400 }
      );
    }

    // Vérifier l'urgence si fournie
    if (urgency && !["red", "amber", "green"].includes(urgency)) {
      return NextResponse.json(
        { error: "Urgence invalide (red, amber, green)" },
        { status: 400 }
      );
    }

    const { session } = auth;

    const action = await prisma.pendingAction.create({
      data: {
        adminId: session.userId,
        type,
        title,
        ...(clientId && { clientId }),
        ...(description && { description }),
        ...(urgency && { urgency }),
      },
      include: {
        client: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json({ action }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
