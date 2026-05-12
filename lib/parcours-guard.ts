import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ParcoursType } from "@prisma/client";
import type { ParcoursFlags } from "./parcours-defaults";

export type ClientFlagsRow = ParcoursFlags & {
  parcoursType: ParcoursType;
};

const FLAG_SELECT = {
  parcoursType: true,
  requiresWelcomeVideo: true,
  requiresConvention: true,
  requiresQuestionnaire: true,
  requiresPhaseVideos: true,
  requiresMorningCheckin: true,
  requiresEveningCheckin: true,
  requiresJournal: true,
  requiresProgramTimeline: true,
} as const;

export async function getClientFlagsByUserId(
  userId: string
): Promise<ClientFlagsRow | null> {
  const client = await prisma.client.findUnique({
    where: { userId },
    select: FLAG_SELECT,
  });
  return client;
}

export async function getCurrentClientFlags(): Promise<ClientFlagsRow | null> {
  const session = await getSession();
  if (!session || session.role !== "CLIENT") return null;
  return getClientFlagsByUserId(session.userId);
}

export async function requireFlagOrRedirect(
  flag: keyof ParcoursFlags,
  redirectPath: string = "/client/home"
): Promise<ClientFlagsRow> {
  const flags = await getCurrentClientFlags();
  if (!flags || !flags[flag]) redirect(redirectPath);
  return flags;
}

export async function assertFlagForApi(
  flag: keyof ParcoursFlags
): Promise<{ ok: true; flags: ClientFlagsRow } | { ok: false; response: NextResponse }> {
  const flags = await getCurrentClientFlags();
  if (!flags) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!flags[flag]) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Module désactivé pour ce parcours", flag },
        { status: 403 }
      ),
    };
  }
  return { ok: true, flags };
}
