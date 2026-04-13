"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";

interface ClientInfo {
  name: string;
  initials: string;
  dayNumber: number;
}

interface Reminders {
  morningReminderEnabled: boolean;
  morningReminderTime: string;
  eveningReminderEnabled: boolean;
  eveningReminderTime: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function ClientHeader() {
  const { lang } = useLanguage();
  const T = (key: { EN: string; FR: string }) => key[lang];

  const [menuOpen, setMenuOpen] = useState(false);
  const [info, setInfo] = useState<ClientInfo | null>(null);
  const [reminders, setReminders] = useState<Reminders | null>(null);

  // PWA install state
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.name) {
          const name = data.user.name;
          const initials = name
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          const dayNumber = data.dayNumber ?? 1;
          setInfo({ name, initials, dayNumber });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (menuOpen && !reminders) {
      fetch("/api/user/reminders")
        .then((res) => res.json())
        .then((data) => setReminders(data))
        .catch(() => {});
    }
  }, [menuOpen, reminders]);

  // PWA install detection
  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const onInstalled = () => setIsStandalone(true);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function isIos(): boolean {
    if (typeof navigator === "undefined") return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent || "");
  }

  async function handleInstall() {
    setMenuOpen(false);
    if (deferredPrompt) {
      // Android / Chrome desktop — native prompt
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
      return;
    }
    if (isIos()) {
      // iOS Safari — show manual instructions modal
      setShowIosModal(true);
      return;
    }
    // Unknown — show iOS modal as fallback (most users on other browsers can't install anyway)
    setShowIosModal(true);
  }

  function handleSignOut() {
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
      window.location.replace("/login");
    });
  }

  async function updateReminder(field: string, value: boolean | string) {
    if (!reminders) return;
    const updated = { ...reminders, [field]: value };
    setReminders(updated);
    await fetch("/api/user/reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    }).catch(() => {});
  }

  return (
    <>
      <header
        data-client-header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: "rgba(253, 250, 244, 0.97)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "0.5px solid #E8D5A8",
          height: "48px",
        }}
      >
        <div
          className="h-full flex items-center justify-between"
          style={{ maxWidth: "640px", margin: "0 auto", padding: "0 20px" }}
        >
          <Link href="/client/home" className="flex flex-col items-start leading-none">
            <span
              style={{
                fontFamily: "'Cormorant SC', serif",
                letterSpacing: "0.12em",
                color: "#B8821E",
                fontWeight: 400,
              }}
              className="text-sm"
            >
              BEEFREQUENCY
            </span>
            <span className="font-ui text-[9px] text-brun-mid/70 tracking-wide mt-0.5">
              by Joffrey Deleplanque
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {info && (
              <div className="w-7 h-7 rounded-full bg-or-sacre/15 flex items-center justify-center">
                <span className="text-[10px] font-ui text-or-sacre font-medium">{info.initials}</span>
              </div>
            )}
            <button
              onClick={() => setMenuOpen(true)}
              className="flex flex-col items-center justify-center w-7 h-7 gap-[4px]"
              aria-label="Menu"
            >
              <span className="block w-4 h-[1.2px] bg-brun-chaud" />
              <span className="block w-4 h-[1.2px] bg-brun-chaud" />
              <span className="block w-4 h-[1.2px] bg-brun-chaud" />
            </button>
          </div>
        </div>
      </header>

      {/* Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/20" onClick={() => setMenuOpen(false)} />
      )}

      {/* Slide-in menu */}
      <div
        className="fixed top-0 right-0 z-[70] h-full bg-creme-sacree shadow-lg flex flex-col transition-transform duration-200 ease-out overflow-y-auto"
        style={{
          width: "280px",
          transform: menuOpen ? "translateX(0)" : "translateX(100%)",
          borderLeft: "0.5px solid #E8D5A8",
        }}
      >
        {/* Close */}
        <div className="flex justify-end p-4">
          <button onClick={() => setMenuOpen(false)} className="text-brun-mid/50 hover:text-brun-chaud text-lg" aria-label="Close">
            {"\u2715"}
          </button>
        </div>

        {/* Client info */}
        {info && (
          <div className="px-6 pb-5">
            <p className="font-display text-xl text-brun-chaud">{info.name}</p>
            <p className="font-ui text-sm text-or-sacre mt-1">{T(t.home.day)} {info.dayNumber}</p>
          </div>
        )}

        <div className="mx-6 border-t border-or-pale" />

        {/* Reminders */}
        <div className="px-6 py-5">
          <p className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-4">{T(t.nav.reminders)}</p>

          {/* Morning reminder */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="font-ui text-sm text-brun-chaud">{"\u2600\uFE0F"} {T(t.home.morningCheckin)}</span>
              <button
                onClick={() => updateReminder("morningReminderEnabled", !reminders?.morningReminderEnabled)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  reminders?.morningReminderEnabled ? "bg-or-sacre" : "bg-or-pale"
                }`}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                  style={{ left: reminders?.morningReminderEnabled ? "22px" : "2px" }}
                />
              </button>
            </div>
            {reminders?.morningReminderEnabled && (
              <input
                type="time"
                value={reminders.morningReminderTime}
                onChange={(e) => updateReminder("morningReminderTime", e.target.value)}
                className="mt-2 w-full px-2 py-1 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre"
              />
            )}
          </div>

          {/* Evening reminder */}
          <div>
            <div className="flex items-center justify-between">
              <span className="font-ui text-sm text-brun-chaud">{"\uD83C\uDF19"} {T(t.home.eveningCheckin)}</span>
              <button
                onClick={() => updateReminder("eveningReminderEnabled", !reminders?.eveningReminderEnabled)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  reminders?.eveningReminderEnabled ? "bg-or-sacre" : "bg-or-pale"
                }`}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                  style={{ left: reminders?.eveningReminderEnabled ? "22px" : "2px" }}
                />
              </button>
            </div>
            {reminders?.eveningReminderEnabled && (
              <input
                type="time"
                value={reminders.eveningReminderTime}
                onChange={(e) => updateReminder("eveningReminderTime", e.target.value)}
                className="mt-2 w-full px-2 py-1 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre"
              />
            )}
          </div>
        </div>

        <div className="mx-6 border-t border-or-pale" />

        {/* Settings link */}
        <div className="px-6 py-4">
          <Link
            href="/client/settings"
            onClick={() => setMenuOpen(false)}
            className="font-ui text-sm text-brun-chaud hover:text-or-sacre transition-colors"
          >
            {T(t.settings.title)}
          </Link>
        </div>

        {/* Install app — seulement si pas déjà en standalone */}
        {!isStandalone && (
          <>
            <div className="mx-6 border-t border-or-pale" />
            <div className="px-6 py-4">
              <button
                onClick={handleInstall}
                className="font-ui text-sm text-brun-chaud hover:text-or-sacre transition-colors text-left w-full"
              >
                📲 {T({ EN: "Install the app", FR: "Installer l'app" })}
              </button>
            </div>
          </>
        )}

        <div className="mx-6 border-t border-or-pale" />

        {/* Sign out */}
        <div className="px-6 py-5">
          <button onClick={handleSignOut} className="font-ui text-sm text-brun-mid/60 hover:text-brun-chaud transition-colors">
            {T(t.nav.signOut)}
          </button>
        </div>
      </div>

      {/* iOS install instructions modal */}
      {showIosModal && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/40"
            onClick={() => setShowIosModal(false)}
          />
          <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
            <div className="bg-creme-sacree border border-or-pale rounded-sm max-w-sm w-full p-6 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <h2 className="font-display text-xl text-brun-chaud">
                  {T({ EN: "Install the app", FR: "Installer l'app" })}
                </h2>
                <button
                  onClick={() => setShowIosModal(false)}
                  className="text-brun-mid hover:text-brun-chaud text-xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <p className="font-ui text-sm text-brun-mid mb-4">
                {T({
                  EN: "On iPhone (Safari):",
                  FR: "Sur iPhone (Safari) :",
                })}
              </p>
              <ol className="font-ui text-sm text-brun-chaud space-y-3 list-decimal list-inside">
                <li>
                  {T({
                    EN: "Tap the Share button (square with up arrow)",
                    FR: "Appuie sur le bouton Partager (carré avec flèche)",
                  })}
                </li>
                <li>
                  {T({
                    EN: "Scroll and tap \"Add to Home Screen\"",
                    FR: "Fais défiler et appuie sur \"Sur l'écran d'accueil\"",
                  })}
                </li>
                <li>
                  {T({ EN: "Tap \"Add\"", FR: "Appuie sur \"Ajouter\"" })}
                </li>
              </ol>
              <p className="font-ui text-xs text-brun-mid/60 italic mt-4">
                {T({
                  EN: "The app will appear on your home screen.",
                  FR: "L'application apparaîtra sur ton écran d'accueil.",
                })}
              </p>
              <button
                onClick={() => setShowIosModal(false)}
                className="mt-5 w-full py-2.5 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-sharp hover:bg-ambre-vif transition-colors"
              >
                {T({ EN: "Got it", FR: "Compris" })}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
