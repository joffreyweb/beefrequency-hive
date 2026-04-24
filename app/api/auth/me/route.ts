import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const LAST_SEEN_THROTTLE_MS = 60 * 60 * 1000; // 1h

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
      lastSeenAt: true,
    },
  });

  // Update throttled (1h) du lastSeenAt pour mesurer l'activité réelle
  // (différent de lastLoginAt qui ne bouge qu'au vrai login formulaire).
  if (user) {
    const now = Date.now();
    const last = user.lastSeenAt ? new Date(user.lastSeenAt).getTime() : 0;
    if (now - last > LAST_SEEN_THROTTLE_MS) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastSeenAt: new Date() },
      }).catch(() => {});
    }
  }

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // For clients, include dayNumber + language
  let dayNumber: number | null = null;
  let language: string | null = null;
  if (user.role === "CLIENT") {
    const client = await prisma.client.findUnique({
      where: { userId: user.id },
      select: { startDate: true, language: true },
    });
    if (client) {
      dayNumber =
        Math.floor(
          (Date.now() - new Date(client.startDate).getTime()) / 86400000
        ) + 1;
      language = client.language;
    }
  }

  return NextResponse.json({ user, dayNumber, language });
}
