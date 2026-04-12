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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erreur envoi relance:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
