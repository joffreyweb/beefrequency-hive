import { prisma } from "@/lib/prisma";

// ═══════════════════════════════════════
// POSTE DE PILOTAGE — « Ma Journée »
// Agrégat unique du plan du jour, partagé par la page /admin/journee,
// la route GET /api/admin/journee et le cron brief matinal.
// Tout est calé sur le fuseau Europe/Brussels (souverain, interne).
// ═══════════════════════════════════════

const TZ = "Europe/Brussels";

// Décalage (ms) du fuseau TZ pour un instant donné.
function tzOffsetMs(date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date).reduce<Record<string, string>>((a, p) => {
    a[p.type] = p.value;
    return a;
  }, {});
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === "24" ? "0" : parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUTC - date.getTime();
}

// Date locale (YYYY-MM-DD) à Bruxelles pour un instant donné.
function isoDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// Bornes UTC du jour local Bruxelles (00:00:00.000 → 23:59:59.999).
export function brusselsDayBounds(now: Date = new Date()): {
  start: Date;
  end: Date;
  iso: string;
  label: string;
} {
  const iso = isoDate(now);
  const [y, m, d] = iso.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, 0, 0, 0, 0);
  const offset = tzOffsetMs(new Date(guess));
  const start = new Date(guess - offset);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  const label = new Intl.DateTimeFormat("fr-FR", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
  return { start, end, iso, label };
}

// Heure locale Bruxelles (0-23) + date iso — utilisé par le cron brief.
export function brusselsNow(now: Date = new Date()): { iso: string; hour: number } {
  const hourStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    hour12: false,
  }).format(now);
  return { iso: isoDate(now), hour: Number(hourStr === "24" ? "0" : hourStr) };
}

export interface TaskLite {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  priority: number | null;
  dueDate: string | null;
  order: number;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
  projectColor: string | null;
}

export interface ApptLite {
  id: string;
  title: string;
  scheduledAt: string;
  timeLabel: string;
  durationMin: number;
  meetingType: string;
  clientName: string | null;
  zoomLink: string | null;
}

export interface PostLite {
  id: string;
  title: string;
  caption: string | null;
  hashtags: string | null;
  format: string | null;
  pinned: boolean;
  order: number;
}

export interface MsgLite {
  id: string;
  content: string;
  senderName: string;
  createdAt: string;
}

export interface PendingLite {
  id: string;
  title: string;
  description: string | null;
  urgency: string;
  clientName: string | null;
}

export interface DayPlan {
  iso: string;
  dateLabel: string;
  focus: TaskLite[];
  week: TaskLite[];
  inbox: TaskLite[];
  appointments: ApptLite[];
  nextPost: PostLite | null;
  postsRemaining: number;
  messages: MsgLite[];
  pendingActions: PendingLite[];
}

type TaskRow = {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  priority: number | null;
  dueDate: Date | null;
  order: number;
  client: { user: { name: string } } | null;
  project: { name: string; color: string } | null;
  projectId: string | null;
};

const taskInclude = {
  client: { include: { user: { select: { name: true } } } },
  project: { select: { name: true, color: true } },
} as const;

function mapTask(t: TaskRow): TaskLite {
  return {
    id: t.id,
    title: t.title,
    notes: t.notes,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    order: t.order,
    clientName: t.client?.user?.name ?? null,
    projectId: t.projectId,
    projectName: t.project?.name ?? null,
    projectColor: t.project?.color ?? null,
  };
}

// Plan du jour complet — une seule source pour l'écran, l'API et le brief.
export async function getDayPlan(now: Date = new Date()): Promise<DayPlan> {
  const { start, end, iso, label } = brusselsDayBounds(now);

  const [focusRaw, weekRaw, inboxRaw, apptRaw, personalRaw, nextPostRaw, postsRemaining, messagesRaw, pendingRaw] =
    await Promise.all([
      prisma.task.findMany({
        where: { status: "TODAY" },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: taskInclude,
      }),
      prisma.task.findMany({
        where: { status: "WEEK" },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: taskInclude,
      }),
      prisma.task.findMany({
        where: { status: "INBOX" },
        orderBy: [{ createdAt: "desc" }],
        include: taskInclude,
      }),
      prisma.appointment.findMany({
        where: { scheduledAt: { gte: start, lte: end }, status: { not: "CANCELLED" } },
        orderBy: { scheduledAt: "asc" },
        include: { client: { include: { user: { select: { name: true } } } } },
      }),
      prisma.personalEvent.findMany({
        where: { scheduledAt: { gte: start, lte: end } },
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.contentPost.findFirst({
        where: { status: "TODO" },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      }),
      prisma.contentPost.count({ where: { status: "TODO" } }),
      prisma.message.findMany({
        where: { readAt: null, receiver: { role: "ADMIN" } },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { sender: { select: { name: true } } },
      }),
      prisma.pendingAction.findMany({
        where: { completedAt: null, urgency: { in: ["red", "amber"] } },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { client: { include: { user: { select: { name: true } } } } },
      }),
    ]);

  const timeFmt = new Intl.DateTimeFormat("fr-FR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });

  const appointments: ApptLite[] = apptRaw.map((a) => ({
    id: a.id,
    title: a.title,
    scheduledAt: a.scheduledAt.toISOString(),
    timeLabel: timeFmt.format(a.scheduledAt),
    durationMin: a.durationMin,
    meetingType: a.meetingType,
    clientName: a.client?.user?.name ?? null,
    zoomLink: a.zoomStartUrl ?? a.zoomJoinUrl ?? null,
  }));

  const personal: ApptLite[] = personalRaw.map((e) => ({
    id: e.id,
    title: e.title,
    scheduledAt: e.scheduledAt.toISOString(),
    timeLabel: timeFmt.format(e.scheduledAt),
    durationMin: e.durationMin,
    meetingType: "perso",
    clientName: null,
  }));
  const agenda: ApptLite[] = [...appointments, ...personal].sort((a, b) =>
    a.scheduledAt.localeCompare(b.scheduledAt),
  );

  const nextPost: PostLite | null = nextPostRaw
    ? {
        id: nextPostRaw.id,
        title: nextPostRaw.title,
        caption: nextPostRaw.caption,
        hashtags: nextPostRaw.hashtags,
        format: nextPostRaw.format,
        pinned: nextPostRaw.pinned,
        order: nextPostRaw.order,
      }
    : null;

  const messages: MsgLite[] = messagesRaw.map((m) => ({
    id: m.id,
    content: m.content,
    senderName: m.sender?.name ?? "—",
    createdAt: m.createdAt.toISOString(),
  }));

  const pendingActions: PendingLite[] = pendingRaw.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    urgency: p.urgency,
    clientName: p.client?.user?.name ?? null,
  }));

  return {
    iso,
    dateLabel: label,
    focus: focusRaw.map(mapTask),
    week: weekRaw.map(mapTask),
    inbox: inboxRaw.map(mapTask),
    appointments: agenda,
    nextPost,
    postsRemaining,
    messages,
    pendingActions,
  };
}
