import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const campaigns = await prisma.newsletterCampaign.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ campaigns });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();
  const { name, subject, previewText, content, targetTags, targetSegments, excludeTags } = body;

  if (!name || !subject || !content) {
    return NextResponse.json({ error: "Champs requis : name, subject, content" }, { status: 400 });
  }

  const campaign = await prisma.newsletterCampaign.create({
    data: {
      name,
      subject,
      previewText: previewText || null,
      content,
      targetTags: targetTags || [],
      targetSegments: targetSegments || [],
      excludeTags: excludeTags || [],
    },
  });

  return NextResponse.json({ campaign });
}
