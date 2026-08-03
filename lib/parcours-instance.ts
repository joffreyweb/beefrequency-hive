import { prisma } from "@/lib/prisma";

// ═══════════════════════════════════════════════════════════════════════
// Instance de parcours ACTIVE — refonte Parcours (Étape 2A)
// Le parcours vit désormais comme objet `ClientParcours`. Les colonnes scalaires
// de Client (detoxStartDate / parcoursType / programTotalDays) restent le MIROIR
// du parcours ACTIF (écriture double le temps de la transition). Règle : un seul
// parcours ACTIVE à la fois par client + historique de parcours COMPLETED.
// ═══════════════════════════════════════════════════════════════════════

// Lecture seule : le parcours ACTIF du client (le plus récent), ou null. Ne crée rien.
export async function getActiveParcours(clientId: string) {
  return prisma.clientParcours.findFirst({
    where: { clientId, status: "ACTIVE" },
    orderBy: { startedAt: "desc" },
  });
}

// Retourne le parcours actif ; en crée un depuis les scalaires Client si aucun ACTIF.
// Utilisé par les gestes admin explicites (génération / recalcul de parcours) et pour
// couvrir les clients créés APRÈS le backfill de l'Étape 1 (pas encore d'instance).
export async function getOrCreateActiveParcours(clientId: string) {
  const existing = await getActiveParcours(clientId);
  if (existing) return existing;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { parcoursType: true, detoxStartDate: true, programTotalDays: true },
  });
  if (!client) return null;

  return prisma.clientParcours.create({
    data: {
      clientId,
      parcoursType: client.parcoursType,
      detoxStartDate: client.detoxStartDate,
      programTotalDays: client.programTotalDays,
      status: "ACTIVE",
      startedAt: client.detoxStartDate ?? new Date(),
    },
  });
}

// Écriture double : synchronise le parcours ACTIF avec les scalaires que l'admin modifie.
// Ne crée PAS d'instance si aucune n'existe (silencieux) — la création est gérée ailleurs.
export async function syncActiveParcours(
  clientId: string,
  data: {
    detoxStartDate?: Date | null;
    parcoursType?: string;
    programTotalDays?: number | null;
  },
) {
  const active = await getActiveParcours(clientId);
  if (!active) return;
  await prisma.clientParcours.update({
    where: { id: active.id },
    data: {
      ...(data.detoxStartDate !== undefined ? { detoxStartDate: data.detoxStartDate } : {}),
      ...(data.parcoursType !== undefined ? { parcoursType: data.parcoursType as never } : {}),
      ...(data.programTotalDays !== undefined ? { programTotalDays: data.programTotalDays } : {}),
    },
  });
}
