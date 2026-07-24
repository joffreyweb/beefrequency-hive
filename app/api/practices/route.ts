import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, isErrorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  try {
    const where: any = {};
    if (category) where.category = category;

    const practices = await prisma.practice.findMany({
      where,
      orderBy: { title: "asc" },
      include: { _count: { select: { clientPractices: true } } },
    });

    return NextResponse.json({ practices });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


// POST — Créer une pratique (admin uniquement)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const data = await request.json();
    if (!data.title || !data.description || !data.type || !data.category) {
      return NextResponse.json(
        { error: "title, description, type et category sont requis" },
        { status: 400 }
      );
    }
    const contentValue =
      typeof data.content === "object" ? JSON.stringify(data.content) : (data.content ?? "");

    const practice = await prisma.practice.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        content: contentValue,
        category: data.category,
        subFolder: data.subFolder ?? null,
        isGlobal: data.isGlobal ?? false,
        dayTrigger: data.dayTrigger ?? null,
      },
    });
    return NextResponse.json({ practice });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
