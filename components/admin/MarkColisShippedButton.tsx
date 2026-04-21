"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  clientId: string;
}

export default function MarkColisShippedButton({ clientId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await fetch(`/api/admin/clients/${clientId}/parcours-stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colisEnvoye: true }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs font-ui text-or-sacre hover:text-ambre-vif px-2 py-1 bg-or-sacre/10 rounded transition-colors disabled:opacity-50"
    >
      {loading ? "..." : "📦 Marquer envoyé"}
    </button>
  );
}
