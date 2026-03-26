import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-utils";

export async function GET() {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const user = await prisma.user.findUnique({
    where: { id: auth.session.userId },
    select: {
      morningReminderEnabled: true,
      morningReminderTime: true,
      eveningReminderEnabled: true,
      eveningReminderTime: true,
    },
  });

  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();
  const allowed = ["morningReminderEnabled", "morningReminderTime", "eveningReminderEnabled", "eveningReminderTime"];
  const data: Record<string, any> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const user = await prisma.user.update({
    where: { id: auth.session.userId },
    data,
    select: {
      morningReminderEnabled: true,
      morningReminderTime: true,
      eveningReminderEnabled: true,
      eveningReminderTime: true,
    },
  });

  return NextResponse.json(user);
}
