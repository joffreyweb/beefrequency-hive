import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import {
  FLAG_KEYS,
  getDefaultsForParcoursType,
  type ParcoursFlags,
} from "@/lib/parcours-defaults";
import { getParcoursTypeForOffer, PARCOURS_CONFIG } from "@/lib/offer-parcours-binding";
import { sendInvitationEmail } from "@/lib/mailer";
import type { ParcoursType } from "@prisma/client";

function isValidParcoursType(v: unknown): v is ParcoursType {
  return typeof v === "string" && v in PARCOURS_CONFIG;
}

// Résout parcoursType + flags. Si parcoursType n'est pas fourni explicitement,
// on dérive du binding de l'offre (garde-fou serveur — plus de défaut LE_PASSAGE).
function resolveParcoursPayload(
  body: Record<string, unknown>,
  offerType: string
): {
  parcoursType: ParcoursType;
  flags: ParcoursFlags;
} {
  const rawType = body.parcoursType;
  const parcoursType: ParcoursType = isValidParcoursType(rawType)
    ? rawType
    : getParcoursTypeForOffer(offerType);

  const defaults = getDefaultsForParcoursType(parcoursType);
  const flags: ParcoursFlags = { ...defaults };
  for (const key of FLAG_KEYS) {
    const provided = body[key];
    if (typeof provided === "boolean") {
      flags[key] = provided;
    }
  }
  return { parcoursType, flags };
}

// POST /api/invite — Crée un token d'invitation pour un nouveau client (admin uniquement)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { email, offerType, language = "FR" } = body;

    // Validation des champs requis
    if (!email || !offerType) {
      return NextResponse.json(
        { error: "email et offerType sont requis" },
        { status: 400 }
      );
    }

    // Validation du type d'offre
    const validOffers = [
      "CONVERSATION_EXPLORATOIRE", "SESSION_SEUIL", "LE_NECTAR_CYCLE",
      "LE_PASSAGE_1_1", "LES_CYCLES_DE_LA_RUCHE", "CEREMONIE_RESET",
      "LA_RUCHE_VIVANTE", "SOUVERAINETE", "LA_CHAMBRE_DE_LA_REINE",
      "SOS_URGENCE_VIP", "LE_FIL_DE_LA_RUCHE", "PARCOURS_PERSONNALISE",
      "HIVE_EXPERIENCE", "THE_PASSAGE", // Legacy
    ];
    if (!validOffers.includes(offerType)) {
      return NextResponse.json(
        { error: "Type d'offre invalide" },
        { status: 400 }
      );
    }

    // Vérifie si un utilisateur existe déjà avec cet email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 409 }
      );
    }

    // Invalide les anciens tokens actifs pour cet email
    await prisma.inviteToken.updateMany({
      where: {
        email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        expiresAt: new Date(),
      },
    });

    // Expiration dans 7 jours
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Résolution parcoursType + 8 flags (binding depuis l'offre si parcoursType absent)
    const { parcoursType, flags } = resolveParcoursPayload(body, offerType);

    // Création du token d'invitation
    const inviteToken = await prisma.inviteToken.create({
      data: {
        email,
        offerType,
        language,
        role: "CLIENT",
        expiresAt,
        parcoursType,
        ...flags,
      },
    });

    // Construction du lien d'invitation
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/register?token=${inviteToken.token}`;

    // Envoi automatique de l'email d'invitation.
    // Fallback : si SMTP échoue, l'invitation reste valide → l'admin peut copier le lien manuellement.
    let emailSent = false;
    if (process.env.SMTP_HOST) {
      try {
        await sendInvitationEmail({
          to: email,
          inviteUrl: inviteLink,
          language: language === "EN" ? "EN" : "FR",
        });
        emailSent = true;
      } catch (err) {
        console.error("[invite] Échec envoi email invitation:", err);
      }
    }

    return NextResponse.json(
      {
        inviteToken,
        inviteLink,
        emailSent,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la création de l'invitation" },
      { status: 500 }
    );
  }
}
