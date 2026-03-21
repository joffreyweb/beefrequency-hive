import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET — liste tous les ElixirLibrary (filtrable par catégorie)
export async function GET(req: Request) {
  const result = await requireAdmin();
  if (isErrorResponse(result)) return result;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const where = category ? { category: category as any } : {};

  const elixirs = await prisma.elixirLibrary.findMany({
    where,
    orderBy: { name: "asc" },
    include: { _count: { select: { phaseElixirs: true } } },
  });

  return NextResponse.json({ elixirs });
}

// POST — créer un élixir dans la bibliothèque
export async function POST(req: Request) {
  const result = await requireAdmin();
  if (isErrorResponse(result)) return result;

  const body = await req.json();
  const { name, description, dosage, unit, category, timing, notes } = body;

  if (!name || !description || !dosage || !unit || !category) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const elixir = await prisma.elixirLibrary.create({
    data: { name, description, dosage, unit, category, timing: timing || "FLEXIBLE", notes },
  });

  return NextResponse.json({ elixir }, { status: 201 });
}
