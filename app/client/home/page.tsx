import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOnboarding } from "@/lib/onboarding-guard";
import Link from "next/link";
import HomeDocuments from "@/components/client/HomeDocuments";

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
      dailyFocuses: true,
      clientPractices: {
        where: { isActive: true },
        include: { practice: true },
        take: 3,
      },
      documents: { orderBy: { createdAt: "desc" } },
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

  const todayFocus =
    (
      client.dailyFocuses as {
        id: string;
        dayFrom: number;
        dayTo: number;
        title: string;
        message: string;
      }[]
    )
      .filter((f) => f.dayFrom <= dayNumber && f.dayTo >= dayNumber)
      .sort((a, b) => b.dayFrom - a.dayFrom)[0] ?? null;

  const nextSession = client.sessions[0] ?? null;
  const now = Date.now();
  const isWithin24h =
    nextSession &&
    new Date(nextSession.scheduledAt).getTime() - now < 24 * 60 * 60 * 1000;

  const unreadMessages = await prisma.message.count({
    where: { receiverId: session.userId, readAt: null },
  });

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl text-brun-chaud">
          {firstName} —{" "}
          <span className="text-or-sacre">Day {dayNumber}</span>
        </h1>
      </div>

      {/* Daily message — prominent */}
      {todayFocus && (
        <div className="bg-cire-chaude border-l-4 border-or-sacre rounded-sm p-5">
          <p className="font-caps text-xs text-or-sacre uppercase tracking-wider mb-2">
            Today&apos;s message
          </p>
          <p className="font-display text-lg text-brun-chaud mb-1">
            {todayFocus.title}
          </p>
          <p className="font-ui text-sm text-brun-mid leading-relaxed">
            {todayFocus.message}
          </p>
        </div>
      )}

      {/* Elixirs — prescribed */}
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
          <Link
            href="/client/elixirs"
            className="text-or-sacre text-sm font-ui hover:text-ambre-vif transition-colors mt-2 inline-block"
          >
            See all &rarr;
          </Link>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Next session */}
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
                —{" "}
                {sessionTypeLabels[nextSession.type] ?? nextSession.type}
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
            <p className="text-brun-mid text-sm font-ui">
              No session scheduled
            </p>
          )}
        </div>

        {/* Unread messages */}
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
          <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
            Messages
          </h2>
          {unreadMessages > 0 ? (
            <div>
              <p className="font-display text-lg text-brun-chaud">
                {unreadMessages} unread message{unreadMessages > 1 ? "s" : ""}
              </p>
              <Link
                href="/client/messages"
                className="text-or-sacre text-sm font-ui hover:text-ambre-vif transition-colors mt-2 inline-block"
              >
                View &rarr;
              </Link>
            </div>
          ) : (
            <p className="text-brun-mid text-sm font-ui">
              No new messages
            </p>
          )}
        </div>
      </div>

      {/* Documents */}
      <div>
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">
          My documents
        </h2>
        <HomeDocuments
          clientDocuments={JSON.parse(JSON.stringify(client.documents))}
        />
      </div>
    </div>
  );
}
