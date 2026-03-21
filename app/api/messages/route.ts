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
// Body: { receiverId, content }
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isErrorResponse(authResult)) return authResult;
    const { session } = authResult;

    const { receiverId, content, tag } = await request.json();

    if (!receiverId || !content?.trim()) {
      return NextResponse.json(
        { error: "receiverId et content requis" },
        { status: 400 }
      );
    }

    // Vérifie que le destinataire existe
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return NextResponse.json(
        { error: "Destinataire introuvable" },
        { status: 404 }
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.userId,
        receiverId,
        content: content.trim(),
        ...(tag ? { tag } : {}),
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
