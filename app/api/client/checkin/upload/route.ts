import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"];

// POST /api/client/checkin/upload — upload photo check-in (matin ou soir).
// Body formData : { file, type: "morning" | "evening" }
// Retourne : { path: "clients/{clientId}/checkins/{type}/{filename}" }
export async function POST(request: NextRequest) {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = (formData.get("type") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }
    if (type !== "morning" && type !== "evening") {
      return NextResponse.json({ error: "type invalide (morning | evening)" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 413 });
    }
    if (!ALLOWED_MIME.includes(file.type) && !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Format non supporté (JPG, PNG, HEIC, WebP)" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { userId: auth.session.userId },
      select: { id: true },
    });
    if (!client) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    const origName = file.name || "photo";
    const ext = (origName.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const dir = join(process.cwd(), "uploads", "clients", client.id, "checkins", type);
    await mkdir(dir, { recursive: true });

    const bytes = await file.arrayBuffer();
    await writeFile(join(dir, filename), Buffer.from(bytes));

    const path = `clients/${client.id}/checkins/${type}/${filename}`;
    return NextResponse.json({ path }, { status: 201 });
  } catch (err) {
    console.error("[checkin/upload] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
