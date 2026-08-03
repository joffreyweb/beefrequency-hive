import { prisma } from "@/lib/prisma";
import { computePhases } from "@/lib/parcours";
import { getConfigForParcours } from "@/lib/offer-parcours-binding";
import { getActiveParcours, getOrCreateActiveParcours } from "@/lib/parcours-instance";

export type EnsurePhasesResult = {
  created: number;
  reason?:
    | "client_introuvable"
    | "parcours_sans_phases"
    | "pas_de_detox"
    | "phases_existantes";
};

/**
 * Crée automatiquement les 7 phases (103j) d'un client SI et seulement si :
 *  - le client existe
 *  - son parcoursType prévoit des phases (PARCOURS_CONFIG[type].hasPhases)
 *  - sa detoxStartDate est posée (source de date canonique)
 *  - aucune ClientPhase n'existe encore (idempotent — jamais de doublon)
 *
 * Réutilise la même logique que POST /api/client-phases (computePhases + create).
 * À appeler après toute pose de detoxStartDate (parcours-stage, elixir-received).
 */
export async function ensureClientPhases(clientId: string): Promise<EnsurePhasesResult> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, parcoursType: true, detoxStartDate: true, requiresProgramTimeline: true },
  });

  if (!client) return { created: 0, reason: "client_introuvable" };
  // Aligné sur le flag admin `requiresProgramTimeline` (source de vérité unique) :
  // pas de phases si le type n'en prévoit pas OU si l'admin a coupé la timeline.
  if (!getConfigForParcours(client.parcoursType).hasPhases || !client.requiresProgramTimeline) {
    return { created: 0, reason: "parcours_sans_phases" };
  }
  if (!client.detoxStartDate) return { created: 0, reason: "pas_de_detox" };

  // Résolution de l'instance de parcours à rattacher (refonte Parcours — Étape 2A).
  // Garde-fou anti-régénération : on ne génère JAMAIS pour un client qui a déjà
  // des phases (même sur un parcours terminé) sans geste explicite → invisible.
  let parcoursId: string;
  const active = await getActiveParcours(clientId);
  if (active) {
    const existing = await prisma.clientPhase.count({ where: { clientParcoursId: active.id } });
    if (existing > 0) return { created: 0, reason: "phases_existantes" };
    parcoursId = active.id;
  } else {
    const anyPhase = await prisma.clientPhase.count({ where: { clientId } });
    if (anyPhase > 0) return { created: 0, reason: "phases_existantes" };
    const created = await getOrCreateActiveParcours(clientId);
    if (!created) return { created: 0, reason: "client_introuvable" };
    parcoursId = created.id;
  }

  const computed = computePhases(client.detoxStartDate);
  await prisma.$transaction(
    computed.map((p) =>
      prisma.clientPhase.create({
        data: {
          clientId,
          clientParcoursId: parcoursId,
          phaseType: p.phaseType,
          phaseNumber: p.phaseNumber,
          startDate: p.startDate,
          endDate: p.endDate,
          status: p.status,
        },
      })
    )
  );

  return { created: computed.length };
}
