import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import bcrypt from "bcryptjs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const body = await request.json();

  const prospect = await prisma.prospect.findUnique({ where: { id } });
  if (!prospect) {
    return NextResponse.json({ error: "Prospect non trouv\u00e9" }, { status: 404 });
  }
  if (prospect.clientId) {
    return NextResponse.json({ error: "D\u00e9j\u00e0 converti" }, { status: 400 });
  }

  const offerType = body.offerType || "MONITORING";
  const tempPassword = Math.random().toString(36).slice(-10);
  const hashed = await bcrypt.hash(tempPassword, 10);

  // Create User + Client
  const user = await prisma.user.create({
    data: {
      email: prospect.email,
      password: hashed,
      role: "CLIENT",
      name: [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") || prospect.email,
    },
  });

  // Find VisitorProfile if exists
  const visitorProfile = await prisma.visitorProfile.findUnique({
    where: { email: prospect.email },
  });

  const client = await prisma.client.create({
    data: {
      userId: user.id,
      offerType,
      status: "ACTIVE",
      acquisitionSource: prospect.source || null,
      acquisitionMedium: null,
      acquisitionCampaign: null,
      referredBy: prospect.referredBy || null,
      prospectId: prospect.id,
      visitorProfileId: visitorProfile?.id || null,
    },
  });

  // Link VisitorProfile if exists
  if (visitorProfile) {
    await prisma.visitorProfile.update({
      where: { id: visitorProfile.id },
      data: { clientId: client.id, convertedAt: new Date(), completed: true },
    });
  }

  // Mark prospect as converted
  await prisma.prospect.update({
    where: { id },
    data: {
      status: "won",
      convertedAt: new Date(),
      clientId: client.id,
    },
  });

  await prisma.prospectActivity.create({
    data: {
      prospectId: id,
      type: "status_change",
      content: `Converti en client (${client.id})`,
      outcome: "positive",
    },
  });

  return NextResponse.json({
    ok: true,
    clientId: client.id,
    userId: user.id,
    tempPassword,
  });
}
