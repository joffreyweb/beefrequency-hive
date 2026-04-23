import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  gif: "image/gif",
};

// GET /api/client/uploads/[...path] — sert un fichier uploadé en vérifiant la propriété.
// Accès : admin OU propriétaire du clientId présent dans le path.
// Path attendu : "clients/{clientId}/checkins/{type}/{filename}" (pour les check-ins).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { path } = await params;
  if (!path || path.length < 2) {
    return NextResponse.json({ error: "Path invalide" }, { status: 400 });
  }

  // Sécurité path : refuser toute tentative de traversée.
  for (const segment of path) {
    if (!segment || segment.includes("..") || segment.includes("\0") || segment.startsWith("/")) {
      return NextResponse.json({ error: "Path invalide" }, { status: 400 });
    }
  }

  // Structure attendue : clients/{clientId}/...
  if (path[0] !== "clients") {
    return NextResponse.json({ error: "Path invalide" }, { status: 400 });
  }
  const pathClientId = path[1];

  // Contrôle propriété : admin OK, sinon client doit matcher son propre clientId.
  if (session.role !== "ADMIN") {
    const me = await prisma.client.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!me || me.id !== pathClientId) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }
  }

  const filePath = join(process.cwd(), "uploads", ...path);

  try {
    await stat(filePath);
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  const data = await readFile(filePath);
  const ext = (path[path.length - 1].split(".").pop() || "").toLowerCase();
  const contentType = MIME_BY_EXT[ext] || "application/octet-stream";

  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}
