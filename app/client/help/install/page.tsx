"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

type Platform = "iphone" | "android" | "mac";

export default function InstallHelpPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [platform, setPlatform] = useState<Platform>("iphone");
  const T = (key: { EN: string; FR: string }) => key[lang];

  return (
    <div className="-mx-4 -mt-16 -mb-24 min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-or-sacre text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button
          onClick={() => router.back()}
          className="p-1 -ml-1 hover:bg-white/10 rounded"
          aria-label="Retour"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="font-display text-lg">
          {T({ EN: "How to install the app", FR: "Comment installer l'app" })}
        </h1>
      </header>

      {/* Intro */}
      <div className="bg-white border-b border-or-pale/40 px-4 py-4">
        <p className="font-ui text-sm text-brun-chaud leading-relaxed">
          {T({
            EN: "BeeFrequency works like a real app. Install it directly from your browser — no App Store needed.",
            FR: "BeeFrequency fonctionne comme une vraie application. Installe-la directement depuis ton navigateur, pas besoin de l'App Store.",
          })}
        </p>
      </div>

      {/* Platform tabs */}
      <div className="flex bg-white border-b border-or-pale/40 sticky top-[52px] z-30">
        {(["iphone", "android", "mac"] as Platform[]).map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-2 font-ui text-sm transition-colors ${
              platform === p
                ? "border-b-2 border-or-sacre text-or-sacre"
                : "border-b-2 border-transparent text-brun-mid"
            }`}
          >
            <PlatformIcon platform={p} />
            <span>{p === "iphone" ? "iPhone" : p === "android" ? "Android" : "Mac"}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {platform === "iphone" && <IPhoneGuide T={T} lang={lang} />}
        {platform === "android" && <AndroidGuide T={T} lang={lang} />}
        {platform === "mac" && <MacGuide T={T} lang={lang} />}
      </div>

      {/* Footer link to settings */}
      <div className="p-4 pb-8 text-center">
        <Link
          href="/client/settings"
          className="font-ui text-xs text-or-sacre hover:text-ambre-vif underline"
        >
          {T({ EN: "← Back to settings", FR: "← Retour aux paramètres" })}
        </Link>
      </div>
    </div>
  );
}

// ── Platform icon ──

function PlatformIcon({ platform }: { platform: Platform }) {
  if (platform === "iphone") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
      </svg>
    );
  }
  if (platform === "android") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25S8.25 13.31 8.25 14 7.69 15.25 7 15.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/>
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
}

// ── iPhone guide ──

function IPhoneGuide({ T, lang }: { T: (k: { EN: string; FR: string }) => string; lang: "EN" | "FR" }) {
  return (
    <>
      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="font-ui text-sm text-amber-800">
          ⚠️ {T({
            EN: "You must use Safari. This option does not exist in Chrome or Firefox on iPhone.",
            FR: "Tu dois utiliser Safari. L'option n'existe pas dans Chrome ou Firefox sur iPhone.",
          })}
        </p>
      </div>

      {/* Step 1 */}
      <StepCard
        number={1}
        title={T({ EN: "Share button", FR: "Bouton Partager" })}
        instruction={T({
          EN: "Tap the Share button (square with an up arrow) at the bottom of the screen",
          FR: "Appuie sur le bouton Partager (carré avec flèche ↑) en bas de l'écran",
        })}
      >
        <IPhoneMockup step={1} />
      </StepCard>

      {/* Step 2 */}
      <StepCard
        number={2}
        title={T({ EN: "Add to Home Screen", FR: "Sur l'écran d'accueil" })}
        instruction={T({
          EN: 'Scroll and tap "Add to Home Screen"',
          FR: "Fais défiler et appuie sur \"Sur l'écran d'accueil\"",
        })}
      >
        <IPhoneMockup step={2} />
      </StepCard>

      {/* Step 3 */}
      <StepCard
        number={3}
        title={T({ EN: "Confirm", FR: "Confirmer" })}
        instruction={T({
          EN: 'Tap "Add" at the top right',
          FR: "Appuie sur \"Ajouter\" en haut à droite",
        })}
      >
        <IPhoneMockup step={3} />
      </StepCard>

      {/* Success */}
      <SuccessCard text={T({
        EN: "The BeeFrequency icon appears on your home screen!",
        FR: "L'icône BeeFrequency apparaît sur ton écran d'accueil !",
      })} />

      {/* FAQ */}
      <FaqSection
        items={[
          {
            q: T({
              EN: "I can't find \"Add to Home Screen\"",
              FR: "Je ne trouve pas \"Sur l'écran d'accueil\"",
            }),
            a: T({
              EN: "Check you are in Safari (not Chrome). Scroll the list down.",
              FR: "Vérifie que tu es dans Safari (pas Chrome). Fais défiler la liste vers le bas.",
            }),
          },
          {
            q: T({
              EN: "The app opens in Safari instead of opening on its own",
              FR: "L'app s'ouvre dans Safari au lieu de s'ouvrir seule",
            }),
            a: T({
              EN: "Remove the icon and start again. Make sure to tap \"Add to Home Screen\", not \"Add Bookmark\".",
              FR: "Supprime l'icône et recommence. Assure-toi de cliquer \"Sur l'écran d'accueil\", pas \"Ajouter aux favoris\".",
            }),
          },
        ]}
      />
    </>
  );
}

// ── Android guide ──

function AndroidGuide({ T, lang }: { T: (k: { EN: string; FR: string }) => string; lang: "EN" | "FR" }) {
  return (
    <>
      {/* Option A */}
      <div>
        <h3 className="font-display text-base text-brun-chaud mb-3">
          {T({ EN: "Option A — Automatic", FR: "Option A — Automatique" })}
        </h3>
        <StepCard
          number={1}
          title={T({ EN: "Install banner", FR: "Bannière d'installation" })}
          instruction={T({
            EN: "A banner appears at the bottom: \"Add BeeFrequency\". Tap \"Install\".",
            FR: "Une bannière apparaît en bas : \"Ajouter BeeFrequency\". Appuie sur \"Installer\".",
          })}
        >
          <AndroidMockup variant="banner" />
        </StepCard>
      </div>

      {/* Option B */}
      <div>
        <h3 className="font-display text-base text-brun-chaud mb-3">
          {T({ EN: "Option B — Manual", FR: "Option B — Manuelle" })}
        </h3>
        <StepCard
          number={1}
          title={T({ EN: "Open menu", FR: "Ouvrir le menu" })}
          instruction={T({
            EN: "Tap the menu (⋮ three dots top right)",
            FR: "Appuie sur le menu (⋮ trois points en haut à droite)",
          })}
        >
          <AndroidMockup variant="menu" />
        </StepCard>
        <StepCard
          number={2}
          title={T({ EN: "Install app", FR: "Installer l'application" })}
          instruction={T({
            EN: "Tap \"Install app\" or \"Add to Home screen\", then confirm",
            FR: "Appuie sur \"Installer l'application\" ou \"Ajouter à l'écran d'accueil\", puis confirme",
          })}
        >
          <AndroidMockup variant="dropdown" />
        </StepCard>
      </div>

      {/* Success */}
      <SuccessCard text={T({
        EN: "The BeeFrequency icon appears on your home screen!",
        FR: "L'icône BeeFrequency apparaît sur ton écran d'accueil !",
      })} />

      {/* FAQ */}
      <FaqSection
        items={[
          {
            q: T({ EN: "The banner doesn't appear", FR: "La bannière n'apparaît pas" }),
            a: T({
              EN: "Open the menu ⋮ and look for \"Install app\".",
              FR: "Ouvre le menu ⋮ et cherche \"Installer l'application\".",
            }),
          },
          {
            q: T({ EN: "There's no \"Install\" option", FR: "L'option \"Installer\" n'existe pas" }),
            a: T({
              EN: "Use Google Chrome (best PWA support).",
              FR: "Utilise Google Chrome (meilleur support PWA).",
            }),
          },
        ]}
      />
    </>
  );
}

// ── Mac guide ──

function MacGuide({ T, lang }: { T: (k: { EN: string; FR: string }) => string; lang: "EN" | "FR" }) {
  return (
    <>
      {/* Prerequisite */}
      <div className="bg-creme-sacree border border-or-pale rounded-lg p-3">
        <p className="font-ui text-sm text-brun-chaud">
          💡 {T({
            EN: "macOS Sonoma (14) or newer required for Safari. On older versions, use Chrome.",
            FR: "macOS Sonoma (14) ou plus récent requis pour Safari. Sur les versions plus anciennes, utilise Chrome.",
          })}
        </p>
      </div>

      {/* Steps */}
      <StepCard
        number={1}
        title={T({ EN: "File menu", FR: "Menu Fichier" })}
        instruction={T({
          EN: "Click \"File\" in the menu bar at the top of the screen",
          FR: "Clique sur \"Fichier\" dans la barre de menu en haut de l'écran",
        })}
      >
        <MacMockup step={1} />
      </StepCard>

      <StepCard
        number={2}
        title={T({ EN: "Add to Dock", FR: "Ajouter au Dock" })}
        instruction={T({
          EN: "Click \"Add to Dock\" in the dropdown menu",
          FR: "Clique sur \"Ajouter au Dock\" dans le menu déroulant",
        })}
      >
        <MacMockup step={2} />
      </StepCard>

      <StepCard
        number={3}
        title={T({ EN: "Confirm", FR: "Confirmer" })}
        instruction={T({
          EN: "Click \"Add\" to confirm the installation",
          FR: "Clique sur \"Ajouter\" pour confirmer l'installation",
        })}
      >
        <MacMockup step={3} />
      </StepCard>

      {/* Success */}
      <SuccessCard text={T({
        EN: "The BeeFrequency icon appears in your Dock!",
        FR: "L'icône BeeFrequency apparaît dans ton Dock !",
      })} />

      {/* FAQ */}
      <FaqSection
        items={[
          {
            q: T({ EN: "I don't see \"Add to Dock\"", FR: "Je ne vois pas \"Ajouter au Dock\"" }),
            a: T({
              EN: "This feature requires macOS Sonoma (14) or newer. On older versions, use Chrome and install via the address bar install icon.",
              FR: "Cette fonction nécessite macOS Sonoma (14) ou plus récent. Sur les versions plus anciennes, utilise Chrome et installe via l'icône d'installation de la barre d'adresse.",
            }),
          },
          {
            q: T({ EN: "Using Chrome instead of Safari", FR: "Utiliser Chrome au lieu de Safari" }),
            a: T({
              EN: "In Chrome, click the install icon (⊕) in the address bar, or Menu (⋮) → \"Install BeeFrequency…\".",
              FR: "Dans Chrome, clique sur l'icône d'installation (⊕) dans la barre d'adresse, ou Menu (⋮) → \"Installer BeeFrequency…\".",
            }),
          },
        ]}
      />
    </>
  );
}

// ── Step card wrapper ──

function StepCard({
  number,
  title,
  instruction,
  children,
}: {
  number: number;
  title: string;
  instruction: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-or-pale/30 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-or-sacre text-white flex items-center justify-center font-ui font-bold text-sm shrink-0">
          {number}
        </div>
        <div className="flex-1">
          <p className="font-display text-base text-brun-chaud">{title}</p>
          <p className="font-ui text-sm text-brun-mid mt-1 leading-relaxed">{instruction}</p>
        </div>
      </div>
      <div className="flex justify-center">{children}</div>
    </div>
  );
}

// ── Success banner ──

function SuccessCard({ text }: { text: string }) {
  return (
    <div className="bg-foret/10 border border-foret/30 rounded-xl p-4 text-center">
      <p className="font-display text-base text-foret">✓ {text}</p>
    </div>
  );
}

// ── FAQ accordion ──

function FaqSection({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-2 pt-2">
      <h3 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-2">
        FAQ
      </h3>
      {items.map((item, i) => (
        <FaqItem key={i} q={item.q} a={item.a} />
      ))}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-lg border border-or-pale/30 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-3 text-left flex items-start justify-between gap-3 hover:bg-creme-sacree transition-colors"
      >
        <span className="font-ui text-sm text-brun-chaud flex-1">{q}</span>
        <span className={`text-or-sacre transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-0">
          <p className="font-ui text-sm text-brun-mid leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MOCKUPS
// ══════════════════════════════════════════════════════════════

// ── iPhone mockup ──

function IPhoneMockup({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="relative w-[240px] h-[490px] bg-[#1c1c1e] rounded-[40px] p-3 shadow-2xl">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[130px] h-[26px] bg-[#1c1c1e] rounded-b-[18px] z-10" />
      {/* Screen */}
      <div className="w-full h-full bg-[#f2f2f7] rounded-[30px] overflow-hidden relative">
        {/* Status bar */}
        <div className="h-10 flex justify-between items-end px-5 pb-1.5 text-[11px] font-semibold">
          <span>9:41</span>
          <span>📶 🔋</span>
        </div>

        {step === 1 && <IPhoneStep1 />}
        {step === 2 && <IPhoneStep2 />}
        {step === 3 && <IPhoneStep3 />}
      </div>
    </div>
  );
}

function IPhoneStep1() {
  return (
    <>
      {/* URL bar */}
      <div className="mx-3 bg-white rounded-xl px-3 py-2.5 text-center text-[11px] text-gray-700 shadow-sm">
        🔒 hive.joffreydeleplanque.com
      </div>
      {/* Logo content */}
      <div className="flex flex-col items-center mt-8 gap-2">
        <img
          src="/icons/icon-512.png"
          alt="BeeFrequency"
          className="w-16 h-16 rounded-2xl shadow-sm"
        />
        <span className="text-or-sacre font-bold text-base tracking-widest">
          BEEFREQUENCY
        </span>
        <span className="text-gray-500 text-[9px]">by Joffrey Deleplanque</span>
      </div>
      {/* Bottom bar with share button highlighted */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#f2f2f7]/95 border-t border-gray-200 flex justify-around items-center px-4 pb-3">
        <span className="text-base text-blue-500">◀</span>
        <span className="text-base text-blue-500">▶</span>
        <div className="relative">
          <span className="text-xl">⬆️</span>
          <div className="absolute -inset-2.5 border-[3px] border-red-500 rounded-full animate-pulse" />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-md">
            1
          </div>
        </div>
        <span className="text-base text-blue-500">📖</span>
        <span className="text-base text-blue-500">⊞</span>
      </div>
    </>
  );
}

function IPhoneStep2() {
  return (
    <>
      {/* Darkened background */}
      <div className="absolute inset-0 top-10 bg-black/30" />
      {/* Share sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-3 max-h-[80%] overflow-hidden">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
          <img
            src="/icons/icon-512.png"
            alt="BeeFrequency"
            className="w-10 h-10 rounded-lg"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[12px] text-gray-900 truncate">BeeFrequency</p>
            <p className="text-[9px] text-gray-500 truncate">hive.joffreydeleplanque.com</p>
          </div>
        </div>
        {/* Share icons row */}
        <div className="flex gap-3 py-3 overflow-x-auto">
          {["💬", "📧", "📝", "📋"].map((icon, i) => (
            <div key={i} className="flex flex-col items-center gap-1 min-w-[40px]">
              <div className="w-10 h-10 bg-[#f2f2f7] rounded-xl flex items-center justify-center text-base">
                {icon}
              </div>
              <span className="text-[8px] text-gray-500">—</span>
            </div>
          ))}
        </div>
        {/* Actions list */}
        <div className="space-y-0 text-[11px]">
          <div className="flex items-center gap-2.5 py-2 border-b border-gray-100">
            <div className="w-6 h-6 bg-[#f2f2f7] rounded flex items-center justify-center text-[10px]">⭐</div>
            <span>Ajouter aux favoris</span>
          </div>
          {/* Highlighted row */}
          <div className="relative -mx-3 px-3 py-2 bg-[#fff8e7] rounded">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-[#f2f2f7] rounded flex items-center justify-center text-[10px]">➕</div>
              <span className="font-semibold">Sur l&apos;écran d&apos;accueil</span>
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-md">
              2
            </div>
            <div className="absolute -inset-0 border-2 border-red-500 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2.5 py-2">
            <div className="w-6 h-6 bg-[#f2f2f7] rounded flex items-center justify-center text-[10px]">🖨️</div>
            <span>Imprimer</span>
          </div>
        </div>
      </div>
    </>
  );
}

function IPhoneStep3() {
  return (
    <>
      {/* Confirmation screen */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <button className="text-blue-500 text-[11px]">Annuler</button>
          <span className="font-semibold text-[12px]">Sur l&apos;écran d&apos;accueil</span>
          <div className="relative">
            <button className="text-blue-500 text-[11px] font-semibold">Ajouter</button>
            <div className="absolute -inset-2 border-[3px] border-red-500 rounded-lg animate-pulse" />
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-md">
              3
            </div>
          </div>
        </div>
        {/* Preview card */}
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm mt-8">
          <img
            src="/icons/icon-512.png"
            alt="BeeFrequency"
            className="w-12 h-12 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <input
              type="text"
              defaultValue="BeeFrequency"
              readOnly
              className="font-semibold text-[12px] text-gray-900 bg-transparent w-full outline-none"
            />
            <p className="text-[9px] text-gray-500 truncate mt-0.5">hive.joffreydeleplanque.com</p>
          </div>
        </div>
        <p className="text-center text-[9px] text-gray-500 mt-3 leading-tight">
          Une icône sera ajoutée à l&apos;écran d&apos;accueil pour accéder rapidement à ce site.
        </p>
      </div>
    </>
  );
}

// ── Android mockup ──

function AndroidMockup({ variant }: { variant: "banner" | "menu" | "dropdown" }) {
  return (
    <div className="relative w-[240px] h-[490px] bg-[#1a1a1a] rounded-[30px] p-2 shadow-2xl">
      <div className="w-full h-full bg-white rounded-[24px] overflow-hidden relative">
        {/* Status bar */}
        <div className="h-6 bg-or-sacre flex justify-end items-center px-3 text-[10px] text-white">
          9:41 📶 🔋
        </div>
        {/* Chrome toolbar */}
        <div className="h-12 bg-or-sacre flex items-center px-3 text-white gap-2">
          <span className="text-sm">‹</span>
          <div className={`flex-1 bg-white/20 rounded-full px-3 py-1.5 text-[10px] text-white truncate ${variant !== "menu" ? "" : ""}`}>
            🔒 hive.joffreydeleplanque.com
          </div>
          <div className="relative">
            <span className="text-base">⋮</span>
            {variant === "menu" && (
              <>
                <div className="absolute -inset-2 border-[3px] border-red-500 rounded-full animate-pulse" />
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-md">
                  1
                </div>
              </>
            )}
          </div>
        </div>
        {/* Content */}
        <div className="flex flex-col items-center justify-center pt-12 gap-2">
          <img
            src="/icons/icon-512.png"
            alt="BeeFrequency"
            className="w-16 h-16 rounded-2xl"
          />
          <span className="text-or-sacre font-bold text-base tracking-widest">
            BEEFREQUENCY
          </span>
          <span className="text-gray-500 text-[9px]">by Joffrey Deleplanque</span>
        </div>

        {/* Dropdown menu */}
        {variant === "dropdown" && (
          <div className="absolute top-[72px] right-3 bg-white rounded-xl shadow-2xl w-[180px] overflow-hidden z-10 border border-gray-100">
            <div className="px-3 py-2.5 text-[11px] text-gray-700 border-b border-gray-100">
              Nouvel onglet
            </div>
            <div className="px-3 py-2.5 text-[11px] text-gray-700 border-b border-gray-100">
              Historique
            </div>
            <div className="relative px-3 py-2.5 text-[11px] bg-[#fff8e7] font-semibold text-gray-900">
              Installer l&apos;application
              <div className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-md">
                2
              </div>
              <div className="absolute inset-0 border-2 border-red-500 rounded animate-pulse pointer-events-none" />
            </div>
            <div className="px-3 py-2.5 text-[11px] text-gray-700">
              Paramètres
            </div>
          </div>
        )}

        {/* Install banner */}
        {variant === "banner" && (
          <div className="absolute bottom-4 left-3 right-3 bg-white rounded-2xl shadow-2xl p-3 flex items-center gap-3 border border-gray-100">
            <img
              src="/icons/icon-512.png"
              alt="BeeFrequency"
              className="w-10 h-10 rounded-xl"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[11px] text-gray-900 truncate">Ajouter BeeFrequency</p>
              <p className="text-[9px] text-gray-500 truncate">à l&apos;écran d&apos;accueil</p>
            </div>
            <div className="relative">
              <button className="bg-or-sacre text-white text-[10px] font-semibold px-3 py-1.5 rounded-full">
                Installer
              </button>
              <div className="absolute -inset-1 border-[3px] border-red-500 rounded-full animate-pulse" />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-md">
                1
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mac mockup ──

function MacMockup({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="w-full max-w-[420px]">
      <div className="bg-[#f6f6f6] rounded-xl overflow-hidden shadow-2xl relative">
        {/* Title bar */}
        <div className="h-8 bg-gradient-to-b from-[#e8e8e8] to-[#d3d3d3] flex items-center px-3 gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28ca41]" />
        </div>
        {/* Menu bar */}
        <div className="h-6 bg-[#f6f6f6] flex items-center px-2 text-[10px] gap-3 border-b border-gray-300 relative">
          <span className="font-semibold">Safari</span>
          <div className="relative">
            <span className={`px-1.5 py-0.5 rounded ${step >= 1 ? "bg-blue-600 text-white" : ""}`}>
              Fichier
            </span>
            {step === 1 && (
              <>
                <div className="absolute -inset-1 border-[3px] border-red-500 rounded animate-pulse" />
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-md">
                  1
                </div>
              </>
            )}
          </div>
          <span>Édition</span>
          <span>Affichage</span>
          <span>Historique</span>

          {/* Dropdown (step 2) */}
          {step === 2 && (
            <div className="absolute top-6 left-10 bg-[#f6f6f6] rounded-md shadow-2xl min-w-[180px] py-1 z-20 border border-gray-200">
              <div className="px-4 py-1.5 text-[10px] flex justify-between">
                <span>Nouvel onglet</span>
                <span className="text-gray-400">⌘T</span>
              </div>
              <div className="px-4 py-1.5 text-[10px] flex justify-between">
                <span>Nouvelle fenêtre</span>
                <span className="text-gray-400">⌘N</span>
              </div>
              <div className="relative bg-blue-600 text-white px-4 py-1.5 text-[10px] flex justify-between font-semibold">
                <span>Ajouter au Dock…</span>
                <span className="text-white/70">⌘D</span>
                <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-md">
                  2
                </div>
              </div>
              <div className="px-4 py-1.5 text-[10px] flex justify-between">
                <span>Imprimer…</span>
                <span className="text-gray-400">⌘P</span>
              </div>
            </div>
          )}
        </div>
        {/* Toolbar */}
        <div className="h-10 bg-[#fafafa] flex items-center px-3 gap-2 border-b border-gray-300">
          <div className="w-6 h-6 bg-[#e8e8e8] rounded flex items-center justify-center text-xs text-gray-600">‹</div>
          <div className="w-6 h-6 bg-[#e8e8e8] rounded flex items-center justify-center text-xs text-gray-600">›</div>
          <div className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-1.5 text-[10px] text-center text-gray-700">
            hive.joffreydeleplanque.com
          </div>
        </div>
        {/* Content */}
        <div className="h-48 bg-gradient-to-br from-or-sacre to-ambre-vif flex flex-col items-center justify-center gap-2 relative">
          <img
            src="/icons/icon-512.png"
            alt="BeeFrequency"
            className="w-14 h-14 rounded-2xl bg-white p-1"
          />
          <span className="text-white font-bold text-base tracking-widest">
            BEEFREQUENCY
          </span>
          <span className="text-white/80 text-[9px]">by Joffrey Deleplanque</span>

          {/* Dialog (step 3) */}
          {step === 3 && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="bg-[#f6f6f6] rounded-xl shadow-2xl p-4 w-[260px] border border-gray-300">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src="/icons/icon-512.png"
                    alt="BeeFrequency"
                    className="w-10 h-10 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[11px] text-gray-900">BeeFrequency</p>
                    <p className="text-[9px] text-gray-500 truncate">hive.joffreydeleplanque.com</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 mb-3">
                  Ajouter ce site au Dock pour y accéder rapidement.
                </p>
                <div className="flex gap-2 justify-end">
                  <button className="px-3 py-1 text-[10px] border border-gray-300 rounded">
                    Annuler
                  </button>
                  <div className="relative">
                    <button className="px-3 py-1 text-[10px] bg-blue-600 text-white rounded font-semibold">
                      Ajouter
                    </button>
                    <div className="absolute -inset-1.5 border-[3px] border-red-500 rounded animate-pulse" />
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-md">
                      3
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
