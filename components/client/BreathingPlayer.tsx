"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Contenu JSON parsé d'une pratique de type BREATHING
interface BreathingContent {
  pattern: [number, number, number, number]; // [inhale, hold1, exhale, hold2] en secondes
  cycles: number;
  guidanceText?: string;
  animationType?: "circle" | "wave" | "box";
}

interface Practice {
  id: string;
  title: string;
  description: string;
  type: string;
  content: string;
}

interface BreathingPlayerProps {
  practice: Practice;
  onComplete: () => void;
  onClose: () => void;
}

type Phase = "inhale" | "hold1" | "exhale" | "hold2";

// Textes de guidance selon la phase en cours
const PHASE_LABELS: Record<Phase, string> = {
  inhale: "Inspirez...",
  hold1: "Retenez...",
  exhale: "Expirez...",
  hold2: "Retenez...",
};

// Ordre des phases dans un cycle complet
const PHASE_ORDER: Phase[] = ["inhale", "hold1", "exhale", "hold2"];

/**
 * Joue un son de cloche douce via Web Audio API (fréquence 528 Hz — fréquence sacrée).
 * Appelé à chaque changement de phase.
 */
function playBell() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 528;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.5);
  } catch {
    // Web Audio API non disponible — on ignore silencieusement
  }
}

/**
 * BreathingPlayer — Lecteur de respiration guidée plein écran.
 *
 * Affiche un cercle animé qui pulse au rythme du pattern de respiration,
 * avec texte de guidance, compteur de cycles et barre de progression.
 */
export default function BreathingPlayer({
  practice,
  onComplete,
  onClose,
}: BreathingPlayerProps) {
  // Parse le contenu JSON de la pratique
  const content: BreathingContent = JSON.parse(practice.content);
  const pattern = content.pattern;
  const totalCycles = content.cycles;

  // État du player
  const [phase, setPhase] = useState<Phase>("inhale");
  const [currentCycle, setCurrentCycle] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [phaseProgress, setPhaseProgress] = useState(0); // 0 à 1, progression dans la phase courante
  const [pulseCount, setPulseCount] = useState(0); // Pour l'animation de fin

  // Refs pour gérer les timers sans dépendances stales
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseStartRef = useRef<number>(Date.now());
  const soundEnabledRef = useRef(soundEnabled);

  // Synchroniser la ref du son
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Durée de la phase courante en secondes
  const getPhaseDuration = useCallback(
    (p: Phase): number => {
      const idx = PHASE_ORDER.indexOf(p);
      return pattern[idx];
    },
    [pattern]
  );

  // Calculer la progression globale (0 à 1)
  const getGlobalProgress = useCallback((): number => {
    // Durée totale d'un cycle complet
    const cycleDuration = pattern.reduce((a, b) => a + b, 0);
    const totalDuration = cycleDuration * totalCycles;
    if (totalDuration === 0) return 1;

    // Durée écoulée
    const completedCycles = currentCycle - 1;
    const phaseIdx = PHASE_ORDER.indexOf(phase);
    let elapsedInCycle = 0;
    for (let i = 0; i < phaseIdx; i++) {
      elapsedInCycle += pattern[i];
    }
    elapsedInCycle += getPhaseDuration(phase) * phaseProgress;

    return (completedCycles * cycleDuration + elapsedInCycle) / totalDuration;
  }, [pattern, totalCycles, currentCycle, phase, phaseProgress, getPhaseDuration]);

  // Avancer à la phase suivante
  const advancePhase = useCallback(() => {
    setPhase((prevPhase) => {
      const currentIdx = PHASE_ORDER.indexOf(prevPhase);
      let nextIdx = currentIdx + 1;

      // Si on a fini le cycle (après hold2 ou exhale si hold2 = 0)
      if (nextIdx >= PHASE_ORDER.length) {
        nextIdx = 0;
        setCurrentCycle((prev) => {
          const next = prev + 1;
          if (next > totalCycles) {
            setIsFinished(true);
            return prev;
          }
          return next;
        });
      }

      let nextPhase = PHASE_ORDER[nextIdx];

      // Sauter les phases avec durée 0
      while (pattern[PHASE_ORDER.indexOf(nextPhase)] === 0) {
        nextIdx++;
        if (nextIdx >= PHASE_ORDER.length) {
          nextIdx = 0;
          setCurrentCycle((prev) => {
            const next = prev + 1;
            if (next > totalCycles) {
              setIsFinished(true);
              return prev;
            }
            return next;
          });
        }
        nextPhase = PHASE_ORDER[nextIdx];
      }

      // Son au changement de phase
      if (soundEnabledRef.current) {
        playBell();
      }

      phaseStartRef.current = Date.now();
      return nextPhase;
    });
  }, [totalCycles, pattern]);

  // Boucle d'animation pour la progression fluide dans la phase
  useEffect(() => {
    if (isFinished) return;

    const duration = getPhaseDuration(phase) * 1000;
    if (duration === 0) {
      // Phase de durée 0 : avancer immédiatement
      advancePhase();
      return;
    }

    phaseStartRef.current = Date.now();
    setPhaseProgress(0);

    // Animation frame pour progression fluide
    function tick() {
      const elapsed = Date.now() - phaseStartRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setPhaseProgress(progress);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    }
    animFrameRef.current = requestAnimationFrame(tick);

    // Timer pour passer à la phase suivante
    phaseTimerRef.current = setTimeout(() => {
      advancePhase();
    }, duration);

    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase, currentCycle, isFinished, getPhaseDuration, advancePhase]);

  // Jouer le son au démarrage
  useEffect(() => {
    if (soundEnabled) {
      playBell();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animation de fin : 3 pulsations douces
  useEffect(() => {
    if (!isFinished) return;

    let count = 0;
    const interval = setInterval(() => {
      count++;
      setPulseCount(count);
      if (count >= 6) {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isFinished]);

  // Appeler onComplete quand la session est terminée
  useEffect(() => {
    if (isFinished) {
      onComplete();
    }
  }, [isFinished, onComplete]);

  // Calculer le scale du cercle selon la phase et la progression
  const getCircleScale = (): number => {
    if (isFinished) {
      // Pulsation douce de fin
      return pulseCount % 2 === 0 ? 0.7 : 0.85;
    }

    switch (phase) {
      case "inhale":
        // Scale de 0.4 à 1.0
        return 0.4 + 0.6 * phaseProgress;
      case "hold1":
        return 1.0;
      case "exhale":
        // Scale de 1.0 à 0.4
        return 1.0 - 0.6 * phaseProgress;
      case "hold2":
        return 0.4;
      default:
        return 0.7;
    }
  };

  // Opacité du cercle selon la phase
  const getCircleOpacity = (): number => {
    if (isFinished) return 0.6;

    switch (phase) {
      case "inhale":
        return 0.5 + 0.5 * phaseProgress;
      case "hold1":
        return 1.0;
      case "exhale":
        return 1.0 - 0.5 * phaseProgress;
      case "hold2":
        return 0.5;
      default:
        return 0.7;
    }
  };

  const scale = getCircleScale();
  const opacity = getCircleOpacity();
  const globalProgress = getGlobalProgress();

  // --- Écran de fin ---
  if (isFinished) {
    return (
      <div className="fixed inset-0 z-50 bg-brun-chaud flex flex-col items-center justify-center">
        {/* Cercle pulsant */}
        <div
          className="w-48 h-48 rounded-full bg-or-sacre mb-8"
          style={{
            transform: `scale(${scale})`,
            opacity,
            transition: "transform 0.5s ease-in-out, opacity 0.5s ease-in-out",
          }}
        />

        <h2 className="font-display text-2xl text-or-sacre mb-3">
          Pratique terminée
        </h2>
        <p className="font-ui text-cire-chaude mb-8">
          {totalCycles} cycles complétés
        </p>

        <button
          onClick={onClose}
          className="px-8 py-3 bg-or-sacre text-white rounded-sharp font-ui text-sm hover:opacity-90 transition-opacity"
        >
          Fermer
        </button>
      </div>
    );
  }

  // --- Écran principal du player ---
  return (
    <div className="fixed inset-0 z-50 bg-brun-chaud flex flex-col items-center justify-center">
      {/* Bouton fermer */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-cire-chaude/60 hover:text-cire-chaude transition-colors text-2xl font-ui"
        aria-label="Fermer"
      >
        ✕
      </button>

      {/* Toggle son */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-6 left-6 text-cire-chaude/60 hover:text-cire-chaude transition-colors text-lg font-ui"
        aria-label={soundEnabled ? "Couper le son" : "Activer le son"}
      >
        {soundEnabled ? "🔔" : "🔕"}
      </button>

      {/* Titre */}
      <h2 className="font-display text-xl text-cire-chaude mb-12">
        {practice.title}
      </h2>

      {/* Cercle animé central */}
      <div className="flex items-center justify-center mb-12" style={{ width: "12rem", height: "12rem" }}>
        <div
          className="w-48 h-48 rounded-full bg-or-sacre"
          style={{
            transform: `scale(${scale})`,
            opacity,
            transition: `transform ${getPhaseDuration(phase) * 0.15}s ease-in-out, opacity ${getPhaseDuration(phase) * 0.15}s ease-in-out`,
          }}
        />
      </div>

      {/* Texte de guidance */}
      <p className="font-display text-lg text-cire-chaude mb-4">
        {PHASE_LABELS[phase]}
      </p>

      {/* Guidance text personnalisé si fourni */}
      {content.guidanceText && (
        <p className="font-ui text-sm text-cire-chaude/60 mb-4 max-w-xs text-center">
          {content.guidanceText}
        </p>
      )}

      {/* Compteur de cycles */}
      <p className="font-ui text-sm text-or-pale mb-16">
        Cycle {currentCycle} sur {totalCycles}
      </p>

      {/* Barre de progression globale */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-or-pale/20">
        <div
          className="h-full bg-or-sacre transition-all duration-300 ease-linear"
          style={{ width: `${globalProgress * 100}%` }}
        />
      </div>
    </div>
  );
}
