import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// Remplace les variables dynamiques dans le texte
function replaceVariables(
  text: string,
  data: {
    firstName: string;
    dayNumber: number;
    offerType: string;
    nextSessionDate: string | null;
  }
): string {
  return text
    .replace(/\{\{firstName\}\}/g, data.firstName)
    .replace(/\{\{dayNumber\}\}/g, String(data.dayNumber))
    .replace(/\{\{offerType\}\}/g, data.offerType)
    .replace(
      /\{\{nextSessionDate\}\}/g,
      data.nextSessionDate || "Non planifiée"
    );
}

// POST — Moteur d'envoi automatique des messages parcours
// Peut être appelé par un admin ou un cron
export async function POST() {
  try {
    const authResult = await requireAdmin();
    if (isErrorResponse(authResult)) return authResult;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Charger tous les clients actifs avec leurs relations
    const clients = await prisma.client.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: true,
        intake: true,
        journeyMessageLogs: true,
      },
    });

    // Charger tous les templates actifs
    const templates = await prisma.journeyMessageTemplate.findMany({
      where: { isActive: true },
    });

    // Charger le premier admin pour l'envoi des messages
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Aucun admin trouvé" },
        { status: 500 }
      );
    }

    let sent = 0;

    for (const client of clients) {
      // Calculer le jour du parcours
      const startDate = new Date(client.startDate);
      startDate.setHours(0, 0, 0, 0);
      const dayNumber =
        Math.floor((today.getTime() - startDate.getTime()) / 86400000) + 1;

      // Données pour le remplacement de variables
      const firstName = client.intake?.firstName || client.user.name || "Client";
      const varData = {
        firstName,
        dayNumber,
        offerType: client.offerType,
        nextSessionDate: client.nextSessionDate
          ? client.nextSessionDate.toLocaleDateString("fr-FR")
          : null,
      };

      // --- Templates JOURNEY_DAY ---
      const journeyTemplates = templates.filter(
        (t) => t.triggerType === "JOURNEY_DAY"
      );

      for (const template of journeyTemplates) {
        if (template.dayTrigger !== dayNumber) continue;

        // Vérifier si déjà envoyé
        const alreadySent = client.journeyMessageLogs.some(
          (log) => log.templateId === template.id
        );
        if (alreadySent) continue;

        // Sélectionner le variant HD
        const variants = JSON.parse(template.hdVariants) as Record<
          string,
          { subject: string; body: string }
        >;
        const hdKey = client.hdType && variants[client.hdType] ? client.hdType : "DEFAULT";
        const variant = variants[hdKey] || variants["DEFAULT"];

        if (!variant) continue;

        // Remplacer les variables dans le body
        const body = replaceVariables(variant.body, varData);

        // Créer le message
        await prisma.message.create({
          data: {
            senderId: admin.id,
            receiverId: client.userId,
            content: body,
            tag: "JOURNEY",
          },
        });

        // Créer le log
        await prisma.journeyMessageLog.create({
          data: {
            clientId: client.id,
            templateId: template.id,
            dayNumber,
            hdType: client.hdType || "UNKNOWN",
            variantUsed: hdKey,
          },
        });

        sent++;
      }

      // Les messages BIRTHDAY ne sont plus envoyés automatiquement.
      // Les anniversaires sont gérés via PendingAction (alertes dashboard).
    }

    // --- Auto-assignation des pratiques selon dayTrigger ---
    const practicesWithTrigger = await prisma.practice.findMany({
      where: { dayTrigger: { not: null } },
    });

    let practicesAssigned = 0;

    for (const client of clients) {
      // Recalculer le jour du parcours pour chaque client
      const clientStart = new Date(client.startDate);
      clientStart.setHours(0, 0, 0, 0);
      const clientDayNumber =
        Math.floor((today.getTime() - clientStart.getTime()) / 86400000) + 1;

      for (const practice of practicesWithTrigger) {
        if (practice.dayTrigger !== clientDayNumber) continue;

        // Vérifier si la pratique n'est pas déjà assignée à ce client
        const existing = await prisma.clientPractice.findUnique({
          where: {
            clientId_practiceId: {
              clientId: client.id,
              practiceId: practice.id,
            },
          },
        });

        if (existing) continue;

        // Créer l'assignation automatique
        await prisma.clientPractice.create({
          data: {
            clientId: client.id,
            practiceId: practice.id,
            assignedByAdmin: false,
          },
        });

        practicesAssigned++;
      }
    }

    return NextResponse.json({ sent, practicesAssigned, clients: clients.length });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
