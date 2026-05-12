import { NextResponse } from "next/server";
import { requireClient, isErrorResponse } from "@/lib/api-utils";
import { getClientFlagsByUserId } from "@/lib/parcours-guard";

// GET /api/client/me/flags — Retourne parcoursType + 8 flags pour le client connecté
export async function GET() {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;

  const row = await getClientFlagsByUserId(auth.session.userId);

  if (!row) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const { parcoursType, ...flags } = row;
  return NextResponse.json({ parcoursType, flags });
}
