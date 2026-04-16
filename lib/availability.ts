/**
 * Calcul des creneaux disponibles
 * Combine: plages admin (9h-18h) - creneaux iCloud - RDV en DB
 */

import { getBusySlots } from "./caldav";
import { prisma } from "./prisma";

const WORK_START_HOUR = 6;
const WORK_END_HOUR = 23;
const TZ = "Europe/Brussels";

/** Create a Date for a given hour in Europe/Brussels on the same calendar day */
function brusselsHour(date: Date, hour: number): Date {
  // Get the calendar date in Brussels
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value || "00";
  const dateStr = `${get("year")}-${get("month")}-${get("day")}`;
  // Build a date string with the target hour, then find the UTC equivalent
  // Using Intl to get the offset for that specific moment
  const target = new Date(`${dateStr}T${String(hour).padStart(2, "0")}:00:00`);
  const utcStr = target.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = target.toLocaleString("en-US", { timeZone: TZ });
  const diff = new Date(utcStr).getTime() - new Date(tzStr).getTime();
  return new Date(target.getTime() + diff);
}

export interface AvailableSlot {
  start: Date;
  available: boolean;
  busyCaldav?: boolean;
  caldavSummary?: string;
}

/**
 * Retourne les creneaux disponibles pour une date donnee
 * @param date — jour a verifier
 * @param slotDurationMin — duree d'un creneau en minutes (defaut 60)
 */
export async function getAvailableSlots(
  date: Date,
  slotDurationMin: number = 60
): Promise<AvailableSlot[]> {
  const dayStart = brusselsHour(date, WORK_START_HOUR);
  const dayEnd = brusselsHour(date, WORK_END_HOUR);

  // 1. Creneaux CalDAV occupes
  const caldavBusy = await getBusySlots(dayStart, dayEnd);

  // 2. RDV en DB pour ce jour
  const dbAppointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: dayStart, lt: dayEnd },
      status: { not: "CANCELLED" },
    },
    select: { scheduledAt: true, durationMin: true },
  });

  // Plages occupees par des RDV Hive (bloquent la creation)
  const dbBusyRanges = dbAppointments.map((a) => ({
    start: new Date(a.scheduledAt).getTime(),
    end: new Date(a.scheduledAt).getTime() + a.durationMin * 60000,
  }));

  // Plages CalDAV externes (iPhone) — informatif, ne bloquent pas
  const caldavRanges = caldavBusy.map((s) => ({
    start: s.start.getTime(),
    end: s.end.getTime(),
    summary: s.summary,
  }));

  // Generer tous les creneaux possibles
  const slots: AvailableSlot[] = [];
  let current = dayStart.getTime();
  const slotMs = slotDurationMin * 60000;

  while (current + slotMs <= dayEnd.getTime()) {
    const slotStart = current;
    const slotEnd = current + slotMs;

    const isDbBusy = dbBusyRanges.some(
      (busy) => slotStart < busy.end && slotEnd > busy.start
    );
    const caldavMatch = caldavRanges.find(
      (busy) => slotStart < busy.end && slotEnd > busy.start
    );

    slots.push({
      start: new Date(slotStart),
      available: !isDbBusy,
      busyCaldav: !!caldavMatch,
      caldavSummary: caldavMatch?.summary,
    });

    current += slotMs;
  }

  return slots;
}

/**
 * Retourne les creneaux disponibles pour les N prochains jours
 */
export async function getAvailableSlotsRange(
  startDate: Date,
  days: number,
  slotDurationMin: number = 60
): Promise<Record<string, AvailableSlot[]>> {
  const result: Record<string, AvailableSlot[]> = {};

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
    const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value || "";
    const key = `${get("year")}-${get("month")}-${get("day")}`;
    result[key] = await getAvailableSlots(date, slotDurationMin);
  }

  return result;
}
