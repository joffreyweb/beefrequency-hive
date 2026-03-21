import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("Test2026!", 12);

  const user = await prisma.user.upsert({
    where: { email: "nouveau@test.com" },
    update: {},
    create: {
      email: "nouveau@test.com",
      password: hashedPassword,
      role: "CLIENT",
      name: "Sophie Laurent",
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
      onboardingCompleted: false,
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
