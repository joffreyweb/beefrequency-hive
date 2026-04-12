import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { subscribers } = body;

    if (!Array.isArray(subscribers)) {
      return NextResponse.json({ error: "Format invalide" }, { status: 400 });
    }

    let created = 0;
    let skipped = 0;

    for (const sub of subscribers) {
      if (!sub.email) { skipped++; continue; }
      try {
        await prisma.newsletterSubscriber.upsert({
          where: { email: sub.email.toLowerCase().trim() },
          create: {
            email: sub.email.toLowerCase().trim(),
            firstName: sub.firstName || null,
            lastName: sub.lastName || null,
            source: sub.source || "manual",
            tags: sub.tags || [],
            segments: sub.segments || [],
          },
          update: {},
        });
        created++;
      } catch {
        skipped++;
      }
    }

    return NextResponse.json({ created, skipped, total: subscribers.length });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
