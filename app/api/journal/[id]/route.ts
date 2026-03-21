import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";

// Helper : verifie que le client connecte est bien proprietaire de l'entree
async function getOwnedEntry(entryId: string, userId: string) {
  const client = await prisma.client.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!client) return null;

  const entry = await prisma.journalEntry.findUnique({
    where: { id: entryId },
  });

  if (!entry || entry.clientId !== client.id) return null;

  return entry;
}

// GET — Retourne une entree de journal (verification ownership)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const clientResult = await requireClient();
    if (isErrorResponse(clientResult)) return clientResult;

    const entry = await getOwnedEntry(id, clientResult.session.userId);

    if (!entry) {
      return NextResponse.json(
        { error: "Entree introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PATCH — Modifie une entree de journal (verification ownership)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const clientResult = await requireClient();
    if (isErrorResponse(clientResult)) return clientResult;

    const entry = await getOwnedEntry(id, clientResult.session.userId);

    if (!entry) {
      return NextResponse.json(
        { error: "Entree introuvable" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { content, isPrivate, mood } = body;

    // Construction des champs a mettre a jour
    const updateData: Record<string, unknown> = {};

    if (content !== undefined) {
      if (!content.trim()) {
        return NextResponse.json(
          { error: "Le contenu ne peut pas etre vide" },
          { status: 400 }
        );
      }
      updateData.content = content.trim();
    }

    if (isPrivate !== undefined) {
      updateData.isPrivate = Boolean(isPrivate);
    }

    if (mood !== undefined) {
      updateData.mood = mood?.trim() || null;
    }

    const updatedEntry = await prisma.journalEntry.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ entry: updatedEntry });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE — Supprime une entree de journal (verification ownership)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const clientResult = await requireClient();
    if (isErrorResponse(clientResult)) return clientResult;

    const entry = await getOwnedEntry(id, clientResult.session.userId);

    if (!entry) {
      return NextResponse.json(
        { error: "Entree introuvable" },
        { status: 404 }
      );
    }

    await prisma.journalEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
