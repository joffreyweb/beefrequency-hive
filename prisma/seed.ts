import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin account
  const hashedPassword = await bcrypt.hash("BeeFrequency2026!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@beefrequency.com" },
    update: {},
    create: {
      email: "admin@beefrequency.com",
      password: hashedPassword,
      role: "ADMIN",
      name: "Joffrey Deleplanque",
    },
  });

  console.log("Admin created:", admin.email);

  // ElixirLibrary — 6 elixirs
  const elixirs = [
    {
      name: "Detox",
      description: "Élixir de détoxification cellulaire profonde",
      dosage: "20 gouttes",
      unit: "GOUTTES" as const,
      category: "ACTIVATION" as const,
      timing: "MATIN" as const,
      notes: "À prendre à jeun dans un verre d'eau",
    },
    {
      name: "Draineur",
      description: "Drainage lymphatique et tissulaire — diluer dans 1L d'eau",
      dosage: "2 capuchons / 1L",
      unit: "CAPUCHONS" as const,
      category: "ACTIVATION" as const,
      timing: "JOURNEE" as const,
      notes: "Boire tout au long de la journée",
    },
    {
      name: "Binder",
      description: "Capteur de toxines — à prendre entre les repas",
      dosage: "2 gélules",
      unit: "GELULES" as const,
      category: "ACTIVATION" as const,
      timing: "JOURNEE" as const,
      notes: "30 min avant ou 2h après les repas",
    },
    {
      name: "Supramineral",
      description: "Reminéralisation profonde — soutien du terrain",
      dosage: "15 gouttes",
      unit: "GOUTTES" as const,
      category: "SUPPORT" as const,
      timing: "MATIN" as const,
      notes: "Sous la langue, garder 30 secondes",
    },
    {
      name: "Deep Sleep",
      description: "Soutien du sommeil profond et de la régénération nocturne",
      dosage: "5 gouttes",
      unit: "GOUTTES" as const,
      category: "SUPPORT" as const,
      timing: "SOIR" as const,
      notes: "15 min avant le coucher",
    },
    {
      name: "Cell Core",
      description: "Soutien hépatique et vésiculaire — phase d'intégration",
      dosage: "10 gouttes",
      unit: "GOUTTES" as const,
      category: "INTEGRATION" as const,
      timing: "MATIN" as const,
      notes: "Élixir foie/vésicule pour les phases d'intégration",
    },
  ];

  for (const elixir of elixirs) {
    await prisma.elixirLibrary.upsert({
      where: { id: elixir.name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        id: elixir.name.toLowerCase().replace(/\s+/g, "-"),
        ...elixir,
      },
    });
  }

  console.log("ElixirLibrary seed:", elixirs.length, "elixirs created");

  // 66 Wisdom Messages — DayMessage seed
  const wisdomMessages = [
    "One thing never changes, that is infinity",
    "Learn to identify yourself under every circumstances",
    "We all know we have a destiny",
    "To be calm is the highest achievement of the self",
    "You travel in grace knowing you are protected by love",
    "Our head bows and our heart is filled with love and joy",
    "When you identify yourself a lot of good things happen",
    "One who brings happiness to others, will find it",
    "In a life of thoughts and feelings, commitment becomes your saving grace",
    "There is no way to happiness, happiness is the way",
    "Be interested in your elevation",
    "Recognise that you are the truth",
    "Be fearless knowing that all will be provided at the right time",
    "Don't wait for heaven to come to you, create heaven",
    "Compassion creates understanding",
    "Desirable person is only that, who has no desire",
    "Sing from your heart",
    "The brightness of your being is generated from within",
    "Be guided. Listen to the whispers of the universe",
    "Those who have found their fulfillment are blessed",
    "Drop your problem and keep going",
    "Healing comes when triggers dissipate",
    "Share your strengths, not your weaknesses",
    "Speak the truth",
    "Seek something higher",
    "In order to be remembered leave nothing behind but love",
    "You will always live happy if you live with heart",
    "Be proud of who you are",
    "Without gratitude, there is no prosperity",
    "You live forever in the memory of the love you have shared",
    "How can you uplift this moment happening right now",
    "Every neighbour can be your teacher",
    "Seek excellence in every person",
    "Open up to infinity and become infinity",
    "Practice compassion, forgiveness and kindness",
    "Your teacher is your own intuition",
    "Experience something higher",
    "Let your heart speak to other hearts",
    "Those who have found guidance are blessed",
    "If you create a mental duality you lose your strength",
    "Your personality is how radiant you are",
    "Everybody wants to know whether you are dependable",
    "Self-reliance is the greatest art",
    "Every experience is a guidance in life, your response determines the quality",
    "When you refuse to become upset, you are also refusing to be set up",
    "Learn to relate to your soul, the light within you",
    "Those who have found their soul and their self are blessed",
    "You are the way you are, that is now",
    "Compassion has no limit. Kindness has no enemy",
    "Infinity which is your unknown guarantees your happiness",
    "In a life of thoughts and feelings, commitment becomes your saving grace",
    "You travel in grace knowing you are protected by love",
    "Be guided. Listen to the whispers of the universe",
    "When you identify yourself a lot of good things happen",
    "The brightness of your being is generated from within",
    "Your teacher is your own intuition",
  ];

  let createdCount = 0;
  for (const text of wisdomMessages) {
    const existing = await prisma.dayMessage.findFirst({ where: { text } });
    if (!existing) {
      await prisma.dayMessage.create({ data: { text, isActive: true } });
      createdCount++;
    }
  }

  console.log("DayMessage seed:", createdCount, "new messages created,", wisdomMessages.length, "total");

  // ═══ Modules ═══
  const moduleDefinitions = [
    { name: "detox", nameFr: "Detox", nameEn: "Detox", duration: 10, isStandalone: false, description: "Phase de nettoyage initial" },
    { name: "cycle", nameFr: "Cycle", nameEn: "Cycle", duration: 21, isStandalone: true, description: "Cycle complet de transformation" },
    { name: "break", nameFr: "Intégration", nameEn: "Integration", duration: 10, isStandalone: false, description: "Pause d'intégration entre les cycles" },
    { name: "protocol30", nameFr: "Protocole 30 jours", nameEn: "30-Day Protocol", duration: 30, isStandalone: false, description: "Suivi post-immersion SOS" },
  ];

  const moduleMap: Record<string, string> = {};
  for (const mod of moduleDefinitions) {
    const created = await prisma.module.upsert({
      where: { name: mod.name },
      update: { nameFr: mod.nameFr, nameEn: mod.nameEn, duration: mod.duration, description: mod.description, isStandalone: mod.isStandalone },
      create: mod,
    });
    moduleMap[mod.name] = created.id;
  }
  console.log("Module seed:", moduleDefinitions.length, "modules");

  // ═══ Programs ═══
  const programDefinitions = [
    {
      name: "monitoring", nameFr: "Le Passage", nameEn: "The Passage",
      description: "Programme Le Passage 1:1 — 103 jours",
      sequence: ["detox", "cycle", "break", "cycle", "break", "cycle", "break"],
    },
    {
      name: "sovereignty", nameFr: "Souveraineté 9 mois", nameEn: "Sovereignty 9 Months",
      description: "Programme Souveraineté complet",
      sequence: [
        "detox", "cycle", "break", "cycle", "break", "cycle", "break",
        "detox", "cycle", "break", "cycle", "break", "cycle", "break",
        "detox", "cycle", "break", "cycle", "break", "cycle", "break",
      ],
    },
    {
      name: "sos", nameFr: "SOS \u00b7 Urgence VIP", nameEn: "SOS Emergency VIP",
      description: "Immersion + Protocole 30j",
      sequence: ["protocol30"],
    },
  ];

  for (const prog of programDefinitions) {
    const { sequence, ...data } = prog;
    const created = await prisma.program.upsert({
      where: { name: prog.name },
      update: { nameFr: prog.nameFr, nameEn: prog.nameEn, description: prog.description },
      create: data,
    });

    await prisma.programModule.deleteMany({ where: { programId: created.id } });
    for (let i = 0; i < sequence.length; i++) {
      await prisma.programModule.create({
        data: { programId: created.id, moduleId: moduleMap[sequence[i]], order: i + 1 },
      });
    }
  }
  console.log("Program seed:", programDefinitions.length, "programs");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
