"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SerializedClient {
  id: string;
  name: string;
  email: string;
  offerType: string;
  offerLabel: string;
  status: string;
  language: string;
  startDate: string;
  analysisStatus: string | null;
  pendingCount: number;
  isLegacy?: boolean;
  questionnaireStatus?: string | null;
}

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function computeDayNumber(startDate: string): number {
  return Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000) + 1;
}

const OFFER_OPTIONS = [
  { value: "CONVERSATION_EXPLORATOIRE", label: "Conversation exploratoire" },
  { value: "SESSION_SEUIL", label: "Session Seuil" },
  { value: "LE_NECTAR_CYCLE", label: "Le Nectar Cycle (600€)" },
  { value: "LE_PASSAGE_1_1", label: "Le Passage 1:1 (3900€)" },
  { value: "LES_CYCLES_DE_LA_RUCHE", label: "Les Cycles de la Ruche (1200€)" },
  { value: "CEREMONIE_RESET", label: "Cérémonie Reset (150€)" },
  { value: "LA_RUCHE_VIVANTE", label: "La Ruche Vivante (75€)" },
  { value: "SOUVERAINETE", label: "Souveraineté (15000€)" },
  { value: "LA_CHAMBRE_DE_LA_REINE", label: "La Chambre de la Reine" },
  { value: "SOS_URGENCE_VIP", label: "SOS Urgence VIP" },
  { value: "LE_FIL_DE_LA_RUCHE", label: "Le Fil de la Ruche" },
];

export default function ClientsGrid({ clients }: { clients: SerializedClient[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  // Invite form state
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    offerType: "CONVERSATION_EXPLORATOIRE", language: "FR",
    isLegacy: false, startDate: "", dayDirect: "",
  });
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; link?: string } | null>(null);

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [clients, search]);

  async function handleCreate() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) return;
    setCreating(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/create-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          offerType: form.offerType,
          language: form.language,
          isLegacy: form.isLegacy,
          startDate: form.isLegacy && form.startDate ? form.startDate : null,
          dayDirect: form.isLegacy && form.dayDirect ? Number(form.dayDirect) : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: "Client cree — email envoye", link: data.inviteLink });
        setTimeout(() => router.refresh(), 2000);
      } else {
        setResult({ success: false, message: data.error || "Erreur" });
      }
    } catch {
      setResult({ success: false, message: "Erreur de connexion" });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-light text-brun-chaud">La Ruche</h1>
        <button
          onClick={() => { setShowInvite(true); setResult(null); setForm({ firstName: "", lastName: "", email: "", offerType: "HIVE_EXPERIENCE", language: "FR", isLegacy: false, startDate: "", dayDirect: "" }); }}
          className="px-4 py-2.5 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-[10px] hover:bg-ambre-vif transition-colors"
        >
          Inviter un client
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2.5 bg-cire-chaude border border-or-pale rounded-[10px] text-sm font-ui text-brun-chaud placeholder:text-brun-mid/40 outline-none focus:border-or-sacre transition-colors"
        />
      </div>

      {/* Client grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-8 text-center">
          <p className="text-sm text-brun-mid/60 font-ui">Aucun client trouve.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const initials = getInitials(client.name);
            const dayNumber = computeDayNumber(client.startDate);

            return (
              <Link
                key={client.id}
                href={`/admin/clients/${client.id}`}
                className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 hover:border-or-sacre transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-or-sacre/10 flex items-center justify-center mb-3">
                  <span className="text-sm font-ui font-medium text-or-sacre">{initials}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-ui text-sm text-brun-chaud">{client.name}</p>
                  <div className="flex items-center gap-1.5">
                    {client.isLegacy && (
                      <span className="text-[9px] bg-brun-mid/10 text-brun-mid px-1.5 py-0.5 rounded-full">Legacy</span>
                    )}
                    {client.pendingCount > 0 && (
                      <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">{client.pendingCount}</span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] font-ui text-brun-mid mt-1">
                  Day {dayNumber} · {client.offerLabel} · {client.language}
                </p>
                {client.questionnaireStatus && (
                  <span className={`text-[9px] font-ui mt-1 inline-block px-1.5 py-0.5 rounded-full ${
                    client.questionnaireStatus === "SUBMITTED"
                      ? "bg-foret/10 text-foret"
                      : client.questionnaireStatus === "IN_PROGRESS"
                        ? "bg-or-sacre/10 text-or-sacre"
                        : "bg-brun-mid/10 text-brun-mid"
                  }`}>
                    Q: {client.questionnaireStatus === "SUBMITTED" ? "Soumis ✓" : client.questionnaireStatus === "IN_PROGRESS" ? "En cours" : "En attente"}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-creme-sacree border border-or-pale rounded-[10px] p-6 w-full max-w-md shadow-xl">
            <h3 className="font-display text-lg text-brun-chaud mb-4">Inviter un client</h3>

            {result?.success ? (
              <div className="space-y-3">
                <p className="text-sm font-ui text-foret">{result.message}</p>
                {result.link && (
                  <div className="bg-cire-chaude border border-or-pale rounded-sm p-3">
                    <p className="text-xs font-ui text-brun-mid/60 mb-1">Lien d&apos;activation</p>
                    <p className="text-xs font-ui text-foret break-all select-all">{result.link}</p>
                  </div>
                )}
                <button onClick={() => setShowInvite(false)} className="w-full py-2 bg-or-sacre text-white text-xs font-ui uppercase rounded-sharp hover:bg-ambre-vif">Fermer</button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-ui text-brun-mid/60 mb-1">Prenom *</label>
                    <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" placeholder="Prenom" />
                  </div>
                  <div>
                    <label className="block text-xs font-ui text-brun-mid/60 mb-1">Nom *</label>
                    <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" placeholder="Nom" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-ui text-brun-mid/60 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" placeholder="client@email.com" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-ui text-brun-mid/60 mb-1">Offre</label>
                    <select value={form.offerType} onChange={(e) => setForm({ ...form, offerType: e.target.value })} className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud">
                      {OFFER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-ui text-brun-mid/60 mb-1">Langue</label>
                    <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud">
                      <option value="FR">FR</option>
                      <option value="EN">EN</option>
                    </select>
                  </div>
                </div>

                {/* Legacy toggle */}
                <div className="border-t border-or-pale/50 pt-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setForm({ ...form, isLegacy: !form.isLegacy })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${form.isLegacy ? "bg-or-sacre" : "bg-brun-mid/20"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isLegacy ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                    <span className="text-sm font-ui text-brun-chaud">Client Legacy</span>
                  </label>
                  <p className="text-[10px] font-ui text-brun-mid/50 mt-1 ml-13">
                    Skip onboarding, entre directement en Programme 3 mois
                  </p>
                </div>

                {/* Legacy fields */}
                {form.isLegacy && (
                  <div className="bg-cire-chaude border border-or-pale/50 rounded-lg p-3 space-y-3">
                    <div>
                      <label className="block text-xs font-ui text-brun-mid/60 mb-1">Date de demarrage</label>
                      <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, dayDirect: "" })} className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" />
                    </div>
                    <div className="text-center text-xs font-ui text-brun-mid/40">ou</div>
                    <div>
                      <label className="block text-xs font-ui text-brun-mid/60 mb-1">Jour direct (ex: 15 = le client est a J15)</label>
                      <input type="number" min="1" value={form.dayDirect} onChange={(e) => setForm({ ...form, dayDirect: e.target.value, startDate: "" })} placeholder="Numero du jour" className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" />
                    </div>
                  </div>
                )}

                {result && !result.success && (
                  <p className="text-xs font-ui text-red-600">{result.message}</p>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <button onClick={() => setShowInvite(false)} className="px-4 py-2 border border-or-pale text-brun-mid text-xs font-ui uppercase rounded-sharp hover:bg-cire-chaude">Annuler</button>
                  <button
                    onClick={handleCreate}
                    disabled={creating || !form.firstName.trim() || !form.lastName.trim() || !form.email.trim()}
                    className="px-4 py-2 bg-or-sacre text-white text-xs font-ui uppercase rounded-sharp hover:bg-ambre-vif disabled:opacity-50"
                  >
                    {creating ? "Creation..." : "Creer le client"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
