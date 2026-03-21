import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { getSession } from "@/lib/auth";

// GET — récupérer un check-in (query: date, clientId optionnel pour admin)
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");

  let clientId: string;

  if (session.role === "ADMIN") {
    const qClientId = searchParams.get("clientId");
    if (!qClientId) return NextResponse.json({ error: "clientId requis" }, { status: 400 });
    clientId = qClientId;
  } else {
    const client = await prisma.client.findUnique({ where: { userId: session.userId } });
    if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    clientId = client.id;
  }

  if (dateStr) {
    const checkin = await prisma.dailyCheckin.findUnique({
      where: { clientId_date: { clientId, date: new Date(dateStr) } },
    });
    return NextResponse.json({ checkin });
  }

  // Sans date, retourner tous les check-ins du client
  const checkins = await prisma.dailyCheckin.findMany({
    where: { clientId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ checkins });
}

// POST — créer ou mettre à jour le check-in du jour
export async function POST(req: Request) {
  const result = await requireClient();
  if (isErrorResponse(result)) return result;

  const { session } = result;
  const client = await prisma.client.findUnique({ where: { userId: session.userId } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const body = await req.json();
  const { date, ...data } = body;

  const checkinDate = date ? new Date(date) : new Date();
  // Normaliser à minuit
  checkinDate.setHours(0, 0, 0, 0);

  // Vérifier que ce n'est pas un jour passé (sauf aujourd'hui)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (checkinDate < today) {
    return NextResponse.json({ error: "Impossible de modifier un jour passé" }, { status: 403 });
  }

  const checkin = await prisma.dailyCheckin.upsert({
    where: { clientId_date: { clientId: client.id, date: checkinDate } },
    update: { ...data },
    create: {
      clientId: client.id,
      date: checkinDate,
      ...data,
    },
  });

  return NextResponse.json({ checkin });
}
