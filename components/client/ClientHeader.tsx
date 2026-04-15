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
  type InstallModal =
    | null
    | "ios"
    | "android"
    | "mac-safari"
    | "mac-chrome"
    | "windows-chrome"
    | "windows-edge"
    | "firefox"
    | "generic";

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState({
    isIOS: false,
    isAndroid: false,
    isMac: false,
    isWindows: false,
    isSafari: false,
    isChrome: false,
    isFirefox: false,
    isEdge: false,
  });
  const [installModal, setInstallModal] = useState<InstallModal>(null);

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

    // Platform detection — iPadOS 13+ reports "MacIntel" by default (Request Desktop),
    // so we use touch points to catch iPads pretending to be Mac
    const ua = navigator.userAgent || "";
    const uaIos = /iPhone|iPad|iPod/i.test(ua);
    const iPadOsAsMac =
      navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    const isIOS = uaIos || iPadOsAsMac;
    const isAndroid = /Android/i.test(ua);
    const isMac = /Macintosh/i.test(ua) && !isIOS;
    const isWindows = /Windows/i.test(ua);
    const isEdge = /Edg/i.test(ua);
    const isChrome = /Chrome/i.test(ua) && !isEdge;
    const isSafari = /Safari/i.test(ua) && !isChrome && !isEdge;
    const isFirefox = /Firefox/i.test(ua);
    setPlatform({ isIOS, isAndroid, isMac, isWindows, isSafari, isChrome, isFirefox, isEdge });

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

  async function handleInstall() {
    setMenuOpen(false);
    if (isStandalone) return;

    const { isIOS, isAndroid, isMac, isWindows, isSafari, isChrome, isFirefox, isEdge } = platform;

    // Try native install prompt first (Android Chrome, Desktop Chrome, Edge)
    if (deferredPrompt && (isAndroid || isChrome || isEdge)) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsStandalone(true);
        }
      } finally {
        setDeferredPrompt(null);
      }
      return;
    }

    // Route to the appropriate instruction modal
    if (isIOS) {
      setInstallModal("ios");
    } else if (isAndroid) {
      setInstallModal("android");
    } else if (isMac && isSafari) {
      setInstallModal("mac-safari");
    } else if (isMac && isChrome) {
      setInstallModal("mac-chrome");
    } else if (isWindows && isChrome) {
      setInstallModal("windows-chrome");
    } else if (isWindows && isEdge) {
      setInstallModal("windows-edge");
    } else if (isFirefox) {
      setInstallModal("firefox");
    } else {
      setInstallModal("generic");
    }
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

        {/* Install app — toujours visible sauf si déjà en standalone */}
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

        {/* Aide installation — toujours visible */}
        <div className="mx-6 border-t border-or-pale" />
        <div className="px-6 py-4">
          <Link
            href="/client/help/install"
            onClick={() => setMenuOpen(false)}
            className="font-ui text-sm text-brun-chaud hover:text-or-sacre transition-colors"
          >
            💡 {T({ EN: "Install help", FR: "Aide installation" })}
          </Link>
        </div>

        <div className="mx-6 border-t border-or-pale" />

        {/* Sign out */}
        <div className="px-6 py-5">
          <button onClick={handleSignOut} className="font-ui text-sm text-brun-mid/60 hover:text-brun-chaud transition-colors">
            {T(t.nav.signOut)}
          </button>
        </div>
      </div>

      {/* Adaptive install modal — content varies by platform */}
      {installModal && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/40"
            onClick={() => setInstallModal(null)}
          />
          <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
            <div className="bg-creme-sacree border border-or-pale rounded-sm max-w-sm w-full p-6 shadow-xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <h2 className="font-display text-xl text-brun-chaud">
                  📲 {T({ EN: "Install the app", FR: "Installer l'app" })}
                </h2>
                <button
                  onClick={() => setInstallModal(null)}
                  className="text-brun-mid hover:text-brun-chaud text-xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <InstallInstructions variant={installModal} T={T} />

              {/* Link to detailed help page */}
              <Link
                href="/client/help/install"
                onClick={() => setInstallModal(null)}
                className="block text-center mt-4 font-ui text-xs text-or-sacre underline hover:text-ambre-vif transition-colors"
              >
                {T({ EN: "Need detailed help?", FR: "Besoin d'aide détaillée ?" })}
              </Link>

              <button
                onClick={() => setInstallModal(null)}
                className="mt-3 w-full py-2.5 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-sharp hover:bg-ambre-vif transition-colors"
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

// ── Install instructions content — varies per platform ──

function InstallInstructions({
  variant,
  T,
}: {
  variant:
    | "ios"
    | "android"
    | "mac-safari"
    | "mac-chrome"
    | "windows-chrome"
    | "windows-edge"
    | "firefox"
    | "generic";
  T: (key: { EN: string; FR: string }) => string;
}) {
  const subtitleCls = "font-ui text-sm text-brun-mid mb-4";
  const stepsCls = "font-ui text-sm text-brun-chaud space-y-3 list-decimal list-inside";
  const footerCls = "font-ui text-xs text-brun-mid/60 italic mt-4";

  if (variant === "ios") {
    return (
      <>
        <p className={subtitleCls}>
          {T({ EN: "On iPhone (Safari):", FR: "Sur iPhone (Safari) :" })}
        </p>
        <ol className={stepsCls}>
          <li>{T({ EN: "Tap the Share button (square with up arrow)", FR: "Appuie sur le bouton Partager (carré avec flèche)" })}</li>
          <li>{T({ EN: "Scroll and tap \"Add to Home Screen\"", FR: "Fais défiler et appuie sur \"Sur l'écran d'accueil\"" })}</li>
          <li>{T({ EN: "Tap \"Add\"", FR: "Appuie sur \"Ajouter\"" })}</li>
        </ol>
        <p className={footerCls}>
          {T({ EN: "The app will appear on your home screen.", FR: "L'application apparaîtra sur ton écran d'accueil." })}
        </p>
      </>
    );
  }

  if (variant === "android") {
    return (
      <>
        <p className={subtitleCls}>
          {T({ EN: "On Android:", FR: "Sur Android :" })}
        </p>
        <ol className={stepsCls}>
          <li>{T({ EN: "Open the menu (⋮ three dots top right)", FR: "Ouvre le menu (⋮ trois points en haut à droite)" })}</li>
          <li>{T({ EN: "Tap \"Install app\" or \"Add to Home screen\"", FR: "Appuie sur \"Installer l'application\" ou \"Ajouter à l'écran d'accueil\"" })}</li>
          <li>{T({ EN: "Confirm the installation", FR: "Confirme l'installation" })}</li>
        </ol>
        <p className={footerCls}>
          {T({ EN: "The app will appear on your home screen.", FR: "L'application apparaîtra sur ton écran d'accueil." })}
        </p>
      </>
    );
  }

  if (variant === "mac-safari") {
    return (
      <>
        <p className={subtitleCls}>
          {T({ EN: "On Mac (Safari):", FR: "Sur Mac (Safari) :" })}
        </p>
        <ol className={stepsCls}>
          <li>{T({ EN: "Click \"File\" in the menu bar", FR: "Clique sur \"Fichier\" dans la barre de menu" })}</li>
          <li>{T({ EN: "Select \"Add to Dock\"", FR: "Sélectionne \"Ajouter au Dock\"" })}</li>
          <li>{T({ EN: "Click \"Add\"", FR: "Clique sur \"Ajouter\"" })}</li>
        </ol>
        <p className={footerCls}>
          {T({ EN: "The app will appear in your Dock.", FR: "L'application apparaîtra dans ton Dock." })}
        </p>
      </>
    );
  }

  if (variant === "mac-chrome") {
    return (
      <>
        <p className={subtitleCls}>
          {T({ EN: "On Mac (Chrome):", FR: "Sur Mac (Chrome) :" })}
        </p>
        <ol className={stepsCls}>
          <li>{T({ EN: "Click the install icon in the address bar (⊕)", FR: "Clique sur l'icône d'installation dans la barre d'adresse (⊕)" })}</li>
          <li>{T({ EN: "Or go to Menu (⋮) → \"Install Hive…\"", FR: "Ou va dans Menu (⋮) → \"Installer Hive…\"" })}</li>
          <li>{T({ EN: "Click \"Install\"", FR: "Clique sur \"Installer\"" })}</li>
        </ol>
        <p className={footerCls}>
          {T({ EN: "The app will open like a native app.", FR: "L'application s'ouvrira comme une app native." })}
        </p>
      </>
    );
  }

  if (variant === "windows-chrome") {
    return (
      <>
        <p className={subtitleCls}>
          {T({ EN: "On Windows (Chrome):", FR: "Sur Windows (Chrome) :" })}
        </p>
        <ol className={stepsCls}>
          <li>{T({ EN: "Click the install icon in the address bar (⊕)", FR: "Clique sur l'icône d'installation dans la barre d'adresse (⊕)" })}</li>
          <li>{T({ EN: "Or go to Menu (⋮) → \"Install Hive…\"", FR: "Ou va dans Menu (⋮) → \"Installer Hive…\"" })}</li>
          <li>{T({ EN: "Click \"Install\"", FR: "Clique sur \"Installer\"" })}</li>
        </ol>
        <p className={footerCls}>
          {T({ EN: "The app will appear in your Start menu.", FR: "L'application apparaîtra dans ton menu Démarrer." })}
        </p>
      </>
    );
  }

  if (variant === "windows-edge") {
    return (
      <>
        <p className={subtitleCls}>
          {T({ EN: "On Windows (Edge):", FR: "Sur Windows (Edge) :" })}
        </p>
        <ol className={stepsCls}>
          <li>{T({ EN: "Click the install icon in the address bar", FR: "Clique sur l'icône d'installation dans la barre d'adresse" })}</li>
          <li>{T({ EN: "Or Menu (⋯) → \"Apps\" → \"Install this site as an app\"", FR: "Ou Menu (⋯) → \"Applications\" → \"Installer ce site en tant qu'application\"" })}</li>
          <li>{T({ EN: "Click \"Install\"", FR: "Clique sur \"Installer\"" })}</li>
        </ol>
        <p className={footerCls}>
          {T({ EN: "The app will appear in your Start menu.", FR: "L'application apparaîtra dans ton menu Démarrer." })}
        </p>
      </>
    );
  }

  if (variant === "firefox") {
    return (
      <>
        <p className={subtitleCls}>
          {T({
            EN: "Firefox does not support installing web apps on desktop.",
            FR: "Firefox ne supporte pas l'installation d'applications web sur desktop.",
          })}
        </p>
        <p className="font-ui text-sm text-brun-chaud mb-2">
          {T({ EN: "To install Hive:", FR: "Pour installer Hive :" })}
        </p>
        <ul className="font-ui text-sm text-brun-chaud space-y-2 list-disc list-inside">
          <li>{T({ EN: "On Mac: open this link in Safari", FR: "Sur Mac : ouvre ce lien dans Safari" })}</li>
          <li>{T({ EN: "On Windows: open this link in Chrome or Edge", FR: "Sur Windows : ouvre ce lien dans Chrome ou Edge" })}</li>
          <li>{T({ EN: "Or open this link on your phone", FR: "Ou ouvre ce lien sur ton téléphone" })}</li>
        </ul>
      </>
    );
  }

  // generic fallback
  return (
    <>
      <p className={subtitleCls}>
        {T({ EN: "To install Hive as an app:", FR: "Pour installer Hive comme une application :" })}
      </p>
      <div className="space-y-3">
        <div>
          <p className="font-display text-sm text-brun-chaud mb-1">
            {T({ EN: "On mobile:", FR: "Sur mobile :" })}
          </p>
          <ul className="font-ui text-xs text-brun-chaud space-y-1 list-disc list-inside">
            <li>{T({ EN: "iPhone: Share → Add to Home Screen", FR: "iPhone : Partager → Sur l'écran d'accueil" })}</li>
            <li>{T({ EN: "Android: Menu → Install app", FR: "Android : Menu → Installer l'application" })}</li>
          </ul>
        </div>
        <div>
          <p className="font-display text-sm text-brun-chaud mb-1">
            {T({ EN: "On desktop:", FR: "Sur desktop :" })}
          </p>
          <ul className="font-ui text-xs text-brun-chaud space-y-1 list-disc list-inside">
            <li>{T({ EN: "Safari Mac: File → Add to Dock", FR: "Safari Mac : Fichier → Ajouter au Dock" })}</li>
            <li>{T({ EN: "Chrome/Edge: ⊕ icon in address bar", FR: "Chrome/Edge : icône ⊕ dans la barre d'adresse" })}</li>
          </ul>
        </div>
      </div>
      <p className={footerCls}>hive.joffreydeleplanque.com</p>
    </>
  );
}
