import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { sendInvitationEmail } from "@/lib/mailer";

// POST /api/admin/clients/[clientId]/send-invitation — Envoyer l'invitation par email
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;

  // Vérifier que le SMTP est configuré
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    return NextResponse.json(
      { error: "SMTP non configuré — ajoutez les variables SMTP dans .env" },
      { status: 503 }
    );
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  // Chercher le token d'invitation actif
  const invite = await prisma.inviteToken.findFirst({
    where: {
      email: client.user.email,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!invite) {
    return NextResponse.json(
      { error: "Aucune invitation active pour ce client — créez-en une d'abord" },
      { status: 404 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const inviteUrl = `${baseUrl}/register?token=${invite.token}`;

  try {
    await sendInvitationEmail({
      to: client.user.email,
      firstName: client.user.name?.split(" ")[0],
      inviteUrl,
      language: (client.language === "EN" ? "EN" : "FR") as "FR" | "EN",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[send-invitation] erreur SMTP:", err);
    return NextResponse.json(
      { error: "Erreur SMTP — vérifiez la configuration" },
      { status: 500 }
    );
  }
}
