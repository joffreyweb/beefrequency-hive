"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Post {
  id: string;
  order: number;
  title: string;
  caption: string | null;
  hashtags: string | null;
  format: string | null;
  pinned: boolean;
  status: string;
}

export default function ContenuPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState("carte");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch("/api/admin/content");
    const d = await r.json();
    setPosts(d.posts || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, format, caption, hashtags, order: posts.length }),
      });
      setTitle("");
      setCaption("");
      setHashtags("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/admin/content/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
  }
  async function del(id: string) {
    await fetch(`/api/admin/content/${id}`, { method: "DELETE" });
    await load();
  }

  const todo = posts.filter((p) => p.status === "TODO");
  const posted = posts.filter((p) => p.status === "POSTED");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-5">
        <p className="font-caps text-[11px] tracking-[0.2em] uppercase text-or-sacre">Contenu</p>
        <h1 className="font-display text-3xl text-brun-chaud mt-0.5">Damier Instagram</h1>
        <p className="font-ui text-sm text-brun-mid/70 mt-1">
          Le prochain « à poster » remonte dans Ma Journée. Coche quand c&apos;est publié.
        </p>
      </div>

      {/* Ajout */}
      <div className="bg-cire-chaude border border-or-pale rounded-[12px] p-5 mb-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du post…" className="flex-1 min-w-[200px] px-3 py-2 font-ui text-sm bg-creme-sacree border border-or-pale rounded-[8px] focus:outline-none focus:border-or-sacre" />
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="px-3 py-2 font-ui text-sm bg-creme-sacree border border-or-pale rounded-[8px] focus:outline-none focus:border-or-sacre">
            <option value="carte">carte</option>
            <option value="reel">reel</option>
          </select>
        </div>
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Légende…" rows={2} className="w-full px-3 py-2 font-ui text-sm bg-creme-sacree border border-or-pale rounded-[8px] focus:outline-none focus:border-or-sacre" />
        <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#hashtags…" className="w-full px-3 py-2 font-ui text-sm bg-creme-sacree border border-or-pale rounded-[8px] focus:outline-none focus:border-or-sacre" />
        <button onClick={add} disabled={busy || !title.trim()} className="px-5 py-2.5 font-caps text-sm bg-or-sacre text-white rounded-[8px] hover:bg-ambre-profond disabled:opacity-30">
          Ajouter au damier
        </button>
      </div>

      {/* À poster */}
      <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">À poster ({todo.length})</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {todo.map((p) => (
          <div key={p.id} className="bg-cire-chaude border border-or-pale rounded-[10px] p-4">
            <div className="flex items-start gap-2">
              <button onClick={() => patch(p.id, { status: "POSTED" })} aria-label="Marquer posté" className="mt-0.5 w-5 h-5 rounded border-2 border-or-sacre shrink-0 hover:bg-or-sacre/20" />
              <div className="flex-1 min-w-0">
                <p className="font-ui text-sm text-brun-chaud">
                  {p.pinned ? "📌 " : ""}{p.title}
                  {p.format ? <span className="text-brun-mid/50"> · {p.format}</span> : null}
                </p>
                {p.caption && <p className="text-[12px] font-ui text-brun-mid/70 mt-1 whitespace-pre-wrap line-clamp-3">{p.caption}</p>}
                {p.hashtags && <p className="text-[11px] font-ui text-or-sacre/80 mt-1 line-clamp-2">{p.hashtags}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 pt-2 border-t border-or-pale/30">
              <button onClick={() => patch(p.id, { pinned: !p.pinned })} className="text-[11px] font-ui text-brun-mid/60 hover:text-or-sacre">{p.pinned ? "Désépingler" : "Épingler"}</button>
              <button onClick={() => del(p.id)} className="text-[11px] font-ui text-brun-mid/40 hover:text-red-500">Supprimer</button>
            </div>
          </div>
        ))}
        {todo.length === 0 && <p className="font-ui text-sm text-brun-mid/50">Rien à poster. Ajoute une carte ou un reel.</p>}
      </div>

      {/* Postés */}
      {posted.length > 0 && (
        <>
          <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">Postés ({posted.length})</h2>
          <ul className="space-y-1.5 mb-6">
            {posted.map((p) => (
              <li key={p.id} className="flex items-center gap-2 p-2 bg-creme-sacree border border-or-pale rounded-[8px] opacity-70">
                <span className="text-foret">✓</span>
                <span className="flex-1 min-w-0 font-ui text-sm text-brun-chaud line-through truncate">{p.title}</span>
                <button onClick={() => patch(p.id, { status: "TODO" })} className="text-[11px] font-ui text-brun-mid/50 hover:text-or-sacre">rétablir</button>
                <button onClick={() => del(p.id)} className="text-[11px] font-ui text-brun-mid/40 hover:text-red-500">✕</button>
              </li>
            ))}
          </ul>
        </>
      )}

      <Link href="/admin/journee" className="font-ui text-sm text-brun-mid/60 hover:text-or-sacre">← Ma Journée</Link>
    </div>
  );
}
