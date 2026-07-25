/* Test E2E — Parcours sur-mesure + email SMTP + isolation Laura
 *   Lancer   : npx tsx scripts/test-e2e.ts
 *   Nettoyer : npx tsx scripts/test-e2e.ts --cleanup
 */
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import * as fs from "fs";
import * as path from "path";

// --- charge .env manuellement (tsx ne le fait pas tout seul) ---
function loadEnv() {
  const p = path.join(process.cwd(), ".env");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadEnv();

const prisma = new PrismaClient();
const TEST_EMAIL = "e2e-parcours@beefrequency.local";
const NOTIFY_EMAIL = process.env.SMTP_USER || "info@joffreydeleplanque.com";
const TZ = "Europe/Brussels";

function brusselsDayIndex(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const y = +parts.find((p) => p.type === "year")!.value;
  const mo = +parts.find((p) => p.type === "month")!.value;
  const d = +parts.find((p) => p.type === "day")!.value;
  return Math.floor(Date.UTC(y, mo - 1, d) / 86400000);
}
function computeTimeline(startDate: Date, totalDays: number) {
  const startIdx = brusselsDayIndex(new Date(startDate));
  const endIdx = startIdx + Math.max(totalDays - 1, 0);
  const todayIdx = brusselsDayIndex(new Date());
  const currentDay = Math.min(Math.max(todayIdx - startIdx + 1, 1), Math.max(totalDays, 1));
  let state = "active";
  if (todayIdx < startIdx) state = "pending";
  else if (todayIdx > endIdx) state = "completed";
  return { currentDay, totalDays, state };
}

const results: { name: string; ok: boolean }[] = [];
function check(name: string, ok: boolean, detail?: string) {
  results.push({ name, ok });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
}

async function cleanup() {
  const u = await prisma.user.findUnique({ where: { email: TEST_EMAIL }, include: { client: true } });
  if (u?.client) {
    const prog = await prisma.program.findUnique({ where: { name: `custom-${u.client.id}` }, select: { id: true } });
    if (prog) {
      await prisma.clientProgram.deleteMany({ where: { programId: prog.id } });
      await prisma.programModule.deleteMany({ where: { programId: prog.id } });
      await prisma.program.delete({ where: { id: prog.id } }).catch(() => {});
    }
  }
  await prisma.inviteToken.deleteMany({ where: { email: TEST_EMAIL } });
  if (u) await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
}

async function report() {
  const pass = results.filter((r) => r.ok).length;
  console.log(`\n========== RÉSULTAT : ${pass}/${results.length} ✅ ==========`);
  if (pass < results.length) console.log("❌ Échecs : " + results.filter((r) => !r.ok).map((r) => r.name).join(" · "));
}

async function main() {
  if (process.argv.includes("--cleanup")) {
    await cleanup();
    console.log("🧹 Client de test supprimé.");
    return;
  }

  console.log("\n========== TEST A-à-Z — Parcours sur-mesure ==========\n");
  await cleanup().catch(() => {}); // repartir propre

  // 1. Client CUSTOM
  const hash = await bcrypt.hash("test1234", 10);
  const user = await prisma.user.create({ data: { email: TEST_EMAIL, password: hash, name: "E2E Test Client", role: "CLIENT" } });
  const client = await prisma.client.create({
    data: {
      userId: user.id, offerType: "PARCOURS_PERSONNALISE", parcoursType: "CUSTOM",
      language: "FR", onboardingCompleted: true, requiresModules: true, requiresProgramTimeline: false,
    },
  });
  check("1. Client CUSTOM créé", !!client.id, `parcoursType=${client.parcoursType} · requiresProgramTimeline=false`);

  // 1b. Invitation
  const invite = await prisma.inviteToken.create({
    data: { email: TEST_EMAIL, offerType: "PARCOURS_PERSONNALISE", parcoursType: "CUSTOM", role: "CLIENT", expiresAt: new Date(Date.now() + 365 * 86400000) },
  });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  check("1b. Lien d'invitation généré", !!invite.token, `${baseUrl}/register?token=${invite.token}`);

  // 2. EMAIL réel
  let emailOk = false, emailDetail = "";
  try {
    if (!process.env.SMTP_HOST) throw new Error("SMTP_HOST absent du .env");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD },
    } as nodemailer.TransportOptions);
    await transporter.verify();
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME || "Joffrey Deleplanque"}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: NOTIFY_EMAIL,
      subject: "✅ Test E2E BeeFrequency — envoi SMTP local OK",
      text: "Test automatique du script E2E. Si tu lis ceci, le SMTP local fonctionne.",
    });
    emailOk = true; emailDetail = `envoyé à ${NOTIFY_EMAIL} · id=${info.messageId}`;
  } catch (e: any) {
    emailDetail = String(e?.message || e);
  }
  check("2. Envoi email SMTP local", emailOk, emailDetail);

  // 3. Composer le parcours sur-mesure (detox -> cycle)
  const mods = await prisma.module.findMany({ where: { name: { in: ["detox", "cycle"] } } });
  const detox = mods.find((m) => m.name === "detox");
  const cycle = mods.find((m) => m.name === "cycle");
  if (!detox || !cycle) {
    check("3. Modules detox+cycle présents", false, "lance d'abord: npx tsx prisma/seed.ts");
    await report();
    return;
  }
  const name = `custom-${client.id}`;
  const program = await prisma.program.upsert({
    where: { name },
    update: { nameFr: "Parcours sur-mesure", nameEn: "Custom program" },
    create: { name, nameFr: "Parcours sur-mesure", nameEn: "Custom program", description: "E2E" },
  });
  await prisma.programModule.deleteMany({ where: { programId: program.id } });
  await prisma.programModule.create({ data: { programId: program.id, moduleId: detox.id, order: 1 } });
  await prisma.programModule.create({ data: { programId: program.id, moduleId: cycle.id, order: 2 } });
  const startDate = new Date();
  const cp = await prisma.clientProgram.upsert({
    where: { clientId_programId: { clientId: client.id, programId: program.id } },
    update: { startDate, isCustom: true, isMain: true, status: "active", currentDay: 1 },
    create: { clientId: client.id, programId: program.id, startDate, isCustom: true, isMain: true },
  });
  check("3. Parcours sur-mesure composé (detox→cycle)", !!cp.id, "Program dédié + 2 modules ordonnés + ClientProgram isCustom");

  // 4. Timeline
  const totalDays = detox.duration + cycle.duration; // 31
  const tl = computeTimeline(startDate, totalDays);
  check("4. Timeline calculée", tl.totalDays === 31 && tl.currentDay === 1, `Jour ${tl.currentDay}/${tl.totalDays} · état=${tl.state} (attendu 1/31 active)`);

  // 5. Isolation LE_PASSAGE (Laura)
  const passage = await prisma.client.findFirst({ where: { parcoursType: "LE_PASSAGE" }, include: { user: { select: { name: true } } } });
  const customLinks = await prisma.clientProgram.count({ where: { programId: program.id } });
  const passageHasCustom = passage
    ? await prisma.clientProgram.findFirst({ where: { clientId: passage.id, program: { name: { startsWith: "custom-" } } } })
    : null;
  check("5a. Parcours custom lié au SEUL client de test", customLinks === 1, `${customLinks} ClientProgram lié`);
  check("5b. Client LE_PASSAGE (Laura) non impacté", !passageHasCustom, passage ? `${passage.user.name} · ${passage.parcoursType} · aucun parcours custom` : "aucun LE_PASSAGE en base");

  await report();
  console.log(`\n👉 Vérif VISUELLE du widget « Mon parcours » : ${baseUrl}/login  →  ${TEST_EMAIL} / test1234`);
  console.log(`   (ou fiche admin « E2E Test Client » → carte « Parcours sur-mesure » + bouton « Composer » / « Copier le lien »)`);
  console.log(`\n🧹 Nettoyer après : npx tsx scripts/test-e2e.ts --cleanup\n`);
}

main().catch((e) => { console.error("💥 Erreur script:", e); process.exit(1); }).finally(() => prisma.$disconnect());
