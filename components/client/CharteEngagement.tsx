'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/LanguageContext'

interface CharteEngagementProps {
  onAccept: () => void
  onCancel: () => void
  clientName?: string
}

export default function CharteEngagement({ onAccept, onCancel, clientName }: CharteEngagementProps) {
  const { lang } = useLanguage()
  const T = (k: { EN: string; FR: string }) => k[lang]
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
        {T({ EN: 'Engagement Charter', FR: "Charte d'Engagement" })}
      </h2>
      <p className="font-ui text-brun-mid text-sm text-center mb-6">
        Monitoring Passage — BeeFrequency
      </p>

      <div className="bg-creme-sacree border border-or-pale rounded-sm p-5 mb-6 max-h-[60vh] overflow-y-auto">

        {/* Section 1 - Jour fixe */}
        <div className="mb-6">
          <h3 className="font-display text-lg text-or-sacre mb-3">
            {T({ EN: '1. Reference day', FR: '1. Jour de référence' })}
          </h3>
          <p className="font-ui text-sm text-brun-chaud leading-relaxed">
            {T({
              EN: 'From the very start you choose a ',
              FR: 'Vous choisissez dès le départ un ',
            })}
            <strong>{T({ EN: 'fixed day each week', FR: 'jour fixe par semaine' })}</strong>
            {T({
              EN: ', which becomes your reference appointment for the entire duration of the program. This day is a commitment to yourself — a sacred appointment with your transformation.',
              FR: ', qui devient votre rendez-vous de référence pendant toute la durée du programme. Ce jour est un engagement envers vous-même — un rendez-vous sacré avec votre transformation.',
            })}
          </p>
        </div>

        {/* Section 2 - Reports */}
        <div className="mb-6">
          <h3 className="font-display text-lg text-or-sacre mb-3">
            {T({ EN: '2. Rescheduling and changes', FR: '2. Reports et modifications' })}
          </h3>
          <p className="font-ui text-sm text-brun-chaud leading-relaxed mb-3">
            <strong>{T({ EN: 'Only one reschedule', FR: 'Un seul report' })}</strong>
            {T({ EN: ' is allowed across all 3 cycles.', FR: " est autorisé sur l'ensemble des 3 cycles." })}
          </p>
          <p className="font-ui text-sm text-brun-chaud leading-relaxed">
            {T({
              EN: 'In case of travel or a time-zone change, an adjustment may be considered provided it is communicated ',
              FR: "En cas de voyage ou de changement de fuseau horaire, une adaptation peut être envisagée à condition d'être communiquée ",
            })}
            <strong>{T({ EN: 'at least 7 days in advance', FR: "au minimum 7 jours à l'avance" })}</strong>
            {T({ EN: '.', FR: '.' })}
          </p>
        </div>

        {/* Section 3 - RDV manqués */}
        <div className="mb-6">
          <h3 className="font-display text-lg text-or-sacre mb-3">
            {T({ EN: '3. Missed appointments', FR: '3. Rendez-vous non honorés' })}
          </h3>
          <p className="font-ui text-sm text-brun-chaud leading-relaxed mb-3">
            {T({ EN: 'Any appointment ', FR: 'Tout rendez-vous ' })}
            <strong>{T({ EN: 'forgotten, missed or not followed up', FR: 'oublié, non honoré ou non suivi' })}</strong>
            {T({ EN: ' is considered lost.', FR: ' est considéré comme perdu.' })}
          </p>
          <p className="font-ui text-sm text-brun-chaud leading-relaxed">
            {T({
              EN: 'It may be rescheduled only subject to availability, but',
              FR: 'Il peut être reprogrammé uniquement selon les disponibilités, mais',
            })}
            <strong>{T({ EN: ' is not included in the package', FR: " n'est pas compris dans le forfait" })}</strong>
            {T({ EN: ' and will have to be', FR: ' et devra être' })}
            <strong>{T({ EN: ' paid in advance', FR: " payé à l'avance" })}</strong>
            {T({
              EN: ' to confirm the new slot. This rescheduled appointment can no longer be moved.',
              FR: ' pour confirmer le nouveau créneau. Ce rendez-vous reprogrammé ne pourra plus être déplacé.',
            })}
          </p>
        </div>

        {/* Section 4 - Annulations */}
        <div className="mb-6">
          <h3 className="font-display text-lg text-or-sacre mb-3">
            {T({ EN: '4. Cancellation terms', FR: "4. Conditions d'annulation" })}
          </h3>
          <p className="font-ui text-sm text-brun-chaud leading-relaxed">
            {T({ EN: 'Any cancellation must be communicated ', FR: 'Toute annulation doit être communiquée ' })}
            <strong>{T({ EN: 'at least 48 hours', FR: '48 heures minimum' })}</strong>
            {T({
              EN: ' before the scheduled appointment. The same rules apply to any rescheduled appointment.',
              FR: " avant le rendez-vous prévu. Les mêmes règles s'appliquent pour tout rendez-vous reprogrammé.",
            })}
          </p>
        </div>

        {/* Section 5 - Droit de fin */}
        <div className="mb-4 p-4 bg-ambre-vif/10 border border-or-sacre/30 rounded-sm">
          <h3 className="font-display text-lg text-or-sacre mb-3">
            {T({ EN: '5. Right to end the accompaniment', FR: "5. Droit de mettre fin à l'accompagnement" })}
          </h3>
          <p className="font-ui text-sm text-brun-chaud leading-relaxed mb-3">
            {T({ EN: 'In case of ', FR: 'En cas de ' })}
            <strong>{T({ EN: 'repeated non-compliance', FR: 'non-respect répété' })}</strong>
            {T({
              EN: ' with the program’s operating rules, in particular the cancellation, rescheduling, attendance conditions or the agreed engagement framework, I reserve the right to ',
              FR: " des règles de fonctionnement du programme, notamment des conditions d'annulation, de report, de présence ou du cadre d'engagement convenu, je me réserve le droit de ",
            })}
            <strong>{T({ EN: 'suspend or end', FR: 'suspendre ou de mettre fin' })}</strong>
            {T({
              EN: ' the accompaniment early.',
              FR: " à l'accompagnement de manière anticipée.",
            })}
          </p>
          <p className="font-ui text-sm text-brun-chaud leading-relaxed">
            {T({ EN: 'Such a decision ', FR: 'Une telle décision ' })}
            <strong>{T({ EN: 'will not entitle you to any refund', FR: "n'ouvrira droit à aucun remboursement" })}</strong>
            {T({
              EN: ', including for the sessions, weeks or phases of the program not yet carried out.',
              FR: ', y compris pour les séances, semaines ou phases restantes du programme non encore réalisées.',
            })}
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
          {T({
            EN: 'I have read and accept this engagement charter in full. I understand that these rules are essential to the smooth running of my accompaniment.',
            FR: "J'ai lu et j'accepte l'intégralité de cette charte d'engagement. Je comprends que ces règles sont essentielles au bon déroulement de mon accompagnement.",
          })}
        </span>
      </label>

      {/* Boutons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-4 border border-brun-mid text-brun-mid font-ui text-sm uppercase tracking-wider rounded-[2px] hover:bg-brun-mid hover:text-creme-sacree transition-colors"
        >
          {T({ EN: 'Back', FR: 'Retour' })}
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
          {loading ? T({ EN: 'Confirming...', FR: 'Confirmation...' }) : T({ EN: 'I commit', FR: "Je m'engage" })}
        </button>
      </div>
    </div>
  )
}
