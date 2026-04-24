import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";

// GET /api/client/modules — liste des modules accessibles au client connecté.
// Filtrage :
//   - accessMode=LIBRE : tous les clients y ont accès
//   - accessMode=DEBLOQUE : uniquement si ClientModule existe pour ce client
//   - accessMode=ACHETE  : EXCLU en V3b (prévu shop V4 · UI muette)
export async function GET() {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;
  const { session } = auth;

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const modules = await prisma.module.findMany({
    where: {
      OR: [
        { accessMode: "LIBRE" },
        {
          accessMode: "DEBLOQUE",
          clientModules: { some: { clientId: client.id } },
        },
      ],
    },
    orderBy: [{ name: "asc" }],
    include: {
      clientModules: {
        where: { clientId: client.id },
        select: {
          unlockedAt: true,
          startedAt: true,
          completedAt: true,
        },
      },
    },
  });

  const payload = modules.map((m) => {
    const cm = m.clientModules[0] ?? null;
    return {
      id: m.id,
      nameFr: m.nameFr,
      nameEn: m.nameEn,
      duration: m.duration,
      description: m.description,
      navigationMode: m.navigationMode,
      unlockedAt: cm?.unlockedAt.toISOString() ?? null,
      startedAt: cm?.startedAt?.toISOString() ?? null,
      completedAt: cm?.completedAt?.toISOString() ?? null,
    };
  });

  // Tri : modules débloqués (ClientModule existe) en premier, puis LIBRE non encore démarrés
  payload.sort((a, b) => {
    const aScore = a.unlockedAt ? 1 : 0;
    const bScore = b.unlockedAt ? 1 : 0;
    return bScore - aScore;
  });

  return NextResponse.json({ modules: payload });
}
