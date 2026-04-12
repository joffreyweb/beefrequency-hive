import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.tags !== undefined) data.tags = body.tags;
  if (body.segments !== undefined) data.segments = body.segments;
  if (body.status !== undefined) {
    data.status = body.status;
    if (body.status === "unsubscribed") data.unsubscribedAt = new Date();
  }
  if (body.firstName !== undefined) data.firstName = body.firstName;
  if (body.lastName !== undefined) data.lastName = body.lastName;

  const subscriber = await prisma.newsletterSubscriber.update({
    where: { id },
    data,
  });

  return NextResponse.json({ subscriber });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  await prisma.newsletterSubscriber.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
