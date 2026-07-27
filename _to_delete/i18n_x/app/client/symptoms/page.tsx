"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";

interface SymptomMessage {
  id: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export default function SymptomsPage() {
  const { lang } = useLanguage();
  const T = (k: { EN: string; FR: string }) => k[lang];
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
          {T({ EN: "Report a symptom", FR: "Signaler un symptôme" })}
        </h1>
        <p className="text-brun-mid font-ui text-sm mt-1">
          {T({
            EN: "Report your symptoms or ask Joffrey a priority question.",
            FR: "Signalez vos symptômes ou posez une question prioritaire à Joffrey.",
          })}
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={T({ EN: "Describe your symptom...", FR: "Décrivez votre symptôme..." })}
          rows={4}
          className="w-full border border-or-pale rounded-sm p-3 font-ui text-sm text-brun-chaud bg-creme-sacree placeholder:text-brun-mid/40 focus:outline-none focus:border-or-sacre"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="bg-or-sacre text-creme-sacree font-ui text-sm px-5 py-2 rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50"
        >
          {sending
            ? T({ EN: "Sending...", FR: "Envoi..." })
            : T({ EN: "Send", FR: "Envoyer" })}
        </button>
      </form>

      {/* Historique */}
      <section>
        <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
          {T({ EN: "History", FR: "Historique" })}
        </h2>
        {loading ? (
          <p className="text-sm text-brun-mid/60 font-ui">
            {T({ EN: "Loading...", FR: "Chargement..." })}
          </p>
        ) : messages.length === 0 ? (
          <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
            <p className="text-sm text-brun-mid/60 font-ui">
              {T({ EN: "No symptoms reported.", FR: "Aucun symptôme signalé." })}
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
                    {new Date(msg.createdAt).toLocaleDateString(lang === "EN" ? "en-US" : "fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {msg.readAt && (
                    <span className="text-xs font-ui bg-foret/10 text-foret px-2 py-0.5 rounded-sharp">
                      {T({ EN: "Read", FR: "Lu" })}
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
