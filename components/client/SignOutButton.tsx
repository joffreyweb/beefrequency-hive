"use client";

import { useState } from "react";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      // Wait for the response to ensure cookie is deleted
      await res.json();
    } catch {
      // Continue to redirect even if fetch fails
    }
    // Clear any client-side cache and force full reload to /login
    document.cookie = "token=; Max-Age=0; path=/";
    document.cookie = "onboarding_completed=; Max-Age=0; path=/";
    window.location.replace("/login");
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="text-xs font-ui text-brun-mid/40 hover:text-brun-mid transition-colors disabled:opacity-50"
    >
      {loading ? "..." : "Sign out"}
    </button>
  );
}
