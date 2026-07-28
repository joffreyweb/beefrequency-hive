import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { generateClarityReport } from "@/lib/clarity/ollama";

// POST — Active Clarity (upsert DRAFT idempotent, ne touche pas une submission existante).
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;
  const { clientId } = await params;

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const submission = await prisma.claritySubmission.upsert({
    where: { clientId },
    create: { clientId, status: "DRAFT" },
    update: {},
    select: { id: true, status: true, sectionsDone: true, createdAt: true },
  });
  return NextResponse.json({ submission });
}

// GET — Détail complet (admin) : réponses brutes + rapport + token. Jamais exposé côté client.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;
  const { clientId } = await params;

  const submission = await prisma.claritySubmission.findUnique({
    where: { clientId },
    select: {
      id: true, status: true, sectionsDone: true, answers: true, reportMd: true,
      reportToken: true, submittedAt: true, generatedAt: true, publishedAt: true,
    },
  });
  return NextResponse.json({ submission: submission ?? null });
}

// PATCH — Actions rapport : generate | save | publish | unpublish
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;
  const { clientId } = await params;
  const { action, reportMd } = await request.json();

  const sub = await prisma.claritySubmission.findUnique({ where: { clientId } });
  if (!sub) return NextResponse.json({ error: "Clarity non activé pour ce client" }, { status: 404 });

  // --- Générer la synthèse via Ollama (VPS) ---
  if (action === "generate") {
    if (!["SUBMITTED", "READY", "GENERATING", "PUBLISHED"].includes(sub.status)) {
      return NextResponse.json({ error: "Le client doit d'abord soumettre son questionnaire." }, { status: 409 });
    }
    await prisma.claritySubmission.update({ where: { clientId }, data: { status: "GENERATING" } });
    // Génération EN FOND : Ollama (CPU) peut prendre plusieurs minutes ; on NE bloque PAS la
    // requête (sinon timeout proxy → statut coincé). Le front rafraîchit tout seul jusqu'à READY.
    const clarityAnswers = (sub.answers as Record<string, string>) || {};
    const hadReport = !!sub.reportMd;
    void generateClarityReport(clarityAnswers)
      .then((md) =>
        prisma.claritySubmission.update({
          where: { clientId },
          data: { reportMd: md, status: "READY", generatedAt: new Date() },
        }),
      )
      .catch(() =>
        prisma.claritySubmission
          .update({ where: { clientId }, data: { status: hadReport ? "READY" : "SUBMITTED" } })
          .catch(() => {}),
      );
    return NextResponse.json({ submission: { status: "GENERATING" } });
  }

  // --- Enregistrer les retouches admin du rapport ---
  if (action === "save") {
    const updated = await prisma.claritySubmission.update({
      where: { clientId },
      data: {
        reportMd: typeof reportMd === "string" ? reportMd : sub.reportMd,
        status: sub.status === "PUBLISHED" ? "PUBLISHED" : "READY",
      },
      select: { status: true, reportMd: true },
    });
    return NextResponse.json({ submission: updated });
  }

  // --- Publier (rend le rapport visible via /r/[reportToken]) ---
  if (action === "publish") {
    if (!sub.reportMd || !sub.reportMd.trim()) {
      return NextResponse.json({ error: "Aucun rapport à publier." }, { status: 409 });
    }
    const updated = await prisma.claritySubmission.update({
      where: { clientId },
      data: { status: "PUBLISHED", publishedAt: new Date() },
      select: { status: true, reportToken: true, publishedAt: true },
    });

    // Archive Clarity (rapport + réponses) vers kDrive (fire-and-forget)
    import("@/lib/kdrive-archive")
      .then(({ archiveClarityToKDrive }) => archiveClarityToKDrive(clientId))
      .catch((err) => console.error("[clarity] kDrive archive error:", err));

    return NextResponse.json({ submission: updated });
  }

  // --- Dépublier (repasse en READY, le lien /r n'affiche plus le rapport) ---
  if (action === "unpublish") {
    const updated = await prisma.claritySubmission.update({
      where: { clientId }, data: { status: "READY" }, select: { status: true },
    });
    return NextResponse.json({ submission: updated });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}

// DELETE — Désactive Clarity, uniquement si rien n'a été rempli (garde-fou anti-perte).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;
  const { clientId } = await params;

  const existing = await prisma.claritySubmission.findUnique({
    where: { clientId },
    select: { id: true, status: true, sectionsDone: true, answers: true },
  });
  if (!existing) return NextResponse.json({ ok: true, alreadyInactive: true });

  const answersObj = existing.answers as Record<string, unknown> | null;
  const hasAnswers =
    existing.sectionsDone > 0 ||
    (answersObj != null && typeof answersObj === "object" && Object.keys(answersObj).length > 0);

  if (existing.status !== "DRAFT" || hasAnswers) {
    return NextResponse.json(
      { error: "Impossible de désactiver : le client a déjà commencé son Clarity. Les réponses sont protégées." },
      { status: 409 }
    );
  }

  await prisma.claritySubmission.delete({ where: { clientId } });
  return NextResponse.json({ ok: true });
}
