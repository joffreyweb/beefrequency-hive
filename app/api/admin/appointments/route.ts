import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { createZoomMeeting, isZoomConfigured } from "@/lib/zoom";

// GET /api/admin/appointments — Tous les RDV (filtre optionnel par mois)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month"); // YYYY-MM
  const clientId = searchParams.get("clientId");

  const where: Record<string, unknown> = {};
  if (month) {
    const start = new Date(`${month}-01T00:00:00`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    where.scheduledAt = { gte: start, lt: end };
  }
  if (clientId) where.clientId = clientId;

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    include: { client: { include: { user: { select: { name: true, email: true } } } } },
  });

  return NextResponse.json({ appointments });
}

// POST /api/admin/appointments — Creer un RDV (+ Zoom + email)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId, scheduledAt, durationMin, title, notes, sendEmail, useFromPack } = await request.json();

  if (!clientId || !scheduledAt) {
    return NextResponse.json({ error: "clientId et scheduledAt requis" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const dateTime = new Date(scheduledAt);
  const dur = durationMin || 60;
  const meetingTitle = title || "Session BeeFrequency";

  // Creer reunion Zoom
  let zoomMeetingId: string | null = null;
  let zoomJoinUrl: string | null = null;
  let zoomStartUrl: string | null = null;

  if (isZoomConfigured()) {
    try {
      const zoom = await createZoomMeeting(meetingTitle, dateTime, dur);
      zoomMeetingId = zoom.meetingId;
      zoomJoinUrl = zoom.joinUrl;
      zoomStartUrl = zoom.startUrl;
    } catch (err) {
      console.error("[appointment] Zoom error:", err);
      // Continue sans Zoom
    }
  }

  // Lier au pack si demande
  let sessionPackId: string | null = null;
  if (useFromPack !== false) {
    const pack = await prisma.sessionPack.findFirst({
      where: { clientId },
      orderBy: { paidAt: "desc" },
    });
    if (pack) {
      const usedCount = await prisma.appointment.count({
        where: { sessionPackId: pack.id, status: { not: "CANCELLED" } },
      });
      // Lier seulement s'il reste des seances
      const totalAll = await prisma.sessionPack.aggregate({
        where: { clientId },
        _sum: { totalSessions: true },
      });
      const totalUsed = await prisma.appointment.count({
        where: { clientId, sessionPackId: { not: null }, status: { not: "CANCELLED" } },
      });
      if ((totalAll._sum.totalSessions || 0) > totalUsed) {
        sessionPackId = pack.id;
      }
    }
  }

  const appointment = await prisma.appointment.create({
    data: {
      clientId,
      title: meetingTitle,
      scheduledAt: dateTime,
      durationMin: dur,
      zoomMeetingId,
      zoomJoinUrl,
      zoomStartUrl,
      notes: notes || null,
      sessionPackId,
    },
    include: { client: { include: { user: { select: { name: true, email: true } } } } },
  });

  // Envoyer email de confirmation
  if (sendEmail !== false && process.env.SMTP_HOST) {
    try {
      const { transporter } = await import("@/lib/mailer");
      const lang = client.language === "EN" ? "EN" : "FR";
      const dateStr = dateTime.toLocaleDateString(lang === "FR" ? "fr-FR" : "en-US", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
      const timeStr = dateTime.toLocaleTimeString(lang === "FR" ? "fr-FR" : "en-US", {
        hour: "2-digit", minute: "2-digit",
      });

      const subject = lang === "EN"
        ? "Your session is confirmed"
        : "Ta session est confirmee";

      const body = lang === "EN"
        ? `Hello ${client.user.name?.split(" ")[0] || ""},\n\nYour session is confirmed:\n\nDate: ${dateStr}\nTime: ${timeStr}\nDuration: ${dur} min${zoomJoinUrl ? `\nJoin: ${zoomJoinUrl}` : ""}\n\nSee you soon,\nJoffrey`
        : `Bonjour ${client.user.name?.split(" ")[0] || ""},\n\nTa session est confirmee :\n\nDate : ${dateStr}\nHeure : ${timeStr}\nDuree : ${dur} min${zoomJoinUrl ? `\nRejoindre : ${zoomJoinUrl}` : ""}\n\nA bientot,\nJoffrey`;

      await transporter.sendMail({
        from: `"${process.env.FROM_NAME || "Joffrey Deleplanque"}" <${process.env.FROM_EMAIL || "admin@beefrequency.com"}>`,
        to: client.user.email,
        subject,
        text: body,
      });
    } catch (err) {
      console.error("[appointment] Email error:", err);
    }
  }

  return NextResponse.json({ appointment }, { status: 201 });
}
