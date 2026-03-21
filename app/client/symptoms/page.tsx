"use client";

import { useState, useEffect } from "react";

interface SymptomMessage {
  id: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export default function SymptomsPage() {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<SymptomMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Charge l'historique des symptômes
  async function fetchMessages() {
    try {
      const res = await fetch("/api/symptoms");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch {
      // Erreur silencieuse
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMessages();
  }, []);

  // Envoie un nouveau symptôme
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (res.ok) {
        setContent("");
        await fetchMessages();
      }
    } catch {
      // Erreur silencieuse
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Titre et explication */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl text-brun-chaud">
          Rapporter un symptôme
        </h1>
        <p className="text-brun-mid font-ui text-sm mt-1">
          Signalez vos symptômes ou posez une question prioritaire à Joffrey.
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Décrivez votre symptôme..."
          rows={4}
          className="w-full border border-or-pale rounded-sm p-3 font-ui text-sm text-brun-chaud bg-creme-sacree placeholder:text-brun-mid/40 focus:outline-none focus:border-or-sacre"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="bg-or-sacre text-creme-sacree font-ui text-sm px-5 py-2 rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50"
        >
          {sending ? "Envoi..." : "Envoyer"}
        </button>
      </form>

      {/* Historique */}
      <section>
        <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
          Historique
        </h2>
        {loading ? (
          <p className="text-sm text-brun-mid/60 font-ui">Chargement...</p>
        ) : messages.length === 0 ? (
          <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
            <p className="text-sm text-brun-mid/60 font-ui">
              Aucun symptôme signalé.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-cire-chaude border border-or-pale rounded-sm p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-ui text-brun-mid/60">
                    {new Date(msg.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {msg.readAt && (
                    <span className="text-xs font-ui bg-foret/10 text-foret px-2 py-0.5 rounded-sharp">
                      Lu
                    </span>
                  )}
                </div>
                <p className="text-sm font-ui text-brun-chaud whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
