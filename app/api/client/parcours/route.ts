import { NextResponse } from "next/server";
import { requireClient, isErrorResponse } from "@/lib/api-utils";
import { getClientParcoursData } from "@/lib/parcours-client";

// GET /api/client/parcours — lecture seule de l'historique check-ins + journal du client connecté
export async function GET() {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;
  const { session } = auth;

  const days = await getClientParcoursData(session.userId);
  if (days === null) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  return NextResponse.json({ days });
}
