import Link from "next/link";
import { getDayPlan, brusselsDayBounds } from "@/lib/journee";
import { isPushConfigured } from "@/lib/push";
import { prisma } from "@/lib/prisma";

// Écran récap in-app « Le Tableau » — vue d'ensemble type Slack (canaux + tuiles + flux).
// Composant serveur : lit les vraies données à chaque visite. Admin-only (garde layout).
export const dynamic = "force-dynamic";

export default async function TableauPage() {
  const plan = await getDayPlan();
  const { start } = brusselsDayBounds();

  const [weekCount, doneToday, contentTodo, contentPosted, eventsUpcoming, projects, settings] =
    await Promise.all([
      prisma.task.count({ where: { status: "WEEK" } }),
      prisma.task.count({ where: { status: "DONE", doneAt: { gte: start } } }),
      prisma.contentPost.count({ where: { status: "TODO" } }),
      prisma.contentPost.count({ where: { status: "POSTED" } }),
      prisma.personalEvent.count({ where: { scheduledAt: { gte: new Date() } } }),
      prisma.project.findMany({
        where: { status: "ACTIVE" },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: { _count: { select: { tasks: true } } },
      }),
      prisma.adminSettings.findFirst(),
    ]);

  const aRepondre = plan.messages.length + plan.pendingActions.length;

  const systems = [
    { label: "Brief matinal", on: settings?.briefPushEnabled || settings?.briefEmailEnabled, detail: settings ? `${settings.briefHour}h` : "—" },
    { label: "Rappel du soir", on: settings?.shutdownEnabled ?? false, detail: settings ? `${settings.shutdownHour}h` : "—" },
    { label: "Push app", on: isPushConfigured(), detail: isPushConfigured() ? "configuré" : "off" },
    { label: "Email (SMTP)", on: settings?.briefEmailEnabled ?? false, detail: settings?.briefEmail ? "actif" : "à régler" },
  ];

  const tiles = [
    { label: "Focus du jour", n: plan.focus.length, href: "/admin/journee", accent: "#B8821E" },
    { label: "Inbox à trier", n: plan.inbox.length, href: "/admin/journee", accent: "#6B4423" },
    { label: "RDV du jour", n: plan.appointments.length, href: "/admin/journee", accent: "#4A5E44" },
    { label: "Posts à faire", n: contentTodo, href: "/admin/contenu", accent: "#B8821E" },
    { label: "Projets actifs", n: projects.length, href: "/admin/projets", accent: "#7A5514" },
    { label: "À répondre", n: aRepondre, href: "/admin/journee", accent: "#b45" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <p className="font-caps text-[11px] tracking-[0.2em] uppercase text-or-sacre">Vue d&apos;ensemble</p>
        <h1 className="font-display text-3xl text-brun-chaud capitalize mt-0.5">Le Tableau</h1>
        <p className="font-ui text-sm text-brun-mid/70 mt-1">{plan.dateLabel} — tout ton pilotage en un regard.</p>
      </div>

      {/* # systèmes */}
      <Channel title="systèmes">
        <div className="flex flex-wrap gap-2">
          {systems.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-2 bg-creme-sacree border border-or-pale rounded-full px-3 py-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.on ? "#4A5E44" : "#c9bfa8" }} />
              <span className="font-ui text-[13px] text-brun-chaud">{s.label}</span>
              <span className="font-ui text-[11px] text-brun-mid/50">{s.detail}</span>
            </span>
          ))}
        </div>
      </Channel>

      {/* Tuiles de stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="bg-cire-chaude border border-or-pale rounded-[12px] p-4 hover:border-or-sacre transition-colors">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl" style={{ color: t.accent }}>{t.n}</span>
            </div>
            <p className="font-ui text-[12px] text-brun-mid/70 mt-1">{t.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        {/* # aujourd'hui */}
        <Channel title="aujourd'hui">
          {plan.focus.length === 0 && !plan.nextPost && plan.appointments.length === 0 ? (
            <p className="font-ui text-sm text-brun-mid/50">Journée vierge. Choisis ton premier pas dans Ma Journée.</p>
          ) : (
            <ul className="space-y-2">
              {plan.appointments.map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-sm">
                  <span className="font-caps text-or-sacre w-12 shrink-0">{a.timeLabel}</span>
                  <span className="font-ui text-brun-chaud truncate">{a.clientName ?? a.title}</span>
                  {a.meetingType === "perso" && <span className="text-[10px] text-brun-mid/40">perso</span>}
                </li>
              ))}
              {plan.focus.map((f) => (
                <li key={f.id} className="flex items-center gap-2 text-sm">
                  <span className="text-or-sacre">◦</span>
                  <span className="font-ui text-brun-chaud truncate">{f.title}</span>
                </li>
              ))}
              {plan.nextPost && (
                <li className="flex items-center gap-2 text-sm">
                  <span>📸</span>
                  <span className="font-ui text-brun-chaud truncate">Prochain post : {plan.nextPost.title}</span>
                </li>
              )}
            </ul>
          )}
        </Channel>

        {/* # projets */}
        <Channel title="projets actifs">
          {projects.length === 0 ? (
            <p className="font-ui text-sm text-brun-mid/50">Aucun projet actif.</p>
          ) : (
            <ul className="space-y-2.5">
              {projects.map((p) => (
                <li key={p.id} className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="font-ui text-sm text-brun-chaud flex-1 min-w-0 truncate">{p.name}</span>
                  <span className="font-ui text-[11px] text-or-sacre bg-or-sacre/10 px-2 py-0.5 rounded-full">{p._count.tasks}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/projets" className="inline-block mt-3 font-ui text-[12px] text-brun-mid/60 hover:text-or-sacre">Ouvrir le pipeline →</Link>
        </Channel>
      </div>

      {/* Bandeau contenu + semaine */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <MiniStat label="Cette semaine" n={weekCount} />
        <MiniStat label="Fait aujourd'hui" n={doneToday} tone="foret" />
        <MiniStat label="Posts publiés" n={contentPosted} tone="foret" />
        <MiniStat label="Blocs à venir" n={eventsUpcoming} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/journee" className="px-5 py-2.5 font-caps text-sm bg-or-sacre text-white rounded-[10px] hover:bg-ambre-profond">Ouvrir Ma Journée</Link>
        <Link href="/admin/depot" className="px-5 py-2.5 font-caps text-sm bg-or-sacre/10 text-or-sacre rounded-[10px] hover:bg-or-sacre/20">Déposer un programme</Link>
      </div>
    </div>
  );
}

function Channel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-cire-chaude border border-or-pale rounded-[12px] p-5">
      <h2 className="font-caps text-sm text-brun-mid tracking-wider mb-3">
        <span className="text-or-sacre/60">#</span> {title}
      </h2>
      {children}
    </section>
  );
}

function MiniStat({ label, n, tone }: { label: string; n: number; tone?: "foret" }) {
  return (
    <div className="bg-creme-sacree border border-or-pale rounded-[10px] p-3 text-center">
      <p className="font-display text-2xl" style={{ color: tone === "foret" ? "#4A5E44" : "#2C1A0E" }}>{n}</p>
      <p className="font-ui text-[11px] text-brun-mid/60 mt-0.5">{label}</p>
    </div>
  );
}
