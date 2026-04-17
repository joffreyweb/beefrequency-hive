import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET — get checkin config for a phase
export async function GET(_req: Request, ctx: RouteContext) {
  const result = await requireAdmin();
  if (isErrorResponse(result)) return result;

  const { id: clientPhaseId } = await ctx.params;

  const configs = await prisma.phaseCheckinConfig.findMany({
    where: { clientPhaseId },
  });

  return NextResponse.json({
    morning: configs.find((c) => c.type === "morning") || null,
    evening: configs.find((c) => c.type === "evening") || null,
  });
}

// PUT — save checkin config for a phase
export async function PUT(req: Request, ctx: RouteContext) {
  const result = await requireAdmin();
  if (isErrorResponse(result)) return result;

  const { id: clientPhaseId } = await ctx.params;
  const body = await req.json();
  const { type, questions } = body;

  if (!type || !["morning", "evening"].includes(type)) {
    return NextResponse.json({ error: "type must be morning or evening" }, { status: 400 });
  }

  if (!Array.isArray(questions)) {
    return NextResponse.json({ error: "questions must be an array" }, { status: 400 });
  }

  const config = await prisma.phaseCheckinConfig.upsert({
    where: { clientPhaseId_type: { clientPhaseId, type } },
    create: { clientPhaseId, type, questions },
    update: { questions },
  });

  return NextResponse.json({ config });
}

// DELETE — reset to defaults (delete custom config)
export async function DELETE(req: Request, ctx: RouteContext) {
  const result = await requireAdmin();
  if (isErrorResponse(result)) return result;

  const { id: clientPhaseId } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type) {
    await prisma.phaseCheckinConfig.deleteMany({
      where: { clientPhaseId, type },
    });
  } else {
    await prisma.phaseCheckinConfig.deleteMany({
      where: { clientPhaseId },
    });
  }

  return NextResponse.json({ ok: true });
}
