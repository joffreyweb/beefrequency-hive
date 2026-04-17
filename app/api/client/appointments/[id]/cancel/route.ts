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
  const { reason } = body;

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
  const isProgram = !!appointment.sessionPackId;
  const sessionDeducted = isLate || (isProgram && client.rescheduleUsed);

  if (sessionDeducted && client.usedSessionsManual != null) {
    await prisma.client.update({
      where: { id: client.id },
      data: { usedSessionsManual: client.usedSessionsManual + 1 },
    });
  }

  await prisma.appointment.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelReason: reason || null,
      sessionDeducted,
    },
  });

  // Notify admin
  const adminEmail = process.env.FROM_EMAIL || "admin@beefrequency.com";
  try {
    await transporter.sendMail({
      from: `"Hive" <${adminEmail}>`,
      to: adminEmail,
      subject: `❌ Annulation RDV — ${client.user.name}`,
      text: [
        `${client.user.name} a annulé son RDV.`,
        `RDV : ${new Date(appointment.scheduledAt).toLocaleDateString("fr-FR")}`,
        `Raison : ${reason || "Non précisée"}`,
        sessionDeducted ? `⚠️ Séance déduite` : "",
        isLate ? `⚠️ Annulation tardive (< 48h)` : "",
      ].filter(Boolean).join("\n"),
    });
  } catch {}

  try {
    const { notifyAdmin } = await import("@/lib/notifications");
    await notifyAdmin({
      clientId: client.id,
      title: `❌ Annulation RDV : ${client.user.name}`,
      urgency: "red",
    });
  } catch {}

  return NextResponse.json({ ok: true, sessionDeducted });
}
