"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ClientInfo {
  name: string;
  initials: string;
  dayNumber: number;
}

export default function ClientHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [info, setInfo] = useState<ClientInfo | null>(null);

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

  function handleSignOut() {
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
      window.location.href = "/login";
    });
  }

  return (
    <>
      <header
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
          {/* Left — Logo */}
          <Link
            href="/client/home"
            className="font-display text-lg text-or-sacre tracking-wide"
          >
            Hive
          </Link>

          {/* Right — Avatar + Hamburger */}
          <div className="flex items-center gap-2">
            {info && (
              <div className="w-7 h-7 rounded-full bg-or-sacre/15 flex items-center justify-center">
                <span className="text-[10px] font-ui text-or-sacre font-medium">
                  {info.initials}
                </span>
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
        <div
          className="fixed inset-0 z-[60] bg-black/20"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Slide-in menu */}
      <div
        className="fixed top-0 right-0 z-[70] h-full bg-creme-sacree shadow-lg flex flex-col transition-transform duration-200 ease-out"
        style={{
          width: "260px",
          transform: menuOpen ? "translateX(0)" : "translateX(100%)",
          borderLeft: "0.5px solid #E8D5A8",
        }}
      >
        {/* Close */}
        <div className="flex justify-end p-4">
          <button
            onClick={() => setMenuOpen(false)}
            className="text-brun-mid/50 hover:text-brun-chaud text-lg"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Client info */}
        {info && (
          <div className="px-6 pb-6">
            <p className="font-display text-xl text-brun-chaud">{info.name}</p>
            <p className="font-ui text-sm text-or-sacre mt-1">Day {info.dayNumber}</p>
          </div>
        )}

        {/* Separator */}
        <div className="mx-6 border-t border-or-pale" />

        {/* Sign out */}
        <div className="px-6 pt-6">
          <button
            onClick={handleSignOut}
            className="font-ui text-sm text-brun-mid/60 hover:text-brun-chaud transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
