// Diagnostic + bascule du flag timeline (base LOCALE).
// Usage : DATABASE_URL="postgresql://joffreydeleplanque@localhost:5432/hive_db" node scripts/parcours-test.cjs
const { PrismaClient } = require("@prisma/client");
(async () => {
  const p = new PrismaClient();
  const client =
    (await p.client.findFirst({ where: { claritySubmission: { isNot: null } }, include: { user: true } })) ||
    (await p.client.findFirst({ include: { user: true } }));
  if (!client) { console.log("Aucun client en base."); process.exit(1); }

  console.log("\n===== AVANT =====");
  console.log("Client                  :", client.user.name, "(" + client.user.email + ")");
  console.log("parcoursType            :", client.parcoursType);
  console.log("requiresProgramTimeline :", client.requiresProgramTimeline);

  await p.client.update({ where: { id: client.id }, data: { requiresProgramTimeline: false } });
  const after = await p.client.findUnique({ where: { id: client.id }, select: { requiresProgramTimeline: true } });

  console.log("\n===== APRÈS (forcé) =====");
  console.log("requiresProgramTimeline :", after.requiresProgramTimeline);
  console.log("\n➡️  RECHARGE (Cmd+R) la fiche admin ET l'accueil client.");
  console.log("   L'habillage Passage (bandeau étapes, 103j, écran prépa) doit DISPARAÎTRE.");
  console.log("   S'il est encore là après rechargement → dis-le-moi, c'est mon code à corriger.\n");
  process.exit(0);
})().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
