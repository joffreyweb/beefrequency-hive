import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Crée le compte admin Joffrey
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

  console.log("Admin créé :", admin.email);

  // Seed ElixirLibrary — 6 élixirs exemple
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

  console.log("ElixirLibrary seed :", elixirs.length, "élixirs créés");
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
