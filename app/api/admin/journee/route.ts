import { NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { getDayPlan } from "@/lib/journee";

// GET /api/admin/journee — plan du jour complet (Focus, Agenda, prochain post, à-répondre, inbox).
export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;
  const plan = await getDayPlan();
  return NextResponse.json(plan);
}
