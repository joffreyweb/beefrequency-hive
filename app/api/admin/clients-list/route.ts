import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET /api/admin/clients-list — Liste legere des clients actifs (id + nom)
export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const clients = await prisma.client.findMany({
    where: { status: { in: ["ACTIVE", "PAUSED"] } },
    select: {
      id: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json({ clients });
}
