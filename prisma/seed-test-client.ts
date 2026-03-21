import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("Test2026!", 12);

  const user = await prisma.user.upsert({
    where: { email: "client@test.com" },
    update: {},
    create: {
      email: "client@test.com",
      password: hashedPassword,
      role: "CLIENT",
      name: "Marie Dupont",
    },
  });

  await prisma.client.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      offerType: "THE_PASSAGE",
      status: "ACTIVE",
      startDate: new Date(),
    },
  });

  console.log("Client test créé :", user.email);
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
