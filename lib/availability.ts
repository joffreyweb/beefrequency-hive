/**
 * Calcul des creneaux disponibles
 * Combine: plages admin (9h-18h) - creneaux iCloud - RDV en DB
 */

import { getBusySlots } from "./caldav";
import { prisma } from "./prisma";

const WORK_START_HOUR = 9;
const WORK_END_HOUR = 21;

export interface AvailableSlot {
  start: Date;
  available: boolean;
  busyCaldav?: boolean; // occupied by external CalDAV event (iPhone), not blocking
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
  const dayStart = new Date(date);
  dayStart.setHours(WORK_START_HOUR, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(WORK_END_HOUR, 0, 0, 0);

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
    const isCaldavBusy = caldavRanges.some(
      (busy) => slotStart < busy.end && slotEnd > busy.start
    );

    slots.push({
      start: new Date(slotStart),
      available: !isDbBusy,
      busyCaldav: isCaldavBusy,
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

    const key = date.toISOString().split("T")[0];
    result[key] = await getAvailableSlots(date, slotDurationMin);
  }

  return result;
}
