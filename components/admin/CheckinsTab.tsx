"use client";

import { useCallback, useEffect, useState } from "react";

interface CheckinRow {
  id: string;
  date: string;
  energyLevel: number | null;
  sleepQuality: number | null;
  sleepType: string | null;
  dreamed: string | null;
  dreamNotes: string | null;
  morningGratitude: string | null;
  morningPhotoPath: string | null;
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
  eveningPhotoPath: string | null;
}

interface Props {
  clientId: string;
  onGoToParcours?: () => void;
}

const PAGE_SIZE = 30;

function hasMorning(c: CheckinRow): boolean {
  return (
    c.energyLevel !== null ||
    c.sleepQuality !== null ||
    c.sleepType !== null ||
    c.dreamed !== null ||
    c.dreamNotes !== null ||
    c.morningGratitude !== null ||
    c.morningPhotoPath !== null
  );
}

function hasEvening(c: CheckinRow): boolean {
  return (
    c.freeFeeling !== null ||
    c.pride1 !== null ||
    c.pride2 !== null ||
    c.pride3 !== null ||
    c.gratitudeMoment !== null ||
    c.gratitudeSensation !== null ||
    c.gratitudeRecu !== null ||
    c.gratitudeSoi !== null ||
    c.selfQuality !== null ||
    c.closingSentence !== null ||
    c.eveningPhotoPath !== null
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CheckinsTab({ clientId, onGoToParcours }: Props) {
  const [rows, setRows] = useState<CheckinRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPage = useCallback(
    async (nextOffset: number, append: boolean) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/admin/daily-checkins?clientId=${encodeURIComponent(clientId)}&limit=${PAGE_SIZE}&offset=${nextOffset}`,
        );
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        setTotal(data.total ?? 0);
        setRows((prev) => (append ? [...prev, ...(data.checkins ?? [])] : data.checkins ?? []));
        setOffset(nextOffset);
      } catch (e) {
        setError("Erreur de chargement");
      } finally {
        setLoading(false);
      }
    },
    [clientId],
  );

  useEffect(() => {
    loadPage(0, false);
  }, [loadPage]);

  const hasMore = rows.length < total;

  return (
    <div className="space-y-5">
      {/* En-tête discoverability */}
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-4 flex items-center justify-between">
        <div>
          <p className="font-caps text-sm text-brun-mid uppercase tracking-wider">Check-ins</p>
          <p className="font-ui text-xs text-brun-mid/70 mt-1">
            {total} jour{total > 1 ? "s" : ""} avec entrée · du plus récent au plus ancien
          </p>
        </div>
        {onGoToParcours && (
          <button
            type="button"
            onClick={onGoToParcours}
            className="flex items-center gap-1.5 bg-or-sacre/10 text-or-sacre hover:bg-or-sacre/20 px-3 py-1.5 rounded font-ui text-xs transition-colors"
            title="Personnaliser les questions de check-in (onglet Parcours)"
          >
            ✏️ Personnaliser les questions
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm font-ui text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>
      )}

      {rows.length === 0 && !loading && !error && (
        <p className="text-sm text-brun-mid/60 font-ui italic text-center py-10">
          Aucun check-in enregistré pour ce client.
        </p>
      )}

      <div className="space-y-3">
        {rows.map((c) => {
          const m = hasMorning(c);
          const e = hasEvening(c);
          return (
            <div key={c.id} className="border border-or-pale/50 rounded-[10px] bg-white">
              <div className="px-4 py-3 border-b border-or-pale/30 flex items-center justify-between">
                <p className="font-ui text-sm text-brun-chaud capitalize">{formatDate(c.date)}</p>
                <div className="flex gap-1.5 text-sm">
                  {m ? <span title="Matin rempli">🌅</span> : <span className="opacity-30" title="Matin vide">🌅</span>}
                  {e ? <span title="Soir rempli">🌙</span> : <span className="opacity-30" title="Soir vide">🌙</span>}
                  {c.morningPhotoPath && <span title="Photo matin">📷</span>}
                  {c.eveningPhotoPath && <span title="Photo soir">📷</span>}
                </div>
              </div>

              <div className="px-4 py-3 grid md:grid-cols-2 gap-4">
                {/* Matin */}
                <div>
                  <p className="font-caps text-[10px] uppercase tracking-wider text-or-sacre mb-2">🌅 Matin</p>
                  {m ? (
                    <div className="space-y-1 text-xs text-brun-chaud">
                      {c.energyLevel !== null && (
                        <p><span className="text-brun-mid">Énergie :</span> {c.energyLevel}/10</p>
                      )}
                      {c.sleepQuality !== null && (
                        <p><span className="text-brun-mid">Qualité sommeil :</span> {c.sleepQuality}/10</p>
                      )}
                      {c.sleepType && (
                        <p><span className="text-brun-mid">Type :</span> {c.sleepType}</p>
                      )}
                      {c.dreamed && (
                        <p><span className="text-brun-mid">Rêves :</span> {c.dreamed}</p>
                      )}
                      {c.dreamNotes && <p className="italic text-brun-mid">« {c.dreamNotes} »</p>}
                      {c.morningGratitude && (
                        <p><span className="text-brun-mid">Gratitude :</span> {c.morningGratitude}</p>
                      )}
                      {c.morningPhotoPath && (
                        <a
                          href={`/api/client/uploads/${c.morningPhotoPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/client/uploads/${c.morningPhotoPath}`}
                            alt="Photo matin"
                            className="max-w-[160px] max-h-[160px] rounded border border-or-pale/50 object-cover"
                          />
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs italic text-brun-mid/40">Non rempli</p>
                  )}
                </div>

                {/* Soir */}
                <div>
                  <p className="font-caps text-[10px] uppercase tracking-wider text-or-sacre mb-2">🌙 Soir</p>
                  {e ? (
                    <div className="space-y-1 text-xs text-brun-chaud">
                      {c.freeFeeling && (
                        <p><span className="text-brun-mid">Ressenti :</span> {c.freeFeeling}</p>
                      )}
                      {(c.pride1 || c.pride2 || c.pride3) && (
                        <div>
                          <p className="text-brun-mid">Fiertés :</p>
                          <ul className="list-disc list-inside ml-2">
                            {[c.pride1, c.pride2, c.pride3].filter(Boolean).map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {c.gratitudeMoment && (
                        <p><span className="text-brun-mid">Moment :</span> {c.gratitudeMoment}</p>
                      )}
                      {c.gratitudeSensation && (
                        <p><span className="text-brun-mid">Sensation :</span> {c.gratitudeSensation}</p>
                      )}
                      {c.gratitudeRecu && (
                        <p><span className="text-brun-mid">Reçu :</span> {c.gratitudeRecu}</p>
                      )}
                      {c.gratitudeSoi && (
                        <p><span className="text-brun-mid">Soi :</span> {c.gratitudeSoi}</p>
                      )}
                      {c.selfQuality && (
                        <p><span className="text-brun-mid">Qualité :</span> {c.selfQuality}</p>
                      )}
                      {c.closingSentence && <p className="italic text-brun-mid">« {c.closingSentence} »</p>}
                      <p className={`text-xs ${c.elixirTaken ? "text-foret" : "text-brun-mid/50"}`}>
                        {c.elixirTaken ? "✓ Élixirs pris" : "Élixirs non pris"}
                      </p>
                      {c.eveningPhotoPath && (
                        <a
                          href={`/api/client/uploads/${c.eveningPhotoPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/client/uploads/${c.eveningPhotoPath}`}
                            alt="Photo soir"
                            className="max-w-[160px] max-h-[160px] rounded border border-or-pale/50 object-cover"
                          />
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs italic text-brun-mid/40">Non rempli</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs font-ui text-brun-mid/50">
          {rows.length} / {total}
        </p>
        {hasMore && (
          <button
            type="button"
            onClick={() => loadPage(offset + PAGE_SIZE, true)}
            disabled={loading}
            className="px-4 py-2 border border-or-sacre text-or-sacre hover:bg-or-sacre hover:text-white font-ui text-xs uppercase tracking-wider rounded transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Charger plus"}
          </button>
        )}
      </div>
    </div>
  );
}
