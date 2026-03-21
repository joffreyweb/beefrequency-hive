import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Vérifie que le client a complété l'onboarding, redirige sinon
export async function requireOnboarding(): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "CLIENT") return;

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: { onboardingCompleted: true },
  });

  if (client && !client.onboardingCompleted) {
    redirect("/client/onboarding");
  }
}
