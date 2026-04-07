import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/caldav/webhook
 *
 * Receives a VCALENDAR body (from Radicale post-put hook or manual call)
 * and upserts a CalDAV event in the database.
 *
 * Auth: shared secret via CALDAV_WEBHOOK_SECRET header or query param.
 *
 * GET /api/caldav/webhook?action=sync
 * Pulls all events from Radicale and syncs non-Hive ones to DB.
 */

function checkAuth(request: NextRequest): boolean {
  const secret = process.env.CALDAV_WEBHOOK_SECRET;
  if (!secret) return false;
  const provided =
    request.headers.get("x-webhook-secret") ||
    request.nextUrl.searchParams.get("secret");
  return provided === secret;
}

// POST — receive a single VCALENDAR event
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.text();
  if (!body.includes("BEGIN:VEVENT")) {
    return NextResponse.json({ error: "No VEVENT found" }, { status: 400 });
  }

  const uid = extractField(body, "UID");
  if (!uid) {
    return NextResponse.json({ error: "No UID" }, { status: 400 });
  }

  // Skip events created by Hive itself
  if (uid.startsWith("hive-")) {
    return NextResponse.json({ skipped: true, reason: "hive event" });
  }

  const summary = extractField(body, "SUMMARY") || "Blocked (CalDAV)";
  const dtstart = extractICalDate(body, "DTSTART");
  const dtend = extractICalDate(body, "DTEND");

  if (!dtstart || !dtend) {
    return NextResponse.json({ error: "Missing DTSTART/DTEND" }, { status: 400 });
  }

  const durationMin = Math.round((dtend.getTime() - dtstart.getTime()) / 60000);

  const event = await prisma.calendarEvent.upsert({
    where: { uid },
    create: {
      uid,
      summary,
      startAt: dtstart,
      endAt: dtend,
      durationMin,
      source: "caldav",
    },
    update: {
      summary,
      startAt: dtstart,
      endAt: dtend,
      durationMin,
    },
  });

  return NextResponse.json({ ok: true, event: { id: event.id, uid, summary } });
}

// GET ?action=sync — pull all events from Radicale and sync to DB
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const action = request.nextUrl.searchParams.get("action");
  if (action !== "sync") {
    return NextResponse.json({ error: "Use ?action=sync" }, { status: 400 });
  }

  const { getBusySlots } = await import("@/lib/caldav");

  const now = new Date();
  const sixMonthsLater = new Date(now);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

  const slots = await getBusySlots(now, sixMonthsLater);

  let synced = 0;
  for (const slot of slots) {
    const summary = slot.summary || "Blocked (CalDAV)";
    // Skip Hive-created events
    if (summary.includes("BeeFrequency")) continue;

    const uid = `caldav-${slot.start.getTime()}`;
    const durationMin = Math.round((slot.end.getTime() - slot.start.getTime()) / 60000);

    await prisma.calendarEvent.upsert({
      where: { uid },
      create: {
        uid,
        summary,
        startAt: slot.start,
        endAt: slot.end,
        durationMin,
        source: "caldav",
      },
      update: {
        summary,
        startAt: slot.start,
        endAt: slot.end,
        durationMin,
      },
    });
    synced++;
  }

  return NextResponse.json({ ok: true, synced });
}

// --- iCal parsing helpers ---

function extractField(ical: string, field: string): string | null {
  const regex = new RegExp(`${field}[^:]*:(.+)`, "m");
  const match = ical.match(regex);
  return match ? match[1].trim() : null;
}

function extractICalDate(ical: string, field: string): Date | null {
  const regex = new RegExp(`${field}[^:]*:([\\dT]+Z?)`, "m");
  const match = ical.match(regex);
  if (!match) return null;

  const val = match[1];
  if (val.length === 8) {
    return new Date(`${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}T00:00:00`);
  }
  const iso = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}T${val.slice(9, 11)}:${val.slice(11, 13)}:${val.slice(13, 15)}${val.endsWith("Z") ? "Z" : ""}`;
  return new Date(iso);
}
