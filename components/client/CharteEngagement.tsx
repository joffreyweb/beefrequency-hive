'use client'

import { useState } from 'react'

interface CharteEngagementProps {
  onAccept: () => void
  onCancel: () => void
  clientName?: string
}

export default function CharteEngagement({ onAccept, onCancel, clientName }: CharteEngagementProps) {
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!accepted) return
    setLoading(true)
    try {
      await onAccept()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 max-w-2xl mx-auto">
      <h2 className="font-display text-2xl text-brun-chaud mb-2 text-center">
        Charte d&apos;Engagement
      </h2>
      <p className="font-ui text-brun-mid text-sm text-center mb-6">
        Monitoring Passage — BeeFrequency
      </p>

      <div className="bg-creme-sacree border border-or-pale rounded-sm p-5 mb-6 max-h-[60vh] overflow-y-auto">

        {/* Section 1 - Jour fixe */}
        <div className="mb-6">
          <h3 className="font-display text-lg text-or-sacre mb-3">
            1. Jour de r&eacute;f&eacute;rence
          </h3>
          <p className="font-ui text-sm text-brun-chaud leading-relaxed">
            Vous choisissez d&egrave;s le d&eacute;part un <strong>jour fixe par semaine</strong>,
            qui devient votre rendez-vous de r&eacute;f&eacute;rence pendant toute la dur&eacute;e du programme.
            Ce jour est un engagement envers vous-m&ecirc;me — un rendez-vous sacr&eacute; avec votre transformation.
          </p>
        </div>

        {/* Section 2 - Reports */}
        <div className="mb-6">
          <h3 className="font-display text-lg text-or-sacre mb-3">
            2. Reports et modifications
          </h3>
          <p className="font-ui text-sm text-brun-chaud leading-relaxed mb-3">
            <strong>Un seul report</strong> est autoris&eacute; sur l&apos;ensemble des 3 cycles.
          </p>
          <p className="font-ui text-sm text-brun-chaud leading-relaxed">
            En cas de voyage ou de changement de fuseau horaire, une adaptation peut &ecirc;tre
            envisag&eacute;e &agrave; condition d&apos;&ecirc;tre communiqu&eacute;e <strong>au minimum 7 jours &agrave; l&apos;avance</strong>.
          </p>
        </div>

        {/* Section 3 - RDV manqués */}
        <div className="mb-6">
          <h3 className="font-display text-lg text-or-sacre mb-3">
            3. Rendez-vous non honor&eacute;s
          </h3>
          <p className="font-ui text-sm text-brun-chaud leading-relaxed mb-3">
            Tout rendez-vous <strong>oubli&eacute;, non honor&eacute; ou non suivi</strong> est consid&eacute;r&eacute; comme perdu.
          </p>
          <p className="font-ui text-sm text-brun-chaud leading-relaxed">
            Il peut &ecirc;tre reprogramm&eacute; uniquement selon les disponibilit&eacute;s, mais
            <strong> n&apos;est pas compris dans le forfait</strong> et devra &ecirc;tre
            <strong> pay&eacute; &agrave; l&apos;avance</strong> pour confirmer le nouveau cr&eacute;neau.
            Ce rendez-vous reprogramm&eacute; ne pourra plus &ecirc;tre d&eacute;plac&eacute;.
          </p>
        </div>

        {/* Section 4 - Annulations */}
        <div className="mb-6">
          <h3 className="font-display text-lg text-or-sacre mb-3">
            4. Conditions d&apos;annulation
          </h3>
          <p className="font-ui text-sm text-brun-chaud leading-relaxed">
            Toute annulation doit &ecirc;tre communiqu&eacute;e <strong>48 heures minimum</strong> avant
            le rendez-vous pr&eacute;vu. Les m&ecirc;mes r&egrave;gles s&apos;appliquent pour tout rendez-vous reprogramm&eacute;.
          </p>
        </div>

        {/* Section 5 - Droit de fin */}
        <div className="mb-4 p-4 bg-ambre-vif/10 border border-or-sacre/30 rounded-sm">
          <h3 className="font-display text-lg text-or-sacre mb-3">
            5. Droit de mettre fin &agrave; l&apos;accompagnement
          </h3>
          <p className="font-ui text-sm text-brun-chaud leading-relaxed mb-3">
            En cas de <strong>non-respect r&eacute;p&eacute;t&eacute;</strong> des r&egrave;gles de fonctionnement du programme,
            notamment des conditions d&apos;annulation, de report, de pr&eacute;sence ou du cadre d&apos;engagement convenu,
            je me r&eacute;serve le droit de <strong>suspendre ou de mettre fin</strong> &agrave; l&apos;accompagnement
            de mani&egrave;re anticip&eacute;e.
          </p>
          <p className="font-ui text-sm text-brun-chaud leading-relaxed">
            Une telle d&eacute;cision <strong>n&apos;ouvrira droit &agrave; aucun remboursement</strong>,
            y compris pour les s&eacute;ances, semaines ou phases restantes du programme non encore r&eacute;alis&eacute;es.
          </p>
        </div>

      </div>

      {/* Checkbox acceptation */}
      <label className="flex items-start gap-3 cursor-pointer mb-6 p-4 bg-creme-sacree border border-or-pale rounded-sm hover:border-or-sacre transition-colors">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-1 w-5 h-5 accent-or-sacre"
        />
        <span className="font-ui text-sm text-brun-chaud">
          J&apos;ai lu et j&apos;accepte l&apos;int&eacute;gralit&eacute; de cette charte d&apos;engagement.
          Je comprends que ces r&egrave;gles sont essentielles au bon d&eacute;roulement de mon accompagnement.
        </span>
      </label>

      {/* Boutons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-4 border border-brun-mid text-brun-mid font-ui text-sm uppercase tracking-wider rounded-[2px] hover:bg-brun-mid hover:text-creme-sacree transition-colors"
        >
          Retour
        </button>
        <button
          onClick={handleConfirm}
          disabled={!accepted || loading}
          className={`flex-1 py-3 px-4 font-ui text-sm uppercase tracking-wider rounded-[2px] transition-colors ${
            accepted && !loading
              ? 'bg-or-sacre text-white hover:bg-ambre-vif'
              : 'bg-or-pale text-brun-mid cursor-not-allowed'
          }`}
        >
          {loading ? 'Confirmation...' : "Je m'engage"}
        </button>
      </div>
    </div>
  )
}
