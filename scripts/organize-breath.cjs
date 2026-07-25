// Range les pratiques Breath existantes dans des sous-dossiers (DEMO, base LOCALE).
// Usage : DATABASE_URL="postgresql://joffreydeleplanque@localhost:5432/hive_db" node scripts/organize-breath.cjs
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const updates = [
  { title: "Box Breathing",        subFolder: "Angoisse" },
  { title: "Respiration 4-7-8",    subFolder: "Sleep" },
  { title: "Respiration cohérente",subFolder: "Sleep" },
  { title: "Morning breathing",    subFolder: "Meditation" },
  { title: "slepp",                subFolder: "Meditation" },
];

(async () => {
  let n = 0;
  for (const u of updates) {
    const r = await p.practice.updateMany({ where: { title: u.title }, data: { subFolder: u.subFolder } });
    n += r.count;
    console.log(`${u.title} -> ${u.subFolder} (${r.count})`);
  }
  console.log(`\n${n} pratiques Breath rangées en sous-dossiers.\n`);
  process.exit(0);
})().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
