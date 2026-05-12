import { requireFlagOrRedirect } from "@/lib/parcours-guard";

export default async function ProgrammeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireFlagOrRedirect("requiresProgramTimeline");
  return <>{children}</>;
}
