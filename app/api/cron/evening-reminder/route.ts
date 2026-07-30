import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { brusselsNow, getDayPlan } from "@/lib/journee";
import { sendPushToAdmin } from "@/lib/push";

// POST /api/cron/evening-reminder — rappel du soir souverain (« shutdown »).
// Appelé chaque heure par le cron VPS. Ne s'envoie qu'UNE fois par jour, à partir de
// shutdownHour (Europe/Brussels), et seulement si shutdownEnabled. Push app uniquement.
// ?test=1 force un envoi. Auth : x-cron-secret. Route dans publicPaths.
export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const test = new URL(req.url).searchParams.get("test") === "1";

  let settings = await prisma.adminSettings.findFirst();
  if (!settings) settings = await prisma.adminSettings.create({ data: {} });

  const { iso, hour } = brusselsNow();
  if (!test) {
    if (!settings.shutdownEnabled) return NextResponse.json({ ok: true, skipped: "disabled" });
    if (settings.shutdownLastRunOn === iso) return NextResponse.json({ ok: true, skipped: "already-sent-today" });
    if (hour < settings.shutdownHour) return NextResponse.json({ ok: true, skipped: "too-early", hour });
  }

  const plan = await getDayPlan();
  const body = plan.nextPost
    ? "Il te reste un post à publier. As-tu posté ? Prépare demain."
    : "Belle journée. Pose ce qui est fait, prépare demain. 🐝";

  let sent = false;
  try {
    await sendPushToAdmin({ title: "🌙 Rappel du soir", body, url: "/admin/journee" });
    sent = true;
  } catch (e) {
    console.error("[evening] push:", e);
  }

  if (!test) {
    await prisma.adminSettings.update({ where: { id: settings.id }, data: { shutdownLastRunOn: iso } });
  }
  return NextResponse.json({ ok: true, sent, test, iso });
}
