"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/translations";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "desktop" | "unknown";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent || navigator.vendor || "";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function InstallPwaSection({ lang }: { lang: Lang }) {
  const T = (key: { EN: string; FR: string }) => key[lang];
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const onInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleNativeInstall() {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } finally {
      setInstalling(false);
    }
  }

  if (installed) {
    return (
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 text-center">
        <p className="font-display text-base text-foret">
          ✓ {T({ EN: "App installed", FR: "Application installée" })}
        </p>
        <p className="font-ui text-xs text-brun-mid mt-1">
          {T({
            EN: "You're using the installed app.",
            FR: "Tu utilises l'application installée.",
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-4">
      <div>
        <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid">
          {T({ EN: "Install the app", FR: "Installer l'application" })}
        </h2>
        <p className="font-ui text-sm text-brun-mid mt-2">
          {T({
            EN: "Add Hive to your home screen for quick access — like a real app.",
            FR: "Ajoute Hive sur ton écran d'accueil pour un accès rapide — comme une vraie app.",
          })}
        </p>
      </div>

      {/* Native install button (Android Chrome / Desktop Chrome) */}
      {deferredPrompt && (
        <button
          onClick={handleNativeInstall}
          disabled={installing}
          className="w-full py-3 bg-or-sacre text-white rounded-sharp font-ui text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-50"
        >
          {installing
            ? T({ EN: "Installing...", FR: "Installation..." })
            : T({ EN: "Install now", FR: "Installer maintenant" })}
        </button>
      )}

      {/* iOS instructions */}
      {platform === "ios" && (
        <div className="bg-creme-sacree border border-or-pale rounded-sm p-4">
          <p className="font-display text-sm text-brun-chaud mb-3">
            {T({ EN: "On iPhone (Safari)", FR: "Sur iPhone (Safari)" })}
          </p>
          <ol className="font-ui text-sm text-brun-chaud space-y-2 list-decimal list-inside">
            <li>
              {T({
                EN: "Open this page in Safari",
                FR: "Ouvre cette page dans Safari",
              })}
            </li>
            <li>
              {T({
                EN: "Tap the Share button (square with arrow)",
                FR: "Appuie sur le bouton Partager (carré avec flèche)",
              })}
            </li>
            <li>
              {T({
                EN: 'Scroll and tap "Add to Home Screen"',
                FR: "Fais défiler et appuie sur \"Sur l'écran d'accueil\"",
              })}
            </li>
            <li>
              {T({ EN: 'Tap "Add"', FR: "Appuie sur \"Ajouter\"" })}
            </li>
          </ol>
        </div>
      )}

      {/* Android instructions */}
      {platform === "android" && !deferredPrompt && (
        <div className="bg-creme-sacree border border-or-pale rounded-sm p-4">
          <p className="font-display text-sm text-brun-chaud mb-3">
            {T({ EN: "On Android (Chrome)", FR: "Sur Android (Chrome)" })}
          </p>
          <ol className="font-ui text-sm text-brun-chaud space-y-2 list-decimal list-inside">
            <li>
              {T({
                EN: "Open this page in Chrome",
                FR: "Ouvre cette page dans Chrome",
              })}
            </li>
            <li>
              {T({
                EN: "Tap the menu (3 dots top right)",
                FR: "Appuie sur le menu (3 points en haut à droite)",
              })}
            </li>
            <li>
              {T({
                EN: 'Tap "Install app" or "Add to Home screen"',
                FR: "Appuie sur \"Installer l'application\" ou \"Ajouter à l'écran d'accueil\"",
              })}
            </li>
            <li>
              {T({ EN: "Confirm the installation", FR: "Confirme l'installation" })}
            </li>
          </ol>
        </div>
      )}

      {/* Desktop / unknown — show both */}
      {(platform === "desktop" || platform === "unknown") && !deferredPrompt && (
        <div className="bg-creme-sacree border border-or-pale rounded-sm p-4 space-y-3">
          <div>
            <p className="font-display text-sm text-brun-chaud mb-2">
              {T({ EN: "iPhone (Safari)", FR: "iPhone (Safari)" })}
            </p>
            <p className="font-ui text-xs text-brun-mid">
              {T({
                EN: "Share button → Add to Home Screen",
                FR: "Bouton Partager → Sur l'écran d'accueil",
              })}
            </p>
          </div>
          <div>
            <p className="font-display text-sm text-brun-chaud mb-2">
              {T({ EN: "Android (Chrome)", FR: "Android (Chrome)" })}
            </p>
            <p className="font-ui text-xs text-brun-mid">
              {T({
                EN: "Menu (3 dots) → Install app",
                FR: "Menu (3 points) → Installer l'application",
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
