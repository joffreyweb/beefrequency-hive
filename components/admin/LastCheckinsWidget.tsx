import Link from "next/link";

interface DailyCheckinLite {
  id: string;
  date: Date;
  updatedAt: Date;
  energyLevel: number | null;
  morningGratitude: string | null;
  morningPhotoPath: string | null;
  freeFeeling: string | null;
  gratitudeMoment: string | null;
  eveningPhotoPath: string | null;
}

interface ClientLite {
  id: string;
  name: string;
  dailyCheckins: DailyCheckinLite[];
}

interface Props {
  clients: ClientLite[];
  staleHours?: number;
}

function relativeLabel(from: Date, now: Date): string {
  const diffMs = now.getTime() - from.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 60) return `il y a ${Math.max(diffMin, 1)} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  return `il y a ${diffD}j`;
}

export default function LastCheckinsWidget({ clients, staleHours = 48 }: Props) {
  const now = new Date();
  const staleCutoff = now.getTime() - staleHours * 3600 * 1000;

  // On trie : clients avec dernier check-in ancien/absent en premier (plus utile côté admin)
  const sorted = [...clients].sort((a, b) => {
    const aTs = a.dailyCheckins[0]?.updatedAt.getTime() ?? 0;
    const bTs = b.dailyCheckins[0]?.updatedAt.getTime() ?? 0;
    return aTs - bTs;
  });

  if (sorted.length === 0) {
    return (
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">Derniers check-ins</h2>
        <p className="text-sm text-brun-mid/60 font-ui italic">Aucun client actif.</p>
      </div>
    );
  }

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">Derniers check-ins</h2>
        <span className="text-[10px] font-ui text-brun-mid/50">{sorted.length} clients actifs</span>
      </div>
      <ul className="space-y-1.5">
        {sorted.map((c) => {
          const last = c.dailyCheckins[0];
          const stale = !last || last.updatedAt.getTime() < staleCutoff;
          const hasMorning = last
            ? last.energyLevel !== null || last.morningGratitude !== null || last.morningPhotoPath !== null
            : false;
          const hasEvening = last
            ? last.freeFeeling !== null || last.gratitudeMoment !== null || last.eveningPhotoPath !== null
            : false;
          return (
            <li key={c.id}>
              <Link
                href={`/admin/clients/${c.id}`}
                className={`flex items-center justify-between gap-3 px-3 py-2 rounded border transition-colors ${
                  stale
                    ? "border-amber-200 bg-amber-50/60 hover:bg-amber-50"
                    : "border-or-pale/40 bg-white hover:bg-or-sacre/5"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-ui text-sm text-brun-chaud truncate">{c.name}</span>
                  {last && (
                    <span className="flex gap-0.5 text-xs shrink-0">
                      {hasMorning && <span title="Matin">🌅</span>}
                      {hasEvening && <span title="Soir">🌙</span>}
                      {(last.morningPhotoPath || last.eveningPhotoPath) && <span title="Photo">📷</span>}
                    </span>
                  )}
                </div>
                <span className={`font-ui text-xs shrink-0 ${stale ? "text-amber-700" : "text-brun-mid/60"}`}>
                  {last ? relativeLabel(last.updatedAt, now) : "aucun"}
                  {stale && last ? " ⚠" : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
