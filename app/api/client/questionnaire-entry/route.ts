import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";
import { transporter } from "@/lib/mailer";

// GET /api/client/questionnaire-entry — Récupère ou crée l'entrée questionnaire
export async function GET() {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;
  const { session } = auth;

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  let entry = await prisma.questionnaireEntry.findUnique({
    where: { clientId: client.id },
  });

  // Auto-créer si inexistant
  if (!entry) {
    entry = await prisma.questionnaireEntry.create({
      data: { clientId: client.id },
    });
  }

  return NextResponse.json({ entry });
}

// PATCH /api/client/questionnaire-entry — Sauvegarde une section
// Body: { sectionId, answers, sectionNumber }
export async function PATCH(request: NextRequest) {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;
  const { session } = auth;

  const { sectionId, answers, sectionNumber } = await request.json();
  if (!sectionId || !answers) {
    return NextResponse.json({ error: "sectionId et answers requis" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const entry = await prisma.questionnaireEntry.findUnique({
    where: { clientId: client.id },
  });
  if (!entry) return NextResponse.json({ error: "Entrée introuvable" }, { status: 404 });

  // Merge les réponses
  const currentResponses = (entry.responses as Record<string, unknown>) || {};
  currentResponses[sectionId] = answers;

  const newSectionsDone = Math.max(entry.sectionsDone, sectionNumber);
  const newStatus = newSectionsDone > 0 && entry.status === "PENDING" ? "IN_PROGRESS" : entry.status;

  const updated = await prisma.questionnaireEntry.update({
    where: { id: entry.id },
    data: {
      responses: currentResponses as any,
      sectionsDone: newSectionsDone,
      status: newStatus,
    },
  });

  return NextResponse.json({ entry: updated });
}

// POST /api/client/questionnaire-entry — Soumission finale
export async function POST() {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;
  const { session } = auth;

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    include: {
      user: { select: { name: true, email: true } },
      intake: { select: { firstName: true } },
    },
  });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const entry = await prisma.questionnaireEntry.findUnique({
    where: { clientId: client.id },
  });
  if (!entry) return NextResponse.json({ error: "Entrée introuvable" }, { status: 404 });

  const updated = await prisma.questionnaireEntry.update({
    where: { id: entry.id },
    data: {
      status: "SUBMITTED",
      sectionsDone: 9,
      submittedAt: new Date(),
    },
  });

  // Archive questionnaire to kDrive (fire-and-forget)
  import("@/lib/kdrive-archive")
    .then(({ archiveQuestionnaireToKDrive }) => archiveQuestionnaireToKDrive(client.id))
    .catch((err) => console.error("[questionnaire-entry] kDrive archive error:", err));

  // Email notification admin
  const adminEmail = process.env.FROM_EMAIL || "admin@beefrequency.com";
  const clientName = client.intake?.firstName || client.user.name;
  try {
    await transporter.sendMail({
      from: `"Hive — Questionnaire" <${adminEmail}>`,
      to: adminEmail,
      subject: `Questionnaire soumis — ${clientName}`,
      text: `${clientName} (${client.user.email}) a soumis son questionnaire d'entrée.\n\nVoir dans la fiche client sur la Hive.`,
    });
  } catch (err) {
    console.error("[questionnaire-entry] Email error:", err);
  }

  return NextResponse.json({ entry: updated });
}
