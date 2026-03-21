import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET — Retourne les réglages de l'admin
export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const user = await prisma.user.findUnique({
    where: { id: auth.session.userId },
    select: { dailyRecapTime: true },
  });

  return NextResponse.json({
    dailyRecapTime: user?.dailyRecapTime ?? "18:00",
  });
}

// PATCH — Met à jour les réglages de l'admin
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();
  const { dailyRecapTime } = body;

  // Validation basique du format HH:MM
  if (!dailyRecapTime || !/^\d{2}:\d{2}$/.test(dailyRecapTime)) {
    return NextResponse.json(
      { error: "Format invalide. Utilisez HH:MM." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: auth.session.userId },
    data: { dailyRecapTime },
  });

  return NextResponse.json({ dailyRecapTime });
}
