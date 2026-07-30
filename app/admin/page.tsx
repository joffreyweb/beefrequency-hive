import { redirect } from "next/navigation";

// /admin → Ma Journée (poste de pilotage, page d'accueil admin).
export default function AdminIndex() {
  redirect("/admin/journee");
}
