import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_secret_do_not_use_in_production"
);

// Routes publiques qui ne nécessitent pas d'auth
const publicPaths = ["/login", "/register", "/invite", "/api/invite", "/api/auth/login", "/blocked", "/client/booking", "/api/booking", "/api/availability"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Laisser passer les routes publiques et les assets
  if (
    publicPaths.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/uploads") ||
    pathname === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    // Guard admin : seuls les ADMIN accèdent à /admin
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/client/home", request.url));
    }

    // Guard client : seuls les CLIENT accèdent à /client
    if (pathname.startsWith("/client") && role !== "CLIENT") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    // Onboarding guard : bloquer /client/* tant que l'onboarding n'est pas complété
    if (
      role === "CLIENT" &&
      pathname.startsWith("/client") &&
      !pathname.startsWith("/client/onboarding")
    ) {
      const onboardingDone = request.cookies.get("onboarding_completed")?.value;
      if (!onboardingDone) {
        return NextResponse.redirect(new URL("/client/onboarding", request.url));
      }
    }

    // Redirection racine selon le rôle
    if (pathname === "/") {
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/client/home", request.url));
    }

    return NextResponse.next();
  } catch {
    // Token invalide → login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon-.*\\.png|manifest\\.json).*)"],
};
