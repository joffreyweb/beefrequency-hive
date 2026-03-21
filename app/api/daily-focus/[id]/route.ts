import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH — Modifie un focus du jour (admin uniquement)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAdmin();
    if (isErrorResponse(authResult)) return authResult;

    const { id } = await params;
    const data = await request.json();

    const focus = await prisma.dailyFocus.update({
      where: { id },
      data,
    });

    return NextResponse.json({ focus });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — Supprime un focus du jour (admin uniquement)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAdmin();
    if (isErrorResponse(authResult)) return authResult;

    const { id } = await params;

    await prisma.dailyFocus.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
