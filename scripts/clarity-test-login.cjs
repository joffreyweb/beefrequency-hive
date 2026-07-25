// Prépare un client de test pour Clarity (base LOCALE uniquement).
// Usage (terminal Mac) :
//   cd ~/beefrequency-hive
//   DATABASE_URL="postgresql://joffreydeleplanque@localhost:5432/hive_db" node scripts/clarity-test-login.cjs
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

(async () => {
  const p = new PrismaClient();

  // 1) On privilégie un client qui a déjà Clarity ; sinon un client "Test" ; sinon le premier.
  let client =
    (await p.client.findFirst({ where: { claritySubmission: { isNot: null } }, include: { user: true } })) ||
    (await p.client.findFirst({ where: { user: { name: { contains: "Test" } } }, include: { user: true } })) ||
    (await p.client.findFirst({ include: { user: true } }));

  if (!client) {
    console.log("\n❌ Aucun client en base locale. Dis-le à Claude, il te fera un script de création.\n");
    process.exit(1);
  }

  // 2) Mot de passe connu + onboarding forcé (sinon la garde renvoie vers /client/onboarding)
  await p.user.update({ where: { id: client.userId }, data: { password: bcrypt.hashSync("test1234", 10) } });
  await p.client.update({ where: { id: client.id }, data: { onboardingCompleted: true } });

  // 3) Clarity activé (DRAFT) — idempotent, ne touche pas une submission existante
  await p.claritySubmission.upsert({
    where: { clientId: client.id },
    create: { clientId: client.id, status: "DRAFT" },
    update: {},
  });

  console.log("\n===== PRÊT POUR LE TEST CLARITY =====");
  console.log("URL          : http://localhost:3000");
  console.log("Email        : " + client.user.email);
  console.log("Mot de passe : test1234");
  console.log("Client       : " + client.user.name);
  console.log("(onboarding forcé + Clarity activé — base locale uniquement)");
  console.log("=====================================\n");
  process.exit(0);
})().catch((e) => {
  console.error("ERREUR:", e.message);
  process.exit(1);
});
