import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// POST /api/admin/clients/[clientId]/booking-token — Creer un lien de booking pour le client
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  // Expiration dans 7 jours
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const bookingToken = await prisma.bookingToken.create({
    data: { clientId, expiresAt },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const bookingUrl = `${baseUrl}/client/booking/${bookingToken.token}`;

  // Envoyer email au client
  if (process.env.SMTP_HOST) {
    try {
      const { transporter } = await import("@/lib/mailer");
      const lang = client.language === "EN" ? "EN" : "FR";

      const subject = lang === "EN"
        ? "Choose your session time"
        : "Choisis ton creneau de session";

      const body = lang === "EN"
        ? `Hello ${client.user.name?.split(" ")[0] || ""},\n\nPlease choose your session time:\n${bookingUrl}\n\nThis link is valid for 7 days.\n\nJoffrey`
        : `Bonjour ${client.user.name?.split(" ")[0] || ""},\n\nChoisis ton creneau de session :\n${bookingUrl}\n\nCe lien est valable 7 jours.\n\nJoffrey`;

      await transporter.sendMail({
        from: `"${process.env.FROM_NAME || "Joffrey Deleplanque"}" <${process.env.FROM_EMAIL || "admin@beefrequency.com"}>`,
        to: client.user.email,
        subject,
        text: body,
      });
    } catch (err) {
      console.error("[booking-token] Email error:", err);
    }
  }

  return NextResponse.json({ bookingUrl, token: bookingToken.token }, { status: 201 });
}
