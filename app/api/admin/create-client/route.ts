import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import * as bcrypt from "bcryptjs";

// POST /api/admin/create-client — Creer un client directement (avec ou sans legacy)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { firstName, lastName, email, offerType, language, isLegacy, startDate, dayDirect } = await request.json();

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: "Prenom, nom et email requis" }, { status: 400 });
  }

  // Check existing user
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Un compte existe deja avec cet email" }, { status: 409 });
  }

  const fullName = `${firstName} ${lastName}`;
  // Generate a random temporary password — client will set it via invite link
  const tempPassword = crypto.randomUUID().slice(0, 12);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  // Calculate start date for legacy
  let clientStartDate = new Date();
  if (isLegacy) {
    if (startDate) {
      clientStartDate = new Date(startDate);
    } else if (dayDirect && dayDirect > 0) {
      // Day X means they started X days ago
      clientStartDate = new Date();
      clientStartDate.setDate(clientStartDate.getDate() - (dayDirect - 1));
    }
  }

  // Create user + client in transaction
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: fullName,
      role: "CLIENT",
    },
  });

  const client = await prisma.client.create({
    data: {
      userId: user.id,
      offerType: offerType || "CONVERSATION_EXPLORATOIRE",
      language: language || "FR",
      isLegacy: isLegacy || false,
      startDate: clientStartDate,
      // Legacy: pre-configure detoxStartDate for phase calculation
      // but client still goes through full onboarding (convention + questionnaire)
      ...(isLegacy ? { detoxStartDate: clientStartDate } : {}),
    },
  });

  // Create invite token for the welcome email (so client can set password)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 365);

  const inviteToken = await prisma.inviteToken.create({
    data: {
      email,
      offerType: offerType || "CONVERSATION_EXPLORATOIRE",
      language: language || "FR",
      role: "CLIENT",
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const inviteLink = `${baseUrl}/invite/${inviteToken.token}`;

  // Send welcome email
  if (process.env.SMTP_HOST) {
    try {
      const { sendInvitationEmail } = await import("@/lib/mailer");
      await sendInvitationEmail({
        to: email,
        firstName,
        inviteUrl: inviteLink,
        language: (language === "EN" ? "EN" : "FR") as "FR" | "EN",
      });
    } catch (err) {
      console.error("[create-client] Email error:", err);
    }
  }

  // Create kDrive folder
  try {
    const { createClientFolder, isKDriveConfigured } = await import("@/lib/kdrive");
    if (isKDriveConfigured()) {
      await createClientFolder(fullName, client.id);
    }
  } catch (err) {
    console.error("[create-client] kDrive error:", err);
  }

  // If legacy, auto-generate parcours phases
  if (isLegacy) {
    try {
      const { computePhases } = await import("@/lib/parcours");
      const phases = computePhases(clientStartDate);
      for (const phase of phases) {
        await prisma.clientPhase.create({
          data: {
            clientId: client.id,
            phaseType: phase.phaseType,
            phaseNumber: phase.phaseNumber,
            startDate: phase.startDate,
            endDate: phase.endDate,
            status: phase.status,
          },
        });
      }
    } catch (err) {
      console.error("[create-client] Parcours generation error:", err);
    }
  }

  return NextResponse.json({
    client: { id: client.id, name: fullName, email },
    inviteLink,
    isLegacy,
  }, { status: 201 });
}
