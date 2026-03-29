import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";

// GET /api/client/elixirs — Elixirs assignes au client (prescriptions actives)
export async function GET() {
  const result = await requireClient();
  if (isErrorResponse(result)) return result;

  const client = await prisma.client.findUnique({
    where: { userId: result.session.userId },
    select: { id: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const now = new Date();

  const prescriptions = await prisma.elixirPrescription.findMany({
    where: {
      clientId: client.id,
      startDate: { lte: now },
      OR: [
        { endDate: null },
        { endDate: { gte: now } },
      ],
    },
    include: {
      elixir: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const elixirs = prescriptions.map((p) => ({
    id: p.id,
    name: p.elixir.name,
    dosage: p.dosage,
  }));

  return NextResponse.json({ elixirs });
}
