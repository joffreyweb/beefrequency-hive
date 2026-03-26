import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // For clients, include dayNumber
  let dayNumber: number | null = null;
  if (user.role === "CLIENT") {
    const client = await prisma.client.findUnique({
      where: { userId: user.id },
      select: { startDate: true },
    });
    if (client) {
      dayNumber =
        Math.floor(
          (Date.now() - new Date(client.startDate).getTime()) / 86400000
        ) + 1;
    }
  }

  return NextResponse.json({ user, dayNumber });
}
