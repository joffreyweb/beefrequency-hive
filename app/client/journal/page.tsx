"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import PhotoGallery from "@/components/client/PhotoGallery";

interface JournalEntry {
  id: string;
  content: string;
  mood: string | null;
  entryType: string;
  mediaUrl: string | null;
  isPrivate: boolean;
  createdAt: string;
}

type EntryFormat = "text" | "photo" | "audio";

const MOOD_OPTIONS = [
  { emoji: "\u{1F614}", key: "difficult" },
  { emoji: "\u{1F610}", key: "neutral" },
  { emoji: "\u{1F642}", key: "good" },
  { emoji: "\u{1F60A}", key: "verygood" },
  { emoji: "\u2728", key: "excellent" },
];

export default function JournalPage() {
  const { lang } = useLanguage();
  const T = (key: { EN: string; FR: string }) => key[lang];

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // New entry state
  const [format, setFormat] = useState<EntryFormat>("text");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Photo state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Audio state
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check-in
  const [hour, setHour] = useState<number | null>(null);
  const [checkinDone, setCheckinDone] = useState(false);

  useEffect(() => {
    setHour(new Date().getHours());
    fetchEntries();
    checkCheckinStatus();
  }, []);

  async function fetchEntries() {
    try {
      const res = await fetch("/api/journal");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch {} finally { setLoading(false); }
  }

  async function checkCheckinStatus() {
    try {
      const res = await fetch("/api/checkin/status");
      if (res.ok) {
        const data = await res.json();
        const h = new Date().getHours();
        if (h >= 5 && h < 13 && data.morningDone) setCheckinDone(true);
        if (h >= 16 && h <= 23 && data.eveningDone) setCheckinDone(true);
      }
    } catch {}
  }

  // ─── Text submit ───
  async function handleTextSubmit() {
    if (!content.trim()) return;
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), isPrivate, mood: mood || null, entryType: "text" }),
      });
      if (res.ok) {
        setContent(""); setMood(""); setIsPrivate(false); setSuccess(true);
        fetchEntries();
        setTimeout(() => setSuccess(false), 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Erreur");
      }
    } catch { setError("Erreur de connexion"); }
    finally { setSubmitting(false); }
  }

  // ─── Photo submit ───
  async function handlePhotoSubmit() {
    if (!selectedFile) return;
    setSubmitting(true); setError("");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", "photo");
      formData.append("isPrivate", String(isPrivate));
      formData.append("caption", content);
      if (mood) formData.append("mood", mood);
      const res = await fetch("/api/journal/upload", { method: "POST", body: formData });
      if (res.ok) {
        setSelectedFile(null); setPreviewUrl(""); setContent(""); setMood(""); setIsPrivate(false);
        setSuccess(true); fetchEntries();
        setTimeout(() => setSuccess(false), 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Erreur");
      }
    } catch { setError("Erreur de connexion"); }
    finally { setSubmitting(false); }
  }

  // ─── Audio recording ───
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setRecordingTime(0);

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      setRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => {
          if (t >= 299) { mediaRecorder.stop(); setRecording(false); return 300; }
          return t + 1;
        });
      }, 1000);

      // Auto-stop at 5 minutes
      setTimeout(() => {
        if (mediaRecorder.state === "recording") { mediaRecorder.stop(); setRecording(false); }
      }, 300000);
    } catch { setError("Impossible d'accéder au micro."); }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function handleAudioSubmit() {
    if (!audioBlob) return;
    setSubmitting(true); setError("");
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "journal-audio.webm");
      formData.append("type", "audio");
      formData.append("isPrivate", String(isPrivate));
      formData.append("caption", content);
      if (mood) formData.append("mood", mood);
      const res = await fetch("/api/journal/upload", { method: "POST", body: formData });
      if (res.ok) {
        setAudioBlob(null); setAudioUrl(""); setContent(""); setMood(""); setIsPrivate(false);
        setSuccess(true); fetchEntries();
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch { setError("Erreur de connexion"); }
    finally { setSubmitting(false); }
  }

  const morningOpen = hour !== null && hour >= 5 && hour < 13;
  const eveningOpen = hour !== null && hour >= 16 && hour <= 23;
  const showCheckin = (morningOpen || eveningOpen) && !checkinDone;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-brun-chaud">{T(t.journal.title)}</h1>

      {/* ─── Check-in du moment ─── */}
      {showCheckin && (
        <div className="bg-or-sacre/10 border border-or-sacre/30 rounded-sm p-5 text-center">
          <p className="font-display text-lg text-brun-chaud mb-2">
            {morningOpen
              ? T(t.home.morningCheckinFull)
              : T(t.home.eveningCheckinFull)}
          </p>
          <p className="font-ui text-sm text-brun-mid/70 mb-4">
            {morningOpen
              ? T(t.home.morningCheckin)
              : T(t.home.eveningCheckin)}
          </p>
          <Link
            href={morningOpen ? "/client/checkin/morning" : "/client/checkin/evening"}
            className="inline-block px-6 py-2.5 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors"
          >
            {T({ EN: "Start check-in", FR: "Faire mon check-in" })}
          </Link>
        </div>
      )}

      {checkinDone && (morningOpen || eveningOpen) && (
        <p className="font-ui text-sm text-foret text-center">
          &#10003; {T({ EN: "Check-in done for this moment", FR: "Check-in fait pour ce moment" })}
        </p>
      )}

      {/* ─── Nouvelle entrée ─── */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-4">
        <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid">
          {T(t.journal.newEntry)}
        </h2>

        {/* Format selector */}
        <div className="flex gap-2">
          {([
            { key: "text" as const, icon: "✍️", label: "Texte" },
            { key: "photo" as const, icon: "📸", label: "Photo" },
            { key: "audio" as const, icon: "🎙️", label: "Audio" },
          ]).map((f) => (
            <button
              key={f.key}
              onClick={() => { setFormat(f.key); setError(""); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-ui transition-colors ${
                format === f.key
                  ? "bg-or-sacre text-white"
                  : "bg-creme-sacree text-brun-mid hover:text-brun-chaud"
              }`}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>

        {/* ─── TEXT format ─── */}
        {format === "text" && (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={T(t.journal.writePlaceholder)}
            rows={4}
            className="w-full px-3 py-2 rounded-sharp border border-or-pale bg-creme-sacree text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors resize-y"
          />
        )}

        {/* ─── PHOTO format ─── */}
        {format === "photo" && (
          <div className="space-y-3">
            {previewUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" className="w-full rounded-sm max-h-64 object-cover" />
                <button
                  onClick={() => { setSelectedFile(null); setPreviewUrl(""); }}
                  className="absolute top-2 right-2 bg-black/50 text-white w-7 h-7 rounded-full text-sm flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-or-pale rounded-sm text-brun-mid/50 font-ui text-sm hover:border-or-sacre/50 transition-colors"
              >
                📸 {T({ EN: "Tap to select a photo", FR: "Appuie pour choisir une photo" })}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
              }}
            />
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={T({ EN: "Caption (optional)", FR: "Légende (optionnel)" })}
              className="w-full px-3 py-2 rounded-sharp border border-or-pale bg-creme-sacree text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre"
            />
          </div>
        )}

        {/* ─── AUDIO format ─── */}
        {format === "audio" && (
          <div className="space-y-3">
            {audioUrl ? (
              <div className="space-y-2">
                <audio src={audioUrl} controls className="w-full" />
                <button
                  onClick={() => { setAudioBlob(null); setAudioUrl(""); }}
                  className="text-xs font-ui text-brun-mid hover:text-brun-chaud transition-colors"
                >
                  {T({ EN: "Delete and redo", FR: "Supprimer et recommencer" })}
                </button>
              </div>
            ) : recording ? (
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-ui text-sm text-brun-chaud">
                    {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")} / 5:00
                  </span>
                </div>
                <button
                  onClick={stopRecording}
                  className="px-6 py-2.5 bg-brun-chaud text-white rounded-sharp font-ui text-xs uppercase tracking-wider"
                >
                  {T({ EN: "Stop recording", FR: "Arrêter l'enregistrement" })}
                </button>
              </div>
            ) : (
              <button
                onClick={startRecording}
                className="w-full py-8 border-2 border-dashed border-or-pale rounded-sm text-brun-mid/50 font-ui text-sm hover:border-or-sacre/50 transition-colors"
              >
                🎙️ {T({ EN: "Tap to start recording", FR: "Appuie pour commencer l'enregistrement" })}
              </button>
            )}
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={T({ EN: "Note (optional)", FR: "Note (optionnel)" })}
              className="w-full px-3 py-2 rounded-sharp border border-or-pale bg-creme-sacree text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre"
            />
          </div>
        )}

        {/* Mood + Private + Submit */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mood selector */}
          <div className="flex gap-1.5">
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.emoji}
                type="button"
                onClick={() => setMood(mood === opt.emoji ? "" : opt.emoji)}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm transition-colors ${
                  mood === opt.emoji ? "bg-or-sacre/20 border-or-sacre" : "border-or-pale hover:border-or-sacre/50"
                }`}
              >
                {opt.emoji}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="accent-or-sacre w-3.5 h-3.5"
            />
            <span className="text-xs font-ui text-brun-mid">{T(t.journal.keepPrivate)}</span>
          </label>

          <button
            onClick={() => {
              if (format === "text") handleTextSubmit();
              else if (format === "photo") handlePhotoSubmit();
              else if (format === "audio") handleAudioSubmit();
            }}
            disabled={
              submitting ||
              (format === "text" && !content.trim()) ||
              (format === "photo" && !selectedFile) ||
              (format === "audio" && !audioBlob)
            }
            className="ml-auto px-4 py-2 rounded-sm bg-or-sacre text-white font-ui text-sm hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {submitting ? T(t.journal.sending) : T(t.journal.add)}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 font-ui">{error}</p>}
        {success && <p className="text-sm text-foret font-ui">✓ {T({ EN: "Entry saved", FR: "Entrée enregistrée" })}</p>}
      </div>

      {/* ─── Entries list ─── */}
      {loading ? (
        <p className="font-ui text-sm text-brun-mid/60">{T(t.common.loading)}</p>
      ) : entries.length === 0 ? (
        <p className="font-ui text-sm text-brun-mid/60 text-center py-8">
          {T({ EN: "No journal entries yet.", FR: "Aucune entrée dans le journal." })}
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-cire-chaude border border-or-pale rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {entry.entryType === "photo" ? "📸" : entry.entryType === "audio" ? "🎙️" : "✍️"}
                  </span>
                  {entry.mood && <span className="text-sm">{entry.mood}</span>}
                  {entry.isPrivate && (
                    <span className="text-[9px] font-ui bg-brun-mid/10 text-brun-mid px-1.5 py-0.5 rounded-full">
                      {T({ EN: "Private", FR: "Privé" })}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-ui text-brun-mid/50">
                  {new Date(entry.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>

              {entry.entryType === "photo" && entry.mediaUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={entry.mediaUrl} alt="" className="w-full rounded-sm max-h-48 object-cover mb-2" />
              )}

              {entry.entryType === "audio" && entry.mediaUrl && (
                <audio src={entry.mediaUrl} controls className="w-full mb-2" />
              )}

              {entry.content && (
                <p className="font-ui text-sm text-brun-chaud whitespace-pre-wrap">{entry.content}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Galerie photos (V3b/3F) · agrège journal + check-ins matin/soir */}
      <PhotoGallery />
    </div>
  );
}
