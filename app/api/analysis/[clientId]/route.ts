import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { generateAnalysis } from "@/app/api/analysis/generate/route";

// ═══════════════════════════════════════
// GET — Consulter l'analyse d'un client
// ═══════════════════════════════════════

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;

  const analysis = await prisma.clientAnalysis.findUnique({
    where: { clientId },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analyse introuvable" }, { status: 404 });
  }

  // Parser les JSON strings en objets pour la réponse
  const parsed = {
    ...analysis,
    astroWestern: analysis.astroWestern ? tryParseField(analysis.astroWestern) : null,
    humanDesign: analysis.humanDesign ? tryParseField(analysis.humanDesign) : null,
    numerology: analysis.numerology ? tryParseField(analysis.numerology) : null,
    bazi: analysis.bazi ? tryParseField(analysis.bazi) : null,
  };

  return NextResponse.json(parsed);
}

// ═══════════════════════════════════════
// POST — Regénérer l'analyse d'un client
// ═══════════════════════════════════════

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;

  // Vérifier que le client existe
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  // Reset du statut et lancement de la génération
  await prisma.clientAnalysis.upsert({
    where: { clientId },
    create: { clientId, status: "GENERATING" },
    update: { status: "GENERATING" },
  });

  try {
    const result = await generateAnalysis(clientId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, status: result.status });
  } catch (error) {
    console.error("Erreur regénération analyse:", error);
    return NextResponse.json(
      { error: "Erreur interne lors de la regénération" },
      { status: 500 }
    );
  }
}

/** Tente de parser un champ JSON, retourne l'objet ou le texte brut */
function tryParseField(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
