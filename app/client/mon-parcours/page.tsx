import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientParcoursData } from "@/lib/parcours-client";
import type { Lang } from "@/lib/translations";

type Label = { EN: string; FR: string };

export default async function MonParcoursPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: { language: true },
  });
  const lang = (client?.language === "EN" ? "EN" : "FR") as Lang;
  const T = (k: Label) => k[lang];

  const days = (await getClientParcoursData(session.userId)) ?? [];

  const locale = lang === "FR" ? "fr-FR" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Paris",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-creme-sacree py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <Link href="/client/home" className="font-ui text-xs text-brun-mid underline">
            {T({ EN: "← Back", FR: "← Retour" })}
          </Link>
          <h1 className="font-display text-3xl text-brun-chaud mt-4">
            {T({ EN: "My Journey", FR: "Mon Parcours" })}
          </h1>
          <p className="font-ui text-sm text-brun-mid mt-2">
            {T({
              EN: "Your past check-ins and journal entries. Read-only.",
              FR: "Tes check-ins et entrées de journal passés. Lecture seule.",
            })}
          </p>
        </header>

        {days.length === 0 ? (
          <p className="font-ui text-sm text-brun-mid/60 italic">
            {T({ EN: "No entries yet.", FR: "Aucune entrée pour l'instant." })}
          </p>
        ) : (
          <ul className="space-y-2">
            {days.map((day) => {
              const asDate = new Date(day.dateKey + "T12:00:00Z");
              const dateLabel = dateFmt.format(asDate);
              const hasMorning = day.checkin?.hasMorning ?? false;
              const hasEvening = day.checkin?.hasEvening ?? false;
              const hasJournal = day.journal.length > 0;
              const prides = day.checkin
                ? [day.checkin.evening.pride1, day.checkin.evening.pride2, day.checkin.evening.pride3].filter(
                    (p): p is string => Boolean(p),
                  )
                : [];

              return (
                <li key={day.dateKey} className="border border-or-pale/50 rounded-sm bg-white">
                  <details>
                    <summary className="px-4 py-3 cursor-pointer flex items-center justify-between gap-3 list-none">
                      <span className="font-ui text-sm text-brun-chaud">{dateLabel}</span>
                      <span className="flex gap-1 text-base">
                        {hasMorning && <span aria-label={T({ EN: "Morning", FR: "Matin" })}>{"\u{1F305}"}</span>}
                        {hasEvening && <span aria-label={T({ EN: "Evening", FR: "Soir" })}>{"\u{1F319}"}</span>}
                        {hasJournal && <span aria-label={T({ EN: "Journal", FR: "Journal" })}>{"\u{1F4D3}"}</span>}
                      </span>
                    </summary>

                    <div className="px-4 pb-4 pt-2 space-y-5 border-t border-or-pale/30">
                      {hasMorning && day.checkin && (
                        <section>
                          <h3 className="font-ui text-xs uppercase tracking-wider text-or-sacre mb-2">
                            {T({ EN: "Morning", FR: "Matin" })}
                          </h3>
                          <div className="space-y-1 text-sm text-brun-chaud">
                            {day.checkin.morning.energyLevel !== null && (
                              <p>
                                <span className="text-brun-mid">{T({ EN: "Energy", FR: "Énergie" })} :</span>{" "}
                                {day.checkin.morning.energyLevel}/10
                              </p>
                            )}
                            {day.checkin.morning.sleepQuality !== null && (
                              <p>
                                <span className="text-brun-mid">{T({ EN: "Sleep quality", FR: "Qualité sommeil" })} :</span>{" "}
                                {day.checkin.morning.sleepQuality}/10
                              </p>
                            )}
                            {day.checkin.morning.sleepType && (
                              <p>
                                <span className="text-brun-mid">{T({ EN: "Sleep type", FR: "Type de sommeil" })} :</span>{" "}
                                {day.checkin.morning.sleepType}
                              </p>
                            )}
                            {day.checkin.morning.dreamed && (
                              <p>
                                <span className="text-brun-mid">{T({ EN: "Dreams", FR: "Rêves" })} :</span>{" "}
                                {day.checkin.morning.dreamed}
                              </p>
                            )}
                            {day.checkin.morning.dreamNotes && (
                              <p className="italic">{day.checkin.morning.dreamNotes}</p>
                            )}
                            {day.checkin.morning.morningGratitude && (
                              <p>
                                <span className="text-brun-mid">
                                  {T({ EN: "Morning gratitude", FR: "Gratitude matin" })} :
                                </span>{" "}
                                {day.checkin.morning.morningGratitude}
                              </p>
                            )}
                          </div>
                        </section>
                      )}

                      {hasEvening && day.checkin && (
                        <section>
                          <h3 className="font-ui text-xs uppercase tracking-wider text-or-sacre mb-2">
                            {T({ EN: "Evening", FR: "Soir" })}
                          </h3>
                          <div className="space-y-1 text-sm text-brun-chaud">
                            {day.checkin.evening.freeFeeling && (
                              <p>
                                <span className="text-brun-mid">{T({ EN: "How I feel", FR: "Comment je me sens" })} :</span>{" "}
                                {day.checkin.evening.freeFeeling}
                              </p>
                            )}
                            {prides.length > 0 && (
                              <div>
                                <p className="text-brun-mid">{T({ EN: "Proud of", FR: "Fier de" })} :</p>
                                <ul className="list-disc list-inside ml-2">
                                  {prides.map((p, i) => (
                                    <li key={i}>{p}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {day.checkin.evening.gratitudeMoment && (
                              <p>
                                <span className="text-brun-mid">
                                  {T({ EN: "Grateful moment", FR: "Moment de gratitude" })} :
                                </span>{" "}
                                {day.checkin.evening.gratitudeMoment}
                              </p>
                            )}
                            {day.checkin.evening.gratitudeSensation && (
                              <p>
                                <span className="text-brun-mid">{T({ EN: "Sensation", FR: "Sensation" })} :</span>{" "}
                                {day.checkin.evening.gratitudeSensation}
                              </p>
                            )}
                            {day.checkin.evening.gratitudeRecu && (
                              <p>
                                <span className="text-brun-mid">{T({ EN: "Received", FR: "Reçu" })} :</span>{" "}
                                {day.checkin.evening.gratitudeRecu}
                              </p>
                            )}
                            {day.checkin.evening.gratitudeSoi && (
                              <p>
                                <span className="text-brun-mid">{T({ EN: "Self", FR: "Soi" })} :</span>{" "}
                                {day.checkin.evening.gratitudeSoi}
                              </p>
                            )}
                            {day.checkin.evening.selfQuality && (
                              <p>
                                <span className="text-brun-mid">
                                  {T({ EN: "Self-quality", FR: "Qualité de soi" })} :
                                </span>{" "}
                                {day.checkin.evening.selfQuality}
                              </p>
                            )}
                            {day.checkin.evening.closingSentence && (
                              <p className="italic">{day.checkin.evening.closingSentence}</p>
                            )}
                            {day.checkin.evening.elixirTaken && (
                              <p className="text-foret text-xs">
                                {"✓ "}
                                {T({ EN: "Elixir taken", FR: "Élixir pris" })}
                              </p>
                            )}
                          </div>
                        </section>
                      )}

                      {hasJournal && (
                        <section>
                          <h3 className="font-ui text-xs uppercase tracking-wider text-or-sacre mb-2">
                            {T({ EN: "Journal", FR: "Journal" })}
                          </h3>
                          <div className="space-y-3">
                            {day.journal.map((j) => (
                              <div key={j.id} className="border-l-2 border-or-pale/50 pl-3">
                                <p className="text-xs text-brun-mid mb-1 flex items-center gap-2">
                                  <span>{timeFmt.format(new Date(j.createdAt))}</span>
                                  {j.mood && <span>· {j.mood}</span>}
                                  {j.isPrivate && (
                                    <span
                                      className="italic"
                                      title={T({
                                        EN: "Private entry (visible to you only)",
                                        FR: "Entrée privée (visible uniquement par toi)",
                                      })}
                                    >
                                      {"\u{1F512} "}
                                      {T({ EN: "private", FR: "privée" })}
                                    </span>
                                  )}
                                </p>
                                <p
                                  className={`text-sm text-brun-chaud whitespace-pre-wrap ${
                                    j.isPrivate ? "italic" : ""
                                  }`}
                                >
                                  {j.content}
                                </p>
                                {j.mediaUrl && j.entryType === "photo" && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={j.mediaUrl} alt="" className="mt-2 max-w-full rounded-sm" />
                                )}
                                {j.mediaUrl && j.entryType === "audio" && (
                                  <audio controls src={j.mediaUrl} className="mt-2 w-full" />
                                )}
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
