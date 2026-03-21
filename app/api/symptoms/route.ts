import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";

// GET — Liste les messages symptômes envoyés par le client connecté
export async function GET() {
  try {
    const authResult = await requireClient();
    if (isErrorResponse(authResult)) return authResult;
    const { session } = authResult;

    // Récupère les messages tag=SYMPTOM envoyés par ce client
    const messages = await prisma.message.findMany({
      where: {
        senderId: session.userId,
        tag: "SYMPTOM",
      },
      orderBy: { createdAt: "desc" },
      include: {
        receiver: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST — Crée un message symptôme (tag=SYMPTOM) vers le premier admin
// Body: { content }
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireClient();
    if (isErrorResponse(authResult)) return authResult;
    const { session } = authResult;

    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "content requis" },
        { status: 400 }
      );
    }

    // Trouve le premier admin comme destinataire
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Aucun admin trouvé" },
        { status: 500 }
      );
    }

    // Crée le message avec le tag SYMPTOM
    const message = await prisma.message.create({
      data: {
        senderId: session.userId,
        receiverId: admin.id,
        content: content.trim(),
        tag: "SYMPTOM",
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
