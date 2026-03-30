"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Questionnaire {
  id: string;
  type: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  _count: { responses: number };
}

export default function QuestionnairesPage() {
  const router = useRouter();
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newType, setNewType] = useState("PRE_START");
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const res = await fetch("/api/admin/questionnaires");
    if (res.ok) {
      const data = await res.json();
      setQuestionnaires(data.questionnaires);
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/questionnaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newType, title: newTitle, questions: [] }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/questionnaires/${data.questionnaire.id}/edit`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/questionnaires/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchAll();
  }

  const preStart = questionnaires.filter((q) => q.type === "PRE_START");
  const followUp = questionnaires.filter((q) => q.type === "FOLLOW_UP");

  return (
    <div>
      <Link href="/admin/dashboard" className="text-[13px] font-ui text-brun-mid/50 hover:text-or-sacre transition-colors mb-4 inline-block">
        &larr; Cockpit
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-brun-chaud">Questionnaires</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-or-sacre text-white text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-ambre-vif transition-colors"
        >
          {showCreate ? "Annuler" : "Creer nouveau"}
        </button>
      </div>

      {showCreate && (
        <div className="bg-cire-chaude border border-or-sacre rounded-[10px] p-5 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-ui text-brun-mid/60 mb-1">Type</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud">
                <option value="PRE_START">Pre-Start</option>
                <option value="FOLLOW_UP">Follow-Up</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-ui text-brun-mid/60 mb-1">Titre</label>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: Evaluation initiale" className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" />
            </div>
          </div>
          <button onClick={handleCreate} disabled={loading || !newTitle.trim()} className="px-4 py-2 bg-or-sacre text-white text-xs font-ui uppercase rounded-sharp hover:bg-ambre-vif disabled:opacity-50">
            {loading ? "..." : "Creer et editer les questions"}
          </button>
        </div>
      )}

      {/* Pre-Start */}
      <Section title="Pre-Start" items={preStart} onToggle={toggleActive} />
      <div className="mt-6" />
      <Section title="Follow-Up" items={followUp} onToggle={toggleActive} />
    </div>
  );
}

function Section({ title, items, onToggle }: { title: string; items: Questionnaire[]; onToggle: (id: string, active: boolean) => void }) {
  return (
    <div>
      <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-brun-mid/60 font-ui">Aucun questionnaire {title}.</p>
      ) : (
        <div className="space-y-2">
          {items.map((q) => (
            <div key={q.id} className="bg-cire-chaude border border-or-pale rounded-[10px] p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-ui text-brun-chaud">{q.title}</p>
                <p className="text-xs font-ui text-brun-mid/50 mt-0.5">
                  {q._count.responses} reponse{q._count.responses !== 1 ? "s" : ""} · {new Date(q.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggle(q.id, q.isActive)}
                  className={`px-2 py-1 text-xs font-ui rounded-sharp ${q.isActive ? "bg-foret/10 text-foret" : "bg-brun-mid/10 text-brun-mid"}`}
                >
                  {q.isActive ? "Actif" : "Inactif"}
                </button>
                <Link
                  href={`/admin/questionnaires/${q.id}/edit`}
                  className="px-3 py-1.5 border border-or-pale text-brun-mid text-xs font-ui uppercase tracking-wider rounded-sharp hover:border-or-sacre hover:text-or-sacre transition-colors"
                >
                  Modifier
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
