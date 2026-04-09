import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH — mettre à jour les champs d'une phase (customName, instructions, check-ins)
export async function PATCH(req: Request, ctx: RouteContext) {
  const result = await requireAdmin();
  if (isErrorResponse(result)) return result;

  const { id } = await ctx.params;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};

  if (body.customName !== undefined) updateData.customName = body.customName || null;
  if (body.instructions !== undefined) updateData.instructions = body.instructions || null;
  if (body.morningCheckinEnabled !== undefined) updateData.morningCheckinEnabled = Boolean(body.morningCheckinEnabled);
  if (body.eveningCheckinEnabled !== undefined) updateData.eveningCheckinEnabled = Boolean(body.eveningCheckinEnabled);
  if (body.checkinMode !== undefined) updateData.checkinMode = body.checkinMode;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });
  }

  const phase = await prisma.clientPhase.update({
    where: { id },
    data: updateData,
    include: {
      phaseElixirs: { include: { elixirLibrary: true } },
      phasePractices: true,
    },
  });

  return NextResponse.json({ phase });
}
