import { NextResponse } from "next/server";
import { requireAuth, isErrorResponse } from "@/lib/api-utils";

// GET /api/push/vapid-public-key — renvoie la clé publique VAPID (destinée à être
// publique) pour que le navigateur s'abonne. null si le push n'est pas configuré.
export async function GET() {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;
  return NextResponse.json({ key: process.env.VAPID_PUBLIC_KEY || null });
}
