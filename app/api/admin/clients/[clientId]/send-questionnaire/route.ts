import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// POST /api/admin/clients/[clientId]/send-questionnaire — Envoyer un questionnaire au client
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;
  const { questionnaireId } = await request.json();

  if (!questionnaireId) {
    return NextResponse.json({ error: "questionnaireId requis" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { user: { select: { email: true, name: true } } },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const questionnaire = await prisma.questionnaire.findUnique({
    where: { id: questionnaireId },
  });

  if (!questionnaire) {
    return NextResponse.json({ error: "Questionnaire introuvable" }, { status: 404 });
  }

  // Creer ou recuperer la reponse existante
  const existing = await prisma.questionnaireResponse.findUnique({
    where: { questionnaireId_clientId: { questionnaireId, clientId } },
  });

  let response;
  if (existing) {
    // Reset si deja soumis (renvoyer)
    response = await prisma.questionnaireResponse.update({
      where: { id: existing.id },
      data: { status: "PENDING", answers: Prisma.DbNull, submittedAt: null },
    });
  } else {
    response = await prisma.questionnaireResponse.create({
      data: { questionnaireId, clientId, status: "PENDING" },
    });
  }

  // Envoyer email au client
  const lang = client.language === "EN" ? "EN" : "FR";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const link = `${baseUrl}/client/questionnaire/${response.id}`;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const { sendInvitationEmail } = await import("@/lib/mailer");
      const { transporter } = await import("@/lib/mailer");

      const subject = lang === "EN"
        ? "Your BeeFrequency intake form is ready"
        : "Ton questionnaire BeeFrequency est pret";

      const body = lang === "EN"
        ? `Hello ${client.user.name?.split(" ")[0] || ""},\n\nYour questionnaire is ready. Please complete it at your earliest convenience:\n${link}\n\nJoffrey`
        : `Bonjour ${client.user.name?.split(" ")[0] || ""},\n\nTon questionnaire est pret. Complete-le quand tu peux :\n${link}\n\nJoffrey`;

      await transporter.sendMail({
        from: `"${process.env.FROM_NAME || "Joffrey Deleplanque"}" <${process.env.FROM_EMAIL || "admin@beefrequency.com"}>`,
        to: client.user.email,
        subject,
        text: body,
      });
    } catch (err) {
      console.error("[send-questionnaire] Email error:", err);
      // Continue — email failure should not block
    }
  }

  return NextResponse.json({ response, link });
}
