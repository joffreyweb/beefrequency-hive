import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { sendReactivationEmail } from "@/lib/mailer";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { clientId } = await request.json();

    if (!clientId) {
      return NextResponse.json({ error: "clientId requis" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        user: { select: { email: true } },
        intake: { select: { firstName: true } },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    const firstName = client.intake?.firstName || "there";
    const lang = (client.language as "FR" | "EN") || "FR";

    await sendReactivationEmail({
      to: client.user.email,
      firstName,
      language: lang,
    });

    // Tracer la relance : anti-doublon (cron) + affichage « dernière relance »
    await prisma.client.update({
      where: { id: clientId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { lastReactivationAt: new Date(), reactivationCount: { increment: 1 } } as any,
    });

    return NextResponse.json({ ok: true, lastReactivationAt: new Date().toISOString() });
  } catch (error) {
    console.error("Erreur envoi relance:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
