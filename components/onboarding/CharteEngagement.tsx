"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  clientName: string;
  onComplete: () => void;
}

export default function CharteEngagement({ clientName, onComplete }: Props) {
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
    if (!allChecked || submitting) return;
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
        <h2 className="font-display text-2xl text-brun-chaud">Convention & Engagement</h2>
        <p className="font-ui text-sm text-brun-mid mt-1">Lisez attentivement avant de signer.</p>
      </div>

      <div
        ref={scrollRef}
        className="h-72 overflow-y-auto border border-or-pale rounded-sm bg-cire-chaude p-4 text-sm font-ui text-brun-chaud space-y-4 leading-relaxed"
      >
        <p className="font-display text-base text-brun-chaud">Objet de la Convention</p>
        <p>Cette convention encadre les modalités de réservation, d&apos;annulation et d&apos;engagement dans le cadre de l&apos;accompagnement proposé. Elle repose sur une responsabilité mutuelle et une qualité de présence nécessaire au travail engagé.</p>

        <p className="font-display text-base">1. Réservation des séances</p>
        <p>Toute séance est confirmée uniquement après règlement ou dans le cadre d&apos;un forfait prépayé. Sans paiement préalable, aucun créneau n&apos;est réservé.</p>

        <p className="font-display text-base">2. Modification & Annulation</p>
        <p>Toute séance non honorée ou annulée moins de 48 heures à l&apos;avance est due et non reportable. Les demandes de modification effectuées plus de 48 heures à l&apos;avance sont possibles, sous réserve de disponibilités. Un seul ajustement exceptionnel (joker) est autorisé sur l&apos;ensemble du parcours.</p>

        <p className="font-display text-base">3. Engagement du participant</p>
        <p>Le participant s&apos;engage dans un processus impliquant une présence active, une continuité dans les échanges et l&apos;utilisation des outils proposés. Des phases d&apos;inconfort ou de résistance peuvent apparaître — elles font partie intégrante du processus. Dans ces moments, le participant s&apos;engage à rester en lien et ne pas interrompre le processus sans communication.</p>

        <p className="font-display text-base">4. Responsabilité personnelle</p>
        <p>Cet accompagnement constitue exclusivement le partage d&apos;une expérience personnelle et de pratiques de bien-être. Il ne constitue en aucun cas un acte médical, un diagnostic, un traitement ou une prescription. Joffrey Deleplanque n&apos;est pas médecin. Aucun contenu partagé ne remplace un avis médical ou un traitement en cours. Le participant s&apos;engage à consulter un professionnel de santé qualifié pour toute question médicale.</p>

        <p className="font-display text-base">5. Nature du processus</p>
        <p>Le travail inclut des pratiques de respiration, de méditation, l&apos;utilisation d&apos;élixirs et des processus d&apos;observation intérieure. Les élixirs proposés sont des préparations naturelles partagées dans le cadre d&apos;une expérience personnelle — ils ne constituent pas des médicaments et ne font l&apos;objet d&apos;aucune allégation thérapeutique. Le participant s&apos;engage librement dans ces pratiques en pleine conscience de leurs effets possibles.</p>

        <p className="font-display text-base">6. Interruption du parcours</p>
        <p>Le participant peut décider d&apos;interrompre le parcours. Cette décision doit être accompagnée d&apos;une séance de clôture permettant d&apos;intégrer et de finaliser le processus. Aucune interruption ne se fait sans cet échange.</p>

        <p className="font-display text-base">7. Protection des données — RGPD</p>
        <p>Les données personnelles collectées (vidéos, journal, données de naissance) sont traitées de manière confidentielle, hébergées en Suisse (Infomaniak) et ne sont jamais partagées avec des tiers. Conformément au RGPD, le participant dispose d&apos;un droit d&apos;accès, de rectification et de suppression de ses données.</p>

        <p className="text-brun-mid/60 text-xs pt-4">— Joffrey Deleplanque · BeeFrequency</p>
      </div>

      {!scrolled && (
        <p className="text-xs text-brun-mid/60 font-ui text-center">↓ Faites défiler jusqu&apos;en bas pour continuer</p>
      )}

      <div className="space-y-3">
        {[
          { key: "c1", text: "J'ai lu et j'accepte les conditions d'accompagnement, la politique d'annulation (48h) et l'engagement de présence." },
          { key: "c2", text: "Je reconnais que cet accompagnement constitue le partage d'une expérience personnelle et ne remplace en aucun cas un suivi médical. Joffrey Deleplanque n'est pas médecin." },
          { key: "c3", text: "J'accepte le traitement confidentiel de mes données personnelles hébergées en Suisse, conformément au RGPD." },
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

      <p className="font-display text-lg text-center text-brun-chaud italic">{clientName}</p>

      <button
        onClick={handleSubmit}
        disabled={!allChecked || submitting}
        className="w-full py-3 bg-or-sacre text-white font-ui text-xs uppercase tracking-widest rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "Enregistrement..." : "Signer et accéder à mon espace"}
      </button>
    </div>
  );
}
