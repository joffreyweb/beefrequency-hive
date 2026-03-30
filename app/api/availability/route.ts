import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAvailableSlots, getAvailableSlotsRange } from "@/lib/availability";

// GET /api/availability?date=2026-04-01 or ?start=2026-04-01&days=14
export async function GET(request: NextRequest) {
  // Accessible par admin et client (pour booking)
  const session = await getSession();
  if (!session) {
    // Aussi accessible via booking token — on verifie apres
    // Pour le moment, on laisse passer
  }

  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const start = searchParams.get("start");
  const days = parseInt(searchParams.get("days") || "14");
  const duration = parseInt(searchParams.get("duration") || "60");

  if (date) {
    const slots = await getAvailableSlots(new Date(date), duration);
    return NextResponse.json({ date, slots });
  }

  if (start) {
    const slotsMap = await getAvailableSlotsRange(new Date(start), days, duration);
    return NextResponse.json({ slots: slotsMap });
  }

  // Default: 14 prochains jours
  const slotsMap = await getAvailableSlotsRange(new Date(), 14, duration);
  return NextResponse.json({ slots: slotsMap });
}
