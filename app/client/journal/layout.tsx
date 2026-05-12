import { requireFlagOrRedirect } from "@/lib/parcours-guard";

export default async function JournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireFlagOrRedirect("requiresJournal");
  return <>{children}</>;
}
