import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/client/questionnaire/[responseId] — Charger le questionnaire pour le client
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ responseId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const { responseId } = await params;

  const response = await prisma.questionnaireResponse.findUnique({
    where: { id: responseId },
    include: {
      questionnaire: true,
      client: { select: { userId: true, language: true } },
    },
  });

  if (!response) {
    return NextResponse.json({ error: "Questionnaire introuvable" }, { status: 404 });
  }

  // Verifier que le client accede a son propre questionnaire
  if (session.role === "CLIENT" && response.client.userId !== session.userId) {
    return NextResponse.json({ error: "Acces interdit" }, { status: 403 });
  }

  // Si deja soumis — client ne voit plus les reponses
  if (session.role === "CLIENT" && response.status === "SUBMITTED") {
    return NextResponse.json({
      submitted: true,
      questionnaire: { title: response.questionnaire.title, type: response.questionnaire.type },
    });
  }

  return NextResponse.json({
    submitted: false,
    response: {
      id: response.id,
      status: response.status,
    },
    questionnaire: {
      id: response.questionnaire.id,
      title: response.questionnaire.title,
      type: response.questionnaire.type,
      questions: response.questionnaire.questions,
    },
    lang: response.client.language,
  });
}

// POST /api/client/questionnaire/[responseId] — Soumettre les reponses
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ responseId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "CLIENT") {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const { responseId } = await params;
  const { answers } = await request.json();

  const response = await prisma.questionnaireResponse.findUnique({
    where: { id: responseId },
    include: {
      client: { select: { userId: true }, include: { user: { select: { name: true } } } },
      questionnaire: { select: { type: true, title: true } },
    },
  });

  if (!response) {
    return NextResponse.json({ error: "Questionnaire introuvable" }, { status: 404 });
  }

  if (response.client.userId !== session.userId) {
    return NextResponse.json({ error: "Acces interdit" }, { status: 403 });
  }

  if (response.status === "SUBMITTED") {
    return NextResponse.json({ error: "Deja soumis" }, { status: 400 });
  }

  // Sauvegarder les reponses
  await prisma.questionnaireResponse.update({
    where: { id: responseId },
    data: {
      answers,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  // Notifier l'admin par email
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const { transporter } = await import("@/lib/mailer");
      const clientName = response.client.user.name || "Client";
      const qType = response.questionnaire.type === "PRE_START" ? "Pre-Start" : "Follow-Up";

      await transporter.sendMail({
        from: `"${process.env.FROM_NAME || "Joffrey Deleplanque"}" <${process.env.FROM_EMAIL || "admin@beefrequency.com"}>`,
        to: process.env.FROM_EMAIL || "admin@beefrequency.com",
        subject: `${clientName} a complete son questionnaire ${qType}`,
        text: `${clientName} vient de soumettre ses reponses au questionnaire "${response.questionnaire.title}" (${qType}).\n\nConsulter dans le cockpit Hive.`,
      });
    } catch (err) {
      console.error("[questionnaire-submit] Email admin notification error:", err);
    }
  }

  return NextResponse.json({ success: true });
}
