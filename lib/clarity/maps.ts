// ============================================================
// Clarity by Beefrequency — Données du questionnaire
// 5 cartes · 27 sections · 81 questions
// ------------------------------------------------------------
// Source de vérité : prototype clarity-by-beefrequency.html.
// Contenu extrait fidèlement. Les couleurs "néon" du prototype
// ne sont PAS reprises ici : le rendu /client/clarity sera au
// brand Hive (ambre/crème, Cormorant) — cf. socle d'architecture.
//
// Bilingue : chaque champ TEXTE affiché est un objet { EN, FR }.
// Le FR est la source d'origine ; le EN une traduction fidèle.
// Le rendu client choisit la langue via useLanguage() ; l'admin
// (Joffrey) lit systématiquement le FR (.FR).
//
// Clé de réponse persistée en base = "mapIdx-secIdx-qIdx" (0-indexé),
// cohérente avec le modèle de données ClaritySubmission.answers (Json).
// ============================================================

export type ClarityLayer = "SURFACE" | "EXPANSION" | "VALIDATION";

/** Champ texte affiché, disponible en deux langues. */
export interface Bilingual {
  EN: string;
  FR: string;
}

export interface ClarityQuestion {
  layer: ClarityLayer;
  text: Bilingual;
}

export interface ClaritySection {
  icon: string;
  title: Bilingual;
  sub: Bilingual;
  questions: [ClarityQuestion, ClarityQuestion, ClarityQuestion];
}

export interface ClarityMap {
  /** identifiant stable de la carte (sert au mapping Blueprint du rapport) */
  id: "clarity" | "activation" | "avatar" | "impact" | "growth";
  num: string;
  label: Bilingual;
  emoji: string;
  subtitle: Bilingual;
  desc: Bilingual;
  sections: ClaritySection[];
}

/** Libellés des 3 couches conversationnelles */
export const LAYER_META: Record<ClarityLayer, { label: Bilingual }> = {
  SURFACE: { label: { EN: "Opening question", FR: "Question d'ouverture" } },
  EXPANSION: { label: { EN: "Deepening & precision", FR: "Approfondissement & précision" } },
  VALIDATION: { label: { EN: "Synthesis & final challenge", FR: "Synthèse & challenge final" } },
};

/** Mapping carte -> intitulé de section du Blueprint (rapport final, FR) */
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
    label: { EN: "PURPOSE CLARITY MAP", FR: "PURPOSE CLARITY MAP" },
    emoji: "🔥",
    subtitle: { EN: "Who are you truly?", FR: "Qui es-tu vraiment ?" },
    desc: {
      EN: "Reveal the essence, the mission and the unique signature. The foundation of everything else.",
      FR: "Révéler l'essence, la mission et la signature unique. Le socle de tout le reste.",
    },
    sections: [
      {
        icon: "🔥",
        title: { EN: "Driving Force", FR: "Driving Force" },
        sub: { EN: "What propels you", FR: "Ce qui te propulse" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `What drives you most deeply in life? Think of moments when time disappeared and you felt fully alive — what were you doing? What set you alight from within?`,
              FR: `Qu'est-ce qui t'anime le plus profondément dans la vie ? Pense à des moments où le temps disparaissait et tu te sentais pleinement vivant — que faisais-tu ? Qu'est-ce qui t'enflammait de l'intérieur ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `Recall a specific moment or experience where time stopped completely within that passion. What exactly were you doing? What made that moment feel so natural or electric?`,
              FR: `Rappelle-toi un moment ou une expérience spécifique où le temps s'est complètement arrêté dans cette passion. Que faisais-tu exactement ? Qu'est-ce qui rendait ce moment si naturel ou électrique ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `If you had to pass this passion on to someone else — not just the tools but its essence — what would be the core insight or transmission you'd want them to receive?`,
              FR: `Si tu devais transmettre cette passion à quelqu'un d'autre — pas juste les outils mais son essence — quelle serait l'insight ou la transmission fondamentale que tu voudrais qu'ils reçoivent ?`,
            },
          },
        ],
      },
      {
        icon: "🎯",
        title: { EN: "Core Contribution", FR: "Core Contribution" },
        sub: { EN: "How you serve others", FR: "Comment tu sers les autres" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `What comes most naturally to you — something others often seek in you but that feels obvious or secondary to you? In what way do your presence, your insight or your gifts serve others, even effortlessly?`,
              FR: `Qu'est-ce qui te vient le plus naturellement — quelque chose que les autres cherchent souvent en toi mais qui te semble évident ou secondaire ? De quelle façon ta présence, ton insight ou tes dons servent-ils les autres, même sans effort ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `When people come to you, what kind of transformation do they tend to experience? What do they often say has shifted or opened up after working with you?`,
              FR: `Quand les gens viennent te voir, quel type de transformation ont-ils tendance à vivre ? Qu'est-ce qu'ils disent souvent qui a changé ou s'est ouvert après avoir travaillé avec toi ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `If you could offer only one sacred contribution — your most natural and most transformative gift — what would it be? The central offering that weaves all your tools and wisdom into one clear essence?`,
              FR: `Si tu ne pouvais offrir qu'une seule contribution sacrée — ton don le plus naturel et le plus transformateur — quelle serait-elle ? L'offre centrale qui tisse tous tes outils et ta sagesse en une seule essence claire ?`,
            },
          },
        ],
      },
      {
        icon: "🌿",
        title: { EN: "Higher Calling", FR: "Higher Calling" },
        sub: { EN: "Why you are here", FR: "Pourquoi tu es ici" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `If you could devote yourself fully to a meaningful mission — free of any constraint of time, money or outcome — what would that mission be? Why does it matter to you at the deepest level?`,
              FR: `Si tu pouvais te consacrer pleinement à une mission porteuse de sens — sans contrainte de temps, d'argent ou de résultat — quelle serait cette mission ? Pourquoi est-ce important pour toi au niveau le plus profond ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `When you imagine someone fully receiving this transmission — reconnecting with nature, with their divine essence — what transformation takes place within them? How do their life, their energy, their way of being change?`,
              FR: `Quand tu imagines quelqu'un qui reçoit pleinement cette transmission — reconnectant avec la nature, son essence divine — quelle transformation se produit en lui ? Comment sa vie, son énergie, sa façon d'être changent-elles ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `In one sentence, what collective impact do you hope your work helps create in the world? If your mission rippled outward, what world would it help build?`,
              FR: `En une phrase, quel impact collectif espères-tu que ton travail contribue à créer dans le monde ? Si ta mission se propageait vers l'extérieur, quel monde aiderait-elle à construire ?`,
            },
          },
        ],
      },
      {
        icon: "✨",
        title: { EN: "Guiding Light", FR: "Guiding Light" },
        sub: { EN: "The principles that guide your work", FR: "Les principes qui guident ton travail" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `Can you name a few core principles or values you hold sacred in your life and your work? What are the non-negotiables that define what feels aligned — or misaligned — for you?`,
              FR: `Peux-tu nommer quelques principes fondamentaux ou valeurs que tu considères comme sacrés dans ta vie et ton travail ? Quels sont les non-négociables qui définissent ce qui se sent aligné — ou désaligné — pour toi ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `Can you recall a specific moment when one of these values was truly tested or illuminated? What did you choose, and what did it teach you about what really matters?`,
              FR: `Peux-tu te souvenir d'un moment précis où l'une de ces valeurs a vraiment été mise à l'épreuve ou illuminée ? Qu'as-tu choisi, et qu'est-ce que cela t'a appris sur ce qui compte vraiment ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `How do these values show up concretely in the way you run your sessions or interact with clients? Give a specific example of how you 'walk your talk'.`,
              FR: `Comment ces valeurs se manifestent-elles concrètement dans la façon dont tu conduis tes sessions ou interagis avec les clients ? Donne un exemple précis de ta façon de 'marcher ta parole'.`,
            },
          },
        ],
      },
      {
        icon: "🌀",
        title: { EN: "Unique Evolution", FR: "Unique Evolution" },
        sub: { EN: "Your path to mastery", FR: "Ton chemin vers la maîtrise" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `How have your gifts and your wisdom evolved over time? What were the experiences, trainings or key moments that shaped who you are today in your work?`,
              FR: `Comment tes dons et ta sagesse ont-ils évolué au fil du temps ? Quelles ont été les expériences, formations ou moments clés qui ont forgé qui tu es aujourd'hui dans ton travail ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `Are there knowledge or transmissions you've received in an unconventional way — through synchronicity, inner experiences, unusual teachers? How has that shaped your practice?`,
              FR: `Y a-t-il des connaissances ou transmissions que tu as reçues d'une manière non conventionnelle — par synchronicité, expériences intérieures, enseignants inhabituels ? Comment cela a-t-il façonné ta pratique ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `What do you offer today that you couldn't have offered 5 or 10 years ago? What is the unique path that led you to embody what you now transmit?`,
              FR: `Qu'est-ce que tu offres aujourd'hui que tu n'aurais pas pu offrir il y a 5 ou 10 ans ? Quel est le chemin unique qui t'a amené à incarner ce que tu transmets maintenant ?`,
            },
          },
        ],
      },
      {
        icon: "🌊",
        title: { EN: "Ripple Effect", FR: "Ripple Effect" },
        sub: { EN: "The change you create", FR: "Le changement que tu crées" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `What change or impact do you hope your work helps create at the collective level? If your mission rippled outward, what kind of world would it help create?`,
              FR: `Quel changement ou impact espères-tu que ton travail contribue à créer au niveau collectif ? Si ta mission se propageait vers l'extérieur, quel type de monde aiderait-elle à créer ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `How can the work you do with a single individual create ripples that reach their family, their community, and beyond? Can you describe this multiplier effect in your own words?`,
              FR: `Comment le travail que tu fais avec un seul individu peut-il créer des ondes qui touchent sa famille, sa communauté, et au-delà ? Peux-tu décrire cet effet multiplicateur dans tes mots ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `In 10 years, if your work had reached its full potential, how would the world look different? What is the vision you carry beyond your individual practice?`,
              FR: `Dans 10 ans, si ton travail avait atteint tout son potentiel, à quoi ressemblerait le monde différemment ? Quelle est la vision que tu portes au-delà de ta pratique individuelle ?`,
            },
          },
        ],
      },
      {
        icon: "🌟",
        title: { EN: "Unique Signature", FR: "Unique Signature" },
        sub: { EN: "The great revelation", FR: "La grande révélation" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `What makes you fundamentally different in the way you hold space and accompany others? What is the quality or gift that people will only find in you?`,
              FR: `Qu'est-ce qui te rend fondamentalement différent dans la façon dont tu tiens l'espace et accompagnes les autres ? Quelle est la qualité ou le don que les gens ne trouveront que chez toi ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `How would you describe the 'frequency' or field you carry — that indescribable something people feel when they're in your space? How does it show up in your work?`,
              FR: `Comment décrirais-tu la 'fréquence' ou le champ que tu transportes — ce truc indescriptible que les gens ressentent quand ils sont dans ton espace ? Comment cela se manifeste-t-il dans ton travail ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `If you had to distill your whole essence into a single sentence — not a title, not a method, but the living truth of who you are — what would it be? ("I am a…")`,
              FR: `Si tu devais distiller toute ton essence en une seule phrase — pas un titre, pas une méthode, mais la vérité vivante de ce que tu es — quelle serait-elle ? ("Je suis un·e…")`,
            },
          },
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
    label: { EN: "PURPOSE ACTIVATION MAP", FR: "PURPOSE ACTIVATION MAP" },
    emoji: "🛠️",
    subtitle: { EN: "How do you live it in practice?", FR: "Comment tu le vis en pratique ?" },
    desc: {
      EN: "Translate inner clarity into a concrete, grounded and sustainable practice model.",
      FR: "Traduire la clarté intérieure en modèle de pratique concret, ancré et durable.",
    },
    sections: [
      {
        icon: "💎",
        title: { EN: "Transformational Essence", FR: "Transformational Essence" },
        sub: { EN: "What transformation do you offer?", FR: "Quelle transformation tu offres ?" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `In one or two sentences, what is the main transformation you create for your clients? Not your methods — but the real, measurable change they experience after working with you.`,
              FR: `En une ou deux phrases, quelle est la transformation principale que tu crées pour tes clients ? Pas tes méthodes — mais le changement réel et mesurable qu'ils vivent après avoir travaillé avec toi.`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `When someone finishes working with you, how would they describe the change they experienced? Do you work across several dimensions (body, relationships, work, soul) — are these entry points or always part of the process?`,
              FR: `Quand quelqu'un termine de travailler avec toi, comment décrirait-il le changement vécu ? Travailles-tu sur plusieurs dimensions (corps, relations, travail, âme) — sont-ce des points d'entrée ou toujours partie du processus ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `If you could only help with one single thing — the deepest and most irreversible transformation you create — what would it be? What is the most fundamental 'before' and 'after' of your work?`,
              FR: `Si tu ne pouvais aider qu'avec une seule chose — la transformation la plus profonde et irréversible que tu crées — quelle serait-elle ? Quel est le 'avant' et 'après' le plus fondamental de ton travail ?`,
            },
          },
        ],
      },
      {
        icon: "🎯",
        title: { EN: "Impact Audience", FR: "Impact Audience" },
        sub: { EN: "Who are you truly here for?", FR: "Pour qui es-tu vraiment ici ?" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `Who are the people you are most naturally called to serve? Describe them: who are they, where are they in their life, what are they looking for?`,
              FR: `Qui sont les personnes que tu es le plus naturellement appelé à servir ? Décris-les : qui sont-elles, où en sont-elles dans leur vie, qu'est-ce qu'elles cherchent ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `What is the common denominator among your most transformed clients? What do they share — mindset, life stage, type of pain or aspiration? What keeps them from moving forward without you?`,
              FR: `Quel est le dénominateur commun entre tes clients les plus transformés ? Qu'ont-ils en commun — mentalité, stade de vie, type de douleur ou aspiration ? Qu'est-ce qui les empêche d'avancer sans toi ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `If you could serve only one type of person for the rest of your career, who would it be? The person for whom your work is most powerful, most irreplaceable?`,
              FR: `Si tu ne pouvais servir qu'un seul type de personne pour le reste de ta carrière, qui serait-ce ? La personne pour laquelle ton travail est le plus puissant, le plus irremplaçable ?`,
            },
          },
        ],
      },
      {
        icon: "📡",
        title: { EN: "Attraction Channels", FR: "Attraction Channels" },
        sub: { EN: "How do the right people find you?", FR: "Comment les bonnes personnes te trouvent ?" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `How do people currently find you? What are your existing channels (word of mouth, social media, events, collaborations, content)?`,
              FR: `Comment les gens te trouvent-ils actuellement ? Quels sont tes canaux existants (bouche-à-oreille, réseaux sociaux, événements, collaborations, contenu) ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `Which channels feel most aligned with your essence and your way of being? Where do you feel most naturally magnetic — live, online, through content, through collaborations?`,
              FR: `Quels canaux te semblent les plus alignés avec ton essence et ta façon d'être ? Où te sens-tu le plus naturellement magnétique — en live, en ligne, à travers du contenu, des collaborations ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `Which channel, if you fully mastered it, would have the greatest impact on your ability to reach the people you're here to serve? Where should you start to create expansion with clarity?`,
              FR: `Quel canal, si tu le maîtrisais pleinement, aurait le plus grand impact sur ta capacité à toucher les personnes que tu es ici pour servir ? Par où commencer pour créer de l'expansion avec clarté ?`,
            },
          },
        ],
      },
      {
        icon: "🤝",
        title: { EN: "Client Connections", FR: "Client Connections" },
        sub: {
          EN: "Structure and quality of your client relationships",
          FR: "Structure et qualité de tes relations clients",
        },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `How do you currently (or ideally) work with your clients? One-to-one, group, retreat, online, in person, long or short programs?`,
              FR: `Comment travailles-tu actuellement (ou idéalement) avec tes clients ? One-to-one, groupe, retraite, en ligne, présentiel, programmes longs ou courts ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `Which format gives you the most energy? What kind of client relationship — by its depth, duration, structure — lets you give the best of yourself?`,
              FR: `Quel format te donne le plus d'énergie ? Quel type de relation client — par sa profondeur, sa durée, sa structure — te permet de donner le meilleur de toi-même ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `If you could design your ideal way of working — with no constraints — what would it look like? The relational structure that honors both your energy and the depth of your transformation?`,
              FR: `Si tu pouvais designer ta façon idéale de travailler — sans contrainte — à quoi ressemblerait-elle ? La structure relationnelle qui honore à la fois ton énergie et la profondeur de ta transformation ?`,
            },
          },
        ],
      },
      {
        icon: "🏛️",
        title: { EN: "Foundational Resources", FR: "Foundational Resources" },
        sub: { EN: "What supports and propels your work", FR: "Ce qui soutient et propulse ton travail" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `What key resources does your work rely on? (Physical space, equipment, digital tools, network, specific knowledge, partners, collaborators)`,
              FR: `Sur quelles ressources clés ton travail repose-t-il ? (Espace physique, équipements, outils digitaux, réseau, savoirs spécifiques, partenaires, collaborateurs)`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `Which resources have you already developed that constitute a real advantage? Which are still missing and currently limit your expansion?`,
              FR: `Quelles ressources as-tu déjà développées et qui constituent un vrai avantage ? Lesquelles manquent encore et limitent actuellement ton expansion ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `What is the most critical resource to develop or secure for your practice to reach the next level? What, if you had it tomorrow, would change everything?`,
              FR: `Quelle est la ressource la plus critique à développer ou sécuriser pour que ta pratique passe au niveau suivant ? Qu'est-ce qui, si tu l'avais demain, changerait tout ?`,
            },
          },
        ],
      },
      {
        icon: "⚡",
        title: { EN: "Core Activities", FR: "Core Activities" },
        sub: { EN: "What you concretely do each week", FR: "Ce que tu fais concrètement chaque semaine" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `What are the main activities you carry out each week? List them all — sessions, content creation, admin, training, networking…`,
              FR: `Quelles sont les activités principales que tu réalises chaque semaine ? Liste-les toutes — sessions, création de contenu, administration, formation, networking…`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `Which ones create the most value — for you and your clients? Which ones drain your energy and could be reduced, delegated or eliminated?`,
              FR: `Lesquelles créent le plus de valeur — pour toi et tes clients ? Lesquelles sont énergivores et pourraient être réduites, déléguées ou éliminées ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `If you could do only 3 activities this week to move your practice forward, which would they be? Your highest-value activity — the one that, multiplied, would change everything?`,
              FR: `Si tu ne pouvais faire que 3 activités cette semaine pour faire avancer ta pratique, lesquelles seraient-elles ? Ton activité de plus haute valeur — celle qui, multipliée, changerait tout ?`,
            },
          },
        ],
      },
      {
        icon: "💸",
        title: { EN: "Practice Outlays", FR: "Practice Outlays" },
        sub: { EN: "What it costs to run your practice", FR: "Ce que ça coûte de faire tourner ta pratique" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `What are your current expenses to run your practice? (Rent, tools, trainings, marketing, travel, insurance, outsourcing)`,
              FR: `Quelles sont tes dépenses actuelles pour faire tourner ta pratique ? (Loyer, outils, formations, marketing, déplacements, assurances, sous-traitance)`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `Which expenses are truly necessary? Which could be optimized, reduced or eliminated without affecting the quality of what you offer?`,
              FR: `Quelles dépenses sont vraiment nécessaires ? Lesquelles pourraient être optimisées, réduites ou éliminées sans impacter la qualité de ce que tu offres ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `What is the minimum monthly cost for your practice to run optimally? And your sustainability threshold — the minimum income below which you can't operate freely?`,
              FR: `Quel est le coût minimal mensuel pour que ta pratique fonctionne de façon optimale ? Et ton seuil de durabilité — le revenu minimum en dessous duquel tu ne peux pas opérer librement ?`,
            },
          },
        ],
      },
      {
        icon: "🌊",
        title: { EN: "Practice Inflows", FR: "Practice Inflows" },
        sub: { EN: "How you sustain yourself financially", FR: "Comment tu te sustentes financièrement" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `What are your current sources of income? How and how much do you earn today? (Sessions, groups, trainings, products, collaborations, other)`,
              FR: `Quelles sont tes sources de revenus actuelles ? Comment et combien gagnes-tu aujourd'hui ? (Sessions, groupes, formations, produits, collaborations, autres)`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `Which revenue model feels most aligned with your essence and the lifestyle you want to create? Which sources would you like to develop or activate?`,
              FR: `Quel modèle de revenus te semble le plus aligné avec ton essence et le style de vie que tu veux créer ? Quelles sources aimerais-tu développer ou activer ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `What does your financial goal look like in 12 months — and how does it align with the impact you want to create? What combination of offers would let you reach that target while staying aligned?`,
              FR: `À quoi ressemble ton objectif financier dans 12 mois — et comment s'aligne-t-il avec l'impact que tu veux créer ? Quelle combinaison d'offres te permettrait d'atteindre cette cible tout en restant aligné ?`,
            },
          },
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
    label: { EN: "CLIENT AVATAR MAP", FR: "CLIENT AVATAR MAP" },
    emoji: "👤",
    subtitle: { EN: "For whom exactly?", FR: "Pour qui exactement ?" },
    desc: {
      EN: "Build an ultra-precise portrait of the ideal client to speak to their soul.",
      FR: "Construire un portrait ultra-précis du client idéal pour parler à son âme.",
    },
    sections: [
      {
        icon: "🪞",
        title: { EN: "Portrait & Identity", FR: "Portrait & Identité" },
        sub: { EN: "Who is this person, concretely?", FR: "Qui est cette personne concrètement ?" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `If your ideal client had a first name, an age, a profession and a place to live — who would they be? Describe them in a few sentences as if you knew them personally.`,
              FR: `Si ton client idéal avait un prénom, un âge, une profession et un lieu de vie — qui serait-il ? Décris-le en quelques phrases comme si tu le connaissais personnellement.`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `What are their core personality traits? Analytical or intuitive? Solitary or social? Ambitious or withdrawn? What is their attitude toward change?`,
              FR: `Quelles sont ses caractéristiques de personnalité fondamentales ? Analytique ou intuitif ? Solitaire ou social ? Ambitieux ou en retrait ? Quelle est son attitude face au changement ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `Describe your ideal client in one powerful sentence — the person who will love what you do from day one. What makes them unique among everyone you could serve?`,
              FR: `Décris ton client idéal en une seule phrase puissante — la personne qui va adorer ce que tu fais dès le premier jour. Qu'est-ce qui le rend unique parmi tous ceux que tu pourrais servir ?`,
            },
          },
        ],
      },
      {
        icon: "🌑",
        title: { EN: "Pains & Blocks", FR: "Douleurs & Blocages" },
        sub: { EN: "What keeps them from moving forward", FR: "Ce qui l'empêche d'avancer" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `What are the main pains, frustrations or challenges your ideal client experiences? What wakes them up at night or keeps them from falling asleep?`,
              FR: `Quelles sont les douleurs, frustrations ou défis principaux que vit ton client idéal ? Qu'est-ce qui le réveille la nuit ou l'empêche de s'endormir ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `What repetitive patterns or behaviors keep them stuck? What are they not yet aware of that limits their progress? What truth do they still refuse to see?`,
              FR: `Quels patterns répétitifs ou comportements le maintiennent coincé ? De quoi n'est-il pas encore conscient qui limite sa progression ? Quelle vérité refuse-t-il encore de voir ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `What is THE deep pain — often unspoken — at the root of all their visible problems? It's not what they say they're looking for, but what they truly need.`,
              FR: `Quelle est LA douleur profonde — souvent inavouée — à la racine de tous ses problèmes visibles ? Ce n'est pas ce qu'il dit chercher, mais ce dont il a vraiment besoin.`,
            },
          },
        ],
      },
      {
        icon: "🌟",
        title: { EN: "Aspirations & Desires", FR: "Aspirations & Désirs" },
        sub: { EN: "What they truly want", FR: "Ce qu'il veut vraiment" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `What are your ideal client's desires and aspirations — what they dream of having, being or experiencing? What are they actively seeking?`,
              FR: `Quels sont les désirs et aspirations de ton client idéal — ce qu'il rêve d'avoir, d'être ou de vivre ? Qu'est-ce qu'il cherche activement ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `What life do they imagine after the transformation? How do they see themselves in 1 year if all went well? What would have changed in their relationships, their work, their well-being?`,
              FR: `Quelle vie imagine-t-il après la transformation ? Comment se voit-il dans 1 an si tout allait bien ? Qu'est-ce qui aurait changé dans ses relations, son travail, son bien-être ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `What is the deep aspiration — often unspoken — behind all their visible goals? It's not what they're looking for but what they truly want to feel.`,
              FR: `Quelle est l'aspiration profonde — souvent non dite — derrière tous ses objectifs visibles ? Ce n'est pas ce qu'il cherche mais ce qu'il veut vraiment ressentir.`,
            },
          },
        ],
      },
      {
        icon: "🛡️",
        title: { EN: "Objections & Resistances", FR: "Objections & Résistances" },
        sub: { EN: "What keeps them from saying yes", FR: "Ce qui l'empêche de dire oui" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `What are the main objections your ideal client would have before committing to you? Price, time, skepticism, fear of change?`,
              FR: `Quelles sont les objections principales que ton client idéal aurait avant de s'engager avec toi ? Prix, temps, scepticisme, peur du changement ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `What makes them wary of approaches like yours — unconventional, spiritual, intuitive? How do you reassure them without compromising your essence?`,
              FR: `Qu'est-ce qui le rend méfiant face à des approches comme la tienne — non-conventionnelles, spirituelles, intuitives ? Comment réassures-tu sans compromettre ton essence ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `What is the real resistance behind their visible objections? Often it's not the price or the time — it's the fear of what, exactly?`,
              FR: `Quelle est la vraie résistance derrière ses objections visibles ? Souvent ce n'est pas le prix ou le temps — c'est la peur de quoi exactement ?`,
            },
          },
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
    label: { EN: "IMPACT TRANSFORMATION MAP", FR: "IMPACT TRANSFORMATION MAP" },
    emoji: "💥",
    subtitle: { EN: "What transformation do you create?", FR: "Quelle transformation tu crées ?" },
    desc: {
      EN: "Crystallize the exact, unrepeatable impact that only you can create.",
      FR: "Cristalliser l'impact exact et irréplicable que seul toi tu peux créer.",
    },
    sections: [
      {
        icon: "🌑",
        title: { EN: "The BEFORE State", FR: "État AVANT" },
        sub: { EN: "Where the client is when they arrive", FR: "Où se trouve le client quand il arrive" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `Describe the state your client is in when they arrive at your door. What do they feel? What do they think? What is no longer working for them?`,
              FR: `Décris l'état dans lequel se trouve ton client quand il arrive chez toi. Que ressent-il ? Que pense-t-il ? Qu'est-ce qui ne fonctionne plus pour lui ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `What is the breaking point or threshold moment that led them to seek you out? What happened for them to realize they needed help — or a different way of seeing?`,
              FR: `Quel est le moment de rupture ou de seuil qui l'a amené à te chercher ? Qu'est-ce qui s'est passé pour qu'il réalise qu'il avait besoin d'aide — ou d'une autre façon de voir ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `In one sentence, what is the fundamental 'BEFORE' — the most universal starting state among all your ideal clients?`,
              FR: `En une phrase, quel est le 'AVANT' fondamental — l'état de départ le plus universel parmi tous tes clients idéaux ?`,
            },
          },
        ],
      },
      {
        icon: "🌅",
        title: { EN: "The AFTER State", FR: "État APRÈS" },
        sub: { EN: "Where the client is after transformation", FR: "Où se trouve le client après transformation" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `Describe the state your client is in after working with you. What do they feel? How do they see things differently? What has concretely changed?`,
              FR: `Décris l'état dans lequel se trouve ton client après avoir travaillé avec toi. Que ressent-il ? Comment voit-il les choses différemment ? Qu'est-ce qui a changé concrètement ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `What is the most irreversible transformation? The change that stays forever? What can clients no longer 'unlearn' after working with you?`,
              FR: `Quelle est la transformation la plus irréversible ? Le changement qui reste pour toujours ? Qu'est-ce que les clients ne peuvent plus 'désapprendre' après avoir travaillé avec toi ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `In one sentence, what is the fundamental 'AFTER' — the most universal and most powerful outcome your work creates?`,
              FR: `En une phrase, quel est le 'APRÈS' fondamental — le résultat le plus universel et le plus puissant que ton travail crée ?`,
            },
          },
        ],
      },
      {
        icon: "🚀",
        title: { EN: "Vehicle of Transformation", FR: "Véhicule de Transformation" },
        sub: { EN: "How the transformation happens", FR: "Comment la transformation se produit" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `What is the main mechanism through which transformation happens in your work? It's not your tools — it's the invisible process that makes it work.`,
              FR: `Quel est le mécanisme principal à travers lequel la transformation se produit dans ton travail ? Ce n'est pas tes outils — c'est le processus invisible qui fait que ça marche.`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `What do you do or create that is fundamentally different from everything your client has tried before? What is the secret ingredient of your approach?`,
              FR: `Qu'est-ce que tu fais ou crées qui est fondamentalement différent de tout ce que ton client a essayé avant ? Quel est l'ingrédient secret de ton approche ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `Frame your impact as a statement: 'I create [transformation] for [audience] through [how].' What is your unique and irreplaceable transformation signature?`,
              FR: `Formule ton impact en une déclaration : 'Je crée [transformation] pour [audience] en [comment].' Quelle est ta signature de transformation unique et irremplaçable ?`,
            },
          },
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
    label: { EN: "GROWTH JOURNEY MAP", FR: "GROWTH JOURNEY MAP" },
    emoji: "🌱",
    subtitle: { EN: "How do you scale?", FR: "Comment tu scales ?" },
    desc: {
      EN: "Build the progressive client journey from the first encounter to the premium offer.",
      FR: "Construire le parcours client progressif de la première rencontre à l'offre premium.",
    },
    sections: [
      {
        icon: "🚪",
        title: { EN: "Entry Point Offering", FR: "Entry Point Offering" },
        sub: { EN: "The low-cost or free entry door", FR: "La porte d'entrée à faible coût ou en accès libre" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `What is the most natural step someone could take to engage with you — at no cost or commitment — that still gives them a taste of transformation?`,
              FR: `Quelle est l'étape la plus naturelle que quelqu'un pourrait franchir pour s'engager avec toi — sans coût ni engagement — qui lui donne quand même un avant-goût de transformation ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `Which format feels most aligned for this first contact? (Discovery call, guided audio, meditation, newsletter, live event, free content) Easy for them to say 'yes' to, powerful for you?`,
              FR: `Quel format te semble le plus aligné pour ce premier contact ? (Call découverte, audio guidé, méditation, newsletter, événement live, contenu en accès libre) Facile à dire 'oui' pour eux, puissant pour toi ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `How does this entry point naturally create the desire to go further? What is the 'mini-awakening' or 'small win' it delivers — and the natural bridge toward the next offer?`,
              FR: `Comment cet entry point crée-t-il naturellement l'envie d'aller plus loin ? Quel est le 'mini-éveil' ou la 'petite victoire' qu'il délivre — et le pont naturel vers l'offre suivante ?`,
            },
          },
        ],
      },
      {
        icon: "🌿",
        title: { EN: "Introductory Offer", FR: "Introductory Offer" },
        sub: { EN: "The first accessible paid offer", FR: "La première offre payante accessible" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `What is your first paid offer — accessible, low-friction — that lets someone test the depth of your work without committing heavily?`,
              FR: `Quelle est ta première offre payante — accessible, à faible friction — qui permet de tester la profondeur de ton travail sans s'engager massivement ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `What is the ideal price, duration and format? What specific transformation does it deliver — and how does it naturally set the stage for a deeper relationship?`,
              FR: `Quel est le prix, la durée et le format idéal ? Quelle transformation spécifique délivre-t-elle — et comment prépare-t-elle naturellement le terrain pour une relation plus profonde ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `How do you know a client is ready to move to the next offer after this intro? What signal or transformation indicates it's the right moment?`,
              FR: `Comment sais-tu qu'un client est prêt à passer à l'offre suivante après cette intro ? Quel signal ou transformation indique que c'est le moment ?`,
            },
          },
        ],
      },
      {
        icon: "💫",
        title: { EN: "Core Transformation Offer", FR: "Core Transformation Offer" },
        sub: { EN: "Your main offer — the backbone", FR: "Ton offre principale — la colonne vertébrale" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `What is your main offer — the one that represents the heart of your practice and delivers the deepest transformation you offer regularly?`,
              FR: `Quelle est ton offre principale — celle qui représente le cœur de ta pratique et délivre la transformation la plus profonde que tu offres régulièrement ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `What is the ideal duration, structure, price and format? What sets this offer apart from everything else on the market? Why is it irreplaceable?`,
              FR: `Quelle est la durée, la structure, le prix et le format idéal ? Qu'est-ce qui différencie cette offre de tout ce qui existe sur le marché ? Pourquoi est-elle irremplaçable ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `Is this offer currently structured to deliver the promised transformation consistently? What is missing or could be improved for it to reach its full potential?`,
              FR: `Cette offre est-elle actuellement structurée pour délivrer systématiquement la transformation promise ? Qu'est-ce qui manque ou pourrait être amélioré pour qu'elle soit à son plein potentiel ?`,
            },
          },
        ],
      },
      {
        icon: "👑",
        title: { EN: "Premium / VIP Offer", FR: "Premium / VIP Offer" },
        sub: { EN: "The high-value offer", FR: "L'offre haute valeur" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `What is your premium offer — reserved for clients who want to go the furthest, the fastest, with the most access to you? How do you deliver the maximum of your essence at this level?`,
              FR: `Quelle est ton offre premium — réservée aux clients qui veulent aller le plus loin, le plus vite, avec le plus d'accès à toi ? Comment délivres-tu le maximum de ton essence à ce niveau ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `What is the price, duration, format and distinctive elements? What does it include that nothing else does? What is the ideal client profile for this offer?`,
              FR: `Quel est le prix, la durée, le format et les éléments distinctifs ? Qu'est-ce qu'elle inclut que rien d'autre n'inclut ? Quel est le profil du client idéal pour cette offre ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `Does this offer position you at the level of value you deserve? Does it reflect the depth and rarity of what you bring — or have you underestimated yourself?`,
              FR: `Est-ce que cette offre te positionne au niveau de valeur que tu mérites ? Reflète-t-elle la profondeur et la rareté de ce que tu apportes — ou t'es-tu sous-estimé ?`,
            },
          },
        ],
      },
      {
        icon: "♾️",
        title: { EN: "Community & Passive Income", FR: "Community & Passive Income" },
        sub: { EN: "Recurring & scalable income", FR: "Revenus récurrents & scalables" },
        questions: [
          {
            layer: "SURFACE",
            text: {
              EN: `How could you create a way for your clients to stay in your orbit, sustain their transformation and keep being nourished by your work — on a recurring basis?`,
              FR: `Comment pourrais-tu créer une façon pour tes clients de rester dans ton orbite, maintenir leur transformation et continuer à être nourris par ton travail — de façon récurrente ?`,
            },
          },
          {
            layer: "EXPANSION",
            text: {
              EN: `What assets (content, courses, products, membership, elixirs, tools) could you create once that would keep generating value and income without your direct presence?`,
              FR: `Quels actifs (contenu, cours, produits, membership, élixirs, outils) pourrais-tu créer une fois et qui continueraient à générer de la valeur et des revenus sans ta présence directe ?`,
            },
          },
          {
            layer: "VALIDATION",
            text: {
              EN: `What combination of recurring income would give you a stable financial base while continuing to offer your deepest work without pressure?`,
              FR: `Quelle combinaison de revenus récurrents te permettrait d'avoir une base financière stable tout en continuant à offrir ton travail le plus profond sans pression ?`,
            },
          },
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
  text: Bilingual;
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
