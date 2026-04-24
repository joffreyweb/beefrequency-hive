import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";

const DEFAULT_LIMIT = 60;
const MAX_LIMIT = 200;

interface PhotoItem {
  id: string;
  url: string;
  date: string;
  source: "journal" | "morning" | "evening";
  caption?: string | null;
  isPrivate?: boolean;
}

// GET /api/client/photos?limit=60&offset=0
// Agrège les 3 sources de photos du client connecté :
//   - JournalEntry.mediaUrl (entryType=photo) · inclut isPrivate=true (SA galerie)
//   - DailyCheckin.morningPhotoPath
//   - DailyCheckin.eveningPhotoPath
// Tri desc, paginé (cap MAX_LIMIT pour sécurité).
export async function GET(request: NextRequest) {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;
  const { session } = auth;

  const { searchParams } = request.nextUrl;
  const rawLimit = parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10);
  const rawOffset = parseInt(searchParams.get("offset") || "0", 10);
  const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = Math.max(Number.isFinite(rawOffset) ? rawOffset : 0, 0);

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const [journalEntries, checkins] = await Promise.all([
    prisma.journalEntry.findMany({
      where: {
        clientId: client.id,
        entryType: "photo",
        mediaUrl: { not: null },
      },
      select: {
        id: true,
        mediaUrl: true,
        content: true,
        createdAt: true,
        isPrivate: true,
      },
    }),
    prisma.dailyCheckin.findMany({
      where: {
        clientId: client.id,
        OR: [
          { morningPhotoPath: { not: null } },
          { eveningPhotoPath: { not: null } },
        ],
      },
      select: {
        id: true,
        date: true,
        morningPhotoPath: true,
        eveningPhotoPath: true,
      },
    }),
  ]);

  const items: PhotoItem[] = [];

  for (const e of journalEntries) {
    if (!e.mediaUrl) continue;
    items.push({
      id: `journal-${e.id}`,
      url: e.mediaUrl, // format /uploads/journal/... (rewrite proxy vers /api/public-uploads/journal/...)
      date: e.createdAt.toISOString(),
      source: "journal",
      caption: e.content || null,
      isPrivate: e.isPrivate,
    });
  }

  for (const c of checkins) {
    if (c.morningPhotoPath) {
      items.push({
        id: `checkin-morning-${c.id}`,
        url: `/api/client/uploads/${c.morningPhotoPath}`, // route protégée V3a/3E
        date: c.date.toISOString(),
        source: "morning",
      });
    }
    if (c.eveningPhotoPath) {
      items.push({
        id: `checkin-evening-${c.id}`,
        url: `/api/client/uploads/${c.eveningPhotoPath}`,
        date: c.date.toISOString(),
        source: "evening",
      });
    }
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = items.length;
  const paginated = items.slice(offset, offset + limit);
  const hasMore = offset + paginated.length < total;

  return NextResponse.json({ photos: paginated, total, hasMore });
}
