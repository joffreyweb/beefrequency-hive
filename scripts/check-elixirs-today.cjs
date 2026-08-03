// Diagnostic « Élixirs du jour » — reproduit EXACTEMENT la logique de app/client/home/page.tsx
// Usage : node scripts/check-elixirs-today.cjs "email-ou-nom-ou-prenom"
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function isElixirDayMatch(frequency, date) {
  const d = date.getDay(); // 0=dim 1=lun ... 6=sam
  switch (frequency) {
    case "DAILY": return true;
    case "MON_JEU": return d === 1 || d === 4;
    case "MAR_VEN": return d === 2 || d === 5;
    case "LUNDI": return d === 1;
    case "MARDI": return d === 2;
    case "MERCREDI": return d === 3;
    case "JEUDI": return d === 4;
    case "VENDREDI": return d === 5;
    case "SAMEDI": return d === 6;
    case "DIMANCHE": return d === 0;
    default: return true;
  }
}

(async () => {
  const q = process.argv[2];

  // Mode liste : "list" OU aucun argument → affiche tous les clients puis quitte
  if (!q || q.toLowerCase() === "list") {
    const all = await prisma.client.findMany({
      include: { user: true, intake: true },
      orderBy: { createdAt: "asc" },
    });
    console.log(`\n=== ${all.length} CLIENT(S) EN BASE ===`);
    for (const c of all) {
      console.log(`- ${c.intake?.firstName || c.user?.name || "?"}  <${c.user?.email || "?"}>  · parcours=${c.parcoursType} · produitsRecus=${c.produitsRecus} · detoxStartDate=${c.detoxStartDate ? new Date(c.detoxStartDate).toISOString().slice(0,10) : "—"}`);
    }
    console.log("\n👉 Relance avec un nom ou email : node scripts/check-elixirs-today.cjs \"prenom\"");
    await prisma.$disconnect();
    return;
  }

  const client = await prisma.client.findFirst({
    where: {
      OR: [
        { user: { email: { contains: q, mode: "insensitive" } } },
        { user: { name:  { contains: q, mode: "insensitive" } } },
        { intake: { firstName: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: { user: true, intake: true },
  });
  if (!client) {
    console.log(`❌ Aucun client trouvé pour "${q}". Liste des clients en base :`);
    const all = await prisma.client.findMany({ include: { user: true, intake: true }, orderBy: { createdAt: "asc" } });
    for (const c of all) console.log(`   - ${c.intake?.firstName || c.user?.name || "?"}  <${c.user?.email || "?"}>`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const now = new Date();
  const jours = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
  console.log("\n================ CLIENT ================");
  console.log("Nom / email      :", client.user?.name, "/", client.user?.email);
  console.log("parcoursType     :", client.parcoursType);
  console.log("requiresElixirs  :", client.requiresElixirs, client.requiresElixirs ? "" : "  ⚠️ SECTION MASQUÉE si false");
  console.log("produitsRecus    :", client.produitsRecus);
  console.log("detoxStartDate   :", client.detoxStartDate);
  console.log("Aujourd'hui      :", now.toString(), "→", jours[now.getDay()]);

  const programHasStarted = client.produitsRecus && !!client.detoxStartDate && new Date(client.detoxStartDate).getTime() <= Date.now();
  console.log("programHasStarted:", programHasStarted, programHasStarted ? "" : "  ⚠️ page ATTENTE (aucun élixir listé) si non-CUSTOM");

  const allPhases = await prisma.clientPhase.findMany({
    where: { clientId: client.id },
    orderBy: { startDate: "asc" },
    include: { phaseElixirs: { include: { elixirLibrary: true } } },
  });

  const today = new Date(); today.setHours(12,0,0,0);
  const activePhase =
    allPhases.find((p) => {
      const s = new Date(p.startDate); s.setHours(0,0,0,0);
      const e = new Date(p.endDate);   e.setHours(23,59,59,999);
      return today >= s && today <= e;
    }) ?? allPhases.find((p) => new Date(p.startDate) > today) ?? null;

  console.log("\n================ PHASES ================");
  for (const p of allPhases) {
    const act = p === activePhase ? " ⬅️ ACTIVE AUJOURD'HUI" : "";
    console.log(`- ${p.phaseType} (#${p.phaseNumber}) ${new Date(p.startDate).toISOString().slice(0,10)} → ${new Date(p.endDate).toISOString().slice(0,10)} · ${p.phaseElixirs.length} élixir(s)${act}`);
  }

  const totalElixirs = allPhases.reduce((n,p)=>n+p.phaseElixirs.length,0);
  console.log(`\nTotal élixirs assignés (toutes phases) : ${totalElixirs}`);

  if (!activePhase) { console.log("\n⚠️ Aucune phase active aujourd'hui → 0 élixir affiché."); await prisma.$disconnect(); return; }

  console.log(`\n=== ÉLIXIRS DE LA PHASE ACTIVE (${activePhase.phaseType}) ===`);
  let visibles = 0;
  for (const pe of activePhase.phaseElixirs) {
    const match = isElixirDayMatch(pe.frequency, new Date());
    if (match) visibles++;
    console.log(`  ${match ? "✅ VISIBLE" : "🚫 CACHÉ  "} · ${pe.elixirLibrary.name}  [freq=${pe.frequency}, timing=${pe.timing}]`);
  }

  console.log("\n================ VERDICT ================");
  console.log(`👉 Élixirs affichés dans « Élixirs du jour » AUJOURD'HUI : ${visibles}`);
  if (visibles === 6) console.log("✅ Parfait : le client voit bien 6 élixirs today.");
  else console.log(`⚠️ Le client voit ${visibles} élixir(s), pas 6. Voir les 🚫 CACHÉ (mauvaise fréquence pour aujourd'hui) ou les élixirs rangés dans une autre phase.`);

  await prisma.$disconnect();
})().catch(async (e)=>{ console.error(e); await prisma.$disconnect(); process.exit(1); });
