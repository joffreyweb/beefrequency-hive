import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const practices = [
  {
    title: "Respiration cohérente",
    description: "Inspirez 5 secondes, expirez 5 secondes. Un rythme qui harmonise le système nerveux et le cœur.",
    type: "BREATHING" as const,
    content: JSON.stringify({
      pattern: [5, 0, 5, 0],
      cycles: 10,
      guidanceText: "Laissez le souffle trouver son rythme naturel. 5 secondes d'inspiration, 5 secondes d'expiration.",
      animationType: "circle",
    }),
    category: "RESPIRATION" as const,
    isGlobal: true,
    dayTrigger: 1,
  },
  {
    title: "Respiration 4-7-8",
    description: "Technique du Dr Andrew Weil. Apaisante et profondément relaxante. Idéale avant le sommeil.",
    type: "BREATHING" as const,
    content: JSON.stringify({
      pattern: [4, 7, 8, 0],
      cycles: 8,
      guidanceText: "Inspirez par le nez 4 secondes. Retenez 7 secondes. Expirez par la bouche 8 secondes.",
      animationType: "wave",
    }),
    category: "RESPIRATION" as const,
    isGlobal: true,
    dayTrigger: 3,
  },
  {
    title: "Box Breathing",
    description: "Respiration en carré. Utilisée par les Navy SEALs pour la concentration et le calme sous pression.",
    type: "BREATHING" as const,
    content: JSON.stringify({
      pattern: [4, 4, 4, 4],
      cycles: 8,
      guidanceText: "Quatre temps égaux. Inspirez 4s, retenez 4s, expirez 4s, retenez 4s. Un carré parfait.",
      animationType: "box",
    }),
    category: "RESPIRATION" as const,
    isGlobal: true,
    dayTrigger: 7,
  },
];

async function main() {
  for (const p of practices) {
    await prisma.practice.create({ data: p });
  }
  console.log(`${practices.length} pratiques par défaut créées.`);
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
