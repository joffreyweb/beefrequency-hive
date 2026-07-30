// Clarity — génération du rapport par le cerveau souverain (Ollama sur le VPS).
// Inférence 100% locale : les données ne quittent jamais le serveur (egress fermé).
import { CLARITY_MAPS, BLUEPRINT_SECTIONS, answerKey } from "./maps";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

type Answers = Record<string, string>;

/** Construit le prompt (voix de passeur, règles §14) à partir des réponses. */
export function buildClarityPrompt(answers: Answers): { system: string; prompt: string } {
  const system = [
    "Tu es l'assistant de rédaction de Joffrey Deleplanque (BeeFrequency), un passeur / bridge-walker.",
    "À partir des réponses d'un client à un questionnaire de clarté, tu rédiges un RAPPORT DE SYNTHÈSE personnel, chaleureux et incarné, en français, au format markdown.",
    "",
    "RÈGLES ABSOLUES :",
    "- Voix de passeur : chaleureuse, précise, jamais de jargon agressif.",
    "- N'emploie JAMAIS ces mots : coach, thérapeute, praticien, gratuit, venin, Lyme, alvéole, Da'at, méridien, MTC.",
    "- Ne cite JAMAIS les questions ni les réponses brutes : tu SYNTHÉTISES et reformules avec tes mots.",
    "- Tutoie le client (« tu »).",
    "- Reste fidèle à ce que le client a écrit ; n'invente aucun fait. Si une section est peu remplie, reste bref et honnête.",
    "- Markdown : un titre ## par section (utilise les intitulés de Blueprint fournis), **gras** pour les points clés, paragraphes courts.",
  ].join("\n");

  let body = "Voici les réponses du client, organisées par carte et par section.\n";
  CLARITY_MAPS.forEach((map, mapIdx) => {
    const parts: string[] = [];
    map.sections.forEach((sec, secIdx) => {
      const qs: string[] = [];
      sec.questions.forEach((q, qIdx) => {
        const a = (answers[answerKey(mapIdx, secIdx, qIdx)] || "").trim();
        if (a) qs.push(`- ${q.text.FR}\n  → ${a}`);
      });
      if (qs.length) parts.push(`**${sec.title.FR} — ${sec.sub.FR}**\n${qs.join("\n")}`);
    });
    if (parts.length) body += `\n### ${BLUEPRINT_SECTIONS[map.id]} (${map.label.FR})\n${parts.join("\n\n")}\n`;
  });

  const prompt = `${body}\n---\nRédige maintenant le rapport de synthèse complet en markdown, structuré selon les 5 sections du Blueprint ci-dessus (reprends leurs intitulés en titres ##). Commence par un court paragraphe d'accueil personnel, puis les 5 sections, puis une conclusion douce qui ouvre vers la suite. N'inclus AUCUNE question ni réponse brute — uniquement ta synthèse rédigée.`;

  return { system, prompt };
}

/** Appelle Ollama (VPS) et renvoie le rapport markdown. Lève en cas d'échec. */
export async function generateClarityReport(answers: Answers): Promise<string> {
  const { system, prompt } = buildClarityPrompt(answers);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 600_000); // 10 min max (CPU, questionnaire complet)
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_MODEL, system, prompt, stream: false, keep_alive: "30m", options: { temperature: 0.7 } }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Ollama HTTP ${res.status} ${t.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = String(data?.response || "").trim();
    if (!text) throw new Error("Réponse Ollama vide");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}
