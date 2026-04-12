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

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    include: {
      activities: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!prospect) {
    return NextResponse.json({ error: "Prospect non trouv\u00e9" }, { status: 404 });
  }

  return NextResponse.json({ prospect });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const body = await request.json();

  const allowedFields = [
    "firstName", "lastName", "phone", "company", "role",
    "source", "sourceDetail", "referredBy",
    "status", "temperature", "score",
    "budget", "timeline", "needs", "painPoints",
    "notes", "tags", "metadata",
    "nextFollowUpAt", "lastContactAt",
  ];

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === "nextFollowUpAt" || field === "lastContactAt") {
        data[field] = body[field] ? new Date(body[field]) : null;
      } else {
        data[field] = body[field];
      }
    }
  }

  // If status changed, log it as activity
  if (body.status) {
    const current = await prisma.prospect.findUnique({ where: { id }, select: { status: true } });
    if (current && current.status !== body.status) {
      await prisma.prospectActivity.create({
        data: {
          prospectId: id,
          type: "status_change",
          content: `${current.status} \u2192 ${body.status}`,
        },
      });
    }
  }

  const prospect = await prisma.prospect.update({
    where: { id },
    data,
  });

  return NextResponse.json({ prospect });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  await prisma.prospect.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
