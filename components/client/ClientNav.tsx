"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";

export default function ClientNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLanguage();
  const T = (key: { EN: string; FR: string }) => key[lang];
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    function fetchUnread() {
      fetch("/api/messages/unread-count")
        .then((res) => res.ok ? res.json() : null)
        .then((data) => { if (data?.count != null) setUnreadCount(data.count); })
        .catch(() => {});
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const isHome =
    isActive("/client/home") ||
    isActive("/client/elixirs") ||
    isActive("/client/sessions") ||
    isActive("/client/agenda") ||
    isActive("/client/programme");
  const isJournal = isActive("/client/journal");
  const isMyModules =
    isActive("/client/mes-modules") ||
    isActive("/client/pratiques") ||
    isActive("/client/transmission");
  const isMessages = isActive("/client/messages");
  const isFromJoffrey =
    isActive("/client/from-joffrey") ||
    isActive("/client/supports") ||
    isActive("/client/recommendations");

  const items = [
    { href: "/client/home", label: T(t.nav.home), active: isHome, icon: HomeIcon, badge: 0 },
    { href: "/client/journal", label: T(t.nav.journal), active: isJournal, icon: JournalIcon, badge: 0 },
    { href: "/client/mes-modules", label: T(t.nav.myModules), active: isMyModules, icon: MyModulesIcon, badge: 0 },
    { href: "/client/messages", label: T(t.nav.messages), active: isMessages, icon: MessagesIcon, badge: unreadCount },
    { href: "/client/from-joffrey", label: T(t.nav.fromJoffrey), active: isFromJoffrey, icon: FromJoffreyIcon, badge: 0 },
  ];

  return (
    <nav
      data-client-nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(253, 250, 244, 0.97)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "0.5px solid #E8D5A8",
      }}
    >
      <div
        className="flex items-center justify-around"
        style={{ maxWidth: "640px", margin: "0 auto", height: "60px", padding: "0 4px" }}
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={(e) => { e.preventDefault(); router.push(item.href); }}
            className="relative flex flex-col items-center justify-center gap-0.5 transition-all duration-200"
            style={{ width: "56px", opacity: item.active ? 1 : 0.5 }}
          >
            <div className="relative">
              <item.icon color={item.active ? "#B8821E" : "#6B4423"} />
              {item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-or-sacre text-white text-[9px] font-ui px-1">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </div>
            <span
              className="font-ui leading-none text-center"
              style={{
                fontSize: "7px",
                letterSpacing: "0.03em",
                color: item.active ? "#B8821E" : "#6B4423",
              }}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" style={{ background: "rgba(253, 250, 244, 0.97)" }} />
    </nav>
  );
}

function HomeIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z" />
      <path d="M9 21V14h6v7" />
    </svg>
  );
}

function JournalIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v16H4z" />
      <path d="M8 8h8M8 12h6M8 16h4" />
    </svg>
  );
}

function MyModulesIcon({ color }: { color: string }) {
  // Pile de cartes empilées (option β) · évoque l'empilage modules
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="9" width="16" height="10" rx="1.5" />
      <path d="M6 6h12" strokeOpacity="0.6" />
      <path d="M8 3h8" strokeOpacity="0.3" />
    </svg>
  );
}

function MessagesIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h16v12H7l-4 4V4z" />
    </svg>
  );
}

function FromJoffreyIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  );
}
