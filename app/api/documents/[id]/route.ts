import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-utils";
import { unlink } from "fs/promises";
import path from "path";

// GET — Récupère un document par ID (marque readByAdmin si admin)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = await requireAuth();
    if (isErrorResponse(authResult)) return authResult;
    const { session } = authResult;

    const document = await prisma.clientDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document introuvable" },
        { status: 404 }
      );
    }

    // Vérification d'accès : le client ne peut voir que ses propres documents
    if (session.role === "CLIENT") {
      const client = await prisma.client.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      });
      if (!client || client.id !== document.clientId) {
        return NextResponse.json(
          { error: "Accès interdit" },
          { status: 403 }
        );
      }
    }

    // Marquer comme lu par l'admin
    if (session.role === "ADMIN" && !document.readByAdmin) {
      await prisma.clientDocument.update({
        where: { id },
        data: { readByAdmin: true },
      });
      document.readByAdmin = true;
    }

    return NextResponse.json({ document });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE — Supprime un document (client ses propres docs, admin tout)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = await requireAuth();
    if (isErrorResponse(authResult)) return authResult;
    const { session } = authResult;

    const document = await prisma.clientDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document introuvable" },
        { status: 404 }
      );
    }

    // Vérification d'accès : le client ne peut supprimer que ses propres documents
    if (session.role === "CLIENT") {
      const client = await prisma.client.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      });
      if (!client || client.id !== document.clientId) {
        return NextResponse.json(
          { error: "Accès interdit" },
          { status: 403 }
        );
      }
    }

    // Suppression du fichier sur le disque
    try {
      const filePath = path.join(process.cwd(), "public", document.fileUrl);
      await unlink(filePath);
    } catch {
      // Le fichier peut ne plus exister, on continue quand même
    }

    // Suppression de l'entrée en base
    await prisma.clientDocument.delete({
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
