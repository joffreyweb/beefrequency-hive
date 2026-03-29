import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireAdmin, requireClient, isErrorResponse } from "@/lib/api-utils";

// GET /api/session-change-request — Lister les demandes (admin: toutes, client: les siennes)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  if (session.role === "ADMIN") {
    const requests = await prisma.sessionChangeRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: { include: { user: { select: { name: true } } } },
        session: true,
      },
    });
    return NextResponse.json({ requests });
  }

  const client = await prisma.client.findUnique({ where: { userId: session.userId } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const requests = await prisma.sessionChangeRequest.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
    include: { session: true },
  });

  return NextResponse.json({ requests });
}

// POST /api/session-change-request — Client demande un changement (max 1 sur 3 mois)
export async function POST(req: Request) {
  const result = await requireClient();
  if (isErrorResponse(result)) return result;

  const client = await prisma.client.findUnique({
    where: { userId: result.session.userId },
    select: { id: true },
  });

  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  // Verifier le nombre de changements deja utilises
  const existingRequests = await prisma.sessionChangeRequest.count({
    where: {
      clientId: client.id,
      status: { in: ["PENDING", "APPROVED"] },
    },
  });

  if (existingRequests >= 1) {
    return NextResponse.json(
      { error: "Vous avez deja utilise votre changement de creneau. Un seul changement est autorise sur les 3 mois." },
      { status: 403 }
    );
  }

  const { sessionId, requestedDate, reason } = await req.json();

  if (!sessionId || !requestedDate) {
    return NextResponse.json({ error: "sessionId et requestedDate requis" }, { status: 400 });
  }

  const changeRequest = await prisma.sessionChangeRequest.create({
    data: {
      clientId: client.id,
      sessionId,
      requestedDate: new Date(requestedDate),
      reason: reason || null,
    },
  });

  return NextResponse.json({ changeRequest });
}

// PATCH /api/session-change-request — Admin approuve/rejette une demande
export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id, status, adminResponse } = await req.json();

  if (!id || !["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "id et status (APPROVED/REJECTED) requis" }, { status: 400 });
  }

  const request = await prisma.sessionChangeRequest.update({
    where: { id },
    data: {
      status,
      adminResponse: adminResponse || null,
      resolvedAt: new Date(),
    },
    include: { session: true },
  });

  // Si approuve, mettre a jour la session
  if (status === "APPROVED") {
    await prisma.session.update({
      where: { id: request.sessionId },
      data: {
        scheduledAt: request.requestedDate,
        changesUsed: { increment: 1 },
      },
    });
  }

  return NextResponse.json({ request });
}
