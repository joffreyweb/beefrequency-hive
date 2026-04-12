import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CHARTE_ENGAGEMENT_COMPLETE = `CHARTE D'ENGAGEMENT — MONITORING PASSAGE
BeeFrequency · Joffrey Deleplanque

=== CADRE D'ENGAGEMENT ===

1. JOUR DE RÉFÉRENCE
Vous choisissez dès le départ un jour fixe par semaine, qui devient votre rendez-vous de référence pendant toute la durée du programme.

2. REPORTS ET MODIFICATIONS
Un seul report est autorisé sur l'ensemble des 3 cycles.
En cas de voyage ou de changement de fuseau horaire, une adaptation peut être envisagée à condition d'être communiquée au minimum 7 jours à l'avance.

3. RENDEZ-VOUS NON HONORÉS
Tout rendez-vous oublié, non honoré ou non suivi est considéré comme perdu.
Il peut être reprogrammé uniquement selon les disponibilités, mais n'est pas compris dans le forfait et devra être payé à l'avance pour confirmer le nouveau créneau. Ce rendez-vous reprogrammé ne pourra plus être déplacé.

4. CONDITIONS D'ANNULATION
Toute annulation doit être communiquée 48 heures minimum avant le rendez-vous prévu.

5. DROIT DE METTRE FIN À L'ACCOMPAGNEMENT
En cas de non-respect répété des règles de fonctionnement du programme, notamment des conditions d'annulation, de report, de présence ou du cadre d'engagement convenu, je me réserve le droit de suspendre ou de mettre fin à l'accompagnement de manière anticipée.
Une telle décision n'ouvrira droit à aucun remboursement, y compris pour les séances, semaines ou phases restantes du programme non encore réalisées.

---
Accepté le : {DATE}
Par : {CLIENT_NAME}
IP : {IP_ADDRESS}`;

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CLIENT") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { fixedDay } = body;

    const validDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    if (fixedDay && !validDays.includes(fixedDay.toLowerCase())) {
      return NextResponse.json({ error: "Jour invalide" }, { status: 400 });
    }

    const client = await prisma.client.findFirst({
      where: { userId: session.userId },
      include: { user: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    if (client.engagementAcceptedAt) {
      // Si déjà acceptée mais fixedDay à mettre à jour (booking après onboarding)
      if (fixedDay && !client.fixedDay) {
        const updatedClient = await prisma.client.update({
          where: { id: client.id },
          data: { fixedDay: fixedDay.toLowerCase() },
        });
        return NextResponse.json({
          success: true,
          engagement: {
            fixedDay: updatedClient.fixedDay,
            acceptedAt: updatedClient.engagementAcceptedAt,
          },
        });
      }
      return NextResponse.json({ error: "Charte déjà acceptée" }, { status: 400 });
    }

    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "IP non disponible";

    const charteArchivee = CHARTE_ENGAGEMENT_COMPLETE
      .replace("{DATE}", new Date().toISOString())
      .replace("{CLIENT_NAME}", client.user?.name || "Client")
      .replace("{IP_ADDRESS}", ip);

    const updatedClient = await prisma.client.update({
      where: { id: client.id },
      data: {
        ...(fixedDay ? { fixedDay: fixedDay.toLowerCase() } : {}),
        reportsUsed: 0,
        engagementAcceptedAt: new Date(),
        engagementText: charteArchivee,
      },
    });

    return NextResponse.json({
      success: true,
      engagement: {
        fixedDay: updatedClient.fixedDay,
        acceptedAt: updatedClient.engagementAcceptedAt,
      },
    });
  } catch (error) {
    console.error("Erreur engagement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const client = await prisma.client.findFirst({
      where: { userId: session.userId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      hasAccepted: !!client.engagementAcceptedAt,
      fixedDay: client.fixedDay,
      reportsUsed: client.reportsUsed || 0,
      acceptedAt: client.engagementAcceptedAt,
    });
  } catch (error) {
    console.error("Erreur get engagement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
