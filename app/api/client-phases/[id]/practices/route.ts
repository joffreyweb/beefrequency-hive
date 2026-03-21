import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST — assigner une pratique à une phase
export async function POST(req: Request, ctx: RouteContext) {
  const result = await requireAdmin();
  if (isErrorResponse(result)) return result;

  const { id: clientPhaseId } = await ctx.params;
  const body = await req.json();
  const { type, title, description, duration, frequency } = body;

  if (!type || !title) {
    return NextResponse.json({ error: "type et title requis" }, { status: 400 });
  }

  const practice = await prisma.phasePractice.create({
    data: {
      clientPhaseId,
      type,
      title,
      description,
      duration,
      frequency: frequency || "DAILY",
    },
  });

  return NextResponse.json({ practice }, { status: 201 });
}

// DELETE — retirer une pratique (query: phasePracticeId)
export async function DELETE(req: Request) {
  const result = await requireAdmin();
  if (isErrorResponse(result)) return result;

  const { searchParams } = new URL(req.url);
  const phasePracticeId = searchParams.get("phasePracticeId");
  if (!phasePracticeId) {
    return NextResponse.json({ error: "phasePracticeId requis" }, { status: 400 });
  }

  await prisma.phasePractice.delete({ where: { id: phasePracticeId } });

  return NextResponse.json({ ok: true });
}
