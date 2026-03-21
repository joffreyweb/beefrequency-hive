import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET — Liste tous les templates, ordonnés par dayTrigger, avec le nombre de logs
export async function GET() {
  try {
    const authResult = await requireAdmin();
    if (isErrorResponse(authResult)) return authResult;

    const templates = await prisma.journeyMessageTemplate.findMany({
      orderBy: { dayTrigger: "asc" },
      include: {
        _count: { select: { logs: true } },
      },
    });

    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST — Crée un nouveau template de message parcours
// Body : { title, dayTrigger, triggerType, hdVariants, isActive }
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (isErrorResponse(authResult)) return authResult;

    const { title, dayTrigger, triggerType, hdVariants, isActive } =
      await request.json();

    if (!title || dayTrigger === undefined || !triggerType || !hdVariants) {
      return NextResponse.json(
        { error: "title, dayTrigger, triggerType et hdVariants requis" },
        { status: 400 }
      );
    }

    // hdVariants peut être un objet ou une string JSON
    const hdVariantsString =
      typeof hdVariants === "string" ? hdVariants : JSON.stringify(hdVariants);

    const template = await prisma.journeyMessageTemplate.create({
      data: {
        title,
        dayTrigger,
        triggerType,
        hdVariants: hdVariantsString,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
