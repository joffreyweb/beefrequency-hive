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
