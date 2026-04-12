import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { transporter } from "@/lib/mailer";

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 1000;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hive.joffreydeleplanque.com";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json({ error: "Campagne non trouv\u00e9e" }, { status: 404 });
  }
  if (campaign.status === "sent" || campaign.status === "sending") {
    return NextResponse.json({ error: "Campagne d\u00e9j\u00e0 envoy\u00e9e" }, { status: 400 });
  }

  // Build subscriber filter
  const where: Record<string, unknown> = { status: "active" };

  if (campaign.targetTags.length > 0) {
    where.tags = { hasSome: campaign.targetTags };
  }
  if (campaign.targetSegments.length > 0) {
    where.segments = { hasSome: campaign.targetSegments };
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where,
    select: { id: true, email: true, firstName: true, tags: true },
  });

  // Filter out excluded tags
  const filtered = campaign.excludeTags.length > 0
    ? subscribers.filter((s) => !s.tags.some((t) => campaign.excludeTags.includes(t)))
    : subscribers;

  if (filtered.length === 0) {
    return NextResponse.json({ error: "Aucun destinataire" }, { status: 400 });
  }

  // Mark as sending
  await prisma.newsletterCampaign.update({
    where: { id },
    data: { status: "sending" },
  });

  const mailFrom = `"${process.env.FROM_NAME || "Joffrey Deleplanque"}" <${process.env.FROM_EMAIL || "admin@beefrequency.com"}>`;
  let sentCount = 0;

  try {
    for (let i = 0; i < filtered.length; i += BATCH_SIZE) {
      const batch = filtered.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(
        batch.map(async (sub) => {
          const unsubLink = `${BASE_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(sub.email)}`;
          const logoHeader = `<div style="text-align:center;padding:32px 0 24px 0;">
  <img src="https://hive.joffreydeleplanque.com/icon512.png" alt="BeeFrequency" width="80" height="80" style="display:inline-block;width:80px;height:80px;border:none;" />
</div>`;
          const htmlWithFooter = `${logoHeader}${campaign.content}
<hr style="border:none;border-top:1px solid #E8D5A8;margin:32px 0 16px 0;">
<p style="font-family:Arial,sans-serif;font-size:11px;color:#999;text-align:center;">
  <a href="${unsubLink}" style="color:#999;text-decoration:underline;">Se désinscrire</a> | <a href="${unsubLink}" style="color:#999;text-decoration:underline;">Unsubscribe</a>
</p>`;

          await transporter.sendMail({
            from: mailFrom,
            to: sub.email,
            subject: campaign.subject,
            ...(campaign.previewText ? { headers: { "X-Preview-Text": campaign.previewText } } : {}),
            html: htmlWithFooter,
          });

          await prisma.newsletterSubscriber.update({
            where: { id: sub.id },
            data: {
              emailsSent: { increment: 1 },
              lastEmailAt: new Date(),
            },
          });

          sentCount++;
        })
      );

      if (i + BATCH_SIZE < filtered.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    await prisma.newsletterCampaign.update({
      where: { id },
      data: {
        status: "sent",
        sentAt: new Date(),
        sentCount,
      },
    });

    return NextResponse.json({ ok: true, sentCount, totalRecipients: filtered.length });
  } catch (error) {
    console.error("Campaign send error:", error);
    await prisma.newsletterCampaign.update({
      where: { id },
      data: { status: "failed", sentCount },
    });
    return NextResponse.json({ error: "Erreur d'envoi", sentCount }, { status: 500 });
  }
}
