import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-utils";
import { computeStockInfo } from "@/lib/stock-utils";

// GET — Prescriptions actives avec stock critique
export async function GET() {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { session } = auth;
    const now = new Date();

    // Filtre de base : prescriptions potentiellement actives
    // (endDate nulle, endDate future, ou quantity/dailyDose définis pour calcul)
    const whereClause =
      session.role === "ADMIN"
        ? {
            OR: [
              { endDate: null },
              { endDate: { gt: now } },
              {
                quantity: { not: null },
                dailyDose: { not: null },
              },
            ],
          }
        : undefined;

    // Si client, on récupère d'abord son profil
    let clientId: string | undefined;
    if (session.role !== "ADMIN") {
      const client = await prisma.client.findUnique({
        where: { userId: session.userId },
      });

      if (!client) {
        return NextResponse.json(
          { error: "Profil client introuvable" },
          { status: 404 }
        );
      }
      clientId = client.id;
    }

    const prescriptions = await prisma.elixirPrescription.findMany({
      where: {
        ...whereClause,
        ...(clientId ? { clientId } : {}),
      },
      include: {
        elixir: { select: { name: true } },
        client: {
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calcul du stock et filtrage des alertes critiques
    const alerts = prescriptions
      .map((rx) => {
        const stockInfo = computeStockInfo({
          quantity: rx.quantity,
          dailyDose: rx.dailyDose,
          startDate: rx.startDate,
          endDate: rx.endDate,
          stockAlertDays: rx.stockAlertDays,
        });

        return { ...rx, stockInfo };
      })
      .filter((rx) => rx.stockInfo.isLow);

    return NextResponse.json({ alerts });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
