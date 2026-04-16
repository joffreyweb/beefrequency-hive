import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";
import { transporter } from "@/lib/mailer";
import { getNextMonday } from "@/lib/parcours";

// POST /api/client/elixir-received — Client confirme avoir reçu ses élixirs
export async function POST() {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;
  const { session } = auth;

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

  if (!client.colisEnvoye) {
    return NextResponse.json(
      { error: "Aucun colis en attente" },
      { status: 400 }
    );
  }

  if (client.produitsRecus) {
    return NextResponse.json(
      { error: "Déjà confirmé" },
      { status: 400 }
    );
  }

  const clientName = client.intake
    ? `${client.intake.firstName} ${client.intake.lastName}`
    : client.user.name;

  // Met à jour le statut → produits reçus + programme démarre le lundi suivant
  const now = new Date();
  const mondayStart = getNextMonday(now);
  await prisma.client.update({
    where: { id: client.id },
    data: {
      produitsRecus: true,
      produitsRecusAt: now,
      detoxStartDate: mondayStart,
    },
  });

  // Notification admin — élixirs reçus
  import("@/lib/notifications")
    .then(({ notifyAdmin }) => notifyAdmin({
      clientId: client.id,
      title: `Élixirs reçus : ${clientName}`,
      description: `Le programme détox démarrera le ${mondayStart.toLocaleDateString("fr-FR")}.`,
      urgency: "amber",
    }))
    .catch(() => {});

  // Email notification à l'admin
  const adminEmail = process.env.FROM_EMAIL || "admin@beefrequency.com";
  try {
    await transporter.sendMail({
      from: `"Hive — Élixirs reçus" <${adminEmail}>`,
      to: adminEmail,
      subject: `Élixirs reçus — ${clientName}`,
      text: [
        `${clientName} a confirmé la réception de ses élixirs.`,
        ``,
        `Email : ${client.user.email}`,
        `Date : ${now.toLocaleDateString("fr-FR")}`,
        ``,
        `Le parcours détox démarre automatiquement.`,
        ``,
        `---`,
        `Envoyé automatiquement depuis la Hive.`,
      ].join("\n"),
    });
  } catch (err) {
    console.error("[elixir-received] Erreur SMTP:", err);
  }

  return NextResponse.json({ success: true });
}
