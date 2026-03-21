import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  requireAuth,
  isErrorResponse,
} from "@/lib/api-utils";

// GET — Détails d'une session (admin : tout avec notes, client : la sienne sans notes)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const { session: jwtSession } = auth;

    if (jwtSession.role === "ADMIN") {
      // Admin — session complète avec notes
      const sessionData = await prisma.session.findUnique({
        where: { id },
        include: {
          client: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      });

      if (!sessionData) {
        return NextResponse.json(
          { error: "Session introuvable" },
          { status: 404 }
        );
      }

      return NextResponse.json({ session: sessionData });
    }

    // Client — sa session sans les notes privées
    const client = await prisma.client.findUnique({
      where: { userId: jwtSession.userId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Profil client introuvable" },
        { status: 404 }
      );
    }

    const sessionData = await prisma.session.findUnique({
      where: { id },
      select: {
        id: true,
        clientId: true,
        scheduledAt: true,
        duration: true,
        type: true,
        status: true,
        zoomLink: true,
        createdAt: true,
        updatedAt: true,
        // notes, checklistItems, recapDone exclues — privées Joffrey
      },
    });

    if (!sessionData) {
      return NextResponse.json(
        { error: "Session introuvable" },
        { status: 404 }
      );
    }

    // Un client ne peut voir que ses propres sessions
    if (sessionData.clientId !== client.id) {
      return NextResponse.json(
        { error: "Accès interdit" },
        { status: 403 }
      );
    }

    return NextResponse.json({ session: sessionData });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH — Modifier une session (admin uniquement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const data = await request.json();

    // Vérifier que la session existe
    const existing = await prisma.session.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Session introuvable" },
        { status: 404 }
      );
    }

    const sessionData = await prisma.session.update({
      where: { id },
      data: {
        ...(data.scheduledAt !== undefined && {
          scheduledAt: new Date(data.scheduledAt),
        }),
        ...(data.duration !== undefined && {
          duration: parseInt(data.duration, 10),
        }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.zoomLink !== undefined && { zoomLink: data.zoomLink }),
        ...(data.checklistItems !== undefined && { checklistItems: data.checklistItems }),
        ...(data.recapDone !== undefined && { recapDone: data.recapDone }),
      },
      include: {
        client: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json({ session: sessionData });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — Supprimer une session (admin uniquement)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    const existing = await prisma.session.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Session introuvable" },
        { status: 404 }
      );
    }

    await prisma.session.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
