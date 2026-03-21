import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/admin/Sidebar";

// Layout admin — Finder-inspired, light BeeFrequency
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  // Compteurs pour les badges sidebar
  const [pendingActionsCount, activeClientsCount, unreadMessagesCount] =
    await Promise.all([
      prisma.pendingAction.count({ where: { completedAt: null } }),
      prisma.client.count({ where: { status: "ACTIVE" } }),
      prisma.message.count({
        where: { readAt: null, receiver: { role: "ADMIN" } },
      }),
    ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        adminName={session.email}
        pendingActionsCount={pendingActionsCount}
        activeClientsCount={activeClientsCount}
        unreadMessagesCount={unreadMessagesCount}
      />
      <main className="flex-1 bg-creme-sacree p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
