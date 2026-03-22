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
      <ClientNav />
      <main className="flex-1 max-w-lg w-full mx-auto px-4 pb-6" style={{ paddingTop: "72px" }}>
        {children}
      </main>
    </div>
  );
}
