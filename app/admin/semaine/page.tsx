import Link from "next/link";
import { brusselsDayBounds } from "@/lib/journee";
import { prisma } from "@/lib/prisma";

// Vue Semaine — 7 jours glissants (aujourd'hui en tête, détaillé = jour complet).
// RDV clients + blocs perso + tâches à échéance, par jour. Composant serveur. Admin-only.
export const dynamic = "force-dynamic";

const TZ = "Europe/Brussels";

interface DayItem {
  kind: "rdv" | "bloc" | "tache";
  time: string | null;
  title: string;
  sub?: string | null;
  sortAt: number;
}

export default async function SemainePage() {
  const baseMs = Date.now();
  const days = Array.from({ length: 7 }, (_, i) => brusselsDayBounds(new Date(baseMs + i * 86400000)));
  const rangeStart = days[0].start;
  const rangeEnd = days[6].end;

  const [appts, events, dueTasks] = await Promise.all([
    prisma.appointment.findMany({
      where: { scheduledAt: { gte: rangeStart, lte: rangeEnd }, status: { not: "CANCELLED" } },
      orderBy: { scheduledAt: "asc" },
      include: { client: { include: { user: { select: { name: true } } } } },
    }),
    prisma.personalEvent.findMany({
      where: { scheduledAt: { gte: rangeStart, lte: rangeEnd } },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.task.findMany({
      where: { dueDate: { gte: rangeStart, lte: rangeEnd }, status: { not: "DONE" } },
      orderBy: { dueDate: "asc" },
      include: { project: { select: { name: true, color: true } } },
    }),
  ]);

  const timeFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });

  function itemsForDay(start: Date, end: Date): DayItem[] {
    const s = start.getTime();
    const e = end.getTime();
    const out: DayItem[] = [];
    for (const a of appts) {
      const t = a.scheduledAt.getTime();
      if (t >= s && t <= e)
        out.push({ kind: "rdv", time: timeFmt.format(a.scheduledAt), title: a.client?.user?.name ?? a.title, sub: `${a.durationMin} min`, sortAt: t });
    }
    for (const ev of events) {
      const t = ev.scheduledAt.getTime();
      if (t >= s && t <= e)
        out.push({ kind: "bloc", time: timeFmt.format(ev.scheduledAt), title: ev.title, sub: "perso", sortAt: t });
    }
    for (const tk of dueTasks) {
      if (!tk.dueDate) continue;
      const t = tk.dueDate.getTime();
      if (t >= s && t <= e)
        out.push({ kind: "tache", time: null, title: tk.title, sub: tk.project?.name ?? null, sortAt: t });
    }
    return out.sort((a, b) => a.sortAt - b.sortAt);
  }

  const dow = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, weekday: "long" });
  const dayNum = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, day: "numeric", month: "short" });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <p className="font-caps text-[11px] tracking-[0.2em] uppercase text-or-sacre">Vue Semaine</p>
        <h1 className="font-display text-3xl text-brun-chaud mt-0.5">7 jours devant toi</h1>
        <p className="font-ui text-sm text-brun-mid/70 mt-1">Aujourd&apos;hui en tête. RDV clients, blocs perso et tâches à échéance, jour par jour.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {days.map((d, i) => {
          const items = itemsForDay(d.start, d.end);
          const today = i === 0;
          return (
            <Link key={d.iso} href={`/admin/blocs?date=${d.iso}`} className={`block rounded-[12px] p-4 border transition-colors hover:border-or-sacre ${today ? "bg-or-sacre/8 border-or-sacre/40 lg:col-span-2" : "bg-cire-chaude border-or-pale"}`}>
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <p className="font-display text-lg text-brun-chaud capitalize leading-none">
                    {today ? "Aujourd'hui" : dow.format(d.start)}
                  </p>
                  <p className="font-ui text-[11px] text-brun-mid/55 capitalize mt-0.5">{dayNum.format(d.start)}</p>
                </div>
                {items.length > 0 && <span className="font-ui text-[11px] text-or-sacre bg-or-sacre/10 px-2 py-0.5 rounded-full">{items.length}</span>}
              </div>
              {items.length === 0 ? (
                <p className="font-ui text-[13px] text-brun-mid/40">—</p>
              ) : (
                <ul className="space-y-1.5">
                  {items.map((it, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[13px] shrink-0 mt-[1px]">
                        {it.kind === "rdv" ? "👤" : it.kind === "bloc" ? "🕯️" : "◦"}
                      </span>
                      <div className="min-w-0">
                        <p className="font-ui text-[13px] text-brun-chaud leading-snug">
                          {it.time && <span className="text-or-sacre font-caps mr-1">{it.time}</span>}
                          {it.title}
                        </p>
                        {it.sub && <p className="font-ui text-[10px] text-brun-mid/45">{it.sub}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 pt-2 border-t border-or-pale/30 text-[11px] font-ui text-or-sacre/70">+ Ajouter un bloc sur ce jour →</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/journee" className="px-5 py-2.5 font-caps text-sm bg-or-sacre text-white rounded-[10px] hover:bg-ambre-profond">Ma Journée</Link>
        <Link href="/admin/tableau" className="px-5 py-2.5 font-caps text-sm bg-or-sacre/10 text-or-sacre rounded-[10px] hover:bg-or-sacre/20">Le Tableau</Link>
        <Link href="/admin/blocs" className="px-5 py-2.5 font-caps text-sm bg-or-pale/40 text-brun-mid rounded-[10px] hover:bg-or-pale/70">+ Bloc perso</Link>
      </div>
    </div>
  );
}
