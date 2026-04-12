import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const activities = await prisma.prospectActivity.findMany({
    where: { prospectId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ activities });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const body = await request.json();

  if (!body.type) {
    return NextResponse.json({ error: "Type requis" }, { status: 400 });
  }

  const activity = await prisma.prospectActivity.create({
    data: {
      prospectId: id,
      type: body.type,
      content: body.content || null,
      outcome: body.outcome || null,
    },
  });

  // Update touchpoints and lastContactAt
  await prisma.prospect.update({
    where: { id },
    data: {
      touchpoints: { increment: 1 },
      lastContactAt: new Date(),
    },
  });

  return NextResponse.json({ activity });
}
