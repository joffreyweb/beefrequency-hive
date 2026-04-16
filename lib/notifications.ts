/**
 * Notifications admin — crée des PendingAction pour alerter l'admin
 * Fire-and-forget — ne bloque jamais le flow client
 */

import { prisma } from "@/lib/prisma";

async function getAdminId(): Promise<string | null> {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  return admin?.id ?? null;
}

export async function notifyAdmin({
  clientId,
  title,
  description,
  urgency = "green",
}: {
  clientId: string;
  title: string;
  description?: string;
  urgency?: "red" | "amber" | "green";
}): Promise<void> {
  try {
    const adminId = await getAdminId();
    if (!adminId) return;

    await prisma.pendingAction.create({
      data: {
        adminId,
        clientId,
        type: "CUSTOM",
        title,
        description: description || null,
        urgency,
      },
    });
  } catch (error) {
    console.error("[notifications] Erreur:", error);
  }
}
