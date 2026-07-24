import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ClarityFill from "@/components/client/ClarityFill";

export const dynamic = "force-dynamic";

// Page de remplissage Clarity — client CONNECTÉ. Accessible seulement si l'admin
// a activé Clarity pour ce client (sinon retour accueil).
export default async function ClientClarityPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!client) redirect("/client/home");

  const submission = await prisma.claritySubmission.findUnique({
    where: { clientId: client.id },
    select: { status: true, answers: true },
  });
  if (!submission) redirect("/client/home");

  const answers = (submission.answers as Record<string, string>) ?? {};

  return <ClarityFill initialAnswers={answers} initialStatus={submission.status} />;
}
