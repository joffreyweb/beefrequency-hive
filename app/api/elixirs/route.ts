import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET — Liste tous les élixirs avec stock (admin uniquement)
export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const elixirs = await prisma.elixir.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { prescriptions: true } },
      },
    });

    return NextResponse.json({ elixirs });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Créer un élixir (admin uniquement)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { name, description, dosage, duration, stock } =
      await request.json();

    // Validation des champs obligatoires
    if (!name || !description || !dosage || !duration) {
      return NextResponse.json(
        { error: "Nom, description, dosage et durée sont requis" },
        { status: 400 }
      );
    }

    const elixir = await prisma.elixir.create({
      data: {
        name,
        description,
        dosage,
        duration,
        stock: stock ?? 0,
      },
    });

    return NextResponse.json({ elixir }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
