// Pose un mot de passe connu sur le compte ADMIN (base LOCALE uniquement).
// Usage : DATABASE_URL="postgresql://joffreydeleplanque@localhost:5432/hive_db" node scripts/set-admin-password.cjs
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
(async () => {
  const p = new PrismaClient();
  const admin = await p.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
  if (!admin) { console.log("\n❌ Aucun compte ADMIN en base locale.\n"); process.exit(1); }
  await p.user.update({ where: { id: admin.id }, data: { password: bcrypt.hashSync("admin1234", 10) } });
  console.log("\n===== ADMIN (local) =====");
  console.log("Email        : " + admin.email);
  console.log("Mot de passe : admin1234");
  console.log("=========================\n");
  process.exit(0);
})().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
