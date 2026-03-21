"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SessionForm from "@/components/admin/SessionForm";

interface ClientOption {
  id: string;
  user: { name: string };
}

interface SessionsAdminProps {
  clients: ClientOption[];
}

// Client component pour le formulaire de création de session
export default function SessionsAdmin({ clients }: SessionsAdminProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  function handleSuccess() {
    setShowForm(false);
    router.refresh();
  }

  return (
    <div className="mb-8">
      <button
        onClick={() => setShowForm(!showForm)}
        className="px-4 py-2.5 text-sm font-caps uppercase tracking-wider bg-or-sacre text-brun-chaud rounded-sharp hover:bg-ambre-vif transition-colors duration-150"
      >
        {showForm ? "Annuler" : "Planifier une session"}
      </button>

      {showForm && (
        <div className="mt-4 bg-cire-chaude border border-or-pale rounded-sm p-6 max-w-lg">
          <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">
            Nouvelle session
          </h2>
          <SessionForm clients={clients} onSuccess={handleSuccess} />
        </div>
      )}
    </div>
  );
}
