"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ClientActionsProps {
  clientId: string;
  blocked: boolean;
  inviteLink: string | null;
}

export default function ClientActions({ clientId, blocked, inviteLink }: ClientActionsProps) {
  const router = useRouter();
  const [isBlocked, setIsBlocked] = useState(blocked);
  const [loading, setLoading] = useState("");
  const [emailStatus, setEmailStatus] = useState("");

  async function toggleBlock(block: boolean) {
    setLoading("block");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/block`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked: block }),
      });
      if (res.ok) {
        setIsBlocked(block);
        router.refresh();
      }
    } finally {
      setLoading("");
    }
  }

  async function handleDelete() {
    if (!window.confirm("Supprimer définitivement ce client et toutes ses données ?")) return;
    setLoading("delete");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/clients");
      }
    } finally {
      setLoading("");
    }
  }

  async function handleSendEmail() {
    setLoading("email");
    setEmailStatus("");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/send-invitation`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setEmailStatus("sent");
      } else {
        setEmailStatus(data.error || "Erreur");
      }
    } catch {
      setEmailStatus("Erreur de connexion");
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-or-pale/50">
      {/* Bloquer / Débloquer */}
      {isBlocked ? (
        <button
          onClick={() => toggleBlock(false)}
          disabled={loading === "block"}
          className="px-3 py-1.5 border border-foret/30 text-foret text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-foret/5 transition-colors disabled:opacity-50"
        >
          {loading === "block" ? "..." : "Réactiver l'accès"}
        </button>
      ) : (
        <button
          onClick={() => toggleBlock(true)}
          disabled={loading === "block"}
          className="px-3 py-1.5 border border-orange-400/50 text-orange-600 text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-orange-50 transition-colors disabled:opacity-50"
        >
          {loading === "block" ? "..." : "Bloquer l'accès"}
        </button>
      )}

      {/* Envoyer par email */}
      {inviteLink && (
        <button
          onClick={handleSendEmail}
          disabled={loading === "email"}
          className="px-3 py-1.5 bg-or-sacre text-white text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50"
        >
          {loading === "email" ? "Envoi..." : "Envoyer par email"}
        </button>
      )}
      {emailStatus === "sent" && (
        <span className="text-xs font-ui text-foret">Email envoyé</span>
      )}
      {emailStatus && emailStatus !== "sent" && (
        <span className="text-xs font-ui text-red-600">{emailStatus}</span>
      )}

      {/* Supprimer */}
      <button
        onClick={handleDelete}
        disabled={loading === "delete"}
        className="px-3 py-1.5 border border-red-300 text-red-600 text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-red-50 transition-colors disabled:opacity-50 ml-auto"
      >
        {loading === "delete" ? "Suppression..." : "Supprimer le client"}
      </button>
    </div>
  );
}
