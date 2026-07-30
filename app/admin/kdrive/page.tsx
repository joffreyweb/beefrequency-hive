"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface KItem {
  id: string;
  name: string;
  type: "dir" | "file";
  size: number | null;
}
interface Project {
  id: string;
  name: string;
}

export default function KDrivePage() {
  const [items, setItems] = useState<KItem[]>([]);
  const [path, setPath] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [targetProject, setTargetProject] = useState("");
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = useCallback(async (folderId?: string, pushCrumb?: { id: string; name: string }) => {
    setLoading(true);
    setMsg("");
    try {
      const q = folderId ? `?folderId=${encodeURIComponent(folderId)}` : "";
      const res = await fetch(`/api/admin/kdrive${q}`);
      const data = await res.json();
      setConfigured(data.configured !== false);
      setItems(data.items || []);
      if (data.error) setMsg(data.error);
      setPath((prev) => {
        if (!folderId) return [{ id: data.folderId, name: "kDrive" }];
        if (pushCrumb) return [...prev, pushCrumb];
        return prev;
      });
    } catch {
      setMsg("Impossible de joindre kDrive.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetch("/api/admin/projects")
      .then((r) => r.json())
      .then((d) => setProjects((d.projects || []).map((p: Project) => ({ id: p.id, name: p.name }))))
      .catch(() => {});
  }, [load]);

  function openFolder(f: KItem) {
    load(f.id, { id: f.id, name: f.name });
  }

  function goCrumb(i: number) {
    const target = path[i];
    setPath(path.slice(0, i + 1));
    load(target.id);
  }

  async function incorporer(f: KItem) {
    setMsg("");
    try {
      const res = await fetch("/api/admin/kdrive/incorporer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: f.id, fileName: f.name, projectId: targetProject || null }),
      });
      if (res.ok) setMsg(`« ${f.name} » incorporé en tâche (Inbox de Ma Journée) ✓`);
      else setMsg("Échec de l'incorporation.");
    } catch {
      setMsg("Échec de l'incorporation.");
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-5">
        <p className="font-caps text-[11px] tracking-[0.2em] uppercase text-or-sacre">kDrive</p>
        <h1 className="font-display text-3xl text-brun-chaud mt-0.5">Piocher un document</h1>
        <p className="font-ui text-sm text-brun-mid/70 mt-1">
          Navigue dans ton kDrive et incorpore un document dans le pilotage (il devient une tâche, liable à un projet).
        </p>
      </div>

      {!configured ? (
        <div className="bg-cire-chaude border border-or-pale rounded-[12px] p-5">
          <p className="font-ui text-sm text-brun-mid/80">
            kDrive n&apos;est pas configuré (token Infomaniak absent du <span className="font-mono">.env</span> VPS).
          </p>
        </div>
      ) : (
        <div className="bg-cire-chaude border border-or-pale rounded-[12px] p-5 space-y-4">
          {/* Fil d'Ariane */}
          <div className="flex flex-wrap items-center gap-1 text-[13px] font-ui">
            {path.map((c, i) => (
              <span key={c.id + i} className="flex items-center gap-1">
                {i > 0 && <span className="text-brun-mid/40">/</span>}
                <button
                  onClick={() => goCrumb(i)}
                  className={i === path.length - 1 ? "text-brun-chaud" : "text-or-sacre hover:underline"}
                >
                  {c.name}
                </button>
              </span>
            ))}
          </div>

          {/* Projet cible */}
          <div className="flex items-center gap-2">
            <label className="font-ui text-xs text-brun-mid/70">Lier au projet :</label>
            <select
              value={targetProject}
              onChange={(e) => setTargetProject(e.target.value)}
              className="px-2 py-1.5 font-ui text-sm bg-creme-sacree border border-or-pale rounded-[8px] focus:outline-none focus:border-or-sacre"
            >
              <option value="">(aucun)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Contenu */}
          {loading ? (
            <p className="font-ui text-sm text-brun-mid/50 py-4">Chargement…</p>
          ) : items.length === 0 ? (
            <p className="font-ui text-sm text-brun-mid/50 py-4">Dossier vide.</p>
          ) : (
            <ul className="divide-y divide-or-pale/40">
              {items.map((f) => (
                <li key={f.id} className="flex items-center gap-3 py-2.5">
                  <span className="text-lg">{f.type === "dir" ? "📁" : "📄"}</span>
                  {f.type === "dir" ? (
                    <button onClick={() => openFolder(f)} className="flex-1 min-w-0 text-left font-ui text-sm text-or-sacre hover:underline truncate">
                      {f.name}
                    </button>
                  ) : (
                    <span className="flex-1 min-w-0 font-ui text-sm text-brun-chaud truncate">{f.name}</span>
                  )}
                  {f.type === "file" && (
                    <button
                      onClick={() => incorporer(f)}
                      className="text-[11px] font-caps px-2.5 py-1 bg-or-sacre/10 text-or-sacre rounded hover:bg-or-sacre/20 shrink-0"
                    >
                      → Tâche
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {msg && <p className="font-ui text-xs text-brun-mid/80 pt-1">{msg}</p>}
          <div className="pt-1">
            <Link href="/admin/journee" className="font-ui text-sm text-brun-mid/60 hover:text-or-sacre">
              ← Ma Journée
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
