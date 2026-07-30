import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

// POST /api/admin/push/subscribe — enregistre l'abonnement push de l'appareil admin (souverain).
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;
  const { session } = auth;

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

  await prisma.adminPushSubscription.upsert({
    where: { endpoint },
    create: { userId: session.userId, endpoint, p256dh, auth: authKey },
    update: { userId: session.userId, p256dh, auth: authKey },
  });

  return NextResponse.json({ ok: true });
}
