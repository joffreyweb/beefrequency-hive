import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// ═══════════════════════════════════════
// Moteur d'analyse IA — génère les 4 analyses + synthèse
// ═══════════════════════════════════════

/** Appelle l'API Claude et retourne le texte brut de la réponse */
async function callClaude(system: string, user: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API error: ${res.status}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

/** Tente de parser du JSON depuis une réponse (nettoie les code fences éventuels) */
function tryParseJSON(raw: string): string {
  // Nettoyer les éventuels code fences markdown
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  // Vérifier que c'est du JSON valide
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    // Si le JSON est invalide, on retourne le texte brut quand même
    return raw;
  }
}

/** Génère les analyses IA pour un client donné */
export async function generateAnalysis(clientId: string) {
  // 1. Charger le ClientIntake
  const intake = await prisma.clientIntake.findUnique({
    where: { clientId },
  });

  if (!intake) {
    return { error: "Intake introuvable pour ce client", status: 404 };
  }

  // 2. Mettre à jour le statut → GENERATING (upsert)
  await prisma.clientAnalysis.upsert({
    where: { clientId },
    create: { clientId, status: "GENERATING" },
    update: { status: "GENERATING" },
  });

  // 3. Préparer les données de naissance
  const birthDate = intake.birthDate.toISOString().split("T")[0];
  const birthTime = intake.birthTime || "unknown";
  const { birthPlace, birthCountry, firstName, lastName, intention } = intake;

  // 4. Lancer les 4 analyses en parallèle
  const [astroResult, hdResult, numResult, baziResult] = await Promise.allSettled([
    // Call 1 — Astrologie occidentale
    callClaude(
      "You are an expert astrologer. Analyze this natal chart data and provide insights in French. Return ONLY valid JSON, no markdown code fences.",
      `Birth data: date=${birthDate}, time=${birthTime}, place=${birthPlace}, country=${birthCountry}. Generate a natal chart analysis with these exact JSON keys: sunSign, moonSign, ascendant, dominantPlanets (array of strings), corePersonality (text), lifeThemes (array of 3 strings), shadowAspects (text), gifts (text)`
    ),
    // Call 2 — Human Design
    callClaude(
      "You are a Human Design expert. Return ONLY valid JSON in French, no markdown code fences.",
      `Birth data: date=${birthDate}, time=${birthTime}, place=${birthPlace}, country=${birthCountry}. Generate: type (Manifestor/Generator/MG/Projector/Reflector), profile (e.g. 2/4), authority, strategy, definedCenters (array), openCenters (array), lifeTheme (text), notSelf (text), signature (text)`
    ),
    // Call 3 — Numérologie
    callClaude(
      "You are a numerology expert. Return ONLY valid JSON in French, no markdown code fences.",
      `Full name: ${firstName} ${lastName}, birth date: ${birthDate}. Calculate and interpret: lifePath (object with number and meaning), expression (object with number and meaning), soulUrge (object with number and meaning), personalYear (object with number and meaning), masterNumbers (array if applicable, empty array if none)`
    ),
    // Call 4 — BaZi
    callClaude(
      "You are a BaZi (Chinese astrology) expert. Return ONLY valid JSON in French, no markdown code fences.",
      `Birth: date=${birthDate}, time=${birthTime}. Generate: dayMaster (object with element and animal), fourPillars (object with year/month/day/hour each having stem and branch), dominantElement, lifePhase (text about current 10-year luck pillar), strengths (array), challenges (array)`
    ),
  ]);

  // Extraire les résultats (ou null si erreur)
  const astro = astroResult.status === "fulfilled" ? tryParseJSON(astroResult.value) : null;
  const hd = hdResult.status === "fulfilled" ? tryParseJSON(hdResult.value) : null;
  const num = numResult.status === "fulfilled" ? tryParseJSON(numResult.value) : null;
  const bazi = baziResult.status === "fulfilled" ? tryParseJSON(baziResult.value) : null;

  // Vérifier si au moins un résultat a réussi
  const hasAnyResult = astro || hd || num || bazi;

  if (!hasAnyResult) {
    // Tout a échoué — marquer comme ERROR
    await prisma.clientAnalysis.update({
      where: { clientId },
      data: {
        status: "ERROR",
        updatedAt: new Date(),
      },
    });
    return { error: "Toutes les analyses ont échoué", status: 500 };
  }

  // 5. Lancer la synthèse globale
  let synthesis: string | null = null;
  try {
    synthesis = await callClaude(
      "You are Joffrey Deleplanque's strategic AI assistant. You analyze people deeply to help him guide their transformation. Write in French, warm and precise. Use markdown formatting.",
      `Based on this complete profile analysis:
Astrology: ${astro || "Non disponible"}
Human Design: ${hd || "Non disponible"}
Numerology: ${num || "Non disponible"}
BaZi: ${bazi || "Non disponible"}
Client intention: ${intention}

Write a 400-word synthesis in markdown for Joffrey with these exact sections:
## Essence
## Forces profondes
## Défis de transformation
## Ce à quoi faire attention
## Recommandations pour l'accompagnement`
    );
  } catch {
    // La synthèse a échoué, on continue avec ce qu'on a
  }

  // 6. Sauvegarder les résultats
  const hasError =
    astroResult.status === "rejected" ||
    hdResult.status === "rejected" ||
    numResult.status === "rejected" ||
    baziResult.status === "rejected" ||
    !synthesis;

  await prisma.clientAnalysis.update({
    where: { clientId },
    data: {
      astroWestern: astro,
      humanDesign: hd,
      numerology: num,
      bazi,
      synthesisMarkdown: synthesis,
      status: hasError ? "ERROR" : "COMPLETE",
      generatedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return { success: true, status: hasError ? "PARTIAL" : "COMPLETE" };
}

// ═══════════════════════════════════════
// Route POST — Lancer la génération d'analyse
// ═══════════════════════════════════════

export async function POST(request: Request) {
  // Vérification admin
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json({ error: "clientId requis" }, { status: 400 });
    }

    // Vérifier que le client existe
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    // Lancer la génération
    const result = await generateAnalysis(clientId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, status: result.status });
  } catch (error) {
    console.error("Erreur génération analyse:", error);
    return NextResponse.json(
      { error: "Erreur interne lors de la génération" },
      { status: 500 }
    );
  }
}
