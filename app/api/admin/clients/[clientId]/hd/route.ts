import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { user: { select: { name: true } } },
  });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  return NextResponse.json({
    clientName: client.user.name,
    hd: client.hdData ? JSON.parse(client.hdData as string) : null,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;
  const data = await req.json();
  await prisma.client.update({
    where: { id: clientId },
    data: { hdData: JSON.stringify(data) },
  });
  return NextResponse.json({ success: true });
}
