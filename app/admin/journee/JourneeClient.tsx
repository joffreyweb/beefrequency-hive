"use client";

import { useState, useCallback } from "react";
import type { DayPlan } from "@/lib/journee";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function JourneeClient({ initialPlan }: { initialPlan: DayPlan }) {
  const [plan, setPlan] = useState<DayPlan>(initialPlan);
  const [capture, setCapture] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/journee");
      if (r.ok) setPlan(await r.json());
    } catch {
      /* silencieux */
    }
  }, []);

  async function addCapture() {
    const title = capture.trim();
    if (!title) return;
    setBusy(true);
    setCapture("");
    try {
      await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, status: "INBOX" }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function patchTask(id: string, body: Record<string, unknown>) {
    await fetch(`/api/admin/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await refresh();
  }

  async function deleteTask(id: string) {
    await fetch(`/api/admin/tasks/${id}`, { method: "DELETE" });
    await refresh();
  }

  async function markPosted(id: string) {
    await fetch(`/api/admin/content/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "POSTED" }),
    });
    await refresh();
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Bandeau du jour */}
      <div className="mb-6">
        <p className="font-caps text-[11px] tracking-[0.2em] uppercase text-or-sacre">Ma Journée</p>
        <h1 className="font-display text-3xl text-brun-chaud capitalize mt-0.5">{plan.dateLabel}</h1>
        <p className="font-ui text-sm text-brun-mid/70 mt-1">
          Une chose à la fois. Respire, puis choisis ton premier pas.
        </p>
      </div>

      {/* Capture rapide — toujours visible */}
      <div className="flex gap-2 mb-6">
        <input
          value={capture}
          onChange={(e) => setCapture(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCapture()}
          placeholder="Capture rapide — une pensée, une tâche…"
          className="flex-1 px-4 py-3 font-ui text-sm text-brun-chaud bg-cire-chaude border border-or-pale rounded-[10px] focus:outline-none focus:border-or-sacre transition-colors"
        />
        <button
          onClick={addCapture}
          disabled={busy || !capture.trim()}
          className="px-5 py-3 font-caps text-sm bg-or-sacre text-white rounded-[10px] hover:bg-ambre-profond transition-colors disabled:opacity-30"
        >
          Capturer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Colonne gauche : Focus + Inbox */}
        <div className="space-y-5">
          <Card title="Focus du jour" count={plan.focus.length} hint="3 à 5 max">
            {plan.focus.length === 0 ? (
              <Empty text="Rien de figé. Fais monter une intention depuis l'inbox." />
            ) : (
              <ul className="space-y-2">
                {plan.focus.map((t) => (
                  <li key={t.id} className="flex items-start gap-3 p-3 bg-creme-sacree border border-or-pale rounded-[10px]">
                    <button
                      onClick={() => patchTask(t.id, { status: "DONE" })}
                      aria-label="Terminer"
                      className="mt-0.5 w-5 h-5 rounded-full border-2 border-or-sacre shrink-0 hover:bg-or-sacre/20 transition-colors"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-ui text-[15px] text-brun-chaud leading-snug">{t.title}</p>
                      {(t.projectName || t.clientName) && (
                        <p className="text-[11px] font-ui text-brun-mid/60 mt-0.5">
                          {t.projectName ? `${t.projectName}` : ""}
                          {t.projectName && t.clientName ? " · " : ""}
                          {t.clientName ?? ""}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => patchTask(t.id, { status: "WEEK" })}
                      className="text-[11px] font-ui text-brun-mid/50 hover:text-or-sacre"
                      title="Repousser à cette semaine"
                    >
                      ↦
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Inbox" count={plan.inbox.length} hint="à trier">
            {plan.inbox.length === 0 ? (
              <Empty text="Inbox vide. 🐝" />
            ) : (
              <ul className="space-y-1.5">
                {plan.inbox.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 p-2 bg-creme-sacree border border-or-pale rounded-[8px]">
                    <span className="flex-1 min-w-0 font-ui text-sm text-brun-chaud truncate">{t.title}</span>
                    <button onClick={() => patchTask(t.id, { status: "TODAY" })} className="text-[11px] font-caps px-2 py-1 bg-or-sacre/10 text-or-sacre rounded hover:bg-or-sacre/20" title="Aujourd'hui">Auj.</button>
                    <button onClick={() => patchTask(t.id, { status: "WEEK" })} className="text-[11px] font-caps px-2 py-1 bg-or-pale/40 text-brun-mid rounded hover:bg-or-pale/70" title="Cette semaine">Sem.</button>
                    <button onClick={() => deleteTask(t.id)} className="text-[11px] text-brun-mid/40 hover:text-red-500" title="Supprimer">✕</button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Colonne droite : Agenda + Prochain post + À-répondre */}
        <div className="space-y-5">
          <Card title="Agenda du jour" count={plan.appointments.length}>
            {plan.appointments.length === 0 ? (
              <Empty text="Aucun rendez-vous aujourd'hui." />
            ) : (
              <ul className="space-y-2">
                {plan.appointments.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 p-3 bg-creme-sacree border border-or-pale rounded-[10px]">
                    <span className="font-caps text-sm text-or-sacre w-14 shrink-0">{a.timeLabel}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-ui text-sm text-brun-chaud truncate">{a.clientName ?? a.title}</p>
                      <p className="text-[11px] font-ui text-brun-mid/60">{a.durationMin} min · {a.meetingType}</p>
                    </div>
                    {a.zoomLink && (
                      <a href={a.zoomLink} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-ui text-or-sacre hover:text-ambre-vif underline">🎥 Zoom</a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Prochain post Instagram" count={plan.postsRemaining}>
            {!plan.nextPost ? (
              <Empty text="Pas de post en attente." />
            ) : (
              <div className="p-3 bg-creme-sacree border border-or-pale rounded-[10px]">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => markPosted(plan.nextPost!.id)}
                    aria-label="Marquer posté"
                    className="mt-0.5 w-5 h-5 rounded border-2 border-or-sacre shrink-0 hover:bg-or-sacre/20 transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-ui text-[15px] text-brun-chaud leading-snug">
                      {plan.nextPost.pinned ? "📌 " : ""}{plan.nextPost.title}
                      {plan.nextPost.format ? <span className="text-brun-mid/50"> · {plan.nextPost.format}</span> : null}
                    </p>
                    {plan.nextPost.caption && (
                      <p className="text-[12px] font-ui text-brun-mid/70 mt-1 line-clamp-3 whitespace-pre-wrap">{plan.nextPost.caption}</p>
                    )}
                    {plan.nextPost.hashtags && (
                      <p className="text-[11px] font-ui text-or-sacre/80 mt-1 line-clamp-2">{plan.nextPost.hashtags}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card title="À répondre" count={plan.messages.length + plan.pendingActions.length}>
            {plan.messages.length + plan.pendingActions.length === 0 ? (
              <Empty text="Rien en attente. Tu es à jour." />
            ) : (
              <ul className="space-y-1.5">
                {plan.messages.map((m) => (
                  <li key={m.id} className="p-2 bg-creme-sacree border border-or-pale rounded-[8px]">
                    <p className="text-[11px] font-caps text-or-sacre">{m.senderName}</p>
                    <p className="font-ui text-sm text-brun-chaud truncate">{m.content}</p>
                  </li>
                ))}
                {plan.pendingActions.map((p) => (
                  <li key={p.id} className={`p-2 border rounded-[8px] ${p.urgency === "red" ? "border-red-300 bg-red-50" : "border-or-pale bg-creme-sacree"}`}>
                    <p className="font-ui text-sm text-brun-chaud truncate">{p.title}</p>
                    {p.clientName && <p className="text-[11px] font-ui text-brun-mid/60">{p.clientName}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Réglages du brief matinal */}
      <div className="mt-6">
        <button
          onClick={() => setShowSettings((s) => !s)}
          className="text-[12px] font-ui text-brun-mid/60 hover:text-or-sacre transition-colors"
        >
          {showSettings ? "▾ Réglages du brief matinal" : "▸ Réglages du brief matinal"}
        </button>
        {showSettings && <BriefSettings />}
      </div>
    </div>
  );
}

function Card({ title, count, hint, children }: { title: string; count?: number; hint?: string; children: React.ReactNode }) {
  return (
    <section className="bg-cire-chaude border border-or-pale rounded-[12px] p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">{title}</h2>
        <div className="flex items-center gap-2">
          {hint && <span className="text-[10px] font-ui text-brun-mid/45">{hint}</span>}
          {count !== undefined && count > 0 && (
            <span className="text-[11px] font-ui text-or-sacre bg-or-sacre/10 px-2 py-0.5 rounded-full">{count}</span>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="font-ui text-sm text-brun-mid/50 py-3">{text}</p>;
}

function BriefSettings() {
  const [hour, setHour] = useState(8);
  const [pushOn, setPushOn] = useState(true);
  const [emailOn, setEmailOn] = useState(true);
  const [email, setEmail] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  if (!loaded) {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((s) => {
        setHour(s.briefHour ?? 8);
        setPushOn(s.briefPushEnabled ?? true);
        setEmailOn(s.briefEmailEnabled ?? true);
        setEmail(s.briefEmail ?? "");
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefHour: hour,
          briefPushEnabled: pushOn,
          briefEmailEnabled: emailOn,
          briefEmail: email,
        }),
      });
      setMsg("Enregistré ✓");
    } finally {
      setSaving(false);
    }
  }

  async function enablePush() {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setMsg("Push non supporté sur cet appareil.");
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setMsg("Notifications refusées.");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const keyRes = await fetch("/api/push/vapid-public-key").then((r) => r.json());
      if (!keyRes.key) {
        setMsg("Push non configuré (VAPID).");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyRes.key) as unknown as BufferSource,
      });
      await fetch("/api/admin/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      setMsg("Cet appareil recevra le brief ✓");
    } catch {
      setMsg("Échec de l'activation push.");
    }
  }

  async function sendTest() {
    setMsg("Envoi du test…");
    try {
      const r = await fetch("/api/cron/morning-brief?test=1", { method: "POST" });
      setMsg(r.ok ? "Test envoyé (vérifie push/email)." : "Le test a échoué.");
    } catch {
      setMsg("Le test a échoué.");
    }
  }

  return (
    <div className="mt-3 bg-cire-chaude border border-or-pale rounded-[12px] p-5 space-y-4">
      <div className="flex items-center gap-3">
        <label className="font-ui text-sm text-brun-chaud">Heure du brief</label>
        <input
          type="number"
          min={0}
          max={23}
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          className="w-16 px-2 py-1.5 font-ui text-sm bg-creme-sacree border border-or-pale rounded-[8px] focus:outline-none focus:border-or-sacre"
        />
        <span className="font-ui text-xs text-brun-mid/60">h (Europe/Brussels)</span>
      </div>
      <label className="flex items-center gap-2 font-ui text-sm text-brun-chaud">
        <input type="checkbox" checked={pushOn} onChange={(e) => setPushOn(e.target.checked)} className="accent-or-sacre" />
        Notification push (app)
      </label>
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 font-ui text-sm text-brun-chaud">
          <input type="checkbox" checked={emailOn} onChange={(e) => setEmailOn(e.target.checked)} className="accent-or-sacre" />
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ton adresse email pour le brief"
          className="w-full px-3 py-2 font-ui text-sm bg-creme-sacree border border-or-pale rounded-[8px] focus:outline-none focus:border-or-sacre"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button onClick={save} disabled={saving} className="px-4 py-2 font-caps text-sm bg-or-sacre text-white rounded-[8px] hover:bg-ambre-profond disabled:opacity-40">
          {saving ? "…" : "Enregistrer"}
        </button>
        <button onClick={enablePush} className="px-4 py-2 font-caps text-sm bg-or-sacre/10 text-or-sacre rounded-[8px] hover:bg-or-sacre/20">
          Activer le push sur cet appareil
        </button>
        <button onClick={sendTest} className="px-4 py-2 font-caps text-sm bg-or-pale/40 text-brun-mid rounded-[8px] hover:bg-or-pale/70">
          Tester le brief
        </button>
        {msg && <span className="font-ui text-xs text-brun-mid/70">{msg}</span>}
      </div>
    </div>
  );
}
