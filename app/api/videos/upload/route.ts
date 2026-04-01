import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;

  try {
    const formData = await request.formData();
    const video = formData.get("video") as File;
    const seuil = formData.get("seuil") as string || "1";

    if (!video) {
      return NextResponse.json({ error: "Fichier vidéo requis" }, { status: 400 });
    }

    // Limite 100MB
    if (video.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 100MB)" }, { status: 413 });
    }

    const userId = auth.session.userId;
    const dir = join(process.cwd(), "uploads", "videos", userId);
    await mkdir(dir, { recursive: true });

    const bytes = await video.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `seuil-${seuil}.webm`;
    await writeFile(join(dir, filename), buffer);

    const videoPath = `${userId}/${filename}`;

    // Sauvegarder le path dans la DB
    if (seuil === "1") {
      await prisma.client.updateMany({
        where: { userId },
        data: { videoSeuil1Url: `/uploads/videos/${videoPath}` },
      });
    } else if (seuil === "1b") {
      await prisma.client.updateMany({
        where: { userId },
        data: { videoSeuil1BUrl: `/uploads/videos/${videoPath}` },
      });
    }

    return NextResponse.json({ success: true, path: videoPath });
  } catch (error) {
    console.error("[video upload] erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
