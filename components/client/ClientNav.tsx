"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function ClientNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll unread messages every 15s
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
  const isTransmission =
    isActive("/client/transmission") ||
    isActive("/client/pratiques") ||
    isActive("/client/from-joffrey") ||
    isActive("/client/supports") ||
    isActive("/client/recommendations");
  const isMessages = isActive("/client/messages");

  const items = [
    { href: "/client/home", label: "Home", active: isHome, icon: HomeIcon, badge: 0 },
    { href: "/client/journal", label: "Journal", active: isJournal, icon: JournalIcon, badge: 0 },
    { href: "/client/transmission", label: "Transmission", active: isTransmission, icon: TransmissionIcon, badge: 0 },
    { href: "/client/messages", label: "Messages", active: isMessages, icon: MessagesIcon, badge: unreadCount },
  ];

  return (
    <nav
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
                fontSize: "8px",
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

function MessagesIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h16v12H7l-4 4V4z" />
    </svg>
  );
}

function TransmissionIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v16H4z" />
      <path d="M8 4v16M12 8h4M12 12h4M12 16h4" />
    </svg>
  );
}
