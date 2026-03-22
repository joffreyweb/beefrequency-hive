"use client";

import { useState, useEffect } from "react";

interface DayMessage { id: string; text: string; isActive: boolean; createdAt: string; }

export default function DayMessagesPage() {
  const [messages, setMessages] = useState<DayMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  async function load() {
    const res = await fetch("/api/admin/day-messages");
    if (res.ok) setMessages(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!newText.trim()) return;
    setAdding(true);
    await fetch("/api/day-messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText.trim() }),
    });
    setNewText("");
    await load();
    setAdding(false);
  }

  async function handleToggle(id: string, current: boolean) {
    await fetch(`/api/day-messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    await load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer ce message ?")) return;
    await fetch(`/api/day-messages/${id}`, { method: "DELETE" });
    await load();
  }

  async function handleEdit(id: string) {
    await fetch(`/api/day-messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: editText.trim() }),
    });
    setEditingId(null);
    await load();
  }

  const active = messages.filter(m => m.isActive).length;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="font-display text-2xl text-brun-chaud">Messages du matin</h1>
        <p className="text-sm font-ui text-brun-mid/60 mt-1">
          {active} actif{active > 1 ? "s" : ""} · {messages.length} au total
        </p>
      </div>
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-4 space-y-3">
        <p className="font-caps text-xs text-brun-mid uppercase tracking-wider">Ajouter un message</p>
        <textarea value={newText} onChange={e => setNewText(e.target.value)}
          rows={2} placeholder="Belle journee a toi."
          className="w-full px-3 py-2.5 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre resize-none" />
        <button onClick={handleAdd} disabled={adding}
          className="px-5 py-2 bg-or-sacre text-white rounded-sharp text-sm font-ui uppercase tracking-wider disabled:opacity-40">
          {adding ? "Ajout..." : "Ajouter"}
        </button>
      </div>
      {loading ? (
        <p className="text-sm font-ui text-brun-mid/60">Chargement...</p>
      ) : messages.length === 0 ? (
        <p className="text-sm font-ui text-brun-mid/60 italic">Aucun message pour le moment.</p>
      ) : (
        <div className="space-y-2">
          {messages.map(m => (
            <div key={m.id} className={`border rounded-sm p-4 flex items-start gap-3 ${m.isActive ? "bg-cire-chaude border-or-pale" : "bg-creme-sacree border-or-pale/40 opacity-50"}`}>
              <button onClick={() => handleToggle(m.id, m.isActive)}
                className={`mt-0.5 w-4 h-4 rounded-full border flex-shrink-0 ${m.isActive ? "bg-or-sacre border-or-sacre" : "bg-transparent border-brun-mid/30"}`} />
              <div className="flex-1">
                {editingId === m.id ? (
                  <div className="space-y-2">
                    <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2}
                      className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-sacre rounded-sharp focus:outline-none resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(m.id)} className="px-4 py-1.5 bg-or-sacre text-white rounded-sharp text-xs font-ui">Sauvegarder</button>
                      <button onClick={() => setEditingId(null)} className="px-4 py-1.5 text-brun-mid text-xs font-ui">Annuler</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-ui text-brun-chaud leading-relaxed">{m.text}</p>
                )}
              </div>
              {editingId !== m.id && (
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(m.id); setEditText(m.text); }} className="text-xs font-ui text-brun-mid/50 hover:text-brun-mid">Modifier</button>
                  <button onClick={() => handleDelete(m.id)} className="text-xs font-ui text-red-400 hover:text-red-600">Suppr.</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}