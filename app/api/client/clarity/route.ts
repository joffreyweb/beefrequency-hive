import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";
import { transporter } from "@/lib/mailer";

// Clarity by Beefrequency — API client CONNECTÉ (requireClient).
// La ligne ClaritySubmission est créée par l'admin (activation). Le client ne
// peut que la remplir/soumettre. Réponses stockées À PLAT : { "mapIdx-secIdx-qIdx": texte }.
// Aucune fuite : ni reportToken ni reportMd ne sont renvoyés côté remplissage.

async function getClientId(userId: string): Promise<string | null> {
  const client = await prisma.client.findUnique({
    where: { userId },
    select: { id: true },
  });
  return client?.id ?? null;
}

// GET — le client charge son Clarity (état + réponses déjà saisies).
export async function GET() {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;

  const clientId = await getClientId(auth.session.userId);
  if (!clientId) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const submission = await prisma.claritySubmission.findUnique({
    where: { clientId },
    select: { status: true, answers: true, sectionsDone: true, submittedAt: true },
  });
  if (!submission) return NextResponse.json({ error: "Clarity non activé" }, { status: 404 });

  return NextResponse.json({ submission });
}

// PATCH — sauvegarde incrémentale. Body: { answers: {clé: texte}, sectionsDone?: number }
// Fusionne les clés fournies dans answers (merge à plat), met à jour sectionsDone, passe IN_PROGRESS.
export async function PATCH(request: NextRequest) {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;

  let body: { answers?: Record<string, unknown>; sectionsDone?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const { answers, sectionsDone } = body;
  if (answers == null || typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json({ error: "answers (objet) requis" }, { status: 400 });
  }

  const clientId = await getClientId(auth.session.userId);
  if (!clientId) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const submission = await prisma.claritySubmission.findUnique({
    where: { clientId },
    select: { id: true, status: true, answers: true, sectionsDone: true },
  });
  if (!submission) return NextResponse.json({ error: "Clarity non activé" }, { status: 404 });

  if (submission.status !== "DRAFT" && submission.status !== "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Ce Clarity est déjà soumis — modification impossible." },
      { status: 409 }
    );
  }

  const current = (submission.answers as Record<string, unknown>) ?? {};
  Object.assign(current, answers);

  const nextSectionsDone =
    typeof sectionsDone === "number" && Number.isFinite(sectionsDone)
      ? Math.max(submission.sectionsDone, Math.floor(sectionsDone))
      : submission.sectionsDone;

  const updated = await prisma.claritySubmission.update({
    where: { id: submission.id },
    data: {
      answers: current as object,
      sectionsDone: nextSectionsDone,
      status: submission.status === "DRAFT" ? "IN_PROGRESS" : submission.status,
    },
    select: { status: true, sectionsDone: true },
  });

  return NextResponse.json({ submission: updated });
}

// POST — soumission finale. Statut SUBMITTED + notif admin.
export async function POST() {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;

  const clientId = await getClientId(auth.session.userId);
  if (!clientId) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      user: { select: { name: true, email: true } },
      intake: { select: { firstName: true } },
      claritySubmission: { select: { id: true, status: true } },
    },
  });
  if (!client || !client.claritySubmission) {
    return NextResponse.json({ error: "Clarity non activé" }, { status: 404 });
  }

  const sub = client.claritySubmission;
  if (sub.status !== "DRAFT" && sub.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Ce Clarity est déjà soumis." }, { status: 409 });
  }

  const updated = await prisma.claritySubmission.update({
    where: { id: sub.id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
    select: { status: true, submittedAt: true },
  });

  const clientName = client.intake?.firstName || client.user.name;

  import("@/lib/notifications")
    .then(({ notifyAdmin }) =>
      notifyAdmin({
        clientId,
        title: `Clarity soumis : ${clientName}`,
        description: "Le client a soumis son Clarity — synthèse à générer.",
        urgency: "amber",
      })
    )
    .catch(() => {});

  const adminEmail = process.env.FROM_EMAIL || "admin@beefrequency.com";
  // Fire-and-forget : ne JAMAIS bloquer la soumission sur l'envoi d'email.
  // (En dev local, le SMTP n'est pas configuré → un await gèlerait la réponse.)
  transporter
    .sendMail({
      from: `"Hive — Clarity" <${adminEmail}>`,
      to: adminEmail,
      subject: `Clarity soumis — ${clientName}`,
      text: `${clientName} (${client.user.email}) a soumis son Clarity.\n\nGénère la synthèse depuis la fiche client sur la Hive.`,
    })
    .catch((err) => console.error("[clarity] Email error:", err));

  return NextResponse.json({ submission: updated });
}
