/**
 * iCloud CalDAV — lecture seule des creneaux occupes
 *
 * Variables .env:
 * - CALDAV_URL (ex: https://caldav.icloud.com/)
 * - CALDAV_USERNAME (Apple ID email)
 * - CALDAV_APP_PASSWORD (mot de passe app genere dans appleid.apple.com)
 */

import { createDAVClient, DAVCalendar } from "tsdav";

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
          // Parse basique du VEVENT
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
  } catch (error) {
    console.error("[CalDAV] Erreur connexion:", error);
    return [];
  }
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
