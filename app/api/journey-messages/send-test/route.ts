import { NextRequest, NextResponse } from "next/server";
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

// POST — Envoi test d'un template à un client spécifique
// Body : { templateId, clientId }
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (isErrorResponse(authResult)) return authResult;

    const { templateId, clientId } = await request.json();

    if (!templateId || !clientId) {
      return NextResponse.json(
        { error: "templateId et clientId requis" },
        { status: 400 }
      );
    }

    // Charger le template
    const template = await prisma.journeyMessageTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template introuvable" },
        { status: 404 }
      );
    }

    // Charger le client avec ses relations
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        user: true,
        intake: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client introuvable" },
        { status: 404 }
      );
    }

    // Charger le premier admin
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Aucun admin trouvé" },
        { status: 500 }
      );
    }

    // Sélectionner le variant HD
    const variants = JSON.parse(template.hdVariants) as Record<
      string,
      { subject: string; body: string }
    >;
    const hdKey =
      client.hdType && variants[client.hdType] ? client.hdType : "DEFAULT";
    const variant = variants[hdKey] || variants["DEFAULT"];

    if (!variant) {
      return NextResponse.json(
        { error: "Aucun variant disponible pour ce client" },
        { status: 400 }
      );
    }

    // Données pour le remplacement de variables
    const firstName = client.intake?.firstName || client.user.name || "Client";
    const varData = {
      firstName,
      dayNumber: 0, // Test
      offerType: client.offerType,
      nextSessionDate: client.nextSessionDate
        ? client.nextSessionDate.toLocaleDateString("fr-FR")
        : null,
    };

    // Remplacer les variables
    const body = replaceVariables(variant.body, varData);

    // Créer le message
    const message = await prisma.message.create({
      data: {
        senderId: admin.id,
        receiverId: client.userId,
        content: body,
        tag: "JOURNEY",
      },
    });

    // Créer le log avec dayNumber=0 (test)
    const log = await prisma.journeyMessageLog.create({
      data: {
        clientId: client.id,
        templateId: template.id,
        dayNumber: 0,
        hdType: client.hdType || "UNKNOWN",
        variantUsed: hdKey,
      },
    });

    return NextResponse.json({ message, log }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
