import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET /api/admin/content — damier Instagram (posts ordonnés). ?status=TODO|POSTED optionnel.
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const statusParam = request.nextUrl.searchParams.get("status");
  const where: { status?: "TODO" | "POSTED" } =
    statusParam === "TODO" || statusParam === "POSTED" ? { status: statusParam } : {};

  const posts = await prisma.contentPost.findMany({
    where,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { project: { select: { name: true, color: true } } },
  });

  return NextResponse.json({ posts });
}

// POST /api/admin/content — créer un post (carte/reel).
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title requis" }, { status: 400 });
  }

  const post = await prisma.contentPost.create({
    data: {
      title: body.title.trim(),
      caption: body.caption?.trim() || null,
      hashtags: body.hashtags?.trim() || null,
      mediaRef: body.mediaRef?.trim() || null,
      format: body.format?.trim() || null,
      pinned: !!body.pinned,
      order: typeof body.order === "number" ? body.order : 0,
      projectId: body.projectId || null,
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
