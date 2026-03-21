import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-utils";

// POST — Marque comme lus tous les messages non lus envoyés par senderId au user connecté
// Body: { senderId }
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isErrorResponse(authResult)) return authResult;
    const { session } = authResult;

    const { senderId } = await request.json();

    if (!senderId) {
      return NextResponse.json(
        { error: "senderId requis" },
        { status: 400 }
      );
    }

    // Met à jour tous les messages non lus envoyés par senderId au user connecté
    const result = await prisma.message.updateMany({
      where: {
        senderId,
        receiverId: session.userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return NextResponse.json({ markedAsRead: result.count });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
