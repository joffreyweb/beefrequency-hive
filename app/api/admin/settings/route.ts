import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

async function getOrCreateSettings() {
  let settings = await prisma.adminSettings.findFirst();
  if (!settings) {
    settings = await prisma.adminSettings.create({ data: {} });
  }
  return settings;
}

// GET — Retourne tous les paramètres admin (inclut les réglages du brief matinal).
export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const settings = await getOrCreateSettings();
  const user = await prisma.user.findUnique({
    where: { id: auth.session.userId },
    select: { dailyRecapTime: true },
  });

  return NextResponse.json({
    ...settings,
    dailyRecapTime: user?.dailyRecapTime ?? "18:00",
  });
}

// PATCH — Met à jour les paramètres (existants + brief matinal Ma Journée).
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();
  const settings = await getOrCreateSettings();

  const data: Record<string, unknown> = {};
  // Existant
  if (body.emailReminderSession !== undefined) data.emailReminderSession = body.emailReminderSession;
  if (body.emailNewMessage !== undefined) data.emailNewMessage = body.emailNewMessage;
  if (body.notifyOverdueTask !== undefined) data.notifyOverdueTask = body.notifyOverdueTask;
  if (body.defaultSessionDuration !== undefined) data.defaultSessionDuration = body.defaultSessionDuration;
  if (body.sessionBuffer !== undefined) data.sessionBuffer = body.sessionBuffer;
  if (body.senderEmail !== undefined) data.senderEmail = body.senderEmail;
  if (body.emailSignature !== undefined) data.emailSignature = body.emailSignature;
  if (body.timezone !== undefined) data.timezone = body.timezone;
  if (body.language !== undefined) data.language = body.language;
  // Brief matinal Ma Journée
  if (body.briefHour !== undefined) {
    const h = Number(body.briefHour);
    if (Number.isInteger(h) && h >= 0 && h <= 23) data.briefHour = h;
  }
  if (body.briefPushEnabled !== undefined) data.briefPushEnabled = !!body.briefPushEnabled;
  if (body.briefEmailEnabled !== undefined) data.briefEmailEnabled = !!body.briefEmailEnabled;
  if (body.briefEmail !== undefined) data.briefEmail = body.briefEmail ? String(body.briefEmail).trim() : null;
  if (body.shutdownEnabled !== undefined) data.shutdownEnabled = !!body.shutdownEnabled;
  if (body.shutdownHour !== undefined) {
    const h = Number(body.shutdownHour);
    if (Number.isInteger(h) && h >= 0 && h <= 23) data.shutdownHour = h;
  }

  const updated = await prisma.adminSettings.update({ where: { id: settings.id }, data });

  if (body.dailyRecapTime && /^\d{2}:\d{2}$/.test(body.dailyRecapTime)) {
    await prisma.user.update({
      where: { id: auth.session.userId },
      data: { dailyRecapTime: body.dailyRecapTime },
    });
  }

  return NextResponse.json(updated);
}
