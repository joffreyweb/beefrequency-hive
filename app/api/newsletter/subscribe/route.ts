import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const API_KEY = process.env.NEWSLETTER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Optional API key auth for external integrations
    const apiKey = request.headers.get("x-api-key");
    if (API_KEY && apiKey && apiKey !== API_KEY) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const body = await request.json();
    const { email, firstName, lastName, source, sourceDetail, tags, segments, metadata } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if subscriber already exists
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      // Merge tags and segments
      const mergedTags = [...new Set([...existing.tags, ...(tags || [])])];
      const mergedSegments = [...new Set([...existing.segments, ...(segments || [])])];
      const mergedMetadata = { ...(existing.metadata as Record<string, unknown> || {}), ...(metadata || {}) };

      const updated = await prisma.newsletterSubscriber.update({
        where: { email: normalizedEmail },
        data: {
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {}),
          tags: mergedTags,
          segments: mergedSegments,
          metadata: mergedMetadata,
          // Re-activate if was unsubscribed
          ...(existing.status === "unsubscribed" ? { status: "active", unsubscribedAt: null } : {}),
        },
      });

      return NextResponse.json({ success: true, subscriberId: updated.id, merged: true });
    }

    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email: normalizedEmail,
        firstName: firstName || null,
        lastName: lastName || null,
        source: source || "website",
        sourceDetail: sourceDetail || null,
        tags: tags || [],
        segments: segments || [],
        metadata: metadata || null,
      },
    });

    return NextResponse.json({ success: true, subscriberId: subscriber.id });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
