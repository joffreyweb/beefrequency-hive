import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST — assigner un élixir à une phase (skip if duplicate)
export async function POST(req: Request, ctx: RouteContext) {
  const result = await requireAdmin();
  if (isErrorResponse(result)) return result;

  const { id: clientPhaseId } = await ctx.params;
  const body = await req.json();
  const { elixirLibraryId, dose, frequency, timing, notes } = body;

  if (!elixirLibraryId) {
    return NextResponse.json({ error: "elixirLibraryId requis" }, { status: 400 });
  }

  // Check for existing assignment with same elixir + timing on this phase
  const existing = await prisma.phaseElixir.findFirst({
    where: {
      clientPhaseId,
      elixirLibraryId,
      timing: timing || "FLEXIBLE",
    },
  });

  if (existing) {
    // Update existing instead of creating duplicate
    const updated = await prisma.phaseElixir.update({
      where: { id: existing.id },
      data: {
        dose,
        frequency: frequency || "DAILY",
        notes,
      },
      include: { elixirLibrary: true },
    });
    return NextResponse.json({ phaseElixir: updated });
  }

  const phaseElixir = await prisma.phaseElixir.create({
    data: {
      clientPhaseId,
      elixirLibraryId,
      dose,
      frequency: frequency || "DAILY",
      timing: timing || "FLEXIBLE",
      notes,
    },
    include: { elixirLibrary: true },
  });

  return NextResponse.json({ phaseElixir }, { status: 201 });
}

// PATCH — modifier un élixir assigné (query: phaseElixirId)
export async function PATCH(req: Request) {
  const result = await requireAdmin();
  if (isErrorResponse(result)) return result;

  const { searchParams } = new URL(req.url);
  const phaseElixirId = searchParams.get("phaseElixirId");
  if (!phaseElixirId) {
    return NextResponse.json({ error: "phaseElixirId requis" }, { status: 400 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.dose !== undefined) data.dose = body.dose;
  if (body.frequency !== undefined) data.frequency = body.frequency;
  if (body.timing !== undefined) data.timing = body.timing;
  if (body.notes !== undefined) data.notes = body.notes;

  const updated = await prisma.phaseElixir.update({
    where: { id: phaseElixirId },
    data,
    include: { elixirLibrary: true },
  });

  return NextResponse.json({ phaseElixir: updated });
}

// DELETE — retirer un élixir assigné (query: phaseElixirId)
export async function DELETE(req: Request) {
  const result = await requireAdmin();
  if (isErrorResponse(result)) return result;

  const { searchParams } = new URL(req.url);
  const phaseElixirId = searchParams.get("phaseElixirId");
  if (!phaseElixirId) {
    return NextResponse.json({ error: "phaseElixirId requis" }, { status: 400 });
  }

  await prisma.phaseElixir.delete({ where: { id: phaseElixirId } });

  return NextResponse.json({ ok: true });
}
