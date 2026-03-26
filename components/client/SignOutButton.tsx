"use client";

import { useState } from "react";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue to redirect even if fetch fails
    }
    window.location.href = "/login";
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
