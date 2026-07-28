"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Referme le tiroir mobile a chaque changement de page
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
    isActive("/admin/practices") ||
    isActive("/admin/recommendations") ||
    isActive("/admin/day-messages") ||
    isActive("/admin/journey-messages") ||
    isActive("/admin/elixir-library");

  return (
    <>
      {/* Barre superieure mobile (telephone uniquement) */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-cire-chaude"
        style={{ borderBottom: "0.5px solid #E8D5A8" }}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          className="flex items-center gap-2.5"
        >
          <span className="flex flex-col gap-[3px]">
            <span className="block w-5 h-[2px] bg-brun-chaud rounded-full" />
            <span className="block w-5 h-[2px] bg-brun-chaud rounded-full" />
            <span className="block w-5 h-[2px] bg-brun-chaud rounded-full" />
          </span>
          <span className="text-lg">{"🐝"}</span>
          <span className="font-display text-base text-brun-chaud tracking-wide">Hive</span>
        </button>
        <span className="font-caps text-[9px] text-or-sacre tracking-[0.15em] uppercase">
          Administration
        </span>
      </div>

      {/* Voile sombre derriere le tiroir (mobile) */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Barre laterale — statique sur ordinateur, tiroir coulissant sur mobile */}
      <aside
        className={`w-[200px] bg-cire-chaude flex flex-col z-50 fixed top-0 bottom-0 left-0 transition-transform duration-200 ease-out md:static md:min-h-screen md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ borderRight: "0.5px solid #E8D5A8" }}
      >
        {/* Header */}
        <div className="px-4 pt-6 pb-5">
          <div className="flex items-center gap-2">
            <span className="text-lg">{"🐝"}</span>
            <div>
              <p className="font-display text-base text-brun-chaud tracking-wide">Hive</p>
              <p className="font-caps text-[9px] text-or-sacre tracking-[0.15em] uppercase">Administration</p>
            </div>
          </div>
          <p className="text-[10px] font-ui text-brun-mid/50 mt-2 truncate">{adminName}</p>
        </div>

        {/* Navigation — 5 sections */}
        <div className="px-3 flex-1 overflow-y-auto">
          <nav className="space-y-0.5">
            <NavItem
              href="/admin/dashboard"
              label="Le Cockpit"
              emoji={"🏠"}
              active={isActive("/admin/dashboard")}
              badge={pendingActionsCount}
            />
            <NavItem
              href="/admin/agenda"
              label="Agenda"
              emoji={"📅"}
              active={isActive("/admin/agenda")}
            />
            <NavItem
              href="/admin/slots"
              label="Créneaux"
              emoji={"🕐"}
              active={isActive("/admin/slots")}
            />
            <NavItem
              href="/admin/clients"
              label="La Ruche"
              emoji={"🐝"}
              active={isActive("/admin/clients")}
              badge={activeClientsCount}
            />
            <NavItem
              href="/admin/atelier"
              label="L'Atelier"
              emoji={"🔧"}
              active={isAtelier}
            />
            <NavItem
              href="/admin/messages"
              label="Messages"
              emoji={"💬"}
              active={isActive("/admin/messages")}
              badge={unreadMessagesCount}
            />
            <NavItem
              href="/admin/prospects"
              label="Prospects"
              emoji={"🎯"}
              active={isActive("/admin/prospects")}
            />
            <NavItem
              href="/admin/analytics"
              label="Analytics"
              emoji={"📈"}
              active={isActive("/admin/analytics")}
            />
            <NavItem
              href="/admin/newsletter"
              label="Newsletter"
              emoji={"✉️"}
              active={isActive("/admin/newsletter")}
            />
            <NavItem
              href="/admin/settings"
              label="Paramètres"
              emoji={"⚙️"}
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
            {loggingOut ? "Déconnexion..." : "Déconnexion"}
          </button>
        </div>
      </aside>
    </>
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
