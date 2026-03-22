"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function ClientNav() {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const isPassage = isActive("/client/programme") || isActive("/client/journal");
  const isTransmission =
    isActive("/client/supports") ||
    isActive("/client/pratiques") ||
    isActive("/client/recommendations");
  const isMessages = isActive("/client/messages");
  const isHome = isActive("/client/home");

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(253, 250, 244, 0.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "0.5px solid #E8D5A8",
        height: "52px",
      }}
    >
      <div
        className="h-full flex items-center justify-between"
        style={{ maxWidth: "640px", margin: "0 auto", padding: "0 20px" }}
      >
        {/* Gauche — icône maison */}
        <Link
          href="/client/home"
          className="flex items-center justify-center transition-opacity duration-200"
          style={{ width: "32px", height: "32px", opacity: isHome ? 1 : 0.4 }}
        >
          <HouseIcon color={isHome ? "#B8821E" : "#6B4423"} />
        </Link>

        {/* Centre — Wordmark Cormorant */}
        <Link
          href="/client/home"
          className="font-caps tracking-widest transition-colors duration-200 hover:text-or-sacre"
          style={{
            fontSize: "13px",
            color: "#2C1A0E",
            letterSpacing: "0.12em",
            fontWeight: 400,
          }}
        >
          BeeFrequency
        </Link>

        {/* Droite — 3 icônes */}
        <div className="flex items-center" style={{ gap: "4px" }}>

          {/* Transmission */}
          <Link
            href="/client/supports"
            onClick={(e) => { e.preventDefault(); router.push("/client/supports"); }}
            className="flex items-center justify-center transition-opacity duration-200"
            style={{
              width: "32px",
              height: "32px",
              opacity: isTransmission ? 1 : 0.4,
            }}
          >
            <TransmissionIcon color={isTransmission ? "#B8821E" : "#6B4423"} />
          </Link>

          {/* Le Passage — cercle actif */}
          <Link
            href="/client/programme"
            onClick={(e) => { e.preventDefault(); router.push("/client/programme"); }}
            className="flex items-center justify-center rounded-full transition-all duration-200"
            style={{
              width: "36px",
              height: "36px",
              background: isPassage ? "#B8821E" : "transparent",
              border: isPassage ? "none" : "0.5px solid #D4B896",
            }}
          >
            <PassageIcon color={isPassage ? "#FDFAF4" : "#6B4423"} />
          </Link>

          {/* Messages */}
          <Link
            href="/client/messages"
            onClick={(e) => { e.preventDefault(); router.push("/client/messages"); }}
            className="flex items-center justify-center transition-opacity duration-200"
            style={{
              width: "32px",
              height: "32px",
              opacity: isMessages ? 1 : 0.4,
            }}
          >
            <ChatIcon color={isMessages ? "#B8821E" : "#6B4423"} />
          </Link>

        </div>
      </div>
    </header>
  );
}

function HouseIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L11 3l8 6.5V18a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 19V13h4v6" />
    </svg>
  );
}

function TransmissionIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 3h14a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M7 3v16M11 7h4M11 11h4M11 15h4" />
    </svg>
  );
}

function PassageIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 19c0-7 4-13 12-14-1 8-7 12-14 12" />
      <path d="M6 19C6 15 9 11 14 9" />
    </svg>
  );
}

function ChatIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h16v12H7l-4 4V4z" />
    </svg>
  );
}
