import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
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
