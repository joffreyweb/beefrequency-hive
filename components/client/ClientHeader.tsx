"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ClientInfo {
  name: string;
  initials: string;
  dayNumber: number;
}

interface Reminders {
  morningReminderEnabled: boolean;
  morningReminderTime: string;
  eveningReminderEnabled: boolean;
  eveningReminderTime: string;
}

export default function ClientHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [info, setInfo] = useState<ClientInfo | null>(null);
  const [reminders, setReminders] = useState<Reminders | null>(null);

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

  // Load reminders when menu opens
  useEffect(() => {
    if (menuOpen && !reminders) {
      fetch("/api/user/reminders")
        .then((res) => res.json())
        .then((data) => setReminders(data))
        .catch(() => {});
    }
  }, [menuOpen, reminders]);

  function handleSignOut() {
    fetch("/api/auth/logout", { method: "POST" }).then(() => {
      window.location.href = "/login";
    });
  }

  async function updateReminder(field: string, value: boolean | string) {
    if (!reminders) return;
    const updated = { ...reminders, [field]: value };
    setReminders(updated);
    await fetch("/api/user/reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    }).catch(() => {});
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
          <Link href="/client/home" className="flex items-center gap-1.5">
            <span className="font-ui text-sm font-light lowercase text-brun-mid">be</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E8D5A8" strokeWidth="1" strokeLinejoin="round"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" /></svg>
            <span className="font-ui text-sm font-light lowercase text-brun-mid">beefrequency</span>
          </Link>
          <div className="flex items-center gap-2">
            {info && (
              <div className="w-7 h-7 rounded-full bg-or-sacre/15 flex items-center justify-center">
                <span className="text-[10px] font-ui text-or-sacre font-medium">{info.initials}</span>
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
        <div className="fixed inset-0 z-[60] bg-black/20" onClick={() => setMenuOpen(false)} />
      )}

      {/* Slide-in menu */}
      <div
        className="fixed top-0 right-0 z-[70] h-full bg-creme-sacree shadow-lg flex flex-col transition-transform duration-200 ease-out overflow-y-auto"
        style={{
          width: "280px",
          transform: menuOpen ? "translateX(0)" : "translateX(100%)",
          borderLeft: "0.5px solid #E8D5A8",
        }}
      >
        {/* Close */}
        <div className="flex justify-end p-4">
          <button onClick={() => setMenuOpen(false)} className="text-brun-mid/50 hover:text-brun-chaud text-lg" aria-label="Close">
            ✕
          </button>
        </div>

        {/* Client info */}
        {info && (
          <div className="px-6 pb-5">
            <p className="font-display text-xl text-brun-chaud">{info.name}</p>
            <p className="font-ui text-sm text-or-sacre mt-1">Day {info.dayNumber}</p>
          </div>
        )}

        <div className="mx-6 border-t border-or-pale" />

        {/* Reminders */}
        <div className="px-6 py-5">
          <p className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-4">Reminders</p>

          {/* Morning reminder */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="font-ui text-sm text-brun-chaud">☀️ Morning</span>
              <button
                onClick={() => updateReminder("morningReminderEnabled", !reminders?.morningReminderEnabled)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  reminders?.morningReminderEnabled ? "bg-or-sacre" : "bg-or-pale"
                }`}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                  style={{ left: reminders?.morningReminderEnabled ? "22px" : "2px" }}
                />
              </button>
            </div>
            {reminders?.morningReminderEnabled && (
              <input
                type="time"
                value={reminders.morningReminderTime}
                onChange={(e) => updateReminder("morningReminderTime", e.target.value)}
                className="mt-2 w-full px-2 py-1 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre"
              />
            )}
          </div>

          {/* Evening reminder */}
          <div>
            <div className="flex items-center justify-between">
              <span className="font-ui text-sm text-brun-chaud">🌙 Evening</span>
              <button
                onClick={() => updateReminder("eveningReminderEnabled", !reminders?.eveningReminderEnabled)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  reminders?.eveningReminderEnabled ? "bg-or-sacre" : "bg-or-pale"
                }`}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                  style={{ left: reminders?.eveningReminderEnabled ? "22px" : "2px" }}
                />
              </button>
            </div>
            {reminders?.eveningReminderEnabled && (
              <input
                type="time"
                value={reminders.eveningReminderTime}
                onChange={(e) => updateReminder("eveningReminderTime", e.target.value)}
                className="mt-2 w-full px-2 py-1 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre"
              />
            )}
          </div>

          <p className="font-ui text-[10px] text-brun-mid/40 mt-3">Notifications coming soon.</p>
        </div>

        <div className="mx-6 border-t border-or-pale" />

        {/* Sign out */}
        <div className="px-6 py-5">
          <button onClick={handleSignOut} className="font-ui text-sm text-brun-mid/60 hover:text-brun-chaud transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
