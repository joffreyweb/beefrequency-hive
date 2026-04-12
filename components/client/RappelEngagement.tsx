'use client'

import { useState } from 'react'

interface RappelEngagementProps {
  fixedDay: string
  onConfirm: () => void
}

const DAYS_FR: Record<string, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
}

export default function RappelEngagement({ fixedDay, onConfirm }: RappelEngagementProps) {
  const [loading, setLoading] = useState(false)
  const dayLabel = DAYS_FR[fixedDay] || fixedDay

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 max-w-lg mx-auto">
      <div className="text-center mb-4">
        <span className="text-4xl">&#x1F41D;</span>
      </div>

      <h2 className="font-display text-xl text-brun-chaud mb-4 text-center">
        Rappel avant votre premi&egrave;re s&eacute;ance
      </h2>

      <div className="bg-creme-sacree border border-or-pale rounded-sm p-4 mb-6">
        <p className="font-ui text-sm text-brun-chaud text-center mb-4">
          Votre jour de r&eacute;f&eacute;rence : <strong className="text-or-sacre">{dayLabel}</strong>
        </p>

        <div className="space-y-2 text-sm text-brun-mid">
          <p className="flex items-center gap-2">
            <span className="text-or-sacre">&#x2726;</span>
            Ce jour est votre RDV fixe pendant tout le programme
          </p>
          <p className="flex items-center gap-2">
            <span className="text-or-sacre">&#x2726;</span>
            1 seul report autoris&eacute; sur les 3 cycles
          </p>
          <p className="flex items-center gap-2">
            <span className="text-or-sacre">&#x2726;</span>
            Annulation : 48h minimum avant le RDV
          </p>
        </div>

        <p className="font-ui text-xs text-brun-mid text-center mt-4 italic">
          Toutes les conditions sont d&eacute;taill&eacute;es dans la charte accept&eacute;e lors de votre inscription.
        </p>
      </div>

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full py-3 px-4 bg-or-sacre text-white font-ui text-sm uppercase tracking-wider rounded-[2px] hover:bg-ambre-vif transition-colors disabled:bg-or-pale disabled:text-brun-mid"
      >
        {loading ? 'Chargement...' : "C'est compris, je suis pr\u00EAt(e)"}
      </button>
    </div>
  )
}
