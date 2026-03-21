import { NextResponse } from "next/server";
import { getSession, JwtPayload } from "@/lib/auth";

// Vérifie que l'utilisateur est admin, renvoie la session ou une erreur 401/403
export async function requireAdmin(): Promise<{ session: JwtPayload } | NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
  return { session };
}

// Vérifie que l'utilisateur est client, renvoie la session ou une erreur
export async function requireClient(): Promise<{ session: JwtPayload } | NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (session.role !== "CLIENT") return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
  return { session };
}

// Vérifie qu'on est authentifié (tout rôle)
export async function requireAuth(): Promise<{ session: JwtPayload } | NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  return { session };
}

// Helper pour vérifier si le résultat est une NextResponse (erreur)
export function isErrorResponse(result: unknown): result is NextResponse {
  return result instanceof NextResponse;
}
