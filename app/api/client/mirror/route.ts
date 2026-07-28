import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";
import { brusselsDayIndex } from "@/lib/program-state";

// Cadence du miroir : il n'apparaît QUE dans une fenêtre autour de chaque cap
// de 21 jours (jours 21-23, 42-44, 63-65, 84-86), puis disparaît. Objectif :
// un point d'étape rythmé, jamais un tableau de bord quotidien de performance.
const CADENCE_DAYS = 21;
const WINDOW_DAYS = 3;

// GET /api/client/mirror — Miroir de progression.
// Renvoie au client SES propres données de check-in (énergie/sommeil dans le
// temps) + son assiduité récente. Pur « redonner » : aucune nouvelle saisie,
// aucune IA. Sert le composant client ProgressMirror.
export async function GET() {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;
  const { session } = auth;

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: { id: true, detoxStartDate: true },
  });
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  // 30 derniers jours de check-ins (ordre chronologique).
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 29);

  const checkins = await prisma.dailyCheckin.findMany({
    where: { clientId: client.id, date: { gte: since } },
    orderBy: { date: "asc" },
    select: { date: true, energyLevel: true, sleepQuality: true },
  });

  // Points de courbe = jours avec un niveau d'énergie renseigné.
  const points = checkins
    .filter((c) => c.energyLevel != null)
    .map((c) => ({
      date: c.date.toISOString().slice(0, 10),
      energy: c.energyLevel as number,
      sleep: c.sleepQuality ?? null,
    }));

  // Assiduité : jours distincts avec un check-in sur les 7 derniers jours.
  const weekAgo = new Date();
  weekAgo.setHours(0, 0, 0, 0);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekDays = new Set(
    checkins
      .filter((c) => new Date(c.date) >= weekAgo)
      .map((c) => c.date.toISOString().slice(0, 10)),
  );
  const weekCount = weekDays.size;

  // Tendance énergie : moyenne des 7 derniers points vs les 7 précédents.
  const energies = points.map((p) => p.energy);
  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const recent = avg(energies.slice(-7));
  const previous = avg(energies.slice(-14, -7));
  let trend: "up" | "down" | "flat" | null = null;
  if (recent != null && previous != null) {
    if (recent - previous >= 0.5) trend = "up";
    else if (previous - recent >= 0.5) trend = "down";
    else trend = "flat";
  }

  // Ancre du calendrier : detoxStartDate (jour 1 du parcours) si présente,
  // sinon le tout premier check-in du client (cas CUSTOM sans détox).
  let anchor: Date | null = client.detoxStartDate ?? null;
  if (!anchor) {
    const first = await prisma.dailyCheckin.findFirst({
      where: { clientId: client.id },
      orderBy: { date: "asc" },
      select: { date: true },
    });
    anchor = first?.date ?? null;
  }

  // Jour dans le parcours (calendrier Bruxelles, immunisé UTC/DST — cf. L 9 avril).
  const dayIndex = anchor
    ? brusselsDayIndex(new Date()) - brusselsDayIndex(anchor) + 1
    : 0;

  // Le miroir n'est visible que dans la fenêtre autour d'un cap de 21 jours.
  const visible =
    anchor != null &&
    checkins.length > 0 &&
    dayIndex >= CADENCE_DAYS &&
    dayIndex % CADENCE_DAYS < WINDOW_DAYS;

  return NextResponse.json({
    visible,
    dayIndex,
    cadenceDays: CADENCE_DAYS,
    points,
    weekCount,
    totalCheckins: checkins.length,
    avgEnergy: recent != null ? Math.round(recent * 10) / 10 : null,
    trend,
  });
}

