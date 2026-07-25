// Crée quelques pratiques d'exemple dans chaque catégorie + sous-dossier (base LOCALE).
// Usage : DATABASE_URL="postgresql://joffreydeleplanque@localhost:5432/hive_db" node scripts/seed-sample-practices.cjs
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const samples = [
  { category: "NUTRITION",        subFolder: "Detox",          title: "Jus vert du matin",        description: "Céleri, concombre, citron, gingembre — à jeun." },
  { category: "NUTRITION",        subFolder: "Detox",          title: "Bouillon minéralisé",      description: "Bouillon d'os ou de légumes reminéralisant." },
  { category: "SLEEP",            subFolder: "Rituel du soir", title: "4-7-8 avant le sommeil",   description: "Respiration apaisante pour s'endormir." },
  { category: "SLEEP",            subFolder: "Rituel du soir", title: "Écrans off 60 min",        description: "Couper les écrans une heure avant le coucher." },
  { category: "SYSTEME_NERVEUX",  subFolder: "Reset",          title: "Scan corporel",            description: "Balayer le corps pour relâcher les tensions." },
  { category: "SYSTEME_NERVEUX",  subFolder: "Anxiety panic",  title: "Ancrage 5-4-3-2-1",        description: "5 choses vues, 4 entendues, 3 touchées, 2 senties, 1 goûtée." },
  { category: "DETOX",            subFolder: "Cure",           title: "Hydratation citron",       description: "Eau tiède citronnée au réveil." },
  { category: "MOUVEMENT",        subFolder: "Matin",          title: "Étirements doux",          description: "Réveil articulaire en 5 minutes." },
  { category: "MINDSET",          subFolder: "Ancrage",        title: "Journal de gratitude",     description: "Noter 3 gratitudes chaque soir." },
  { category: "MINDSET",          subFolder: "Meditation",     title: "Méditation guidée 10 min", description: "Présence, souffle et détente." },
];

(async () => {
  let created = 0, skipped = 0;
  for (const s of samples) {
    const exists = await p.practice.findFirst({ where: { title: s.title } });
    if (exists) { skipped++; continue; }
    await p.practice.create({
      data: {
        title: s.title,
        description: s.description,
        type: "MEDITATION",
        content: "{}",
        category: s.category,
        subFolder: s.subFolder,
        isGlobal: false,
        dayTrigger: null,
      },
    });
    created++;
  }
  console.log(`\nPratiques d'exemple : ${created} créées, ${skipped} déjà présentes.\n`);
  process.exit(0);
})().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
