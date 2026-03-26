"use client";

import { useState, useEffect, useCallback } from "react";
import BreathingPlayer from "@/components/client/BreathingPlayer";
import VideoPlayer from "@/components/client/VideoPlayer";

// Types pour les données de l'API
interface Practice {
  id: string;
  title: string;
  description: string;
  type: "BREATHING" | "VIDEO" | "MEDITATION";
  content: string;
  category: string;
  dayTrigger: number | null;
}

interface ClientPractice {
  id: string;
  practiceId: string;
  practice: Practice;
  assignedAt: string;
  completedCount: number;
  lastCompletedAt: string | null;
  isActive: boolean;
  note: string | null;
}

interface AuthUser {
  userId: string;
  clientId?: string;
  startDate?: string;
}

// Badge selon le type de pratique
const TYPE_BADGES: Record<string, { emoji: string; label: string }> = {
  BREATHING: { emoji: "🫁", label: "Breathing" },
  VIDEO: { emoji: "🎬", label: "Video" },
  MEDITATION: { emoji: "🧘", label: "Meditation" },
};

/**
 * Vérifie si une date correspond à aujourd'hui.
 */
function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Formater une date en format lisible français.
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Page Pratiques — Liste des pratiques assignées au client.
 * Affiche les pratiques actives, triées avec les non-complétées aujourd'hui en premier.
 * Permet de lancer un player (BreathingPlayer / VideoPlayer) selon le type.
 */
export default function ClientPratiquesPage() {
  const [practices, setPractices] = useState<ClientPractice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayNumber, setDayNumber] = useState<number | null>(null);

  // Player actif
  const [activePractice, setActivePractice] = useState<ClientPractice | null>(null);

  // Charger les pratiques et les données utilisateur
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger en parallèle les pratiques et les infos utilisateur
      const [practicesRes, authRes] = await Promise.all([
        fetch("/api/client-practices"),
        fetch("/api/auth/me"),
      ]);

      if (!practicesRes.ok) {
        throw new Error("Failed to load practices");
      }

      const practicesData = await practicesRes.json();
      setPractices(practicesData.clientPractices ?? practicesData);

      // Calculer le dayNumber à partir de startDate
      if (authRes.ok) {
        const authData: AuthUser = await authRes.json();
        if (authData.startDate) {
          const start = new Date(authData.startDate);
          const now = new Date();
          const diffMs = now.getTime() - start.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
          setDayNumber(diffDays);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Marquer une pratique comme complétée via l'API
  const handleComplete = useCallback(
    async (clientPracticeId: string) => {
      try {
        const res = await fetch(
          `/api/client-practices/${clientPracticeId}/complete`,
          { method: "POST" }
        );
        if (res.ok) {
          // Recharger les données pour mettre à jour le compteur
          await loadData();
        }
      } catch {
        // Erreur silencieuse — les données seront rechargées au prochain mount
      }
    },
    [loadData]
  );

  // Fermer le player
  const handleClosePlayer = useCallback(() => {
    setActivePractice(null);
  }, []);

  // Filtrer et trier les pratiques
  const activePractices = practices.filter((cp) => cp.isActive);

  // Pratiques du jour : celles dont le dayTrigger correspond OU toutes les actives non complétées
  const todayPractices = activePractices
    .sort((a, b) => {
      // Non complétées aujourd'hui en premier
      const aCompleted = isToday(a.lastCompletedAt);
      const bCompleted = isToday(b.lastCompletedAt);
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      return 0;
    });

  // --- Rendu ---

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-brun-mid font-ui text-sm">
          Loading your practices...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-brun-mid font-ui text-sm">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-or-sacre text-white rounded-sharp font-ui text-sm hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Player actif selon le type */}
      {activePractice && activePractice.practice.type === "BREATHING" && (
        <BreathingPlayer
          practice={activePractice.practice}
          onComplete={() => handleComplete(activePractice.id)}
          onClose={handleClosePlayer}
        />
      )}
      {activePractice && activePractice.practice.type === "MEDITATION" && (
        <BreathingPlayer
          practice={activePractice.practice}
          onComplete={() => handleComplete(activePractice.id)}
          onClose={handleClosePlayer}
        />
      )}
      {activePractice && activePractice.practice.type === "VIDEO" && (
        <VideoPlayer
          practice={activePractice.practice}
          onComplete={() => handleComplete(activePractice.id)}
          onClose={handleClosePlayer}
        />
      )}

      <div>
        {/* Titre de la page */}
        <h1 className="font-display text-2xl text-brun-chaud mb-8">
          Practices
        </h1>

        {/* Day of journey */}
        {dayNumber !== null && (
          <p className="font-ui text-sm text-brun-mid mb-6">
            Day {dayNumber} of your journey
          </p>
        )}

        {/* Section Aujourd'hui */}
        <section className="mb-10">
          <h2 className="font-display text-lg text-brun-chaud mb-4">
            Today
          </h2>

          {todayPractices.length === 0 ? (
            <p className="font-ui text-sm text-brun-mid">
              No practices assigned yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {todayPractices.map((cp) => (
                <PracticeCard
                  key={cp.id}
                  clientPractice={cp}
                  onStart={() => setActivePractice(cp)}
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </>
  );
}

// --- Composant carte de pratique ---

interface PracticeCardProps {
  clientPractice: ClientPractice;
  onStart: () => void;
}

function PracticeCard({ clientPractice, onStart }: PracticeCardProps) {
  const { practice, completedCount, lastCompletedAt } = clientPractice;
  const badge = TYPE_BADGES[practice.type] ?? { emoji: "📋", label: practice.type };
  const completedToday = isToday(lastCompletedAt);

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 flex flex-col gap-3">
      {/* Badge type + checkmark si complété aujourd'hui */}
      <div className="flex items-center justify-between">
        <span className="font-caps text-xs text-or-sacre tracking-wider uppercase">
          {badge.emoji} {badge.label}
        </span>
        {completedToday && (
          <span className="text-foret font-ui text-sm font-semibold">✓</span>
        )}
      </div>

      {/* Titre */}
      <h3 className="font-display text-lg text-brun-chaud leading-snug">
        {practice.title}
      </h3>

      {/* Description */}
      <p className="font-ui text-sm text-brun-mid line-clamp-2">
        {practice.description}
      </p>

      {/* Stats */}
      <div className="font-ui text-xs text-brun-mid/70 flex items-center gap-2 flex-wrap">
        <span>Completed {completedCount} time{completedCount !== 1 ? "s" : ""}</span>
        {lastCompletedAt && (
          <>
            <span>·</span>
            <span>Last: {formatDate(lastCompletedAt)}</span>
          </>
        )}
      </div>

      {/* Note du praticien */}
      {clientPractice.note && (
        <p className="font-ui text-xs text-or-sacre/80 italic border-l-2 border-or-pale pl-3">
          {clientPractice.note}
        </p>
      )}

      {/* Bouton commencer */}
      <button
        onClick={onStart}
        className="mt-auto px-4 py-2 bg-or-sacre text-white rounded-sharp font-ui text-sm hover:opacity-90 transition-opacity self-start"
      >
        {completedToday ? "Redo" : "Start"}
      </button>
    </div>
  );
}
