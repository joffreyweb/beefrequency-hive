import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOnboarding } from "@/lib/onboarding-guard";
import Link from "next/link";
import DocumentUploadButton from "@/components/client/DocumentUploadButton";

const sessionTypeLabels: Record<string, string> = {
  ONLINE: "Online",
  PRESENTIAL: "In-person",
  CEREMONY: "Ceremony",
};

export default async function ClientHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await requireOnboarding();

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    include: {
      user: { select: { name: true } },
      intake: { select: { firstName: true } },
      sessions: {
        where: { status: "SCHEDULED", scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: "asc" },
        take: 1,
      },
      clientPractices: {
        where: { isActive: true },
        include: { practice: true },
        take: 1,
      },
      elixirPrescriptions: {
        where: { endDate: null },
        include: { elixir: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) redirect("/login");

  const dayNumber =
    Math.floor(
      (Date.now() - new Date(client.startDate).getTime()) / 86400000
    ) + 1;

  const firstName = client.intake?.firstName || client.user.name;

  // Wisdom message of the day — cycle through DayMessages
  const allMessages = await prisma.dayMessage.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const wisdomMessage =
    allMessages.length > 0
      ? allMessages[(dayNumber - 1) % allMessages.length]
      : null;

  const nextSession = client.sessions[0] ?? null;
  const now = Date.now();
  const isWithin24h =
    nextSession &&
    new Date(nextSession.scheduledAt).getTime() - now < 24 * 60 * 60 * 1000;

  const todayPractice = client.clientPractices[0] ?? null;

  return (
    <div className="space-y-8">
      {/* a) Wisdom message — prominent, centered */}
      {wisdomMessage && (
        <div className="text-center py-6">
          <p className="font-display text-xl sm:text-2xl text-brun-chaud leading-relaxed italic max-w-md mx-auto">
            &ldquo;{wisdomMessage.text}&rdquo;
          </p>
        </div>
      )}

      {/* b) First name + Day number */}
      <div className="text-center">
        <h1 className="font-display text-2xl text-brun-chaud">
          {firstName} — <span className="text-or-sacre">Day {dayNumber}</span>
        </h1>
      </div>

      {/* c) Elixirs prescribed */}
      {client.elixirPrescriptions.length > 0 && (
        <div>
          <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
            Your elixirs
          </h2>
          <div className="space-y-3">
            {client.elixirPrescriptions.map((rx: any) => (
              <div key={rx.id} className="bg-cire-chaude border border-or-pale rounded-sm p-4">
                <p className="font-display text-base text-brun-chaud">{rx.elixir.name}</p>
                <p className="font-ui text-sm text-brun-mid mt-1">
                  {rx.dosage || rx.elixir.dosage}
                </p>
                {rx.notes && (
                  <p className="font-ui text-xs text-brun-mid/60 italic mt-1">{rx.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* d) Today's practice */}
      {todayPractice && (
        <Link
          href="/client/pratiques"
          className="block bg-cire-chaude border border-or-pale rounded-sm p-5 hover:border-or-sacre transition-colors"
        >
          <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-2">
            Today&apos;s practice
          </h2>
          <p className="font-display text-lg text-brun-chaud">
            {todayPractice.practice.title}
          </p>
          <p className="font-ui text-sm text-or-sacre mt-1">
            Start &rarr;
          </p>
        </Link>
      )}

      {/* e) Next session */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
        <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
          Next session
        </h2>
        {nextSession ? (
          <>
            <p className="font-display text-lg text-brun-chaud">
              {new Date(nextSession.scheduledAt).toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <p className="text-sm text-brun-mid mt-1">
              {new Date(nextSession.scheduledAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              — {sessionTypeLabels[nextSession.type] ?? nextSession.type}
            </p>
            {isWithin24h && nextSession.zoomLink && (
              <a
                href={nextSession.zoomLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 bg-or-sacre text-white rounded-sharp px-4 py-2 text-xs font-ui hover:bg-ambre-vif transition-colors"
              >
                Join on Zoom
              </a>
            )}
          </>
        ) : (
          <p className="text-brun-mid text-sm font-ui">No session scheduled</p>
        )}
      </div>

      {/* f) Share a document — discreet upload button */}
      <DocumentUploadButton />
    </div>
  );
}
