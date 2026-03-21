import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET — Historique des envois pour un client donné
// Query : ?clientId=xxx
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (isErrorResponse(authResult)) return authResult;

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId requis" },
        { status: 400 }
      );
    }

    const logs = await prisma.journeyMessageLog.findMany({
      where: { clientId },
      orderBy: { sentAt: "desc" },
      include: {
        template: {
          select: { title: true, dayTrigger: true },
        },
      },
    });

    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
