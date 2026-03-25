import { NextResponse } from "next/server";
import { removeAuthCookie } from "@/lib/auth";

export async function POST() {
  await removeAuthCookie();
  const response = NextResponse.json({ success: true });
  response.cookies.delete("onboarding_completed");
  return response;
}
