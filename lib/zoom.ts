/**
 * Zoom Server-to-Server OAuth API
 *
 * Setup: marketplace.zoom.us → Develop → Build App → Server-to-Server OAuth
 * Permissions: meeting:write:meeting
 *
 * Variables .env:
 * - ZOOM_ACCOUNT_ID
 * - ZOOM_CLIENT_ID
 * - ZOOM_CLIENT_SECRET
 */

let cachedToken: { token: string; expiresAt: number } | null = null;

export function isZoomConfigured(): boolean {
  return !!(process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET);
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoom OAuth failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

export interface ZoomMeeting {
  meetingId: string;
  joinUrl: string;
  startUrl: string;
}

export async function createZoomMeeting(
  title: string,
  startTime: Date,
  durationMin: number
): Promise<ZoomMeeting> {
  if (!isZoomConfigured()) {
    throw new Error("Zoom non configure — ajoutez ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET");
  }

  const token = await getAccessToken();

  const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: title,
      type: 2, // Scheduled meeting
      start_time: startTime.toISOString(),
      duration: durationMin,
      timezone: "Europe/Paris",
      settings: {
        join_before_host: true,
        waiting_room: false,
        auto_recording: "none",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoom create meeting failed: ${res.status} ${err}`);
  }

  const data = await res.json();

  return {
    meetingId: String(data.id),
    joinUrl: data.join_url,
    startUrl: data.start_url,
  };
}

export async function updateZoomMeeting(
  meetingId: string,
  newStartTime: Date,
  durationMin?: number
): Promise<void> {
  if (!isZoomConfigured()) return;

  const token = await getAccessToken();

  const body: Record<string, unknown> = {
    start_time: newStartTime.toISOString(),
    timezone: "Europe/Paris",
  };
  if (durationMin) body.duration = durationMin;

  const res = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.text();
    console.error(`Zoom update meeting failed: ${res.status} ${err}`);
  }
}

export async function deleteZoomMeeting(meetingId: string): Promise<void> {
  if (!isZoomConfigured()) return;

  const token = await getAccessToken();

  const res = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 204 && res.status !== 404) {
    const err = await res.text();
    console.error(`Zoom delete meeting failed: ${res.status} ${err}`);
  }
}
