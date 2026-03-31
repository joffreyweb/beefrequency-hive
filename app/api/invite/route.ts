import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

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
      "SOS_URGENCE_VIP", "LE_FIL_DE_LA_RUCHE",
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

    // Création du token d'invitation
    const inviteToken = await prisma.inviteToken.create({
      data: {
        email,
        offerType,
        language,
        role: "CLIENT",
        expiresAt,
      },
    });

    // Construction du lien d'invitation
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/register?token=${inviteToken.token}`;

    return NextResponse.json(
      {
        inviteToken,
        inviteLink,
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
