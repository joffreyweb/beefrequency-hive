"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import type { Lang } from "@/lib/translations";
import Link from "next/link";
import MySessionsSection from "@/components/client/MySessionsSection";
import InstallPwaSection from "@/components/client/InstallPwaSection";

const DAYS_FR: Record<string, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

const DAYS_EN: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const TIMEZONES = [
  "Europe/Paris",
  "Europe/Brussels",
  "Europe/London",
  "Europe/Zurich",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Lisbon",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Montreal",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Australia/Sydney",
  "Pacific/Auckland",
];

interface ProfileData {
  language: string;
  timezone: string | null;
  intake: {
    postalAddress: string;
    addressLine2: string | null;
    city: string;
    postalCode: string;
    country: string;
    phoneNumber: string | null;
  } | null;
  user: { email: string } | null;
}

interface EngagementData {
  hasAccepted: boolean;
  fixedDay: string | null;
  reportsUsed: number;
  acceptedAt: string | null;
}

export default function ClientSettingsPage() {
  const { lang, setLang } = useLanguage();
  const T = (key: { EN: string; FR: string }) => key[lang];

  const [selectedLang, setSelectedLang] = useState<Lang>(lang);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile data
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [engagement, setEngagement] = useState<EngagementData | null>(null);

  // Address editing
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    postalAddress: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);

  // Contact editing
  const [editingContact, setEditingContact] = useState(false);
  const [phoneForm, setPhoneForm] = useState("");
  const [contactSaving, setContactSaving] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  // Timezone
  const [selectedTz, setSelectedTz] = useState("");
  const [tzSaving, setTzSaving] = useState(false);
  const [tzSaved, setTzSaved] = useState(false);

  // Password
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/client/profile")
      .then((r) => r.json())
      .then((data: ProfileData) => {
        setProfile(data);
        if (data.intake) {
          setAddressForm({
            postalAddress: data.intake.postalAddress || "",
            addressLine2: data.intake.addressLine2 || "",
            city: data.intake.city || "",
            postalCode: data.intake.postalCode || "",
            country: data.intake.country || "",
          });
          setPhoneForm(data.intake.phoneNumber || "");
        }
        setSelectedTz(data.timezone || "Europe/Paris");
      })
      .catch(() => {});

    fetch("/api/client/engagement")
      .then((r) => r.json())
      .then((data: EngagementData) => setEngagement(data))
      .catch(() => {});
  }, []);

  // Language save
  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setLang(selectedLang);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
    }, 500);
  }

  // Address save
  async function handleAddressSave() {
    setAddressSaving(true);
    setAddressSaved(false);
    try {
      await fetch("/api/client/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
      });
      setEditingAddress(false);
      setAddressSaved(true);
      if (profile?.intake) {
        setProfile({
          ...profile,
          intake: { ...profile.intake, ...addressForm },
        });
      }
    } finally {
      setAddressSaving(false);
    }
  }

  // Contact save
  async function handleContactSave() {
    setContactSaving(true);
    setContactSaved(false);
    try {
      await fetch("/api/client/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phoneForm }),
      });
      setEditingContact(false);
      setContactSaved(true);
      if (profile?.intake) {
        setProfile({
          ...profile,
          intake: { ...profile.intake, phoneNumber: phoneForm },
        });
      }
    } finally {
      setContactSaving(false);
    }
  }

  // Timezone save
  async function handleTzSave() {
    setTzSaving(true);
    setTzSaved(false);
    try {
      await fetch("/api/client/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: selectedTz }),
      });
      setTzSaved(true);
      if (profile) setProfile({ ...profile, timezone: selectedTz });
    } finally {
      setTzSaving(false);
    }
  }

  // Password save
  async function handlePwSave() {
    setPwMessage(null);
    if (pwForm.newPw.length < 8) {
      setPwMessage({ type: "error", text: T(t.settings.passwordTooShort) });
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwMessage({ type: "error", text: T(t.settings.passwordMismatch) });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/client/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwForm.current,
          newPassword: pwForm.newPw,
        }),
      });
      if (res.ok) {
        setPwMessage({ type: "ok", text: T(t.settings.passwordChanged) });
        setPwForm({ current: "", newPw: "", confirm: "" });
      } else {
        const data = await res.json();
        if (data.error === "passwordWrong") {
          setPwMessage({ type: "error", text: T(t.settings.passwordWrong) });
        } else if (data.error === "passwordTooShort") {
          setPwMessage({ type: "error", text: T(t.settings.passwordTooShort) });
        } else {
          setPwMessage({ type: "error", text: data.error || "Error" });
        }
      }
    } finally {
      setPwSaving(false);
    }
  }

  const dayLabel = engagement?.fixedDay
    ? (lang === "FR" ? DAYS_FR : DAYS_EN)[engagement.fixedDay] || engagement.fixedDay
    : "—";

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl text-brun-chaud">
        {T(t.settings.title)}
      </h1>

      {/* Language toggle */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-4">
        <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid">
          {T(t.settings.changeLanguage)}
        </h2>

        <div className="flex gap-3">
          <button
            onClick={() => setSelectedLang("EN")}
            className={`flex-1 py-3 rounded-lg border-2 transition-all duration-200 ${
              selectedLang === "EN"
                ? "bg-or-sacre border-or-sacre text-white"
                : "bg-creme-sacree border-or-pale text-brun-chaud hover:border-or-sacre/50"
            }`}
          >
            <span className="font-ui text-sm">EN</span>
            <span className="font-ui text-[10px] block mt-0.5 opacity-70">English</span>
          </button>
          <button
            onClick={() => setSelectedLang("FR")}
            className={`flex-1 py-3 rounded-lg border-2 transition-all duration-200 ${
              selectedLang === "FR"
                ? "bg-or-sacre border-or-sacre text-white"
                : "bg-creme-sacree border-or-pale text-brun-chaud hover:border-or-sacre/50"
            }`}
          >
            <span className="font-ui text-sm">FR</span>
            <span className="font-ui text-[10px] block mt-0.5 opacity-70">Fran&ccedil;ais</span>
          </button>
        </div>

        {selectedLang !== lang && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-or-sacre text-white rounded-sharp font-ui text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {saving ? T(t.settings.saving) : T(t.settings.save)}
          </button>
        )}
        {saved && (
          <p className="text-center text-sm text-foret font-ui">{T(t.settings.saved)}</p>
        )}
      </div>

      {/* 1. Adresse livraison */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid">
            {T(t.settings.deliveryAddress)}
          </h2>
          {!editingAddress && profile?.intake && (
            <button
              onClick={() => setEditingAddress(true)}
              className="font-ui text-xs text-or-sacre hover:text-ambre-vif transition-colors"
            >
              {T(t.settings.edit)}
            </button>
          )}
        </div>

        {editingAddress ? (
          <div className="space-y-3">
            <SettingsField
              label={T(t.settings.addressLine1)}
              value={addressForm.postalAddress}
              onChange={(v) => setAddressForm((p) => ({ ...p, postalAddress: v }))}
            />
            <SettingsField
              label={T(t.settings.addressLine2)}
              value={addressForm.addressLine2}
              onChange={(v) => setAddressForm((p) => ({ ...p, addressLine2: v }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <SettingsField
                label={T(t.settings.postalCode)}
                value={addressForm.postalCode}
                onChange={(v) => setAddressForm((p) => ({ ...p, postalCode: v }))}
              />
              <SettingsField
                label={T(t.settings.city)}
                value={addressForm.city}
                onChange={(v) => setAddressForm((p) => ({ ...p, city: v }))}
              />
            </div>
            <SettingsField
              label={T(t.settings.country)}
              value={addressForm.country}
              onChange={(v) => setAddressForm((p) => ({ ...p, country: v }))}
            />
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditingAddress(false)}
                className="flex-1 py-2.5 border border-brun-mid text-brun-mid font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-brun-mid hover:text-creme-sacree transition-colors"
              >
                {T(t.settings.cancel)}
              </button>
              <button
                onClick={handleAddressSave}
                disabled={addressSaving}
                className="flex-1 py-2.5 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-ambre-vif transition-colors disabled:opacity-50"
              >
                {addressSaving ? T(t.settings.saving) : T(t.settings.save)}
              </button>
            </div>
          </div>
        ) : (
          <div className="font-ui text-sm text-brun-chaud space-y-1">
            {profile?.intake ? (
              <>
                <p>{profile.intake.postalAddress}</p>
                {profile.intake.addressLine2 && <p>{profile.intake.addressLine2}</p>}
                <p>{profile.intake.postalCode} {profile.intake.city}</p>
                <p>{profile.intake.country}</p>
              </>
            ) : (
              <p className="text-brun-mid/60 italic">—</p>
            )}
          </div>
        )}
        {addressSaved && (
          <p className="text-center text-sm text-foret font-ui">{T(t.settings.saved)}</p>
        )}
      </div>

      {/* 2. Mon engagement */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-4">
        <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid">
          {T(t.settings.myEngagement)}
        </h2>

        {engagement?.hasAccepted ? (
          <div className="font-ui text-sm text-brun-chaud space-y-2">
            <div className="flex justify-between">
              <span className="text-brun-mid">{T(t.settings.referenceDay)}</span>
              <span className="font-semibold">{dayLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brun-mid">{T(t.settings.reportsUsed)}</span>
              <span className="font-semibold">{engagement.reportsUsed}/1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brun-mid">{T(t.settings.acceptedOn)}</span>
              <span className="font-semibold">
                {engagement.acceptedAt
                  ? new Date(engagement.acceptedAt).toLocaleDateString(lang === "FR" ? "fr-FR" : "en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
          </div>
        ) : (
          <p className="font-ui text-sm text-brun-mid/60 italic">
            {T(t.settings.notYetAccepted)}
          </p>
        )}
      </div>

      {/* 3. Contact */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid">
            {T(t.settings.contact)}
          </h2>
          {!editingContact && (
            <button
              onClick={() => setEditingContact(true)}
              className="font-ui text-xs text-or-sacre hover:text-ambre-vif transition-colors"
            >
              {T(t.settings.edit)}
            </button>
          )}
        </div>

        <div className="font-ui text-sm text-brun-chaud space-y-3">
          <div>
            <label className="block text-xs text-brun-mid mb-1">{T(t.settings.email)}</label>
            <p className="text-brun-chaud">{profile?.user?.email || "—"}</p>
          </div>

          {editingContact ? (
            <>
              <SettingsField
                label={T(t.settings.phone)}
                value={phoneForm}
                onChange={setPhoneForm}
              />
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setEditingContact(false)}
                  className="flex-1 py-2.5 border border-brun-mid text-brun-mid font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-brun-mid hover:text-creme-sacree transition-colors"
                >
                  {T(t.settings.cancel)}
                </button>
                <button
                  onClick={handleContactSave}
                  disabled={contactSaving}
                  className="flex-1 py-2.5 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-ambre-vif transition-colors disabled:opacity-50"
                >
                  {contactSaving ? T(t.settings.saving) : T(t.settings.save)}
                </button>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs text-brun-mid mb-1">{T(t.settings.phone)}</label>
              <p className="text-brun-chaud">{profile?.intake?.phoneNumber || "—"}</p>
            </div>
          )}
        </div>
        {contactSaved && (
          <p className="text-center text-sm text-foret font-ui">{T(t.settings.saved)}</p>
        )}
      </div>

      {/* 4. Fuseau horaire */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-4">
        <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid">
          {T(t.settings.timezone)}
        </h2>

        <select
          value={selectedTz}
          onChange={(e) => { setSelectedTz(e.target.value); setTzSaved(false); }}
          className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
          ))}
        </select>

        {selectedTz !== (profile?.timezone || "Europe/Paris") && (
          <button
            onClick={handleTzSave}
            disabled={tzSaving}
            className="w-full py-2.5 bg-or-sacre text-white rounded-sharp font-ui text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {tzSaving ? T(t.settings.saving) : T(t.settings.save)}
          </button>
        )}
        {tzSaved && (
          <p className="text-center text-sm text-foret font-ui">{T(t.settings.saved)}</p>
        )}
      </div>

      {/* 5. Mot de passe */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-4">
        <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid">
          {T(t.settings.password)}
        </h2>

        <div className="space-y-3">
          <SettingsField
            label={T(t.settings.currentPassword)}
            value={pwForm.current}
            onChange={(v) => setPwForm((p) => ({ ...p, current: v }))}
            type="password"
          />
          <SettingsField
            label={T(t.settings.newPassword)}
            value={pwForm.newPw}
            onChange={(v) => setPwForm((p) => ({ ...p, newPw: v }))}
            type="password"
          />
          <SettingsField
            label={T(t.settings.confirmPassword)}
            value={pwForm.confirm}
            onChange={(v) => setPwForm((p) => ({ ...p, confirm: v }))}
            type="password"
          />
        </div>

        <button
          onClick={handlePwSave}
          disabled={pwSaving || !pwForm.current || !pwForm.newPw || !pwForm.confirm}
          className="w-full py-2.5 bg-or-sacre text-white rounded-sharp font-ui text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-50"
        >
          {pwSaving ? T(t.settings.saving) : T(t.settings.changePassword)}
        </button>

        {pwMessage && (
          <p className={`text-center text-sm font-ui ${pwMessage.type === "ok" ? "text-foret" : "text-red-600"}`}>
            {pwMessage.text}
          </p>
        )}
      </div>

      {/* Mes seances */}
      {/* Installer l'application */}
      <InstallPwaSection lang={lang} />

      {/* Aide */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-3">
        <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid">
          {T({ EN: "HELP", FR: "AIDE" })}
        </h2>
        <Link
          href="/client/help/install"
          className="flex items-center justify-between py-2 hover:bg-creme-sacree -mx-2 px-2 rounded transition-colors"
        >
          <span className="font-ui text-sm text-brun-chaud">
            💡 {T({ EN: "How to install the app", FR: "Comment installer l'app" })}
          </span>
          <span className="text-or-sacre">›</span>
        </Link>
      </div>

      <MySessionsSection lang={lang} />
    </div>
  );
}

function SettingsField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-ui text-brun-mid mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors"
      />
    </div>
  );
}
