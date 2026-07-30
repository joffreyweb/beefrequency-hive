import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.caption !== undefined) data.caption = body.caption ? String(body.caption).trim() : null;
  if (body.hashtags !== undefined) data.hashtags = body.hashtags ? String(body.hashtags).trim() : null;
  if (body.mediaRef !== undefined) data.mediaRef = body.mediaRef ? String(body.mediaRef).trim() : null;
  if (body.format !== undefined) data.format = body.format ? String(body.format).trim() : null;
  if (body.pinned !== undefined) data.pinned = !!body.pinned;
  if (body.order !== undefined) data.order = body.order;
  if (body.projectId !== undefined) data.projectId = body.projectId || null;
  if (body.status === "TODO" || body.status === "POSTED") data.status = body.status;

  const post = await prisma.contentPost.update({ where: { id }, data });
  return NextResponse.json({ post });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  await prisma.contentPost.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
