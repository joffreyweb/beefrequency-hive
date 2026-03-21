import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET — Liste toutes les recommandations du catalogue (admin uniquement)
export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const recommendations = await prisma.recommendation.findMany({
      orderBy: [{ category: "asc" }, { title: "asc" }],
      include: {
        _count: { select: { clientRecommendations: true } },
      },
    });

    return NextResponse.json({ recommendations });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Créer une recommandation (admin uniquement)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { title, description, url, category, imageUrl, isGlobal } =
      await request.json();

    // Validation des champs obligatoires
    if (!title || !description || !url || !category) {
      return NextResponse.json(
        { error: "Titre, description, URL et catégorie sont requis" },
        { status: 400 }
      );
    }

    const recommendation = await prisma.recommendation.create({
      data: {
        title,
        description,
        url,
        category,
        imageUrl: imageUrl ?? null,
        isGlobal: isGlobal ?? false,
      },
    });

    return NextResponse.json({ recommendation }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
