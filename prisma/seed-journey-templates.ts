import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Variantes HD par défaut pour chaque template
function makeVariants(defaultBody: string): string {
  return JSON.stringify({
    GENERATOR: {
      subject: "Énergie sacrale en mouvement",
      body: defaultBody.replace("{{hdNote}}", "Ton énergie sacrale est ton guide. Réponds à ce qui t'allume, laisse ton corps te montrer le chemin."),
    },
    MANIFESTOR: {
      subject: "L'impulsion créatrice",
      body: defaultBody.replace("{{hdNote}}", "Tu es fait·e pour initier. Informe ton entourage de tes élans, et laisse l'impact se déployer."),
    },
    MANIFESTING_GENERATOR: {
      subject: "Multi-potentiel en action",
      body: defaultBody.replace("{{hdNote}}", "Ta rapidité est un don. Permets-toi les pivots, les changements de direction — c'est ta nature profonde."),
    },
    PROJECTOR: {
      subject: "La sagesse de l'attente",
      body: defaultBody.replace("{{hdNote}}", "Ta guidance est précieuse. Attends l'invitation, et quand elle vient, ta sagesse éclaire tout."),
    },
    REFLECTOR: {
      subject: "Le miroir lunaire",
      body: defaultBody.replace("{{hdNote}}", "Tu reflètes la santé de ton environnement. Accorde-toi un cycle lunaire complet avant les grandes décisions."),
    },
    DEFAULT: {
      subject: "Message de parcours",
      body: defaultBody.replace("{{hdNote}}", "Chaque jour est une opportunité de transformation."),
    },
  });
}

const templates = [
  {
    title: "J+1 — Bienvenue",
    dayTrigger: 1,
    triggerType: "JOURNEY_DAY" as const,
    hdVariants: makeVariants(
      "Bienvenue {{firstName}},\n\nTon parcours commence aujourd'hui. Jour {{dayNumber}} de ta transformation.\n\n{{hdNote}}\n\nJe suis là pour t'accompagner à chaque étape.\n\nAvec bienveillance,\nJoffrey"
    ),
  },
  {
    title: "J+3 — Ancrage semaine 1",
    dayTrigger: 3,
    triggerType: "JOURNEY_DAY" as const,
    hdVariants: makeVariants(
      "{{firstName}},\n\nJour {{dayNumber}}. Les premiers jours sont souvent les plus intenses. C'est normal.\n\n{{hdNote}}\n\nPrend le temps d'observer ce qui bouge en toi. Note-le dans ton journal.\n\nJoffrey"
    ),
  },
  {
    title: "J+7 — Bilan semaine 1",
    dayTrigger: 7,
    triggerType: "JOURNEY_DAY" as const,
    hdVariants: makeVariants(
      "{{firstName}},\n\nUne semaine déjà. Jour {{dayNumber}}.\n\nQu'as-tu remarqué ? Quels changements subtils se dessinent ?\n\n{{hdNote}}\n\nC'est le moment de faire un petit bilan dans ton journal.\n\nJoffrey"
    ),
  },
  {
    title: "J+10 — Ancrage semaine 2",
    dayTrigger: 10,
    triggerType: "JOURNEY_DAY" as const,
    hdVariants: makeVariants(
      "{{firstName}},\n\nJour {{dayNumber}}. La deuxième semaine approfondit le travail.\n\n{{hdNote}}\n\nContinue d'écouter ton corps et tes ressentis.\n\nJoffrey"
    ),
  },
  {
    title: "J+14 — Mi-parcours",
    dayTrigger: 14,
    triggerType: "JOURNEY_DAY" as const,
    hdVariants: makeVariants(
      "{{firstName}},\n\nMi-parcours. Jour {{dayNumber}}.\n\nTu es au cœur de la transformation. C'est ici que les choses bougent vraiment.\n\n{{hdNote}}\n\nJe suis fier de ton engagement.\n\nJoffrey"
    ),
  },
  {
    title: "J+17 — Ancrage semaine 3",
    dayTrigger: 17,
    triggerType: "JOURNEY_DAY" as const,
    hdVariants: makeVariants(
      "{{firstName}},\n\nJour {{dayNumber}}. La dernière ligne droite commence.\n\n{{hdNote}}\n\nChaque jour compte. Continue.\n\nJoffrey"
    ),
  },
  {
    title: "J+21 — Célébration fin de parcours",
    dayTrigger: 21,
    triggerType: "JOURNEY_DAY" as const,
    hdVariants: makeVariants(
      "{{firstName}},\n\n21 jours. Tu l'as fait.\n\nCe parcours n'est pas une fin, c'est un nouveau départ. Le poison est devenu nectar.\n\n{{hdNote}}\n\nAvec toute ma gratitude,\nJoffrey"
    ),
  },
  // Anniversaire géré manuellement via PendingAction — pas de template auto
];

async function main() {
  for (const tmpl of templates) {
    await prisma.journeyMessageTemplate.upsert({
      where: { id: tmpl.title }, // Won't match — will create
      update: {},
      create: tmpl,
    });
  }
  console.log(`${templates.length} templates de messages parcours créés.`);
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
