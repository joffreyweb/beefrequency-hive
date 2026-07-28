import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-utils";

// GET — Récupère les messages selon le rôle
// Admin : ?clientId= → fil avec ce client | sans param → liste de tous les fils
// Client : fil de conversation avec l'admin
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isErrorResponse(authResult)) return authResult;
    const { session } = authResult;

    const { searchParams } = new URL(request.url);

    // --- ADMIN ---
    if (session.role === "ADMIN") {
      const clientId = searchParams.get("clientId");

      // Si clientId fourni, retourne le fil de conversation avec ce client
      if (clientId) {
        const messages = await prisma.message.findMany({
          where: {
            OR: [
              { senderId: session.userId, receiverId: clientId },
              { senderId: clientId, receiverId: session.userId },
            ],
          },
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, role: true } },
          },
        });

        return NextResponse.json({ messages });
      }

      // Sinon, retourne la liste de tous les fils (dernier message + count non-lus par client)
      // On récupère tous les clients qui ont au moins un message échangé avec l'admin
      const clients = await prisma.user.findMany({
        where: { role: "CLIENT" },
        select: {
          id: true,
          name: true,
          email: true,
          sentMessages: {
            where: { receiverId: session.userId },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          receivedMessages: {
            where: { senderId: session.userId },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      // Construit la liste des fils avec dernier message et compteur non-lus
      const threadsPromises = clients.map(async (client) => {
        // Dernier message du fil (envoyé ou reçu)
        const lastSent = client.sentMessages[0];
        const lastReceived = client.receivedMessages[0];
        let lastMessage = null;

        if (lastSent && lastReceived) {
          lastMessage =
            lastSent.createdAt > lastReceived.createdAt
              ? lastSent
              : lastReceived;
        } else {
          lastMessage = lastSent || lastReceived;
        }

        // Pas de messages = pas de fil
        if (!lastMessage) return null;

        // Compteur de messages non lus envoyés par ce client
        const unreadCount = await prisma.message.count({
          where: {
            senderId: client.id,
            receiverId: session.userId,
            readAt: null,
          },
        });

        // Vérifie s'il y a des messages parcours non lus pour ce client
        const journeyUnread = await prisma.message.count({
          where: {
            senderId: session.userId,
            receiverId: client.id,
            tag: "JOURNEY",
            readAt: null,
          },
        });

        return {
          clientId: client.id,
          clientName: client.name,
          clientEmail: client.email,
          lastMessage: {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
          },
          unreadCount,
          hasJourneyMessages: journeyUnread > 0,
        };
      });

      const threads = (await Promise.all(threadsPromises)).filter(Boolean);

      // Tri par date du dernier message (plus récent en premier)
      threads.sort((a, b) => {
        const dateA = new Date(a!.lastMessage.createdAt).getTime();
        const dateB = new Date(b!.lastMessage.createdAt).getTime();
        return dateB - dateA;
      });

      return NextResponse.json({ threads });
    }

    // --- CLIENT ---
    // Trouve le premier admin
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, name: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Aucun admin trouvé" },
        { status: 500 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.userId, receiverId: admin.id },
          { senderId: admin.id, receiverId: session.userId },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ messages, adminId: admin.id, adminName: admin.name });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST — Crée un nouveau message
// Body: { receiverId, content, tag }
// Sécurité : les messages ne circulent QU'ENTRE un client et l'admin.
//  - CLIENT  → destinataire forcé à l'admin (receiverId fourni ignoré, tag ignoré).
//  - ADMIN   → destinataire doit être un client existant (rôle CLIENT vérifié).
// Garantit qu'un message ne peut jamais arriver au mauvais client.
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isErrorResponse(authResult)) return authResult;
    const { session } = authResult;

    const { receiverId, content, tag } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "content requis" },
        { status: 400 }
      );
    }

    let finalReceiverId: string;
    let finalTag: string | undefined;

    if (session.role === "CLIENT") {
      // Un client ne peut écrire qu'à l'admin. On ignore tout receiverId fourni.
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
      finalReceiverId = admin.id;
      finalTag = undefined; // Le tag (JOURNEY/SYMPTOM) est réservé à l'admin/système.
    } else {
      // ADMIN : le destinataire doit être un client existant.
      if (!receiverId) {
        return NextResponse.json(
          { error: "receiverId requis" },
          { status: 400 }
        );
      }
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true, role: true },
      });
      if (!receiver || receiver.role !== "CLIENT") {
        return NextResponse.json(
          { error: "Destinataire invalide" },
          { status: 400 }
        );
      }
      finalReceiverId = receiver.id;
      finalTag = typeof tag === "string" && tag.trim() ? tag.trim() : undefined;
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.userId,
        receiverId: finalReceiverId,
        content: content.trim(),
        ...(finalTag ? { tag: finalTag } : {}),
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
