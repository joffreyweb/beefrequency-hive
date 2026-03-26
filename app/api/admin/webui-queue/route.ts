import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const pending = await prisma.openWebuiQueue.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(pending);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await request.json();
  await prisma.openWebuiQueue.update({
    where: { id },
    data: { status: "DONE", processedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
