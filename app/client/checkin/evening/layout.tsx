import { requireFlagOrRedirect } from "@/lib/parcours-guard";

export default async function EveningCheckinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireFlagOrRedirect("requiresEveningCheckin");
  return <>{children}</>;
}
