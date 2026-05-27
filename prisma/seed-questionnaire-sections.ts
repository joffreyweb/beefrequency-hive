import { PrismaClient } from "@prisma/client";
import { SECTION_SEED } from "../lib/offer-parcours-binding";

// Seed idempotent des sections de questionnaire (LOT P0).
// Questions vides — à remplir par Joffrey via l'admin plus tard.
const prisma = new PrismaClient();

async function main() {
  for (const s of SECTION_SEED) {
    await prisma.questionnaireSection.upsert({
      where: { slug: s.slug },
      update: { title: s.title, order: s.order }, // ne touche PAS aux questions déjà remplies
      create: { slug: s.slug, title: s.title, order: s.order, questions: [], isActive: true },
    });
  }
  console.log(`Seeded ${SECTION_SEED.length} questionnaire sections.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
