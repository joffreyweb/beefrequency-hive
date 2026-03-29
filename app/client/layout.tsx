import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ClientNav from "@/components/client/ClientNav";
import ClientHeader from "@/components/client/ClientHeader";
import { LanguageProvider } from "@/lib/LanguageContext";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "CLIENT") {
    redirect("/login");
  }

  // Vérifier si le client est bloqué
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { blocked: true },
  });
  if (user?.blocked) {
    redirect("/blocked");
  }

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-creme-sacree flex flex-col">
        <ClientHeader />
        <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-16 pb-24">
          {children}
        </main>
        <ClientNav />
      </div>
    </LanguageProvider>
  );
}
