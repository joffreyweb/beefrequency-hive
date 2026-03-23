import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Token invalide" }, { status: 401 });

    const formData = await request.formData();
    const video = formData.get("video") as File;
    const seuil = formData.get("seuil") as string;

    if (!video || !seuil) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const dir = join(process.cwd(), "uploads", "videos", payload.userId);
    await mkdir(dir, { recursive: true });

    const bytes = await video.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `seuil-${seuil}.webm`;
    await writeFile(join(dir, filename), buffer);

    return NextResponse.json({ success: true, path: `${payload.userId}/${filename}` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
