import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const jwtSecretString = process.env.JWT_SECRET;
if (!jwtSecretString) {
  throw new Error("[FATAL] JWT_SECRET environment variable is required");
}
const JWT_SECRET = new TextEncoder().encode(jwtSecretString);

// Routes publiques qui ne nécessitent pas d'auth (cookie). Les endpoints cron ci-dessous
// valident eux-mêmes leur secret partagé (x-cron-secret / CALDAV_WEBHOOK_SECRET) dans leur handler.
const publicPaths = ["/login", "/register", "/invite", "/api/invite", "/api/auth/login", "/blocked", "/client/booking", "/api/booking", "/api/availability", "/forgot-password", "/reset-password", "/api/auth/forgot-password", "/api/auth/reset-password", "/api/newsletter/unsubscribe", "/api/public-uploads/journal", "/api/actions/sync", "/api/session-reminders", "/api/caldav/webhook", "/api/cron/kdrive-archive", "/api/cron/morning-brief", "/r/"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rewrite public /uploads/journal/* → /api/public-uploads/journal/* (Next route
  // qui sert les fichiers depuis process.cwd()/uploads/journal). URL browser
  // inchangée, zéro migration des mediaUrl existants en DB.
  // Nom `public-uploads` volontaire : le rsync deploy.yml exclut tout dossier
  // nommé `uploads` (pour préserver les fichiers en prod), donc on ne peut pas
  // nommer ce dossier `uploads` côté code.
  if (pathname.startsWith("/uploads/journal/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace("/uploads/journal/", "/api/public-uploads/journal/");
    return NextResponse.rewrite(url);
  }

  // Redirects 301 renommage Transmission/Pratiques → Mes Modules (V3a)
  if (pathname === "/client/transmission" || pathname.startsWith("/client/transmission/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace("/client/transmission", "/client/mes-modules");
    return NextResponse.redirect(url, 301);
  }
  if (pathname === "/client/pratiques" || pathname.startsWith("/client/pratiques/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace("/client/pratiques", "/client/mes-modules");
    return NextResponse.redirect(url, 301);
  }

  // Laisser passer les routes publiques et les assets
  if (
    publicPaths.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/uploads") ||
    pathname === "/manifest.json" ||
    pathname === "/logo_joffrey_transparent.png" ||
    pathname === "/tracking.js"
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
      return NextResponse.redirect(new URL("/admin/journee", request.url));
    }

    // Onboarding guard : bloquer /client/* tant que l'onboarding n'est pas complété
    // Exceptions : /client/onboarding (le flux lui-même) et /client/help (aide accessible tout le temps)
    if (
      role === "CLIENT" &&
      pathname.startsWith("/client") &&
      !pathname.startsWith("/client/onboarding") &&
      !pathname.startsWith("/client/help")
    ) {
      const onboardingDone = request.cookies.get("onboarding_completed")?.value;
      if (!onboardingDone) {
        return NextResponse.redirect(new URL("/client/onboarding", request.url));
      }
    }

    // Redirection racine selon le rôle
    if (pathname === "/") {
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/journee", request.url));
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
