import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDayPlan, brusselsNow } from "@/lib/journee";
import { sendPushToAdmin } from "@/lib/push";

// POST /api/cron/morning-brief — brief matinal souverain « Ma Journée ».
// Appelé par le cron du VPS (toutes les heures p.ex.). Ne s'envoie qu'UNE fois par jour,
// à partir de l'heure réglée dans AdminSettings (briefHour, Europe/Brussels).
// Canaux : push app (VAPID) + email (SMTP Infomaniak) — chacun activable.
// ?test=1 force un envoi immédiat sans toucher la garde d'idempotence (bouton de test admin).
// Auth : header x-cron-secret. Route déclarée dans publicPaths (proxy.ts).
export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const url = new URL(req.url);
  const test = url.searchParams.get("test") === "1";

  let settings = await prisma.adminSettings.findFirst();
  if (!settings) settings = await prisma.adminSettings.create({ data: {} });

  const { iso, hour } = brusselsNow();

  if (!test) {
    if (settings.briefLastRunOn === iso) {
      return NextResponse.json({ ok: true, skipped: "already-sent-today", iso });
    }
    if (hour < settings.briefHour) {
      return NextResponse.json({ ok: true, skipped: "too-early", hour, briefHour: settings.briefHour });
    }
  }

  const plan = await getDayPlan();

  const focusLines =
    plan.focus.length > 0
      ? plan.focus.map((t) => `• ${t.title}`).join("\n")
      : "• (rien de figé — choisis 3 intentions)";
  const agendaLines =
    plan.appointments.length > 0
      ? plan.appointments.map((a) => `${a.timeLabel} — ${a.clientName ?? a.title}`).join("\n")
      : "Aucun rendez-vous.";
  const postLine = plan.nextPost
    ? `Prochain post : ${plan.nextPost.title}${plan.postsRemaining > 1 ? ` (+${plan.postsRemaining - 1})` : ""}`
    : "Pas de post en attente.";
  const aRepondre = plan.messages.length + plan.pendingActions.length;

  const pushBody = `${plan.focus.length} focus · ${plan.appointments.length} RDV · ${plan.nextPost ? "1 post à faire" : "0 post"}${aRepondre > 0 ? ` · ${aRepondre} à répondre` : ""}`;

  const results: { push: boolean; email: boolean } = { push: false, email: false };

  // 1) Push app
  if (settings.briefPushEnabled) {
    try {
      await sendPushToAdmin({
        title: `🐝 Ta journée — ${plan.dateLabel}`,
        body: pushBody,
        url: "/admin/journee",
      });
      results.push = true;
    } catch (e) {
      console.error("[brief] push:", e);
    }
  }

  // 2) Email (SMTP Infomaniak — souverain)
  if (settings.briefEmailEnabled && settings.briefEmail) {
    try {
      const { transporter } = await import("@/lib/mailer");
      const html = `
        <div style="font-family:Georgia,serif;color:#2C1A0E;max-width:560px;margin:0 auto;padding:24px;background:#FDFAF4;">
          <p style="font-size:12px;letter-spacing:.15em;text-transform:uppercase;color:#B8821E;margin:0 0 4px;">Ma Journée</p>
          <h1 style="font-size:22px;margin:0 0 16px;color:#2C1A0E;">${plan.dateLabel}</h1>
          <h2 style="font-size:14px;color:#6B4423;margin:16px 0 6px;">Focus du jour</h2>
          <pre style="font-family:Georgia,serif;white-space:pre-wrap;margin:0;color:#2C1A0E;">${focusLines}</pre>
          <h2 style="font-size:14px;color:#6B4423;margin:16px 0 6px;">Agenda</h2>
          <pre style="font-family:Georgia,serif;white-space:pre-wrap;margin:0;color:#2C1A0E;">${agendaLines}</pre>
          <h2 style="font-size:14px;color:#6B4423;margin:16px 0 6px;">Instagram</h2>
          <p style="margin:0;color:#2C1A0E;">${postLine}</p>
          ${aRepondre > 0 ? `<p style="margin:16px 0 0;color:#6B4423;">${aRepondre} élément(s) à répondre.</p>` : ""}
          <p style="margin:24px 0 0;font-size:12px;color:#6B4423;">Ouvre ton poste de pilotage : /admin/journee</p>
        </div>`;
      await transporter.sendMail({
        from: `"${process.env.FROM_NAME || "BeeFrequency"}" <${process.env.FROM_EMAIL || "admin@beefrequency.com"}>`,
        to: settings.briefEmail,
        subject: `🐝 Ta journée — ${plan.dateLabel}`,
        html,
      });
      results.email = true;
    } catch (e) {
      console.error("[brief] email:", e);
    }
  }

  if (!test) {
    await prisma.adminSettings.update({
      where: { id: settings.id },
      data: { briefLastRunOn: iso },
    });
  }

  return NextResponse.json({ ok: true, sent: results, test, iso });
}
