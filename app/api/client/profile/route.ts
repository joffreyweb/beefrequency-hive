import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-utils";

export async function GET() {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const client = await prisma.client.findUnique({
    where: { userId: auth.session.userId },
    select: { language: true },
  });

  return NextResponse.json(client);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();

  // Language update on Client
  if (body.language && (body.language === "EN" || body.language === "FR")) {
    await prisma.client.update({
      where: { userId: auth.session.userId },
      data: { language: body.language },
    });
  }

  return NextResponse.json({ ok: true });
}
