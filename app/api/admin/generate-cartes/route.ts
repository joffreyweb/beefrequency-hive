import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { generateAllCartes } from "@/lib/generateCartes";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await request.json();
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  // Non-blocking
  generateAllCartes(clientId).catch(console.error);

  return NextResponse.json({ ok: true, message: "Generation started" });
}
