import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";

// GET /api/client/modules/[moduleId]
// Retourne Module + ModuleDays (asc) + ClientModule du client (si existe).
// Vérifications :
//   - accessMode=ACHETE  → 404 (invisible client en V3b, shop V4)
//   - accessMode=DEBLOQUE sans ClientModule pour ce client → 403
//   - accessMode=LIBRE   → OK même sans ClientModule (sera créé au POST /start)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;
  const { session } = auth;

  const { moduleId } = await params;

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      days: { orderBy: { dayNumber: "asc" } },
      clientModules: {
        where: { clientId: client.id },
        select: {
          id: true,
          unlockedAt: true,
          startedAt: true,
          completedAt: true,
        },
      },
    },
  });

  if (!mod) {
    return NextResponse.json({ error: "Module introuvable" }, { status: 404 });
  }

  // ACHETE : invisible en V3b
  if (mod.accessMode === "ACHETE") {
    return NextResponse.json({ error: "Module introuvable" }, { status: 404 });
  }

  const cm = mod.clientModules[0] ?? null;

  // DEBLOQUE sans ClientModule → accès interdit
  if (mod.accessMode === "DEBLOQUE" && !cm) {
    return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
  }

  return NextResponse.json({
    module: {
      id: mod.id,
      nameFr: mod.nameFr,
      nameEn: mod.nameEn,
      duration: mod.duration,
      description: mod.description,
      navigationMode: mod.navigationMode,
      accessMode: mod.accessMode,
      days: mod.days.map((d) => ({
        id: d.id,
        dayNumber: d.dayNumber,
        elixirs: d.elixirs,
        practices: d.practices,
        notification: d.notification,
      })),
      clientModule: cm
        ? {
            id: cm.id,
            unlockedAt: cm.unlockedAt.toISOString(),
            startedAt: cm.startedAt?.toISOString() ?? null,
            completedAt: cm.completedAt?.toISOString() ?? null,
          }
        : null,
    },
  });
}
