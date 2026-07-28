import { NextRequest, NextResponse } from "next/server";
import { requireClient, isErrorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

// POST /api/push/subscribe — enregistre l'abonnement push du client (un par appareil).
export async function POST(request: NextRequest) {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;
  const { session } = auth;

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  let body: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const authKey = body?.keys?.auth;
  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: "Abonnement invalide" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { clientId: client.id, endpoint, p256dh, auth: authKey },
    update: { clientId: client.id, p256dh, auth: authKey },
  });

  return NextResponse.json({ ok: true });
}
