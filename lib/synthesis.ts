import Anthropic from "@anthropic-ai/sdk";

// ═══════════════════════════════════════════════════════════════
// Synthèses des cartes — RAPPORT INTERNE approfondi (Joffrey seul)
// Moteur : Claude (API Anthropic). Registre clinique, français.
// Données réelles Swiss Ephemeris fournies en entrée (system A).
// ═══════════════════════════════════════════════════════════════

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_INTERNE =
  "Tu es l'assistant clinique de Joffrey Deleplanque, accompagnant en transformation profonde (30 ans d'expérience). " +
  "Tu rédiges des rapports STRICTEMENT INTERNES, destinés à Joffrey seul et jamais au client. " +
  "Écris en français, registre clinique : dense, précis, opérationnel. Pas de flatterie, pas de langue de bois, " +
  "pas de généralités d'horoscope. Chaque affirmation s'appuie sur les données fournies. " +
  "Format markdown : titres de section en '## ', sous-titres en '### ', gras avec **…**, listes avec '- '.";

async function generate(prompt: string, maxTokens = 2200): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system: SYSTEM_INTERNE,
    messages: [{ role: "user", content: prompt }],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}

// ─── Human Design ──────────────────────────────────────────────
export async function generateHDSynthesis(hdData: any, clientName: string): Promise<string> {
  return generate(
    `RAPPORT HUMAN DESIGN APPROFONDI — ${clientName}
Données calculées (Swiss Ephemeris) :
${JSON.stringify(hdData)}

Rédige un rapport interne structuré en markdown, sections dans cet ordre exact :

## Type & Stratégie
Le type énergétique, ce qu'il implique concrètement au quotidien, la stratégie juste (attendre / répondre / informer / initier), et le signe d'alignement vs. non-alignement.

## Autorité intérieure & prise de décision
L'autorité (émotionnelle, sacrale, splénique…) : comment cette personne prend une décision juste, à quel rythme, et les erreurs de décision typiques quand elle se coupe de son autorité.

## Profil & rôle incarné
Le profil (lignes), le rôle que la personne joue dans le monde, sa manière naturelle d'apprendre et de se relier.

## Mécanique énergétique — centres définis & ouverts
Ce que les centres définis rendent fiable/constant, et surtout ce que les centres ouverts rendent poreux : là où la personne absorbe, amplifie, se conditionne. Le plus utile cliniquement.

## Canaux & portes majeurs
Les 2-3 canaux/portes les plus structurants et ce qu'ils orientent dans la vie de la personne.

## Conditionnement & Non-Soi
Les pièges récurrents (le Non-Soi), les stratégies de survie qui la détournent d'elle-même, ce qui la fatigue ou l'amère.

## Points d'entrée pour l'accompagnement
3 à 5 leviers concrets et priorisés que Joffrey peut activer avec cette personne, reliés aux données ci-dessus.

Chaque section : 4 à 8 lignes, concret, jamais générique. Longueur totale visée : riche et complète.`,
    2400,
  );
}

// ─── Astrologie évolutive (Kaypacha) ──────────────────────────
export async function generateAstroSynthesis(astroData: any, clientName: string): Promise<string> {
  return generate(
    `RAPPORT ASTROLOGIE ÉVOLUTIVE (système Kaypacha) APPROFONDI — ${clientName}
Données calculées (Swiss Ephemeris — thème natal, progressions, révolution solaire, transits) :
${JSON.stringify(astroData)}

Rédige un rapport interne structuré en markdown, sections dans cet ordre exact :

## Thème de l'âme (Pluton)
La signature plutonienne : la blessure/intensité évolutive centrale, le domaine de vie où se joue la métamorphose.

## Bagage karmique (Nœud Sud + Lune)
Les schémas hérités, la zone de confort régressive, ce que la personne rejoue par sécurité.

## Direction évolutive (Nœud Nord)
Là où l'âme est appelée à grandir, le mouvement juste — souvent inconfortable — vers lequel tendre.

## Structure natale porteuse
Soleil / Lune / Ascendant et 2-3 aspects majeurs qui organisent la personnalité et les tensions internes.

## Année en cours — Révolution solaire & transits actifs
Le focus de l'année, les transits lourds actifs (Saturne, Pluton, Uranus, Neptune) et ce qu'ils ouvrent ou pressent maintenant.

## Points d'entrée pour l'accompagnement
3 à 5 leviers concrets et priorisés pour Joffrey, reliés aux configurations ci-dessus.

Registre : profond, orienté sens et évolution, jamais fataliste. Chaque section : 4 à 8 lignes, ancrée dans les données.`,
    2400,
  );
}

// ─── BaZi (Quatre Piliers) ────────────────────────────────────
export async function generateBaziSynthesis(baziData: any, clientName: string): Promise<string> {
  return generate(
    `RAPPORT BAZI (Quatre Piliers du Destin) APPROFONDI — ${clientName}
Données calculées :
${JSON.stringify(baziData)}

Rédige un rapport interne structuré en markdown, sections dans cet ordre exact :

## Maître du Jour & tempérament de fond
L'élément du Maître du Jour, sa force ou sa faiblesse dans le thème, le tempérament naturel qui en découle.

## Équilibre des cinq éléments
Les éléments en excès et ceux en manque, ce que ce déséquilibre produit concrètement (santé, émotions, relations, énergie).

## Dynamique des piliers
Ce que racontent les piliers (année/mois/jour/heure) : héritage, environnement, être profond, projection/enfants-projets.

## Cycle de chance actuel (Luck Pillar)
La phase de 10 ans en cours : ce qu'elle soutient ou éprouve, et le climat de l'année 2026.

## Fenêtres favorables & vigilances
Les leviers élémentaires à renforcer, les périodes/appuis porteurs, et les points de fragilité à surveiller.

## Points d'entrée pour l'accompagnement
3 à 5 leviers concrets pour Joffrey (hygiène de vie, timing, éléments à nourrir), reliés aux données.

Registre : concret, opérationnel. Chaque section : 3 à 6 lignes.`,
    2000,
  );
}

// ─── Numérologie ──────────────────────────────────────────────
export async function generateNumerologySynthesis(numData: any, clientName: string): Promise<string> {
  return generate(
    `RAPPORT NUMÉROLOGIE APPROFONDI — ${clientName}
Nombres calculés (chemin de vie, expression, âme, personnalité, anniversaire, maturité, éventuels nombres maîtres) :
${JSON.stringify(numData)}

Rédige un rapport interne structuré en markdown, sections dans cet ordre exact :

## Chemin de vie — mission de fond
Le sens central de la trajectoire, la leçon d'âme, la manière dont ce nombre s'exprime en maturité vs. en immaturité.

## Nombre d'expression — comment la personne agit dans le monde
Les talents naturels, la manière de faire, ce qui est fluide et ce qui coûte.

## Nombre de l'âme — motivation profonde
Ce qui anime réellement en secret, le désir moteur derrière les choix.

## Nombre de personnalité — l'image projetée
Ce que les autres perçoivent en premier, l'écart éventuel avec le nombre d'âme.

## Nombre de maturité — seconde moitié de vie
La direction qui se révèle avec l'âge, la synthèse vers laquelle la personne converge.

## Nombres maîtres & tensions
S'il y a des nombres maîtres (11/22/33) : leur charge, leur exigence. Sinon, les tensions entre les nombres.

## Points d'entrée pour l'accompagnement
3 à 4 leviers concrets pour Joffrey, reliés aux nombres.

Chaque section : 3 à 6 lignes, jamais générique, toujours reliée aux nombres réels fournis.`,
    2000,
  );
}

// ─── Synthèse TRANSVERSALE — le rapport intégré ───────────────
export async function generateTransversalSynthesis(
  all: { hd: any; astro: any; bazi: any; numerology: any },
  clientName: string,
  intention: string,
): Promise<string> {
  return generate(
    `SYNTHÈSE TRANSVERSALE INTÉGRÉE — ${clientName}
Tu disposes de quatre lectures d'un même être. Ton travail n'est PAS de les résumer une à une,
mais de les CROISER pour dégager la structure profonde de la personne.

HUMAN DESIGN :
${JSON.stringify(all.hd)}

ASTROLOGIE ÉVOLUTIVE :
${JSON.stringify(all.astro)}

BAZI :
${JSON.stringify(all.bazi)}

NUMÉROLOGIE :
${JSON.stringify(all.numerology)}

INTENTION / CONTEXTE exprimé par la personne :
${intention || "(non renseigné)"}

Rédige pour Joffrey (600 à 900 mots) une synthèse intégrée en markdown, sections dans cet ordre exact :

## Fil rouge
Ce qui converge dans au moins trois des quatre systèmes : le thème central qui revient sous des langages différents. C'est le cœur du rapport.

## Tensions & paradoxes
Là où les systèmes divergent ou se contredisent — c'est souvent le matériau clinique le plus riche (ex. un système pousse à l'action, un autre à l'attente).

## Terrain de transformation
Le nœud central à travailler : la fragilité structurante, le point de bascule où se joue l'évolution de la personne.

## Leviers d'accompagnement
4 à 6 leviers concrets, priorisés, que Joffrey peut activer — reliés explicitement à ce qui précède.

## Points de vigilance
Les angles morts, les résistances probables, ce qui peut se braquer ou se saboter en accompagnement.

Ne répète pas les données brutes : relie-les. Registre clinique, dense, pour Joffrey seul.`,
    3000,
  );
}
