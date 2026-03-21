import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Types MIME acceptés
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Préfixe pour les images
function isAllowedMimeType(mime: string): boolean {
  if (ALLOWED_MIME_TYPES.includes(mime)) return true;
  if (mime.startsWith("image/")) return true;
  return false;
}

// Taille max : 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// GET — Liste les documents (admin avec clientId, client ses propres docs)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isErrorResponse(authResult)) return authResult;
    const { session } = authResult;

    let clientId: string;

    if (session.role === "ADMIN") {
      // Admin : clientId requis en query
      const { searchParams } = new URL(request.url);
      const paramClientId = searchParams.get("clientId");
      if (!paramClientId) {
        return NextResponse.json(
          { error: "Le paramètre clientId est requis" },
          { status: 400 }
        );
      }
      clientId = paramClientId;
    } else {
      // Client : récupère son propre clientId
      const client = await prisma.client.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      });
      if (!client) {
        return NextResponse.json(
          { error: "Client introuvable" },
          { status: 404 }
        );
      }
      clientId = client.id;
    }

    const documents = await prisma.clientDocument.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST — Upload un document (multipart/form-data)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isErrorResponse(authResult)) return authResult;
    const { session } = authResult;

    // Lecture du formulaire multipart
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Le fichier est requis" },
        { status: 400 }
      );
    }

    if (!category || !["ANALYSE", "IDENTITE", "MEDICAL", "AUTRE"].includes(category)) {
      return NextResponse.json(
        { error: "Catégorie invalide (ANALYSE, IDENTITE, MEDICAL, AUTRE)" },
        { status: 400 }
      );
    }

    // Vérification du type MIME
    if (!isAllowedMimeType(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé. Acceptés : PDF, images, Word" },
        { status: 400 }
      );
    }

    // Vérification de la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Le fichier dépasse la taille maximale de 10 MB" },
        { status: 400 }
      );
    }

    // Détermination du clientId
    let clientId: string;

    if (session.role === "ADMIN") {
      // Pour l'admin, le clientId peut être passé dans le formulaire
      const formClientId = formData.get("clientId") as string | null;
      if (!formClientId) {
        return NextResponse.json(
          { error: "Le paramètre clientId est requis pour un admin" },
          { status: 400 }
        );
      }
      clientId = formClientId;
    } else {
      const client = await prisma.client.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      });
      if (!client) {
        return NextResponse.json(
          { error: "Client introuvable" },
          { status: 404 }
        );
      }
      clientId = client.id;
    }

    // Création du dossier client si nécessaire
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "clients",
      clientId
    );
    await mkdir(uploadDir, { recursive: true });

    // Nom du fichier unique
    const uuid = randomUUID();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storedName = `${uuid}-${safeFileName}`;
    const filePath = path.join(uploadDir, storedName);

    // Écriture du fichier sur le disque
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // URL publique relative
    const fileUrl = `/uploads/clients/${clientId}/${storedName}`;

    // Création de l'entrée en base
    const uploadedBy = session.role as "CLIENT" | "ADMIN";
    const document = await prisma.clientDocument.create({
      data: {
        clientId,
        uploadedBy,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        category: category as "ANALYSE" | "IDENTITE" | "MEDICAL" | "AUTRE",
        readByAdmin: uploadedBy === "ADMIN",
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
