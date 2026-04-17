import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";
import { transporter } from "@/lib/mailer";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const body = await request.json();
  const { message, reason } = body;

  const client = await prisma.client.findUnique({
    where: { userId: auth.session.userId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment || appointment.clientId !== client.id) {
    return NextResponse.json({ error: "RDV introuvable" }, { status: 404 });
  }

  // Check 48h rule
  const hoursUntil = (new Date(appointment.scheduledAt).getTime() - Date.now()) / 3600000;
  const isLate = hoursUntil < 48;

  // Check if program session (linked to SessionPack)
  const isProgram = !!appointment.sessionPackId;
  let sessionDeducted = false;

  if (isProgram) {
    if (client.rescheduleUsed || isLate) {
      sessionDeducted = true;
      // Increment used sessions
      if (client.usedSessionsManual != null) {
        await prisma.client.update({
          where: { id: client.id },
          data: { usedSessionsManual: client.usedSessionsManual + 1 },
        });
      }
    } else {
      // First reschedule — mark as used
      await prisma.client.update({
        where: { id: client.id },
        data: { rescheduleUsed: true },
      });
    }
  } else if (isLate) {
    sessionDeducted = true;
  }

  // Update appointment
  await prisma.appointment.update({
    where: { id },
    data: {
      rescheduleRequested: true,
      rescheduleMessage: message || null,
      rescheduleReason: reason || null,
      rescheduleRequestedAt: new Date(),
      sessionDeducted,
      status: "RESCHEDULED",
    },
  });

  // Notify admin
  const adminEmail = process.env.FROM_EMAIL || "admin@beefrequency.com";
  const subject = sessionDeducted
    ? `⚠️ Changement avec pénalité — ${client.user.name}`
    : `🔄 Demande de changement — ${client.user.name}`;

  try {
    await transporter.sendMail({
      from: `"Hive" <${adminEmail}>`,
      to: adminEmail,
      subject,
      text: [
        `${client.user.name} demande un changement de RDV.`,
        ``,
        `RDV : ${new Date(appointment.scheduledAt).toLocaleDateString("fr-FR")} à ${new Date(appointment.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
        `Raison : ${reason || "Non précisée"}`,
        `Message : ${message || "Aucun"}`,
        ``,
        sessionDeducted ? `⚠️ Séance déduite du forfait` : `✓ Premier changement (sans pénalité)`,
        isLate ? `⚠️ Modification tardive (< 48h)` : "",
      ].filter(Boolean).join("\n"),
    });
  } catch {}

  // Create notification
  try {
    const { notifyAdmin } = await import("@/lib/notifications");
    await notifyAdmin({
      clientId: client.id,
      title: `${sessionDeducted ? "⚠️" : "🔄"} Changement RDV : ${client.user.name}`,
      description: `${reason || "Changement demandé"}${sessionDeducted ? " — séance déduite" : ""}`,
      urgency: sessionDeducted ? "red" : "amber",
    });
  } catch {}

  return NextResponse.json({
    ok: true,
    sessionDeducted,
    rescheduleUsed: isProgram ? true : client.rescheduleUsed,
  });
}
