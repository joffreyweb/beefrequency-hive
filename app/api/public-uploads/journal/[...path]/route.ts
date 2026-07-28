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
  webm: "audio/webm",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
};

// GET /api/uploads/journal/[...path]
// Sert les fichiers écrits par /api/journal/upload dans
// process.cwd()/uploads/journal/<clientId>/<filename>.
// Les mediaUrl en DB (format /uploads/journal/...) sont rewrite'd en interne
// par proxy.ts vers cette route sans changer l'URL vue par le browser.
//
// SÉCURITÉ (Vague 2) : accès contrôlé — auth obligatoire.
//  - Non authentifié            → 401.
//  - Client propriétaire        → accès (privé ou non, c'est SA galerie).
//  - Client tiers               → 403 (ne peut pas voir le journal d'un autre).
//  - Admin                      → accès SAUF entrée privée (isPrivate=true), jamais visible par l'admin.
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

  // Garde-fou traversée
  for (const segment of path) {
    if (!segment || segment.includes("..") || segment.includes("\0") || segment.startsWith("/")) {
      return NextResponse.json({ error: "Path invalide" }, { status: 400 });
    }
  }

  // Structure du path : <clientId>/<filename>
  const pathClientId = path[0];

  if (session.role !== "ADMIN") {
    // Client : doit être le propriétaire du clientId présent dans le path.
    const me = await prisma.client.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!me || me.id !== pathClientId) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }
  } else {
    // Admin : ne voit JAMAIS une entrée privée (cohérent avec /api/journal).
    const mediaUrl = `/uploads/journal/${path.join("/")}`;
    const entry = await prisma.journalEntry.findFirst({
      where: { mediaUrl },
      select: { isPrivate: true },
    });
    if (entry?.isPrivate) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }
  }

  const filePath = join(process.cwd(), "uploads", "journal", ...path);

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
      "Cache-Control": "private, max-age=3600",
    },
  });
}
