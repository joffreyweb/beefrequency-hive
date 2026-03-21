import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ClientNav from "@/components/client/ClientNav";

// Layout client — navigation iPhone bottom bar
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
      <ClientNav />
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-4 pb-24">
        {children}
      </main>
    </div>
  );
}
