import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-utils";

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
    });

    return NextResponse.json({ practices });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
