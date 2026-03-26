import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ClientNav from "@/components/client/ClientNav";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "CLIENT") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-creme-sacree flex flex-col">
      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-6 pb-24">
        {children}
      </main>
      <ClientNav />
    </div>
  );
}
