import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// POST /api/admin/clients/[clientId]/kdrive-sync
// Rejoue TOUS les archiveurs kDrive pour ce client (rattrapage historique + relance
// à la demande). Fire-and-forget : l'archivage complet (plusieurs PDF + uploads) peut
// prendre du temps, on ne bloque pas la requête.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;

  import("@/lib/kdrive-archive")
    .then(({ archiveAllForClient }) => archiveAllForClient(clientId))
    .catch((err) => console.error("[kdrive-sync] error:", err));

  return NextResponse.json({ ok: true, started: true });
}
