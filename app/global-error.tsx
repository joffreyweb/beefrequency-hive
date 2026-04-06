"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Auto-reload on stale cache after a new build
    const isStaleCache =
      error.message?.includes("Failed to find Server Action") ||
      error.message?.includes("ChunkLoadError") ||
      error.message?.includes("Loading chunk");

    if (isStaleCache) {
      window.location.reload();
    }
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: "1rem",
        }}
      >
        <h2>Une erreur est survenue</h2>
        <button
          onClick={() => reset()}
          style={{
            padding: "0.5rem 1.5rem",
            borderRadius: "0.375rem",
            border: "1px solid #B8821E",
            background: "#B8821E",
            color: "white",
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
