import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_secret_do_not_use_in_production"
);

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface JwtPayload {
  userId: string;
  role: "ADMIN" | "CLIENT";
  email: string;
}

// Convertit la durée string en secondes
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60; // 7 jours par défaut
  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case "s": return value;
    case "m": return value * 60;
    case "h": return value * 3600;
    case "d": return value * 86400;
    default: return 7 * 86400;
  }
}

// Génère un JWT signé
export async function signToken(payload: JwtPayload): Promise<string> {
  const expiresInSeconds = parseDuration(JWT_EXPIRES_IN);
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(JWT_SECRET);
}

// Vérifie et décode un JWT
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

// Récupère le payload JWT depuis les cookies
export async function getSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Définit le cookie JWT httpOnly
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const expiresInSeconds = parseDuration(JWT_EXPIRES_IN);
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: expiresInSeconds,
    path: "/",
  });
}

// Supprime le cookie d'auth
export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("token");
}
