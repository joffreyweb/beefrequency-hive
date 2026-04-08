/**
 * CalDAV — lecture seule des creneaux occupes
 * Compatible iCloud et Radicale
 *
 * Variables .env:
 * - CALDAV_URL (ex: https://caldav.icloud.com/ ou https://cal.beefrequency.com/)
 * - CALDAV_USERNAME
 * - CALDAV_APP_PASSWORD
 * - CALDAV_HOME_URL (optionnel, requis pour Radicale: https://cal.beefrequency.com/Joffrey/)
 */

import { createDAVClient, fetchCalendars, fetchCalendarObjects, createCalendarObject, getBasicAuthHeaders } from "tsdav";
import type { DAVAccount } from "tsdav";

export function isCalDAVConfigured(): boolean {
  return !!(process.env.CALDAV_URL && process.env.CALDAV_USERNAME && process.env.CALDAV_APP_PASSWORD);
}

export interface BusySlot {
  start: Date;
  end: Date;
  summary?: string;
}

export async function getBusySlots(startDate: Date, endDate: Date): Promise<BusySlot[]> {
  if (!isCalDAVConfigured()) {
    console.log("[CalDAV] Non configure — retour vide");
    return [];
  }

  try {
    const homeUrl = process.env.CALDAV_HOME_URL;

    // Si homeUrl est fourni (Radicale), on utilise les fonctions bas niveau
    // Sinon (iCloud), on utilise createDAVClient avec decouverte automatique
    if (homeUrl) {
      return await fetchWithDirectHomeUrl(homeUrl, startDate, endDate);
    } else {
      return await fetchWithAutoDiscovery(startDate, endDate);
    }
  } catch (error) {
    console.error("[CalDAV] Erreur connexion:", error);
    return [];
  }
}

async function fetchWithDirectHomeUrl(homeUrl: string, startDate: Date, endDate: Date): Promise<BusySlot[]> {
  const credentials = {
    username: process.env.CALDAV_USERNAME!,
    password: process.env.CALDAV_APP_PASSWORD!,
  };
  const headers = getBasicAuthHeaders(credentials);

  const account: DAVAccount = {
    accountType: "caldav",
    serverUrl: process.env.CALDAV_URL!,
    credentials,
    homeUrl,
    rootUrl: process.env.CALDAV_URL!,
  };

  const calendars = await fetchCalendars({ account, headers });

  if (calendars.length === 0) {
    console.log("[CalDAV] Aucun calendrier trouve");
    return [];
  }

  return await collectBusySlots(calendars, headers, startDate, endDate);
}

async function fetchWithAutoDiscovery(startDate: Date, endDate: Date): Promise<BusySlot[]> {
  const client = await createDAVClient({
    serverUrl: process.env.CALDAV_URL!,
    credentials: {
      username: process.env.CALDAV_USERNAME!,
      password: process.env.CALDAV_APP_PASSWORD!,
    },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });

  const calendars = await client.fetchCalendars();

  if (calendars.length === 0) {
    console.log("[CalDAV] Aucun calendrier trouve");
    return [];
  }

  const busySlots: BusySlot[] = [];

  for (const calendar of calendars) {
    try {
      const objects = await client.fetchCalendarObjects({
        calendar,
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      });

      for (const obj of objects) {
        if (!obj.data) continue;
        const dtstart = extractICalDate(obj.data, "DTSTART");
        const dtend = extractICalDate(obj.data, "DTEND");
        const summary = extractICalField(obj.data, "SUMMARY");

        if (dtstart && dtend) {
          busySlots.push({ start: dtstart, end: dtend, summary: summary || undefined });
        }
      }
    } catch (err) {
      console.error(`[CalDAV] Erreur calendrier ${calendar.displayName}:`, err);
    }
  }

  return busySlots;
}

async function collectBusySlots(
  calendars: Awaited<ReturnType<typeof fetchCalendars>>,
  headers: Record<string, string>,
  startDate: Date,
  endDate: Date,
): Promise<BusySlot[]> {
  const busySlots: BusySlot[] = [];

  for (const calendar of calendars) {
    try {
      const objects = await fetchCalendarObjects({
        calendar,
        headers,
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      });

      for (const obj of objects) {
        if (!obj.data) continue;
        const dtstart = extractICalDate(obj.data, "DTSTART");
        const dtend = extractICalDate(obj.data, "DTEND");
        const summary = extractICalField(obj.data, "SUMMARY");

        if (dtstart && dtend) {
          busySlots.push({ start: dtstart, end: dtend, summary: summary || undefined });
        }
      }
    } catch (err) {
      console.error(`[CalDAV] Erreur calendrier ${calendar.displayName}:`, err);
    }
  }

  return busySlots;
}

// ═══════════════════════════════════════
// Création d'événement CalDAV (PUT vers Radicale)
// ═══════════════════════════════════════

export async function createCalDAVEvent({
  uid,
  summary,
  start,
  end,
  description,
}: {
  uid: string;
  summary: string;
  start: Date;
  end: Date;
  description?: string;
}): Promise<boolean> {
  if (!isCalDAVConfigured()) {
    console.log("[CalDAV] Non configure — event non pousse");
    return false;
  }

  const homeUrl = process.env.CALDAV_HOME_URL;
  if (!homeUrl) {
    console.log("[CalDAV] CALDAV_HOME_URL requis pour push Radicale");
    return false;
  }

  try {
    const credentials = {
      username: process.env.CALDAV_USERNAME!,
      password: process.env.CALDAV_APP_PASSWORD!,
    };
    const headers = getBasicAuthHeaders(credentials);

    const account: DAVAccount = {
      accountType: "caldav",
      serverUrl: process.env.CALDAV_URL!,
      credentials,
      homeUrl,
      rootUrl: process.env.CALDAV_URL!,
    };

    const calendars = await fetchCalendars({ account, headers });
    if (calendars.length === 0) {
      console.error("[CalDAV] Aucun calendrier trouve pour push");
      return false;
    }

    const calendar = calendars[0];
    const TZ = "Europe/Brussels";

    const iCalString = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//BeeFrequency//Hive//FR",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatICalDateUTC(new Date())}`,
      `DTSTART;TZID=${TZ}:${formatICalDateLocal(start, TZ)}`,
      `DTEND;TZID=${TZ}:${formatICalDateLocal(end, TZ)}`,
      `SUMMARY:${summary}`,
      ...(description ? [`DESCRIPTION:${description}`] : []),
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    await createCalendarObject({
      calendar,
      iCalString,
      filename: `${uid}.ics`,
      headers,
    });

    console.log(`[CalDAV] Event pousse: ${uid}`);
    return true;
  } catch (error) {
    console.error("[CalDAV] Erreur push event:", error);
    return false;
  }
}

/** UTC format for DTSTAMP: 20260407T120000Z */
export async function deleteCalDAVEvent(uid: string): Promise<boolean> {
  if (!isCalDAVConfigured()) return false;

  const homeUrl = process.env.CALDAV_HOME_URL;
  if (!homeUrl) return false;

  try {
    const credentials = {
      username: process.env.CALDAV_USERNAME!,
      password: process.env.CALDAV_APP_PASSWORD!,
    };
    const headers = getBasicAuthHeaders(credentials);

    const account: DAVAccount = {
      accountType: "caldav",
      serverUrl: process.env.CALDAV_URL!,
      credentials,
      homeUrl,
      rootUrl: process.env.CALDAV_URL!,
    };

    const calendars = await fetchCalendars({ account, headers });
    if (calendars.length === 0) return false;

    const calendar = calendars[0];
    const calendarUrl = calendar.url.endsWith("/") ? calendar.url : `${calendar.url}/`;
    const eventUrl = `${calendarUrl}${uid}.ics`;

    const res = await fetch(eventUrl, { method: "DELETE", headers });
    console.log(`[CalDAV] Event supprime: ${uid} (status ${res.status})`);
    return res.status >= 200 && res.status < 300;
  } catch (error) {
    console.error("[CalDAV] Erreur suppression event:", error);
    return false;
  }
}

function formatICalDateUTC(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Local format for DTSTART/DTEND with TZID: 20260407T140000 */
function formatICalDateLocal(date: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value || "00";
  return `${get("year")}${get("month")}${get("day")}T${get("hour")}${get("minute")}${get("second")}`;
}

function extractVEvent(ical: string): string {
  const match = ical.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/);
  return match ? match[0] : ical;
}

/** Convert a local date/time in a given IANA timezone to UTC */
function tzToUTC(dateStr: string, timeStr: string, tzid: string): Date {
  const utcRef = new Date(`${dateStr}T${timeStr}Z`);
  const inTz = new Intl.DateTimeFormat("en-CA", {
    timeZone: tzid, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(utcRef);
  const get = (t: Intl.DateTimeFormatPartTypes) => inTz.find((p) => p.type === t)?.value || "00";
  const actualLocal = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
  const wantedLocal = `${dateStr}T${timeStr}`;
  const correction = new Date(`${actualLocal}Z`).getTime() - new Date(`${wantedLocal}Z`).getTime();
  return new Date(utcRef.getTime() - correction);
}

function extractICalDate(ical: string, field: string): Date | null {
  const vevent = extractVEvent(ical);
  const regex = new RegExp(`${field}(?:;TZID=([^:;]+))?[^:]*:(\\d{8}(?:T\\d{6}Z?)?)`, "m");
  const match = vevent.match(regex);
  if (!match) return null;

  const tzid = match[1];
  const val = match[2];

  if (val.length === 8) return null; // all-day — skip

  const dateStr = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
  const timeStr = `${val.slice(9, 11)}:${val.slice(11, 13)}:${val.slice(13, 15)}`;

  if (val.endsWith("Z")) return new Date(`${dateStr}T${timeStr}Z`);
  if (tzid) return tzToUTC(dateStr, timeStr, tzid);
  return new Date(`${dateStr}T${timeStr}Z`);
}

function extractICalField(ical: string, field: string): string | null {
  const vevent = extractVEvent(ical);
  const regex = new RegExp(`${field}[^:]*:(.+)`, "m");
  const match = vevent.match(regex);
  return match ? match[1].trim() : null;
}
