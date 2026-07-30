import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// Notifications push (VAPID). Les clés viennent de l'env du VPS :
//   VAPID_PUBLIC_KEY · VAPID_PRIVATE_KEY · VAPID_SUBJECT (mailto:…)
// Génération : `npx web-push generate-vapid-keys`

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:info@joffreydeleplanque.com",
    pub,
    priv,
  );
  configured = true;
  return true;
}

export function isPushConfigured(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

type PushPayload = { title: string; body: string; url?: string };

// Envoie une notification à TOUS les appareils d'un client. Fire-and-forget côté appelant.
export async function sendPushToClient(
  clientId: string,
  payload: PushPayload,
): Promise<void> {
  if (!ensureConfigured()) return;
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { clientId } });
    if (subs.length === 0) return;
    const data = JSON.stringify(payload);
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            data,
          );
        } catch (err: unknown) {
          const code = (err as { statusCode?: number })?.statusCode;
          if (code === 404 || code === 410) {
            await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
          }
        }
      }),
    );
  } catch (e) {
    console.error("[push] sendPushToClient:", e);
  }
}

// Envoie une notification à TOUS les appareils admin (abonnements AdminPushSubscription).
// Si userId omis → premier utilisateur ADMIN. Fire-and-forget. Admin-only, souverain.
export async function sendPushToAdmin(
  payload: PushPayload,
  userId?: string,
): Promise<void> {
  if (!ensureConfigured()) return;
  try {
    let uid = userId;
    if (!uid) {
      const admin = await prisma.user.findFirst({
        where: { role: "ADMIN" },
        select: { id: true },
      });
      uid = admin?.id ?? undefined;
    }
    if (!uid) return;

    const subs = await prisma.adminPushSubscription.findMany({ where: { userId: uid } });
    if (subs.length === 0) return;
    const data = JSON.stringify(payload);
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            data,
          );
        } catch (err: unknown) {
          const code = (err as { statusCode?: number })?.statusCode;
          if (code === 404 || code === 410) {
            await prisma.adminPushSubscription.delete({ where: { id: s.id } }).catch(() => {});
          }
        }
      }),
    );
  } catch (e) {
    console.error("[push] sendPushToAdmin:", e);
  }
}
