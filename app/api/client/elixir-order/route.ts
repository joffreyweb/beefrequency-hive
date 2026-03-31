import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";
import { transporter } from "@/lib/mailer";

// POST /api/client/elixir-order — Commande d'élixirs (adresse livraison → email admin)
export async function POST(request: NextRequest) {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;
  const { session } = auth;

  const { street, city, postalCode, country } = await request.json();

  if (!street?.trim() || !city?.trim() || !postalCode?.trim() || !country?.trim()) {
    return NextResponse.json(
      { error: "Tous les champs d'adresse sont requis" },
      { status: 400 }
    );
  }

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    include: {
      user: { select: { name: true, email: true } },
      intake: { select: { firstName: true, lastName: true } },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const clientName = client.intake
    ? `${client.intake.firstName} ${client.intake.lastName}`
    : client.user.name;

  // Envoi email à l'admin
  const adminEmail = process.env.FROM_EMAIL || "admin@beefrequency.com";

  try {
    await transporter.sendMail({
      from: `"Hive — Commande Élixirs" <${adminEmail}>`,
      to: adminEmail,
      subject: `Commande élixirs — ${clientName}`,
      text: [
        `Nouvelle commande d'élixirs`,
        ``,
        `Client : ${clientName}`,
        `Email : ${client.user.email}`,
        ``,
        `Adresse de livraison :`,
        `${street.trim()}`,
        `${postalCode.trim()} ${city.trim()}`,
        `${country.trim()}`,
        ``,
        `---`,
        `Envoyé automatiquement depuis la Hive.`,
      ].join("\n"),
    });
  } catch (err) {
    console.error("[elixir-order] Erreur SMTP:", err);
    return NextResponse.json(
      { error: "Erreur d'envoi — réessaie plus tard" },
      { status: 500 }
    );
  }

  // Met à jour le statut parcours → colis envoyé
  await prisma.client.update({
    where: { id: client.id },
    data: {
      colisEnvoye: true,
      colisEnvoyeAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
