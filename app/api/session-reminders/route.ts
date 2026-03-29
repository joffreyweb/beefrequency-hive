import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/mailer";

// POST /api/session-reminders — Envoyer les rappels pour les sessions dans les prochaines 48h
// A appeler via cron job (ex: toutes les heures)
export async function POST(req: Request) {
  // Securite basique via header secret
  const authHeader = req.headers.get("x-cron-secret");
  if (authHeader !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Trouver les sessions programmees dans les 48 prochaines heures sans rappel EMAIL
  const sessions = await prisma.session.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { gte: now, lte: in48h },
      reminders: { none: { type: "EMAIL" } },
    },
    include: {
      client: {
        include: {
          user: { select: { email: true, name: true } },
        },
      },
    },
  });

  if (!process.env.SMTP_HOST) {
    return NextResponse.json({
      message: "SMTP non configure — rappels non envoyes",
      sessionsFound: sessions.length,
    });
  }

  let sent = 0;

  for (const session of sessions) {
    try {
      const lang = session.client.language === "EN" ? "EN" : "FR";
      const dateStr = new Date(session.scheduledAt).toLocaleDateString(
        lang === "FR" ? "fr-FR" : "en-US",
        { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }
      );

      const subject = lang === "EN"
        ? `Reminder: your session on ${dateStr}`
        : `Rappel : ta session du ${dateStr}`;

      const body = lang === "EN"
        ? `Hello ${session.client.user.name?.split(" ")[0] || ""},\n\nThis is a reminder that your session is scheduled for ${dateStr}.\n\n${session.zoomLink ? `Zoom link: ${session.zoomLink}\n\n` : ""}See you soon,\nJoffrey`
        : `Bonjour ${session.client.user.name?.split(" ")[0] || ""},\n\nRappel : ta session est prevue le ${dateStr}.\n\n${session.zoomLink ? `Lien Zoom : ${session.zoomLink}\n\n` : ""}A tres vite,\nJoffrey`;

      const { transporter } = await import("@/lib/mailer");
      await transporter.sendMail({
        from: `"${process.env.FROM_NAME || "Joffrey Deleplanque"}" <${process.env.FROM_EMAIL || "admin@beefrequency.com"}>`,
        to: session.client.user.email,
        subject,
        text: body,
      });

      await prisma.sessionReminder.create({
        data: { sessionId: session.id, type: "EMAIL" },
      });

      sent++;
    } catch (err) {
      console.error(`[session-reminder] Erreur envoi pour session ${session.id}:`, err);
    }
  }

  return NextResponse.json({ sent, total: sessions.length });
}
