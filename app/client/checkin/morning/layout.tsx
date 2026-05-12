import { requireFlagOrRedirect } from "@/lib/parcours-guard";

export default async function MorningCheckinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireFlagOrRedirect("requiresMorningCheckin");
  return <>{children}</>;
}
