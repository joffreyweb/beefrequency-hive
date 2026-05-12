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

  // Validation structurée : liste explicite des champs manquants
  const missing: string[] = [];
  if (!name || (typeof name === "string" && !name.trim())) missing.push("name");
  if (!description || (typeof description === "string" && !description.trim())) missing.push("description");
  if (!dosage || (typeof dosage === "string" && !dosage.trim())) missing.push("dosage");
  if (!unit) missing.push("unit");
  if (!category) missing.push("category");

  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "Validation failed",
        missing_fields: missing,
        message: `Les champs suivants sont requis : ${missing.join(", ")}`,
      },
      { status: 400 }
    );
  }

  const elixir = await prisma.elixirLibrary.create({
    data: { name, description, dosage, unit, category, timing: timing || "FLEXIBLE", notes },
  });

  return NextResponse.json({ elixir }, { status: 201 });
}
