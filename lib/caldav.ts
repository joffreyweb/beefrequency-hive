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

import { createDAVClient, fetchCalendars, fetchCalendarObjects, getBasicAuthHeaders } from "tsdav";
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

function extractICalDate(ical: string, field: string): Date | null {
  // Match DTSTART;VALUE=DATE:20260330 or DTSTART:20260330T090000Z or DTSTART;TZID=...:20260330T090000
  const regex = new RegExp(`${field}[^:]*:([\\dT]+Z?)`, "m");
  const match = ical.match(regex);
  if (!match) return null;

  const val = match[1];
  if (val.length === 8) {
    // Date only: YYYYMMDD
    return new Date(`${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}T00:00:00`);
  }
  // DateTime: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  const iso = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}T${val.slice(9, 11)}:${val.slice(11, 13)}:${val.slice(13, 15)}${val.endsWith("Z") ? "Z" : ""}`;
  return new Date(iso);
}

function extractICalField(ical: string, field: string): string | null {
  const regex = new RegExp(`${field}[^:]*:(.+)`, "m");
  const match = ical.match(regex);
  return match ? match[1].trim() : null;
}
