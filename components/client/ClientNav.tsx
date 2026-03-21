"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// Navigation iPhone-style — barre fixe en bas
export default function ClientNav() {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* Wordmark centré en haut */}
      <header className="bg-creme-sacree pt-4 pb-2 text-center">
        <p className="font-caps text-sm text-brun-chaud tracking-[0.08em]">
          BeeFrequency
        </p>
      </header>

      {/* Barre de navigation fixe en bas */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-creme-sacree flex items-center justify-around"
        style={{ borderTop: "0.5px solid #E8D5A8", height: "64px" }}
      >
        <TabItem href="/client/home" label="Accueil" active={isActive("/client/home")} onClick={() => router.push("/client/home")}>
          <HouseIcon />
        </TabItem>
        <TabItem href="/client/journal" label="Journal" active={isActive("/client/journal")} onClick={() => router.push("/client/journal")}>
          <BookIcon />
        </TabItem>
        <TabItem href="/client/programme" label="Programme" active={isActive("/client/programme")} onClick={() => router.push("/client/programme")}>
          <LeafIcon />
        </TabItem>
        <TabItem href="/client/sessions" label="Séances" active={isActive("/client/sessions")} onClick={() => router.push("/client/sessions")}>
          <CalendarIcon />
        </TabItem>
        <TabItem href="/client/messages" label="Messages" active={isActive("/client/messages")} onClick={() => router.push("/client/messages")}>
          <ChatBubbleIcon />
        </TabItem>
      </nav>
    </>
  );
}

// Item de la tab bar
function TabItem({
  href,
  label,
  active,
  children,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className="flex flex-col items-center justify-center gap-0.5 pt-1.5"
    >
      <span className={`transition-colors duration-150 ${active ? "text-or-sacre" : "text-[#B4B2A9]"}`}>
        {children}
      </span>
      <span
        className={`font-ui transition-colors duration-150 ${
          active ? "text-or-sacre" : "text-[#B4B2A9]"
        }`}
        style={{ fontSize: "10px" }}
      >
        {label}
      </span>
    </Link>
  );
}

// Icônes SVG 22px — lignes fines
function HouseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L11 3l8 6.5V18a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 19V13h4v6" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 3h14a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M7 3v16M11 8h4M11 11h4" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 19c0-7 4-13 12-14-1 8-7 12-14 12" />
      <path d="M6 19C6 15 9 11 14 9" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="16" height="15" rx="1.5" />
      <path d="M3 9h16M7 2v4M15 2v4" />
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h16v12H7l-4 4V4z" />
    </svg>
  );
}
