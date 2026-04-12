import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-utils";

export async function GET() {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const client = await prisma.client.findUnique({
    where: { userId: auth.session.userId },
    select: {
      language: true,
      timezone: true,
      intake: {
        select: {
          postalAddress: true,
          addressLine2: true,
          city: true,
          postalCode: true,
          country: true,
          phoneNumber: true,
        },
      },
      user: {
        select: { email: true },
      },
    },
  });

  return NextResponse.json(client);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();

  // Language update on Client
  if (body.language && (body.language === "EN" || body.language === "FR")) {
    await prisma.client.update({
      where: { userId: auth.session.userId },
      data: { language: body.language },
    });
  }

  // Timezone update on Client
  if (body.timezone && typeof body.timezone === "string") {
    await prisma.client.update({
      where: { userId: auth.session.userId },
      data: { timezone: body.timezone },
    });
  }

  // Address / phone update on ClientIntake
  const addressFields = ["postalAddress", "addressLine2", "city", "postalCode", "country", "phoneNumber"];
  const intakeUpdate: Record<string, string> = {};
  for (const field of addressFields) {
    if (body[field] !== undefined) {
      intakeUpdate[field] = body[field];
    }
  }

  if (Object.keys(intakeUpdate).length > 0) {
    const client = await prisma.client.findUnique({
      where: { userId: auth.session.userId },
      select: { id: true },
    });
    if (client) {
      await prisma.clientIntake.updateMany({
        where: { clientId: client.id },
        data: intakeUpdate,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
