// ============================================================
// Clarity by Beefrequency — Données du questionnaire
// 5 cartes · 27 sections · 81 questions
// ------------------------------------------------------------
// Source de vérité : prototype clarity-by-beefrequency.html.
// Contenu extrait fidèlement. Les couleurs "néon" du prototype
// ne sont PAS reprises ici : le rendu /client/clarity sera au
// brand Hive (ambre/crème, Cormorant) — cf. socle d'architecture.
//
// Clé de réponse persistée en base = "mapIdx-secIdx-qIdx" (0-indexé),
// cohérente avec le modèle de données ClaritySubmission.answers (Json).
// ============================================================

export type ClarityLayer = "SURFACE" | "EXPANSION" | "VALIDATION";

export interface ClarityQuestion {
  layer: ClarityLayer;
  text: string;
}

export interface ClaritySection {
  icon: string;
  title: string;
  sub: string;
  questions: [ClarityQuestion, ClarityQuestion, ClarityQuestion];
}

export interface ClarityMap {
  /** identifiant stable de la carte (sert au mapping Blueprint du rapport) */
  id: "clarity" | "activation" | "avatar" | "impact" | "growth";
  num: string;
  label: string;
  emoji: string;
  subtitle: string;
  desc: string;
  sections: ClaritySection[];
}

/** Libellés des 3 couches conversationnelles */
export const LAYER_META: Record<ClarityLayer, { label: string }> = {
  SURFACE: { label: "Question d'ouverture" },
  EXPANSION: { label: "Approfondissement & précision" },
  VALIDATION: { label: "Synthèse & challenge final" },
};

/** Mapping carte -> intitulé de section du Blueprint (rapport final) */
export const BLUEPRINT_SECTIONS: Record<ClarityMap["id"], string> = {
  clarity: "1. Ton Purpose (Clarté)",
  activation: "2. Ton Modèle de Pratique (Activation)",
  avatar: "3. Ton Client Idéal (Avatar)",
  impact: "4. Ta Signature de Transformation (Impact)",
  growth: "5. Ton Parcours de Croissance (Ladder d'offres)",
};

export const CLARITY_MAPS: ClarityMap[] = [
  // ==========================================================
  // CARTE 01 — PURPOSE CLARITY MAP
  // ==========================================================
  {
    id: "clarity",
    num: "01",
    label: "PURPOSE CLARITY MAP",
    emoji: "🔥",
    subtitle: "Qui es-tu vraiment ?",
    desc: "Révéler l'essence, la mission et la signature unique. Le socle de tout le reste.",
    sections: [
      {
        icon: "🔥",
        title: "Driving Force",
        sub: "Ce qui te propulse",
        questions: [
          { layer: "SURFACE", text: `Qu'est-ce qui t'anime le plus profondément dans la vie ? Pense à des moments où le temps disparaissait et tu te sentais pleinement vivant — que faisais-tu ? Qu'est-ce qui t'enflammait de l'intérieur ?` },
          { layer: "EXPANSION", text: `Rappelle-toi un moment ou une expérience spécifique où le temps s'est complètement arrêté dans cette passion. Que faisais-tu exactement ? Qu'est-ce qui rendait ce moment si naturel ou électrique ?` },
          { layer: "VALIDATION", text: `Si tu devais transmettre cette passion à quelqu'un d'autre — pas juste les outils mais son essence — quelle serait l'insight ou la transmission fondamentale que tu voudrais qu'ils reçoivent ?` },
        ],
      },
      {
        icon: "🎯",
        title: "Core Contribution",
        sub: "Comment tu sers les autres",
        questions: [
          { layer: "SURFACE", text: `Qu'est-ce qui te vient le plus naturellement — quelque chose que les autres cherchent souvent en toi mais qui te semble évident ou secondaire ? De quelle façon ta présence, ton insight ou tes dons servent-ils les autres, même sans effort ?` },
          { layer: "EXPANSION", text: `Quand les gens viennent te voir, quel type de transformation ont-ils tendance à vivre ? Qu'est-ce qu'ils disent souvent qui a changé ou s'est ouvert après avoir travaillé avec toi ?` },
          { layer: "VALIDATION", text: `Si tu ne pouvais offrir qu'une seule contribution sacrée — ton don le plus naturel et le plus transformateur — quelle serait-elle ? L'offre centrale qui tisse tous tes outils et ta sagesse en une seule essence claire ?` },
        ],
      },
      {
        icon: "🌿",
        title: "Higher Calling",
        sub: "Pourquoi tu es ici",
        questions: [
          { layer: "SURFACE", text: `Si tu pouvais te consacrer pleinement à une mission porteuse de sens — sans contrainte de temps, d'argent ou de résultat — quelle serait cette mission ? Pourquoi est-ce important pour toi au niveau le plus profond ?` },
          { layer: "EXPANSION", text: `Quand tu imagines quelqu'un qui reçoit pleinement cette transmission — reconnectant avec la nature, son essence divine — quelle transformation se produit en lui ? Comment sa vie, son énergie, sa façon d'être changent-elles ?` },
          { layer: "VALIDATION", text: `En une phrase, quel impact collectif espères-tu que ton travail contribue à créer dans le monde ? Si ta mission se propageait vers l'extérieur, quel monde aiderait-elle à construire ?` },
        ],
      },
      {
        icon: "✨",
        title: "Guiding Light",
        sub: "Les principes qui guident ton travail",
        questions: [
          { layer: "SURFACE", text: `Peux-tu nommer quelques principes fondamentaux ou valeurs que tu considères comme sacrés dans ta vie et ton travail ? Quels sont les non-négociables qui définissent ce qui se sent aligné — ou désaligné — pour toi ?` },
          { layer: "EXPANSION", text: `Peux-tu te souvenir d'un moment précis où l'une de ces valeurs a vraiment été mise à l'épreuve ou illuminée ? Qu'as-tu choisi, et qu'est-ce que cela t'a appris sur ce qui compte vraiment ?` },
          { layer: "VALIDATION", text: `Comment ces valeurs se manifestent-elles concrètement dans la façon dont tu conduis tes sessions ou interagis avec les clients ? Donne un exemple précis de ta façon de 'marcher ta parole'.` },
        ],
      },
      {
        icon: "🌀",
        title: "Unique Evolution",
        sub: "Ton chemin vers la maîtrise",
        questions: [
          { layer: "SURFACE", text: `Comment tes dons et ta sagesse ont-ils évolué au fil du temps ? Quelles ont été les expériences, formations ou moments clés qui ont forgé qui tu es aujourd'hui dans ton travail ?` },
          { layer: "EXPANSION", text: `Y a-t-il des connaissances ou transmissions que tu as reçues d'une manière non conventionnelle — par synchronicité, expériences intérieures, enseignants inhabituels ? Comment cela a-t-il façonné ta pratique ?` },
          { layer: "VALIDATION", text: `Qu'est-ce que tu offres aujourd'hui que tu n'aurais pas pu offrir il y a 5 ou 10 ans ? Quel est le chemin unique qui t'a amené à incarner ce que tu transmets maintenant ?` },
        ],
      },
      {
        icon: "🌊",
        title: "Ripple Effect",
        sub: "Le changement que tu crées",
        questions: [
          { layer: "SURFACE", text: `Quel changement ou impact espères-tu que ton travail contribue à créer au niveau collectif ? Si ta mission se propageait vers l'extérieur, quel type de monde aiderait-elle à créer ?` },
          { layer: "EXPANSION", text: `Comment le travail que tu fais avec un seul individu peut-il créer des ondes qui touchent sa famille, sa communauté, et au-delà ? Peux-tu décrire cet effet multiplicateur dans tes mots ?` },
          { layer: "VALIDATION", text: `Dans 10 ans, si ton travail avait atteint tout son potentiel, à quoi ressemblerait le monde différemment ? Quelle est la vision que tu portes au-delà de ta pratique individuelle ?` },
        ],
      },
      {
        icon: "🌟",
        title: "Unique Signature",
        sub: "La grande révélation",
        questions: [
          { layer: "SURFACE", text: `Qu'est-ce qui te rend fondamentalement différent dans la façon dont tu tiens l'espace et accompagnes les autres ? Quelle est la qualité ou le don que les gens ne trouveront que chez toi ?` },
          { layer: "EXPANSION", text: `Comment décrirais-tu la 'fréquence' ou le champ que tu transportes — ce truc indescriptible que les gens ressentent quand ils sont dans ton espace ? Comment cela se manifeste-t-il dans ton travail ?` },
          { layer: "VALIDATION", text: `Si tu devais distiller toute ton essence en une seule phrase — pas un titre, pas une méthode, mais la vérité vivante de ce que tu es — quelle serait-elle ? ("Je suis un·e…")` },
        ],
      },
    ],
  },

  // ==========================================================
  // CARTE 02 — PURPOSE ACTIVATION MAP
  // ==========================================================
  {
    id: "activation",
    num: "02",
    label: "PURPOSE ACTIVATION MAP",
    emoji: "🛠️",
    subtitle: "Comment tu le vis en pratique ?",
    desc: "Traduire la clarté intérieure en modèle de pratique concret, ancré et durable.",
    sections: [
      {
        icon: "💎",
        title: "Transformational Essence",
        sub: "Quelle transformation tu offres ?",
        questions: [
          { layer: "SURFACE", text: `En une ou deux phrases, quelle est la transformation principale que tu crées pour tes clients ? Pas tes méthodes — mais le changement réel et mesurable qu'ils vivent après avoir travaillé avec toi.` },
          { layer: "EXPANSION", text: `Quand quelqu'un termine de travailler avec toi, comment décrirait-il le changement vécu ? Travailles-tu sur plusieurs dimensions (corps, relations, travail, âme) — sont-ce des points d'entrée ou toujours partie du processus ?` },
          { layer: "VALIDATION", text: `Si tu ne pouvais aider qu'avec une seule chose — la transformation la plus profonde et irréversible que tu crées — quelle serait-elle ? Quel est le 'avant' et 'après' le plus fondamental de ton travail ?` },
        ],
      },
      {
        icon: "🎯",
        title: "Impact Audience",
        sub: "Pour qui es-tu vraiment ici ?",
        questions: [
          { layer: "SURFACE", text: `Qui sont les personnes que tu es le plus naturellement appelé à servir ? Décris-les : qui sont-elles, où en sont-elles dans leur vie, qu'est-ce qu'elles cherchent ?` },
          { layer: "EXPANSION", text: `Quel est le dénominateur commun entre tes clients les plus transformés ? Qu'ont-ils en commun — mentalité, stade de vie, type de douleur ou aspiration ? Qu'est-ce qui les empêche d'avancer sans toi ?` },
          { layer: "VALIDATION", text: `Si tu ne pouvais servir qu'un seul type de personne pour le reste de ta carrière, qui serait-ce ? La personne pour laquelle ton travail est le plus puissant, le plus irremplaçable ?` },
        ],
      },
      {
        icon: "📡",
        title: "Attraction Channels",
        sub: "Comment les bonnes personnes te trouvent ?",
        questions: [
          { layer: "SURFACE", text: `Comment les gens te trouvent-ils actuellement ? Quels sont tes canaux existants (bouche-à-oreille, réseaux sociaux, événements, collaborations, contenu) ?` },
          { layer: "EXPANSION", text: `Quels canaux te semblent les plus alignés avec ton essence et ta façon d'être ? Où te sens-tu le plus naturellement magnétique — en live, en ligne, à travers du contenu, des collaborations ?` },
          { layer: "VALIDATION", text: `Quel canal, si tu le maîtrisais pleinement, aurait le plus grand impact sur ta capacité à toucher les personnes que tu es ici pour servir ? Par où commencer pour créer de l'expansion avec clarté ?` },
        ],
      },
      {
        icon: "🤝",
        title: "Client Connections",
        sub: "Structure et qualité de tes relations clients",
        questions: [
          { layer: "SURFACE", text: `Comment travailles-tu actuellement (ou idéalement) avec tes clients ? One-to-one, groupe, retraite, en ligne, présentiel, programmes longs ou courts ?` },
          { layer: "EXPANSION", text: `Quel format te donne le plus d'énergie ? Quel type de relation client — par sa profondeur, sa durée, sa structure — te permet de donner le meilleur de toi-même ?` },
          { layer: "VALIDATION", text: `Si tu pouvais designer ta façon idéale de travailler — sans contrainte — à quoi ressemblerait-elle ? La structure relationnelle qui honore à la fois ton énergie et la profondeur de ta transformation ?` },
        ],
      },
      {
        icon: "🏛️",
        title: "Foundational Resources",
        sub: "Ce qui soutient et propulse ton travail",
        questions: [
          { layer: "SURFACE", text: `Sur quelles ressources clés ton travail repose-t-il ? (Espace physique, équipements, outils digitaux, réseau, savoirs spécifiques, partenaires, collaborateurs)` },
          { layer: "EXPANSION", text: `Quelles ressources as-tu déjà développées et qui constituent un vrai avantage ? Lesquelles manquent encore et limitent actuellement ton expansion ?` },
          { layer: "VALIDATION", text: `Quelle est la ressource la plus critique à développer ou sécuriser pour que ta pratique passe au niveau suivant ? Qu'est-ce qui, si tu l'avais demain, changerait tout ?` },
        ],
      },
      {
        icon: "⚡",
        title: "Core Activities",
        sub: "Ce que tu fais concrètement chaque semaine",
        questions: [
          { layer: "SURFACE", text: `Quelles sont les activités principales que tu réalises chaque semaine ? Liste-les toutes — sessions, création de contenu, administration, formation, networking…` },
          { layer: "EXPANSION", text: `Lesquelles créent le plus de valeur — pour toi et tes clients ? Lesquelles sont énergivores et pourraient être réduites, déléguées ou éliminées ?` },
          { layer: "VALIDATION", text: `Si tu ne pouvais faire que 3 activités cette semaine pour faire avancer ta pratique, lesquelles seraient-elles ? Ton activité de plus haute valeur — celle qui, multipliée, changerait tout ?` },
        ],
      },
      {
        icon: "💸",
        title: "Practice Outlays",
        sub: "Ce que ça coûte de faire tourner ta pratique",
        questions: [
          { layer: "SURFACE", text: `Quelles sont tes dépenses actuelles pour faire tourner ta pratique ? (Loyer, outils, formations, marketing, déplacements, assurances, sous-traitance)` },
          { layer: "EXPANSION", text: `Quelles dépenses sont vraiment nécessaires ? Lesquelles pourraient être optimisées, réduites ou éliminées sans impacter la qualité de ce que tu offres ?` },
          { layer: "VALIDATION", text: `Quel est le coût minimal mensuel pour que ta pratique fonctionne de façon optimale ? Et ton seuil de durabilité — le revenu minimum en dessous duquel tu ne peux pas opérer librement ?` },
        ],
      },
      {
        icon: "🌊",
        title: "Practice Inflows",
        sub: "Comment tu te sustentes financièrement",
        questions: [
          { layer: "SURFACE", text: `Quelles sont tes sources de revenus actuelles ? Comment et combien gagnes-tu aujourd'hui ? (Sessions, groupes, formations, produits, collaborations, autres)` },
          { layer: "EXPANSION", text: `Quel modèle de revenus te semble le plus aligné avec ton essence et le style de vie que tu veux créer ? Quelles sources aimerais-tu développer ou activer ?` },
          { layer: "VALIDATION", text: `À quoi ressemble ton objectif financier dans 12 mois — et comment s'aligne-t-il avec l'impact que tu veux créer ? Quelle combinaison d'offres te permettrait d'atteindre cette cible tout en restant aligné ?` },
        ],
      },
    ],
  },

  // ==========================================================
  // CARTE 03 — CLIENT AVATAR MAP
  // ==========================================================
  {
    id: "avatar",
    num: "03",
    label: "CLIENT AVATAR MAP",
    emoji: "👤",
    subtitle: "Pour qui exactement ?",
    desc: "Construire un portrait ultra-précis du client idéal pour parler à son âme.",
    sections: [
      {
        icon: "🪞",
        title: "Portrait & Identité",
        sub: "Qui est cette personne concrètement ?",
        questions: [
          { layer: "SURFACE", text: `Si ton client idéal avait un prénom, un âge, une profession et un lieu de vie — qui serait-il ? Décris-le en quelques phrases comme si tu le connaissais personnellement.` },
          { layer: "EXPANSION", text: `Quelles sont ses caractéristiques de personnalité fondamentales ? Analytique ou intuitif ? Solitaire ou social ? Ambitieux ou en retrait ? Quelle est son attitude face au changement ?` },
          { layer: "VALIDATION", text: `Décris ton client idéal en une seule phrase puissante — la personne qui va adorer ce que tu fais dès le premier jour. Qu'est-ce qui le rend unique parmi tous ceux que tu pourrais servir ?` },
        ],
      },
      {
        icon: "🌑",
        title: "Douleurs & Blocages",
        sub: "Ce qui l'empêche d'avancer",
        questions: [
          { layer: "SURFACE", text: `Quelles sont les douleurs, frustrations ou défis principaux que vit ton client idéal ? Qu'est-ce qui le réveille la nuit ou l'empêche de s'endormir ?` },
          { layer: "EXPANSION", text: `Quels patterns répétitifs ou comportements le maintiennent coincé ? De quoi n'est-il pas encore conscient qui limite sa progression ? Quelle vérité refuse-t-il encore de voir ?` },
          { layer: "VALIDATION", text: `Quelle est LA douleur profonde — souvent inavouée — à la racine de tous ses problèmes visibles ? Ce n'est pas ce qu'il dit chercher, mais ce dont il a vraiment besoin.` },
        ],
      },
      {
        icon: "🌟",
        title: "Aspirations & Désirs",
        sub: "Ce qu'il veut vraiment",
        questions: [
          { layer: "SURFACE", text: `Quels sont les désirs et aspirations de ton client idéal — ce qu'il rêve d'avoir, d'être ou de vivre ? Qu'est-ce qu'il cherche activement ?` },
          { layer: "EXPANSION", text: `Quelle vie imagine-t-il après la transformation ? Comment se voit-il dans 1 an si tout allait bien ? Qu'est-ce qui aurait changé dans ses relations, son travail, son bien-être ?` },
          { layer: "VALIDATION", text: `Quelle est l'aspiration profonde — souvent non dite — derrière tous ses objectifs visibles ? Ce n'est pas ce qu'il cherche mais ce qu'il veut vraiment ressentir.` },
        ],
      },
      {
        icon: "🛡️",
        title: "Objections & Résistances",
        sub: "Ce qui l'empêche de dire oui",
        questions: [
          { layer: "SURFACE", text: `Quelles sont les objections principales que ton client idéal aurait avant de s'engager avec toi ? Prix, temps, scepticisme, peur du changement ?` },
          { layer: "EXPANSION", text: `Qu'est-ce qui le rend méfiant face à des approches comme la tienne — non-conventionnelles, spirituelles, intuitives ? Comment réassures-tu sans compromettre ton essence ?` },
          { layer: "VALIDATION", text: `Quelle est la vraie résistance derrière ses objections visibles ? Souvent ce n'est pas le prix ou le temps — c'est la peur de quoi exactement ?` },
        ],
      },
    ],
  },

  // ==========================================================
  // CARTE 04 — IMPACT TRANSFORMATION MAP
  // ==========================================================
  {
    id: "impact",
    num: "04",
    label: "IMPACT TRANSFORMATION MAP",
    emoji: "💥",
    subtitle: "Quelle transformation tu crées ?",
    desc: "Cristalliser l'impact exact et irréplicable que seul toi tu peux créer.",
    sections: [
      {
        icon: "🌑",
        title: "État AVANT",
        sub: "Où se trouve le client quand il arrive",
        questions: [
          { layer: "SURFACE", text: `Décris l'état dans lequel se trouve ton client quand il arrive chez toi. Que ressent-il ? Que pense-t-il ? Qu'est-ce qui ne fonctionne plus pour lui ?` },
          { layer: "EXPANSION", text: `Quel est le moment de rupture ou de seuil qui l'a amené à te chercher ? Qu'est-ce qui s'est passé pour qu'il réalise qu'il avait besoin d'aide — ou d'une autre façon de voir ?` },
          { layer: "VALIDATION", text: `En une phrase, quel est le 'AVANT' fondamental — l'état de départ le plus universel parmi tous tes clients idéaux ?` },
        ],
      },
      {
        icon: "🌅",
        title: "État APRÈS",
        sub: "Où se trouve le client après transformation",
        questions: [
          { layer: "SURFACE", text: `Décris l'état dans lequel se trouve ton client après avoir travaillé avec toi. Que ressent-il ? Comment voit-il les choses différemment ? Qu'est-ce qui a changé concrètement ?` },
          { layer: "EXPANSION", text: `Quelle est la transformation la plus irréversible ? Le changement qui reste pour toujours ? Qu'est-ce que les clients ne peuvent plus 'désapprendre' après avoir travaillé avec toi ?` },
          { layer: "VALIDATION", text: `En une phrase, quel est le 'APRÈS' fondamental — le résultat le plus universel et le plus puissant que ton travail crée ?` },
        ],
      },
      {
        icon: "🚀",
        title: "Véhicule de Transformation",
        sub: "Comment la transformation se produit",
        questions: [
          { layer: "SURFACE", text: `Quel est le mécanisme principal à travers lequel la transformation se produit dans ton travail ? Ce n'est pas tes outils — c'est le processus invisible qui fait que ça marche.` },
          { layer: "EXPANSION", text: `Qu'est-ce que tu fais ou crées qui est fondamentalement différent de tout ce que ton client a essayé avant ? Quel est l'ingrédient secret de ton approche ?` },
          { layer: "VALIDATION", text: `Formule ton impact en une déclaration : 'Je crée [transformation] pour [audience] en [comment].' Quelle est ta signature de transformation unique et irremplaçable ?` },
        ],
      },
    ],
  },

  // ==========================================================
  // CARTE 05 — GROWTH JOURNEY MAP
  // ==========================================================
  {
    id: "growth",
    num: "05",
    label: "GROWTH JOURNEY MAP",
    emoji: "🌱",
    subtitle: "Comment tu scales ?",
    desc: "Construire le parcours client progressif de la première rencontre à l'offre premium.",
    sections: [
      {
        icon: "🚪",
        title: "Entry Point Offering",
        sub: "La porte d'entrée à faible coût ou en accès libre",
        questions: [
          { layer: "SURFACE", text: `Quelle est l'étape la plus naturelle que quelqu'un pourrait franchir pour s'engager avec toi — sans coût ni engagement — qui lui donne quand même un avant-goût de transformation ?` },
          { layer: "EXPANSION", text: `Quel format te semble le plus aligné pour ce premier contact ? (Call découverte, audio guidé, méditation, newsletter, événement live, contenu en accès libre) Facile à dire 'oui' pour eux, puissant pour toi ?` },
          { layer: "VALIDATION", text: `Comment cet entry point crée-t-il naturellement l'envie d'aller plus loin ? Quel est le 'mini-éveil' ou la 'petite victoire' qu'il délivre — et le pont naturel vers l'offre suivante ?` },
        ],
      },
      {
        icon: "🌿",
        title: "Introductory Offer",
        sub: "La première offre payante accessible",
        questions: [
          { layer: "SURFACE", text: `Quelle est ta première offre payante — accessible, à faible friction — qui permet de tester la profondeur de ton travail sans s'engager massivement ?` },
          { layer: "EXPANSION", text: `Quel est le prix, la durée et le format idéal ? Quelle transformation spécifique délivre-t-elle — et comment prépare-t-elle naturellement le terrain pour une relation plus profonde ?` },
          { layer: "VALIDATION", text: `Comment sais-tu qu'un client est prêt à passer à l'offre suivante après cette intro ? Quel signal ou transformation indique que c'est le moment ?` },
        ],
      },
      {
        icon: "💫",
        title: "Core Transformation Offer",
        sub: "Ton offre principale — la colonne vertébrale",
        questions: [
          { layer: "SURFACE", text: `Quelle est ton offre principale — celle qui représente le cœur de ta pratique et délivre la transformation la plus profonde que tu offres régulièrement ?` },
          { layer: "EXPANSION", text: `Quelle est la durée, la structure, le prix et le format idéal ? Qu'est-ce qui différencie cette offre de tout ce qui existe sur le marché ? Pourquoi est-elle irremplaçable ?` },
          { layer: "VALIDATION", text: `Cette offre est-elle actuellement structurée pour délivrer systématiquement la transformation promise ? Qu'est-ce qui manque ou pourrait être amélioré pour qu'elle soit à son plein potentiel ?` },
        ],
      },
      {
        icon: "👑",
        title: "Premium / VIP Offer",
        sub: "L'offre haute valeur",
        questions: [
          { layer: "SURFACE", text: `Quelle est ton offre premium — réservée aux clients qui veulent aller le plus loin, le plus vite, avec le plus d'accès à toi ? Comment délivres-tu le maximum de ton essence à ce niveau ?` },
          { layer: "EXPANSION", text: `Quel est le prix, la durée, le format et les éléments distinctifs ? Qu'est-ce qu'elle inclut que rien d'autre n'inclut ? Quel est le profil du client idéal pour cette offre ?` },
          { layer: "VALIDATION", text: `Est-ce que cette offre te positionne au niveau de valeur que tu mérites ? Reflète-t-elle la profondeur et la rareté de ce que tu apportes — ou t'es-tu sous-estimé ?` },
        ],
      },
      {
        icon: "♾️",
        title: "Community & Passive Income",
        sub: "Revenus récurrents & scalables",
        questions: [
          { layer: "SURFACE", text: `Comment pourrais-tu créer une façon pour tes clients de rester dans ton orbite, maintenir leur transformation et continuer à être nourris par ton travail — de façon récurrente ?` },
          { layer: "EXPANSION", text: `Quels actifs (contenu, cours, produits, membership, élixirs, outils) pourrais-tu créer une fois et qui continueraient à générer de la valeur et des revenus sans ta présence directe ?` },
          { layer: "VALIDATION", text: `Quelle combinaison de revenus récurrents te permettrait d'avoir une base financière stable tout en continuant à offrir ton travail le plus profond sans pression ?` },
        ],
      },
    ],
  },
];

// ---- Helpers ------------------------------------------------

/** Clé de réponse persistée : "mapIdx-secIdx-qIdx" (0-indexé). */
export function answerKey(mapIdx: number, secIdx: number, qIdx: number): string {
  return `${mapIdx}-${secIdx}-${qIdx}`;
}

/** Liste plate des étapes, pour piloter le chat pas-à-pas. */
export interface ClarityStep {
  mapIdx: number;
  secIdx: number;
  qIdx: number;
  layer: ClarityLayer;
  text: string;
  key: string;
}

export const CLARITY_STEPS: ClarityStep[] = CLARITY_MAPS.flatMap((m, mapIdx) =>
  m.sections.flatMap((s, secIdx) =>
    s.questions.map((q, qIdx) => ({
      mapIdx,
      secIdx,
      qIdx,
      layer: q.layer,
      text: q.text,
      key: answerKey(mapIdx, secIdx, qIdx),
    }))
  )
);

export const CLARITY_TOTAL_QUESTIONS = CLARITY_STEPS.length; // 81
export const CLARITY_TOTAL_SECTIONS = CLARITY_MAPS.reduce((n, m) => n + m.sections.length, 0); // 27
