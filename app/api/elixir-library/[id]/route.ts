import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH — modifier un élixir
export async function PATCH(req: Request, ctx: RouteContext) {
  const result = await requireAdmin();
  if (isErrorResponse(result)) return result;

  const { id } = await ctx.params;
  const body = await req.json();

  const elixir = await prisma.elixirLibrary.update({
    where: { id },
    data: body,
  });

  return NextResponse.json({ elixir });
}

// DELETE — supprimer un élixir
export async function DELETE(_req: Request, ctx: RouteContext) {
  const result = await requireAdmin();
  if (isErrorResponse(result)) return result;

  const { id } = await ctx.params;

  await prisma.elixirLibrary.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
