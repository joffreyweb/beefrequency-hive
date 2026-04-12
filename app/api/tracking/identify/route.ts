import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, email, data } = body;

    if (!sessionId || !email) {
      return NextResponse.json({ error: "sessionId and email required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if another profile already has this email
    const existingByEmail = await prisma.visitorProfile.findUnique({
      where: { email: normalizedEmail },
    });

    const existingBySession = await prisma.visitorProfile.findUnique({
      where: { sessionId },
    });

    if (existingBySession && !existingByEmail) {
      // Update current session with email
      const mergedData = { ...(existingBySession.collectedData as Record<string, unknown> || {}), ...(data || {}) };
      await prisma.visitorProfile.update({
        where: { sessionId },
        data: {
          email: normalizedEmail,
          collectedData: mergedData,
          lastSeen: new Date(),
        },
      });
    } else if (!existingBySession && !existingByEmail) {
      // Create new profile
      await prisma.visitorProfile.create({
        data: {
          sessionId,
          email: normalizedEmail,
          collectedData: data || null,
        },
      });
    } else if (existingBySession && existingByEmail && existingBySession.id !== existingByEmail.id) {
      // Merge: update email profile with session data
      await prisma.visitorProfile.update({
        where: { email: normalizedEmail },
        data: {
          lastSeen: new Date(),
          totalVisits: { increment: existingBySession.totalVisits },
          collectedData: { ...(existingByEmail.collectedData as Record<string, unknown> || {}), ...(data || {}) },
        },
      });
      // Delete duplicate session profile
      await prisma.visitorProfile.delete({ where: { sessionId } });
    } else if (existingByEmail) {
      // Just update collected data
      const mergedData = { ...(existingByEmail.collectedData as Record<string, unknown> || {}), ...(data || {}) };
      await prisma.visitorProfile.update({
        where: { email: normalizedEmail },
        data: { collectedData: mergedData, lastSeen: new Date() },
      });
    }

    // Link to prospect if exists
    const prospect = await prisma.prospect.findFirst({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (prospect) {
      await prisma.visitorProfile.updateMany({
        where: { email: normalizedEmail },
        data: { prospectId: prospect.id },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Tracking identify error:", error);
    return NextResponse.json({ ok: true }); // Silent fail
  }
}
