"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

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

  const isAtelier =
    isActive("/admin/atelier") ||
    isActive("/admin/elixirs") ||
    isActive("/admin/practices") ||
    isActive("/admin/recommendations") ||
    isActive("/admin/day-messages") ||
    isActive("/admin/journey-messages") ||
    isActive("/admin/elixir-library");

  return (
    <aside className="w-[200px] min-h-screen bg-cire-chaude flex flex-col" style={{ borderRight: "0.5px solid #E8D5A8" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-5">
        <div className="flex items-center gap-2">
          <span className="text-lg">{"\uD83D\uDC1D"}</span>
          <div>
            <p className="font-display text-base text-brun-chaud tracking-wide">Hive</p>
            <p className="font-caps text-[9px] text-or-sacre tracking-[0.15em] uppercase">Administration</p>
          </div>
        </div>
        <p className="text-[10px] font-ui text-brun-mid/50 mt-2 truncate">{adminName}</p>
      </div>

      {/* Navigation — 5 sections */}
      <div className="px-3 flex-1">
        <nav className="space-y-0.5">
          <NavItem
            href="/admin/dashboard"
            label="Le Cockpit"
            emoji={"\uD83C\uDFE0"}
            active={isActive("/admin/dashboard")}
            badge={pendingActionsCount}
          />
          <NavItem
            href="/admin/agenda"
            label="Agenda"
            emoji={"\uD83D\uDCC5"}
            active={isActive("/admin/agenda")}
          />
          <NavItem
            href="/admin/clients"
            label="La Ruche"
            emoji={"\uD83D\uDC1D"}
            active={isActive("/admin/clients")}
            badge={activeClientsCount}
          />
          <NavItem
            href="/admin/atelier"
            label="L'Atelier"
            emoji={"\uD83D\uDD27"}
            active={isAtelier}
          />
          <NavItem
            href="/admin/messages"
            label="Messages"
            emoji={"\uD83D\uDCAC"}
            active={isActive("/admin/messages")}
            badge={unreadMessagesCount}
          />
          <NavItem
            href="/admin/newsletter"
            label="Newsletter"
            emoji={"\u2709\uFE0F"}
            active={isActive("/admin/newsletter")}
          />
          <NavItem
            href="/admin/settings"
            label="Param\u00e8tres"
            emoji={"\u2699\uFE0F"}
            active={isActive("/admin/settings")}
          />
        </nav>
      </div>

      {/* Footer */}
      <div className="px-5 pb-5">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-[11px] font-ui text-brun-mid/35 hover:text-brun-mid transition-colors duration-150 disabled:opacity-50"
        >
          {loggingOut ? "D\u00e9connexion..." : "D\u00e9connexion"}
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  label,
  emoji,
  active,
  badge,
}: {
  href: string;
  label: string;
  emoji: string;
  active: boolean;
  badge?: number;
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
      <span className="w-[22px] h-[22px] flex items-center justify-center shrink-0 text-sm">
        {emoji}
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
