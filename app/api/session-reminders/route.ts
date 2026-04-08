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
        { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" }
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

  // ── Rappels Appointments (nouveau systeme RDV) ──
  const in47h = new Date(now.getTime() + 47 * 60 * 60 * 1000);
  const appointments = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      reminderSent: false,
      scheduledAt: { gte: in47h, lte: in48h },
    },
    include: {
      client: { include: { user: { select: { email: true, name: true } } } },
    },
  });

  let appointmentsSent = 0;

  for (const appt of appointments) {
    try {
      const lang = appt.client.language === "EN" ? "EN" : "FR";
      const dateStr = new Date(appt.scheduledAt).toLocaleDateString(
        lang === "FR" ? "fr-FR" : "en-US",
        { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" }
      );

      const subject = lang === "EN"
        ? `Reminder: your session tomorrow`
        : `Rappel : ta session demain`;

      const body = lang === "EN"
        ? `Hello ${appt.client.user.name?.split(" ")[0] || ""},\n\nReminder: your session is scheduled for ${dateStr}.\n\n${appt.zoomJoinUrl ? `Join: ${appt.zoomJoinUrl}\n\n` : ""}See you soon,\nJoffrey`
        : `Bonjour ${appt.client.user.name?.split(" ")[0] || ""},\n\nRappel : ta session est prevue le ${dateStr}.\n\n${appt.zoomJoinUrl ? `Rejoindre : ${appt.zoomJoinUrl}\n\n` : ""}A demain,\nJoffrey`;

      const { transporter } = await import("@/lib/mailer");
      await transporter.sendMail({
        from: `"${process.env.FROM_NAME || "Joffrey Deleplanque"}" <${process.env.FROM_EMAIL || "admin@beefrequency.com"}>`,
        to: appt.client.user.email,
        subject,
        text: body,
      });

      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminderSent: true },
      });

      appointmentsSent++;
    } catch (err) {
      console.error(`[appointment-reminder] Erreur pour ${appt.id}:`, err);
    }
  }

  return NextResponse.json({
    sessions: { sent, total: sessions.length },
    appointments: { sent: appointmentsSent, total: appointments.length },
  });
}
