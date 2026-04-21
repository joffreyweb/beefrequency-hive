import { prisma } from "@/lib/prisma";

export interface ParcoursJournalEntry {
  id: string;
  createdAt: string;
  content: string;
  mood: string | null;
  entryType: string;
  mediaUrl: string | null;
  isPrivate: boolean;
}

export interface ParcoursCheckin {
  id: string;
  hasMorning: boolean;
  hasEvening: boolean;
  morning: {
    energyLevel: number | null;
    sleepQuality: number | null;
    sleepType: string | null;
    dreamed: string | null;
    dreamNotes: string | null;
    morningGratitude: string | null;
  };
  evening: {
    freeFeeling: string | null;
    pride1: string | null;
    pride2: string | null;
    pride3: string | null;
    gratitudeMoment: string | null;
    gratitudeSensation: string | null;
    gratitudeRecu: string | null;
    gratitudeSoi: string | null;
    selfQuality: string | null;
    closingSentence: string | null;
    elixirTaken: boolean;
  };
}

export interface ParcoursDay {
  dateKey: string;
  checkin: ParcoursCheckin | null;
  journal: ParcoursJournalEntry[];
}

const PARIS_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dateKeyParis(d: Date): string {
  return PARIS_DATE_FORMATTER.format(d);
}

function dateOnlyKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getClientParcoursData(userId: string): Promise<ParcoursDay[] | null> {
  const client = await prisma.client.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!client) return null;

  const [checkins, journal] = await Promise.all([
    prisma.dailyCheckin.findMany({
      where: { clientId: client.id },
      orderBy: { date: "desc" },
    }),
    prisma.journalEntry.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const byDate = new Map<string, ParcoursDay>();

  for (const c of checkins) {
    const key = dateOnlyKey(c.date);
    const hasMorning =
      c.energyLevel !== null ||
      c.sleepQuality !== null ||
      c.sleepType !== null ||
      c.dreamed !== null ||
      c.dreamNotes !== null ||
      c.morningGratitude !== null;
    const hasEvening =
      c.freeFeeling !== null ||
      c.pride1 !== null ||
      c.pride2 !== null ||
      c.pride3 !== null ||
      c.gratitudeMoment !== null ||
      c.gratitudeSensation !== null ||
      c.gratitudeRecu !== null ||
      c.gratitudeSoi !== null ||
      c.selfQuality !== null ||
      c.closingSentence !== null;

    byDate.set(key, {
      dateKey: key,
      checkin: {
        id: c.id,
        hasMorning,
        hasEvening,
        morning: {
          energyLevel: c.energyLevel,
          sleepQuality: c.sleepQuality,
          sleepType: c.sleepType,
          dreamed: c.dreamed,
          dreamNotes: c.dreamNotes,
          morningGratitude: c.morningGratitude,
        },
        evening: {
          freeFeeling: c.freeFeeling,
          pride1: c.pride1,
          pride2: c.pride2,
          pride3: c.pride3,
          gratitudeMoment: c.gratitudeMoment,
          gratitudeSensation: c.gratitudeSensation,
          gratitudeRecu: c.gratitudeRecu,
          gratitudeSoi: c.gratitudeSoi,
          selfQuality: c.selfQuality,
          closingSentence: c.closingSentence,
          elixirTaken: c.elixirTaken,
        },
      },
      journal: [],
    });
  }

  for (const j of journal) {
    const key = dateKeyParis(j.createdAt);
    let day = byDate.get(key);
    if (!day) {
      day = { dateKey: key, checkin: null, journal: [] };
      byDate.set(key, day);
    }
    day.journal.push({
      id: j.id,
      createdAt: j.createdAt.toISOString(),
      content: j.content,
      mood: j.mood,
      entryType: j.entryType,
      mediaUrl: j.mediaUrl,
      isPrivate: j.isPrivate,
    });
  }

  return Array.from(byDate.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}
