import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join } from "path";

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
// Route publique (cf. publicPaths proxy.ts) · sert les fichiers écrits par
// /api/journal/upload dans process.cwd()/uploads/journal/<clientId>/<filename>.
// Les mediaUrl en DB (format /uploads/journal/...) sont rewrite'd en interne
// par proxy.ts vers cette route sans changer l'URL vue par le browser.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  if (!path || path.length === 0) {
    return NextResponse.json({ error: "Path invalide" }, { status: 400 });
  }

  // Garde-fou traversée
  for (const segment of path) {
    if (!segment || segment.includes("..") || segment.includes("\0") || segment.startsWith("/")) {
      return NextResponse.json({ error: "Path invalide" }, { status: 400 });
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
