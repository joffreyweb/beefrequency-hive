"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

// Réglage client : activer les notifications push sur cet appareil.
// Se cache si le navigateur n'est pas compatible (iPhone : PWA à installer d'abord).
export default function PushNotificationSection() {
  const { lang } = useLanguage();
  const T = (k: { EN: string; FR: string }) => k[lang];
  const [supported, setSupported] = useState(false);
  const [granted, setGranted] = useState(false);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (ok && Notification.permission === "granted") setGranted(true);
    if (ok && Notification.permission === "denied") setDenied(true);
  }, []);

  async function activate() {
    setBusy(true);
    setMsg("");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setDenied(perm === "denied");
        setMsg(T({ EN: "Permission not granted.", FR: "Permission non accordée." }));
        return;
      }

      const keyRes = await fetch("/api/push/vapid-public-key");
      const { key } = await keyRes.json();
      if (!key) {
        setMsg(
          T({
            EN: "Notifications are not configured on the server yet.",
            FR: "Les notifications ne sont pas encore configurées côté serveur.",
          }),
        );
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!res.ok) throw new Error();

      setGranted(true);
      setMsg(T({ EN: "Notifications enabled ✓", FR: "Notifications activées ✓" }));
    } catch {
      setMsg(T({ EN: "Could not enable notifications.", FR: "Impossible d'activer les notifications." }));
    } finally {
      setBusy(false);
    }
  }

  // Navigateur non compatible (ex. iPhone en onglet Safari, pas en PWA installée).
  if (!supported) return null;

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-3">
      <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid">
        {T({ EN: "Notifications", FR: "Notifications" })}
      </h2>
      <p className="font-ui text-sm text-brun-mid/70">
        {T({
          EN: "Get an alert on your phone when Joffrey writes to you or for your reminders.",
          FR: "Reçois une alerte sur ton téléphone quand Joffrey t'écrit ou pour tes rappels.",
        })}
      </p>

      {granted ? (
        <p className="font-ui text-sm text-foret">
          {T({ EN: "✓ Enabled on this device", FR: "✓ Activées sur cet appareil" })}
        </p>
      ) : denied ? (
        <p className="font-ui text-sm text-brun-mid/70">
          {T({
            EN: "Notifications are blocked — allow them in your browser settings.",
            FR: "Notifications bloquées — autorise-les dans les réglages de ton navigateur.",
          })}
        </p>
      ) : (
        <button
          type="button"
          onClick={activate}
          disabled={busy}
          className="px-4 py-2 rounded-[8px] bg-or-sacre text-white text-sm font-ui hover:bg-ambre-vif transition-colors disabled:opacity-50"
        >
          {busy
            ? T({ EN: "Enabling…", FR: "Activation…" })
            : T({ EN: "Enable notifications", FR: "Activer les notifications" })}
        </button>
      )}

      {msg && (
        <p className={`font-ui text-xs ${msg.includes("✓") ? "text-foret" : "text-brun-mid/70"}`}>{msg}</p>
      )}
    </div>
  );
}
