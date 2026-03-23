import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
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
  const { clientId } = await params;
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const data = await req.json();
  await prisma.client.update({
    where: { id: clientId },
    data: { hdData: JSON.stringify(data) },
  });
  return NextResponse.json({ success: true });
}
