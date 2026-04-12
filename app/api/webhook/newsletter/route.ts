import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Future-proof webhook for Stripe, Shopify, etc.
// Validates signature and creates/updates subscribers

const WEBHOOK_SECRET = process.env.NEWSLETTER_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  // Signature validation (placeholder — implement per provider)
  if (WEBHOOK_SECRET) {
    const sig = request.headers.get("x-webhook-signature");
    if (!sig || sig !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const { event, data } = body;

    // Standard webhook event structure
    // event: "subscriber.created" | "subscriber.updated" | "order.completed" etc.
    // data: { email, firstName?, lastName?, tags?, segments?, metadata? }

    if (!data?.email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const email = data.email.toLowerCase().trim();

    switch (event) {
      case "subscriber.created":
      case "order.completed": {
        await prisma.newsletterSubscriber.upsert({
          where: { email },
          create: {
            email,
            firstName: data.firstName || null,
            lastName: data.lastName || null,
            source: data.source || "webhook",
            sourceDetail: data.sourceDetail || event,
            tags: data.tags || [],
            segments: data.segments || [],
            metadata: data.metadata || null,
          },
          update: {
            tags: data.tags ? { push: data.tags } : undefined,
            segments: data.segments ? { push: data.segments } : undefined,
          },
        });
        break;
      }

      case "subscriber.unsubscribed": {
        await prisma.newsletterSubscriber.updateMany({
          where: { email },
          data: { status: "unsubscribed", unsubscribedAt: new Date() },
        });
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook newsletter error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
