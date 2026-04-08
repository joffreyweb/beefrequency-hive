import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createZoomMeeting, isZoomConfigured } from "@/lib/zoom";
import { createCalDAVEvent } from "@/lib/caldav";

// GET /api/booking/[token] — Valider le token et retourner les infos
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const bookingToken = await prisma.bookingToken.findUnique({ where: { token } });

  if (!bookingToken) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
  }

  if (bookingToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Lien expire" }, { status: 410 });
  }

  if (bookingToken.usedAt) {
    return NextResponse.json({ error: "Lien deja utilise" }, { status: 410 });
  }

  const client = await prisma.client.findUnique({
    where: { id: bookingToken.clientId },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json({
    valid: true,
    clientName: client?.user.name,
    clientId: bookingToken.clientId,
  });
}

// POST /api/booking/[token] — Client choisit un creneau
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { scheduledAt, durationMin } = await request.json();

  if (!scheduledAt) {
    return NextResponse.json({ error: "scheduledAt requis" }, { status: 400 });
  }

  const bookingToken = await prisma.bookingToken.findUnique({ where: { token } });

  if (!bookingToken || bookingToken.expiresAt < new Date() || bookingToken.usedAt) {
    return NextResponse.json({ error: "Lien invalide ou expire" }, { status: 410 });
  }

  const client = await prisma.client.findUnique({
    where: { id: bookingToken.clientId },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const dateTime = new Date(scheduledAt);
  const dur = durationMin || 60;

  // Creer Zoom
  let zoomMeetingId: string | null = null;
  let zoomJoinUrl: string | null = null;
  let zoomStartUrl: string | null = null;

  if (isZoomConfigured()) {
    try {
      const zoom = await createZoomMeeting("Session BeeFrequency", dateTime, dur);
      zoomMeetingId = zoom.meetingId;
      zoomJoinUrl = zoom.joinUrl;
      zoomStartUrl = zoom.startUrl;
    } catch (err) {
      console.error("[booking] Zoom error:", err);
    }
  }

  // Creer le RDV
  const appointment = await prisma.appointment.create({
    data: {
      clientId: bookingToken.clientId,
      scheduledAt: dateTime,
      durationMin: dur,
      zoomMeetingId,
      zoomJoinUrl,
      zoomStartUrl,
    },
  });

  // Push vers Radicale CalDAV
  try {
    const endTime = new Date(dateTime.getTime() + dur * 60000);
    await createCalDAVEvent({
      uid: `hive-${appointment.id}`,
      summary: `Session BeeFrequency — ${client.user.name || "Client"}`,
      start: dateTime,
      end: endTime,
      description: zoomJoinUrl ? `Zoom: ${zoomJoinUrl}` : undefined,
    });
  } catch (err) {
    console.error("[booking] CalDAV push error:", err);
  }

  // Marquer le token comme utilise
  await prisma.bookingToken.update({
    where: { id: bookingToken.id },
    data: { usedAt: new Date() },
  });

  // Email confirmation
  if (process.env.SMTP_HOST) {
    try {
      const { transporter } = await import("@/lib/mailer");
      const lang = client.language === "EN" ? "EN" : "FR";
      const dateStr = dateTime.toLocaleDateString(lang === "FR" ? "fr-FR" : "en-US", {
        weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Brussels",
      });
      const timeStr = dateTime.toLocaleTimeString(lang === "FR" ? "fr-FR" : "en-US", {
        hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels",
      });

      await transporter.sendMail({
        from: `"${process.env.FROM_NAME || "Joffrey Deleplanque"}" <${process.env.FROM_EMAIL || "admin@beefrequency.com"}>`,
        to: client.user.email,
        subject: lang === "EN" ? "Your session is confirmed" : "Ta session est confirmee",
        text: lang === "EN"
          ? `Hello ${client.user.name?.split(" ")[0]},\n\nYour session is confirmed:\n\nDate: ${dateStr}\nTime: ${timeStr}${zoomJoinUrl ? `\nJoin: ${zoomJoinUrl}` : ""}\n\nJoffrey`
          : `Bonjour ${client.user.name?.split(" ")[0]},\n\nTa session est confirmee :\n\nDate : ${dateStr}\nHeure : ${timeStr}${zoomJoinUrl ? `\nRejoindre : ${zoomJoinUrl}` : ""}\n\nJoffrey`,
      });
    } catch (err) {
      console.error("[booking] Email error:", err);
    }
  }

  return NextResponse.json({ appointment: { id: appointment.id, scheduledAt, zoomJoinUrl } });
}
