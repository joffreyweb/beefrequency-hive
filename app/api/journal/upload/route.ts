import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// POST /api/journal/upload — Upload photo ou audio pour le journal
export async function POST(request: NextRequest) {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const entryType = (formData.get("type") as string) || "photo";
    const mood = formData.get("mood") as string | null;
    const isPrivateStr = formData.get("isPrivate") as string;
    const caption = formData.get("caption") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10MB)" }, { status: 413 });
    }

    // Validate type
    if (entryType === "photo" && !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Type de fichier non supporté" }, { status: 400 });
    }
    if (entryType === "audio" && !file.type.startsWith("audio/") && !file.type.includes("webm")) {
      return NextResponse.json({ error: "Type de fichier non supporté" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { userId: auth.session.userId },
      select: { id: true },
    });
    if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

    // Save file locally
    const ext = entryType === "photo"
      ? file.name.split(".").pop() || "jpg"
      : file.name.split(".").pop() || "webm";
    const filename = `${Date.now()}.${ext}`;
    const dir = join(process.cwd(), "uploads", "journal", client.id);
    await mkdir(dir, { recursive: true });

    const bytes = await file.arrayBuffer();
    await writeFile(join(dir, filename), Buffer.from(bytes));

    const mediaUrl = `/uploads/journal/${client.id}/${filename}`;

    // Create journal entry
    const entry = await prisma.journalEntry.create({
      data: {
        clientId: client.id,
        content: caption?.trim() || "",
        entryType,
        mediaUrl,
        isPrivate: isPrivateStr === "true",
        mood: mood?.trim() || null,
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    console.error("[journal/upload] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
