"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

// Props du sidebar Finder-inspired
interface SidebarProps {
  adminName: string;
  pendingActionsCount: number;
  activeClientsCount: number;
  unreadMessagesCount: number;
}

export default function Sidebar({
  adminName,
  pendingActionsCount,
  activeClientsCount,
  unreadMessagesCount,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      setLoggingOut(false);
    }
  }

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="w-[200px] min-h-screen bg-cire-chaude flex flex-col" style={{ borderRight: "0.5px solid #E8D5A8" }}>
      {/* En-tête — identité Hive */}
      <div className="px-4 pt-6 pb-5">
        <div className="flex items-center gap-2">
          <span className="text-lg">🐝</span>
          <div>
            <p className="font-display text-base text-brun-chaud tracking-wide">Hive</p>
            <p className="font-caps text-[9px] text-or-sacre tracking-[0.15em] uppercase">Administration</p>
          </div>
        </div>
        <p className="text-[10px] font-ui text-brun-mid/50 mt-2 truncate">{adminName}</p>
      </div>

      {/* Section NAVIGATION */}
      <div className="px-3">
        <p className="text-[10px] font-ui uppercase tracking-[0.12em] text-or-sacre px-2 mb-1.5">
          Navigation
        </p>
        <nav className="space-y-0.5">
          <NavItem href="/admin/dashboard" label="Le Cockpit" active={isActive("/admin/dashboard")} badge={pendingActionsCount}>
            <GridIcon />
          </NavItem>
          <NavItem href="/admin/clients" label="La Ruche" active={isActive("/admin/clients")} badge={activeClientsCount}>
            <PeopleIcon />
          </NavItem>
          <NavItem href="/admin/atelier" label="L'Atelier" active={isActive("/admin/atelier")}>
            <SettingsIcon />
          </NavItem>
        </nav>
      </div>

      {/* Séparateur */}
      <div className="mx-5 my-3" style={{ borderTop: "0.5px solid #E8D5A8" }} />

      {/* Section OUTILS */}
      <div className="px-3">
        <p className="text-[10px] font-ui uppercase tracking-[0.12em] text-or-sacre px-2 mb-1.5">
          Outils
        </p>
        <nav className="space-y-0.5">
          <NavItem href="/admin/day-messages" label="Messages Matin" active={isActive("/admin/day-messages")}>
            <span>🌅</span>
          </NavItem>
          <NavItem href="/admin/messages" label="Messages" active={isActive("/admin/messages")} badge={unreadMessagesCount}>
            <ChatIcon />
          </NavItem>
          <NavItem href="/admin/settings" label="Paramètres" active={isActive("/admin/settings")}>
            <GearIcon />
          </NavItem>
        </nav>
      </div>

      {/* Pied — déconnexion */}
      <div className="mt-auto px-5 pb-5">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-[11px] font-ui text-brun-mid/35 hover:text-brun-mid transition-colors duration-150 disabled:opacity-50"
        >
          {loggingOut ? "Déconnexion..." : "Déconnexion"}
        </button>
      </div>
    </aside>
  );
}

// Composant item de navigation
function NavItem({
  href,
  label,
  active,
  badge,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 h-[34px] px-2 rounded-[8px] transition-all duration-150 ${
        active
          ? "bg-or-sacre text-white"
          : "text-brun-chaud hover:bg-or-pale/50"
      }`}
    >
      <span className={`w-[22px] h-[22px] flex items-center justify-center shrink-0 ${active ? "text-white" : "text-brun-mid"}`}>
        {children}
      </span>
      <span className="text-[13px] font-ui flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`text-[9px] font-ui px-1.5 py-0.5 rounded-full min-w-[16px] text-center ${
          active ? "bg-white/25 text-white" : "bg-or-sacre/15 text-or-sacre"
        }`}>
          {badge}
        </span>
      )}
    </Link>
  );
}

// Icônes SVG simples et propres
function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="5.5" cy="5" r="2.5" />
      <path d="M1 13c0-2.2 2-4 4.5-4s4.5 1.8 4.5 4" />
      <circle cx="11.5" cy="5.5" r="2" />
      <path d="M15 13c0-1.8-1.5-3.2-3.5-3.5" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 5h10M3 8h10M3 11h10" />
      <circle cx="5" cy="5" r="1.5" fill="currentColor" />
      <circle cx="11" cy="8" r="1.5" fill="currentColor" />
      <circle cx="7" cy="11" r="1.5" fill="currentColor" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h12v8H5l-3 3V3z" rx="1" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" strokeLinecap="round" />
    </svg>
  );
}
