"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  color: string;
  type: string | null;
  status: string;
  _count?: { tasks: number };
}
interface Task {
  id: string;
  title: string;
  status: string;
  projectId: string | null;
}

const STATUSES = ["ACTIVE", "PAUSED", "DONE", "ARCHIVED"];

export default function ProjetsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#B8821E");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [pr, tr] = await Promise.all([
      fetch("/api/admin/projects").then((r) => r.json()),
      fetch("/api/admin/tasks").then((r) => r.json()),
    ]);
    setProjects(pr.projects || []);
    setTasks(tr.tasks || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      setName("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    await fetch(`/api/admin/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  function openTasks(projectId: string): Task[] {
    return tasks.filter((t) => t.projectId === projectId && t.status !== "DONE");
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-5">
        <p className="font-caps text-[11px] tracking-[0.2em] uppercase text-or-sacre">Projets</p>
        <h1 className="font-display text-3xl text-brun-chaud mt-0.5">Pipeline</h1>
        <p className="font-ui text-sm text-brun-mid/70 mt-1">
          Tes chantiers et leur prochaine action. Les tâches viennent de Ma Journée et de l&apos;import.
        </p>
      </div>

      {/* Ajout projet */}
      <div className="bg-cire-chaude border border-or-pale rounded-[12px] p-4 mb-6 flex flex-wrap items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Nouveau chantier…" className="flex-1 min-w-[200px] px-3 py-2 font-ui text-sm bg-creme-sacree border border-or-pale rounded-[8px] focus:outline-none focus:border-or-sacre" />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-9 rounded border border-or-pale bg-creme-sacree" title="Couleur" />
        <button onClick={add} disabled={busy || !name.trim()} className="px-4 py-2 font-caps text-sm bg-or-sacre text-white rounded-[8px] hover:bg-ambre-profond disabled:opacity-30">Créer</button>
      </div>

      {/* Liste projets */}
      <div className="space-y-4">
        {projects.map((p) => {
          const open = openTasks(p.id);
          return (
            <div key={p.id} className="bg-cire-chaude border border-or-pale rounded-[12px] p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <h2 className="font-display text-xl text-brun-chaud flex-1 min-w-0 truncate">{p.name}</h2>
                <select value={p.status} onChange={(e) => setStatus(p.id, e.target.value)} className="text-[12px] font-ui px-2 py-1 bg-creme-sacree border border-or-pale rounded-[6px] focus:outline-none focus:border-or-sacre">
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {open.length === 0 ? (
                <p className="font-ui text-sm text-brun-mid/50">Aucune tâche ouverte.</p>
              ) : (
                <>
                  <p className="text-[11px] font-caps uppercase tracking-wider text-or-sacre mb-1">Prochaine action</p>
                  <p className="font-ui text-sm text-brun-chaud mb-2">→ {open[0].title}</p>
                  {open.length > 1 && (
                    <ul className="space-y-1 mt-2">
                      {open.slice(1).map((t) => (
                        <li key={t.id} className="font-ui text-[13px] text-brun-mid/70">• {t.title}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          );
        })}
        {projects.length === 0 && <p className="font-ui text-sm text-brun-mid/50">Aucun projet. Crée un chantier ou dépose un programme.</p>}
      </div>

      <div className="mt-6">
        <Link href="/admin/journee" className="font-ui text-sm text-brun-mid/60 hover:text-or-sacre">← Ma Journée</Link>
      </div>
    </div>
  );
}
