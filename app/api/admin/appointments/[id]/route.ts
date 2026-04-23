import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { updateZoomMeeting, deleteZoomMeeting } from "@/lib/zoom";
import { deleteCalDAVEvent, updateCalDAVEvent } from "@/lib/caldav";

// PATCH /api/admin/appointments/[id] — Modifier (reschedule) ou annuler
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const body = await request.json();

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { client: { include: { user: { select: { name: true, email: true } } } } },
  });

  if (!appointment) {
    return NextResponse.json({ error: "RDV introuvable" }, { status: 404 });
  }

  // Garder les anciennes valeurs pour l'email de reschedule
  const oldScheduledAt = appointment.scheduledAt;
  const oldDurationMin = appointment.durationMin;

  // Validation durée (si fournie)
  const rawDuration = body.durationMin;
  const nextDuration = rawDuration !== undefined && rawDuration !== null ? Number(rawDuration) : oldDurationMin;
  if (rawDuration !== undefined && rawDuration !== null) {
    if (!Number.isFinite(nextDuration) || nextDuration < 15 || nextDuration > 480) {
      return NextResponse.json(
        { error: "Durée invalide (doit être entre 15 et 480 minutes)" },
        { status: 400 },
      );
    }
  }

  // Validation fin ≤ 23h00 Europe/Brussels (si reschedule)
  if (body.scheduledAt) {
    const startAt = new Date(body.scheduledAt);
    const endAt = new Date(startAt.getTime() + nextDuration * 60000);
    const brusselsHour = parseInt(
      new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", hour: "2-digit", hour12: false }).format(endAt),
      10,
    );
    const brusselsMinute = parseInt(
      new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", minute: "2-digit" }).format(endAt),
      10,
    );
    if (brusselsHour > 23 || (brusselsHour === 23 && brusselsMinute > 0)) {
      return NextResponse.json(
        { error: "Le RDV dépasse l'amplitude (fin au-delà de 23h00)" },
        { status: 400 },
      );
    }
  }

  const data: Record<string, unknown> = {};

  // Annulation
  if (body.status === "CANCELLED") {
    data.status = "CANCELLED";
    if (appointment.zoomMeetingId) {
      await deleteZoomMeeting(appointment.zoomMeetingId).catch(console.error);
    }
    await deleteCalDAVEvent(`hive-${id}`).catch(console.error);
  }

  // Reschedule
  if (body.scheduledAt) {
    data.scheduledAt = new Date(body.scheduledAt);
    data.status = "CONFIRMED";
    data.reminderSent = false;
    if (appointment.zoomMeetingId) {
      await updateZoomMeeting(appointment.zoomMeetingId, new Date(body.scheduledAt), nextDuration).catch(console.error);
    }
    // CalDAV UPDATE (même UID, SEQUENCE++) — pas delete+create
    const newStart = new Date(body.scheduledAt);
    const newEnd = new Date(newStart.getTime() + nextDuration * 60000);
    await updateCalDAVEvent({
      uid: `hive-${id}`,
      summary: `${appointment.title} — ${appointment.client.user.name || "Client"}`,
      start: newStart,
      end: newEnd,
      description: appointment.zoomJoinUrl ? `Zoom: ${appointment.zoomJoinUrl}` : undefined,
    }).catch(console.error);
  }

  if (body.durationMin !== undefined && body.durationMin !== null) data.durationMin = nextDuration;
  if (body.notes !== undefined) data.notes = body.notes;

  const updated = await prisma.appointment.update({
    where: { id },
    data,
    include: { client: { include: { user: { select: { name: true, email: true } } } } },
  });

  // Email notification au client · honorer sendEmail (défaut: envoi)
  const shouldSendEmail = body.sendEmail !== false;
  if (shouldSendEmail && (body.status === "CANCELLED" || body.scheduledAt) && process.env.SMTP_HOST) {
    try {
      const { transporter } = await import("@/lib/mailer");
      const lang = updated.client.language === "EN" ? "EN" : "FR";
      const isCancelled = body.status === "CANCELLED";

      const subject = isCancelled
        ? (lang === "EN" ? "Session cancelled" : "Session annulee")
        : (lang === "EN" ? "Session rescheduled" : "Session reprogrammee");

      let emailBody: string;
      if (isCancelled) {
        emailBody = lang === "EN"
          ? `Hello,\n\nYour session has been cancelled. Joffrey will contact you to reschedule.\n\nJoffrey`
          : `Bonjour,\n\nTa session a ete annulee. Joffrey te contactera pour reprogrammer.\n\nJoffrey`;
      } else {
        const newDate = new Date(body.scheduledAt);
        const locale = lang === "FR" ? "fr-FR" : "en-US";
        const dateOpts: Intl.DateTimeFormatOptions = {
          weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Brussels",
        };
        const timeOpts: Intl.DateTimeFormatOptions = {
          hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels",
        };
        const oldDateStr = oldScheduledAt.toLocaleDateString(locale, dateOpts);
        const oldTimeStr = oldScheduledAt.toLocaleTimeString(locale, timeOpts);
        const newDateStr = newDate.toLocaleDateString(locale, dateOpts);
        const newTimeStr = newDate.toLocaleTimeString(locale, timeOpts);
        emailBody = lang === "EN"
          ? `Hello,\n\nYour session has been rescheduled:\n\nPrevious: ${oldDateStr} at ${oldTimeStr} (${oldDurationMin} min)\nNew: ${newDateStr} at ${newTimeStr} (${nextDuration} min)${updated.zoomJoinUrl ? `\nJoin: ${updated.zoomJoinUrl}` : ""}\n\nJoffrey`
          : `Bonjour,\n\nTa session a été reprogrammée :\n\nAncienne : ${oldDateStr} à ${oldTimeStr} (${oldDurationMin} min)\nNouvelle : ${newDateStr} à ${newTimeStr} (${nextDuration} min)${updated.zoomJoinUrl ? `\nRejoindre : ${updated.zoomJoinUrl}` : ""}\n\nJoffrey`;
      }

      await transporter.sendMail({
        from: `"${process.env.FROM_NAME || "Joffrey Deleplanque"}" <${process.env.FROM_EMAIL || "admin@beefrequency.com"}>`,
        to: updated.client.user.email,
        subject,
        text: emailBody,
      });
    } catch (err) {
      console.error("[appointment] Email error:", err);
    }
  }

  return NextResponse.json({ appointment: updated });
}

// DELETE /api/admin/appointments/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (appointment?.zoomMeetingId) {
    await deleteZoomMeeting(appointment.zoomMeetingId).catch(console.error);
  }
  await deleteCalDAVEvent(`hive-${id}`).catch(console.error);

  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
