import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { computeStockInfo } from "@/lib/stock-utils";

// POST — Synchroniser / générer les actions automatiques au chargement du dashboard
export async function POST() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { session } = auth;
    const adminId = session.userId;
    let created = 0;

    // Récupérer toutes les actions non complétées pour éviter les doublons
    const existingActions = await prisma.pendingAction.findMany({
      where: { completedAt: null },
      select: { type: true, clientId: true, title: true },
    });

    // Vérifie si une action du même type+clientId existe déjà
    const actionExists = (type: string, clientId: string | null) =>
      existingActions.some(
        (a) => a.type === type && a.clientId === clientId
      );

    // --- a) RECAP — Sessions terminées aujourd'hui sans récap ---
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const completedSessions = await prisma.session.findMany({
      where: {
        status: "COMPLETED",
        recapDone: false,
        scheduledAt: { gte: todayStart },
      },
      include: { client: { include: { user: true } } },
    });

    for (const s of completedSessions) {
      if (!actionExists("RECAP", s.clientId)) {
        await prisma.pendingAction.create({
          data: {
            adminId,
            clientId: s.clientId,
            type: "RECAP",
            title: `Récap post-session — ${s.client.user.name}`,
            urgency: "amber",
          },
        });
        created++;
        // Ajouter aux existantes pour éviter les doublons dans la même boucle
        existingActions.push({ type: "RECAP", clientId: s.clientId, title: "" });
      }
    }

    // --- b) ELIXIR — Prescriptions avec stock critique ---
    const prescriptions = await prisma.elixirPrescription.findMany({
      where: { client: { status: "ACTIVE" } },
      include: { elixir: true, client: { include: { user: true } } },
    });

    for (const rx of prescriptions) {
      const stock = computeStockInfo(rx);
      if (stock.isLow && !actionExists("ELIXIR", rx.clientId)) {
        await prisma.pendingAction.create({
          data: {
            adminId,
            clientId: rx.clientId,
            type: "ELIXIR",
            title: `Stock bas — ${rx.elixir.name} (${rx.client.user.name})`,
            urgency: (stock.daysRemaining ?? 0) <= 3 ? "red" : "amber",
          },
        });
        created++;
        existingActions.push({ type: "ELIXIR", clientId: rx.clientId, title: "" });
      }
    }

    // --- c) SESSION — Prochaine session non planifiée (dernière > 7 jours) ---
    const activeClients = await prisma.client.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: true,
        sessions: { orderBy: { scheduledAt: "desc" }, take: 1 },
      },
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    for (const client of activeClients) {
      const lastSession = client.sessions[0];
      // Dernière session date de plus de 7 jours (ou aucune session)
      const isOverdue =
        !lastSession || new Date(lastSession.scheduledAt) < sevenDaysAgo;

      // Vérifier qu'il n'y a pas de session SCHEDULED dans le futur
      const hasFutureSession = lastSession
        ? lastSession.status === "SCHEDULED" &&
          new Date(lastSession.scheduledAt) > now
        : false;

      if (isOverdue && !hasFutureSession && !actionExists("SESSION", client.id)) {
        await prisma.pendingAction.create({
          data: {
            adminId,
            clientId: client.id,
            type: "SESSION",
            title: `Planifier session — ${client.user.name}`,
            urgency: "green",
          },
        });
        created++;
        existingActions.push({ type: "SESSION", clientId: client.id, title: "" });
      }
    }

    // --- d) SYMPTOM — Messages symptômes non lus ---
    const symptomMsgs = await prisma.message.findMany({
      where: { tag: "SYMPTOM", readAt: null },
      include: { sender: { include: { client: true } } },
    });

    for (const msg of symptomMsgs) {
      const clientId = msg.sender.client?.id ?? null;
      if (clientId && !actionExists("SYMPTOM", clientId)) {
        await prisma.pendingAction.create({
          data: {
            adminId,
            clientId,
            type: "SYMPTOM",
            title: `Message symptôme — ${msg.sender.name}`,
            urgency: "red",
          },
        });
        created++;
        existingActions.push({ type: "SYMPTOM", clientId, title: "" });
      }
    }

    // --- e) DOCUMENT — Documents non lus par l'admin ---
    const unreadDocs = await prisma.clientDocument.findMany({
      where: { readByAdmin: false },
      include: { client: { include: { user: true } } },
    });

    for (const doc of unreadDocs) {
      if (!actionExists("DOCUMENT", doc.clientId)) {
        await prisma.pendingAction.create({
          data: {
            adminId,
            clientId: doc.clientId,
            type: "DOCUMENT",
            title: `Nouveau document — ${doc.client.user.name}`,
            urgency: "amber",
          },
        });
        created++;
        existingActions.push({ type: "DOCUMENT", clientId: doc.clientId, title: "" });
      }
    }

    // --- f) BIRTHDAY — Anniversaires à venir (demain + dans 7 jours) ---
    const clientsWithIntake = await prisma.client.findMany({
      where: { status: "ACTIVE" },
      include: { user: true, intake: true },
    });

    const tomorrow = new Date(todayStart.getTime() + 86400000);
    const inSevenDays = new Date(todayStart.getTime() + 7 * 86400000);

    for (const client of clientsWithIntake) {
      if (!client.intake?.birthDate) continue;
      const bd = new Date(client.intake.birthDate);
      const bdDay = bd.getDate();
      const bdMonth = bd.getMonth();
      const fullName = `${client.intake.firstName} ${client.intake.lastName}`;
      const age = tomorrow.getFullYear() - bd.getFullYear();
      const bdFormatted = bd.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

      // Anniversaire demain
      if (bdDay === tomorrow.getDate() && bdMonth === tomorrow.getMonth()) {
        const title = `Anniversaire demain — ${fullName}`;
        if (!existingActions.some((a) => a.type === "BIRTHDAY" && a.title === title)) {
          await prisma.pendingAction.create({
            data: {
              adminId,
              clientId: client.id,
              type: "BIRTHDAY",
              title,
              description: `Né(e) le ${bdFormatted} · ${age} ans demain`,
              urgency: "amber",
            },
          });
          created++;
          existingActions.push({ type: "BIRTHDAY", clientId: client.id, title });
        }
      }

      // Anniversaire dans 7 jours
      if (bdDay === inSevenDays.getDate() && bdMonth === inSevenDays.getMonth()) {
        const title = `Anniversaire dans 7 jours — ${fullName}`;
        const ageIn7 = inSevenDays.getFullYear() - bd.getFullYear();
        if (!existingActions.some((a) => a.type === "BIRTHDAY" && a.title === title)) {
          await prisma.pendingAction.create({
            data: {
              adminId,
              clientId: client.id,
              type: "BIRTHDAY",
              title,
              description: `Né(e) le ${bdFormatted} · ${ageIn7} ans dans 7 jours`,
              urgency: "green",
            },
          });
          created++;
          existingActions.push({ type: "BIRTHDAY", clientId: client.id, title });
        }
      }
    }

    // --- g) CUSTOM — Templates HD incomplets ---
    const HD_VARIANT_KEYS = [
      "GENERATOR",
      "MANIFESTOR",
      "MANIFESTING_GENERATOR",
      "PROJECTOR",
      "REFLECTOR",
      "DEFAULT",
    ] as const;

    const templates = await prisma.journeyMessageTemplate.findMany({
      where: { isActive: true },
    });

    for (const template of templates) {
      // Parser les variantes HD du template
      let variants: Record<string, { subject?: string; body?: string }> = {};
      try {
        variants =
          typeof template.hdVariants === "string"
            ? JSON.parse(template.hdVariants)
            : (template.hdVariants as Record<
                string,
                { subject?: string; body?: string }
              >) ?? {};
      } catch {
        // Si le JSON est invalide, on considère le template comme incomplet
        variants = {};
      }

      // Vérifier que chaque variante a un body de plus de 10 caractères
      const isIncomplete = HD_VARIANT_KEYS.some((key) => {
        const variant = variants[key];
        return !variant || !variant.body || variant.body.length < 10;
      });

      if (isIncomplete) {
        const actionTitle = `Compléter les variantes HD — ${template.title}`;
        const alreadyExists = existingActions.some(
          (a) => a.type === "CUSTOM" && a.title === actionTitle
        );

        if (!alreadyExists) {
          await prisma.pendingAction.create({
            data: {
              adminId,
              clientId: null,
              type: "CUSTOM",
              title: actionTitle,
              urgency: "amber",
            },
          });
          created++;
          existingActions.push({
            type: "CUSTOM",
            clientId: null,
            title: actionTitle,
          });
        }
      }
    }

    // Total des actions visibles (non complétées)
    const total = await prisma.pendingAction.count({
      where: { completedAt: null },
    });

    return NextResponse.json({ created, total });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
