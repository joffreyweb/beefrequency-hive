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

  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json({ error: "Campagne non trouv\u00e9e" }, { status: 404 });
  }
  if (campaign.status === "sent" || campaign.status === "sending") {
    return NextResponse.json({ error: "Campagne d\u00e9j\u00e0 envoy\u00e9e" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.subject !== undefined) data.subject = body.subject;
  if (body.previewText !== undefined) data.previewText = body.previewText;
  if (body.content !== undefined) data.content = body.content;
  if (body.targetTags !== undefined) data.targetTags = body.targetTags;
  if (body.targetSegments !== undefined) data.targetSegments = body.targetSegments;
  if (body.excludeTags !== undefined) data.excludeTags = body.excludeTags;

  const updated = await prisma.newsletterCampaign.update({
    where: { id },
    data,
  });

  return NextResponse.json({ campaign: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json({ error: "Non trouv\u00e9e" }, { status: 404 });
  }
  if (campaign.status === "sent") {
    return NextResponse.json({ error: "Impossible de supprimer une campagne envoy\u00e9e" }, { status: 400 });
  }

  await prisma.newsletterCampaign.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
