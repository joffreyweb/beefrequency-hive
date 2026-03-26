"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  clientFirstName: string;
  clientName: string;
  onComplete: () => void;
}

export default function CharteEngagement({ clientFirstName, clientName, onComplete }: Props) {
  const [checks, setChecks] = useState({ c1: false, c2: false, c3: false });
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const checkScrolled = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
        setScrolled(true);
      }
    };
    checkScrolled();
    el.addEventListener("scroll", checkScrolled);
    return () => el.removeEventListener("scroll", checkScrolled);
  }, []);

  const allChecked = checks.c1 && checks.c2 && checks.c3;

  async function handleSubmit() {
    if (!allChecked || !scrolled || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/onboarding/charte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature: clientName,
          signedAt: new Date().toISOString(),
        }),
      });
      onComplete();
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-display text-2xl text-brun-chaud">Our engagement.</h2>
        <p className="font-ui text-sm text-brun-mid mt-1">Please read carefully before signing.</p>
      </div>

      <div
        ref={scrollRef}
        className="h-80 overflow-y-auto border border-or-pale rounded-sm bg-cire-chaude p-5 text-sm font-ui text-brun-chaud space-y-4 leading-relaxed"
      >
        <p className="font-display text-base text-brun-chaud">Purpose of this Agreement</p>
        <p>This agreement governs the terms of booking, cancellation and commitment within the framework of the accompaniment offered. It rests upon mutual responsibility and a quality of presence essential to the work engaged.</p>

        <p className="font-display text-base">1. Session Booking</p>
        <p>Every session is confirmed only upon payment or within the scope of a prepaid package. Without prior payment, no time slot is reserved.</p>

        <p className="font-display text-base">2. Changes &amp; Cancellations</p>
        <p>Any session not attended or cancelled less than 48 hours in advance is due and non-transferable. Modification requests made more than 48 hours in advance are possible, subject to availability. A single exceptional adjustment (joker) is granted over the entire journey.</p>

        <p className="font-display text-base">3. Participant&apos;s Commitment</p>
        <p>The participant commits to a process involving active presence, continuity in exchanges and the use of the proposed tools. Phases of discomfort or resistance may arise — they are an integral part of the process. In such moments, the participant commits to staying in contact and not interrupting the process without communication.</p>

        <p className="font-display text-base">4. Personal Responsibility</p>
        <p>This accompaniment constitutes exclusively the sharing of a personal experience and well-being practices. It does not in any way constitute a medical act, diagnosis, treatment or prescription. Joffrey Deleplanque is not a physician. No content shared replaces medical advice or ongoing treatment. The participant commits to consulting a qualified healthcare professional for any medical question.</p>

        <p className="font-display text-base">5. Nature of the Process</p>
        <p>The work includes breathing practices, meditation, the use of elixirs and processes of inner observation. The elixirs offered are natural preparations shared within the framework of a personal experience — they do not constitute medication and carry no therapeutic claims. The participant freely engages in these practices with full awareness of their possible effects.</p>

        <p className="font-display text-base">6. Interruption of the Journey</p>
        <p>The participant may decide to interrupt the journey. This decision must be accompanied by a closing session to integrate and finalise the process. No interruption takes place without this exchange.</p>

        <p className="font-display text-base">7. Data Protection — GDPR</p>
        <p>Personal data collected (videos, journal, birth data) is processed confidentially, hosted in Switzerland (Infomaniak) and is never shared with third parties. In accordance with the GDPR, the participant has the right to access, rectify and delete their data.</p>

        <p className="text-brun-mid/60 text-xs pt-4">— Joffrey Deleplanque · BeeFrequency</p>
      </div>

      {!scrolled && (
        <p className="text-xs text-brun-mid/60 font-ui text-center animate-pulse">↓ Scroll to the bottom to continue</p>
      )}

      <div className={`space-y-3 transition-opacity duration-300 ${scrolled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
        {[
          { key: "c1", text: "I have read and accept the terms of accompaniment, the cancellation policy (48h) and the commitment of presence." },
          { key: "c2", text: "I acknowledge that this accompaniment constitutes the sharing of a personal experience and does not replace medical care in any way. Joffrey Deleplanque is not a physician." },
          { key: "c3", text: "I accept the confidential processing of my personal data hosted in Switzerland, in accordance with the GDPR." },
        ].map(({ key, text }) => (
          <label key={key} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checks[key as keyof typeof checks]}
              onChange={(e) => setChecks(prev => ({ ...prev, [key]: e.target.checked }))}
              className="mt-0.5 accent-or-sacre w-4 h-4 flex-shrink-0"
            />
            <span className="font-ui text-sm text-brun-chaud leading-relaxed">{text}</span>
          </label>
        ))}
      </div>

      {/* Auto-signature with first name */}
      <div className="text-center py-2">
        <p className="font-caps text-xs text-brun-mid/60 uppercase tracking-wider mb-1">Signed by</p>
        <p className="font-display text-2xl text-brun-chaud italic">{clientFirstName}</p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allChecked || !scrolled || submitting}
        className="w-full py-3 bg-or-sacre text-white font-ui text-xs uppercase tracking-widest rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "Signing..." : "I commit"}
      </button>
    </div>
  );
}
