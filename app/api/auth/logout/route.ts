import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Expire the httpOnly token cookie
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  // Expire the onboarding cookie
  response.cookies.set("onboarding_completed", "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}
