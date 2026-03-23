import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data, clientName } = await req.json();

  const prompt = `Tu es un expert en Human Design, formé sur les enseignements originaux de Ra Uru Hu et Jovian Archive.

Voici les données Human Design de ${clientName || "ce client"} :
- Type : ${data.hdType}
- Autorité intérieure : ${data.authority}
- Profil : ${data.profile}
- Définition : ${data.definition}
- Centres définis : ${data.definedCenters}
- Centres ouverts : ${data.openCenters}
- Gates principaux : ${data.gates}
- Canaux actifs : ${data.channels}
- Croix incarnée : ${data.incarnationCross}
- Notes : ${data.notes}

Génère une synthèse structurée en 5 sections pour guider Joffrey Deleplanque (thérapeute et passeur) dans son accompagnement et sa communication avec ce client. Reste fidèle aux enseignements de Ra Uru Hu.

FORMAT EXACT — 5 sections :

🧬 TYPE & STRATÉGIE
Comment cette personne est conçue pour fonctionner. Sa stratégie de vie. Son signe de reconnaissance (Signature) et son non-soi.

🎯 AUTORITÉ & DÉCISION
Comment cette personne prend ses meilleures décisions. Ce qu'il faut respecter dans le processus d'accompagnement.

💬 COMMENT COMMUNIQUER AVEC ELLE
Ton, rythme, style de communication adapté. Ce qui résonne. Ce qu'il faut éviter.

🌀 PATTERNS & ENJEUX
Ses conditionnements probables selon ses centres ouverts. Ses défis de vie selon son profil. Ce qui peut créer de la résistance.

🐝 POINTS D'ENTRÉE POUR LE TRAVAIL
Comment aborder le travail de transformation avec cette personne. Ses portes d'accès naturelles. Ce qui peut déclencher une vraie traversée.

Sois précis, pratique et ancré dans Ra Uru Hu. Pas de généralités. Chaque phrase doit être directement utile à Joffrey.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const result = await response.json();
  const synthesis = result.content?.[0]?.text || "";
  return NextResponse.json({ synthesis });
}
