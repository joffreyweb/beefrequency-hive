import { getDayPlan } from "@/lib/journee";
import JourneeClient from "./JourneeClient";

// Écran unique « Ma Journée » — page d'accueil admin. Souverain, admin-only (garde layout).
export const dynamic = "force-dynamic";

export default async function JourneePage() {
  const plan = await getDayPlan();
  return <JourneeClient initialPlan={plan} />;
}
