import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { updateZoomMeeting, deleteZoomMeeting } from "@/lib/zoom";

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

  const data: Record<string, unknown> = {};

  // Annulation
  if (body.status === "CANCELLED") {
    data.status = "CANCELLED";
    if (appointment.zoomMeetingId) {
      await deleteZoomMeeting(appointment.zoomMeetingId).catch(console.error);
    }
  }

  // Reschedule
  if (body.scheduledAt) {
    data.scheduledAt = new Date(body.scheduledAt);
    data.status = "CONFIRMED";
    data.reminderSent = false;
    if (appointment.zoomMeetingId) {
      await updateZoomMeeting(appointment.zoomMeetingId, new Date(body.scheduledAt), body.durationMin).catch(console.error);
    }
  }

  if (body.durationMin) data.durationMin = body.durationMin;
  if (body.notes !== undefined) data.notes = body.notes;

  const updated = await prisma.appointment.update({
    where: { id },
    data,
    include: { client: { include: { user: { select: { name: true, email: true } } } } },
  });

  // Email notification au client
  if ((body.status === "CANCELLED" || body.scheduledAt) && process.env.SMTP_HOST) {
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
        const dateStr = newDate.toLocaleDateString(lang === "FR" ? "fr-FR" : "en-US", {
          weekday: "long", day: "numeric", month: "long",
        });
        const timeStr = newDate.toLocaleTimeString(lang === "FR" ? "fr-FR" : "en-US", {
          hour: "2-digit", minute: "2-digit",
        });
        emailBody = lang === "EN"
          ? `Hello,\n\nYour session has been rescheduled:\n\nNew date: ${dateStr}\nNew time: ${timeStr}${updated.zoomJoinUrl ? `\nJoin: ${updated.zoomJoinUrl}` : ""}\n\nJoffrey`
          : `Bonjour,\n\nTa session a ete reprogrammee :\n\nNouvelle date : ${dateStr}\nNouvelle heure : ${timeStr}${updated.zoomJoinUrl ? `\nRejoindre : ${updated.zoomJoinUrl}` : ""}\n\nJoffrey`;
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

  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
