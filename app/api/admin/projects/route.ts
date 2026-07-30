import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET /api/admin/projects — liste des projets/chantiers (+ compteur de tâches ouvertes).
export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const projects = await prisma.project.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { tasks: true } } },
  });

  return NextResponse.json({ projects });
}

// POST /api/admin/projects
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { name, color, type } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "name requis" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      color: color?.trim() || "#B8821E",
      type: type?.trim() || null,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}
