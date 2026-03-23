"use client";

import { useState, useRef, useCallback } from "react";

const QUESTIONS = {
  "1": [
    "Où j'en suis aujourd'hui.",
    "Comment je me sens en arrivant ici.",
    "Ce qui est vraiment présent en moi.",
    "Ce que j'ai envie de déposer.",
  ],
  "2": [
    "Ce qui a déjà bougé en moi.",
    "Ce que je vois différemment aujourd'hui.",
    "Ce qui résiste encore.",
    "Ce que je commence à comprendre.",
  ],
  "3": [
    "Ce qui est devenu plus clair.",
    "Ce que je ne peux plus ignorer.",
    "Ce que je choisis maintenant.",
    "L'engagement que je prends envers moi.",
  ],
};

interface VideoRecorderProps {
  seuil: "1" | "2" | "3";
  onComplete: () => void;
}

export default function VideoRecorder({ seuil, onComplete }: VideoRecorderProps) {
  const [phase, setPhase] = useState<"intro" | "recording" | "preview" | "uploading" | "done">("intro");
  const [error, setError] = useState("");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const questions = QUESTIONS[seuil];

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setRecordedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        setPhase("preview");
      };

      mediaRecorder.start();
      setPhase("recording");

      // Stop auto après 90 secondes
      setTimeout(() => {
        if (mediaRecorder.state === "recording") mediaRecorder.stop();
      }, 90000);
    } catch {
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
  }, []);

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const uploadVideo = async () => {
    if (!recordedBlob) return;
    setPhase("uploading");

    const formData = new FormData();
    formData.append("video", recordedBlob, `seuil-${seuil}.webm`);
    formData.append("seuil", seuil);

    try {
      const res = await fetch("/api/videos/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Erreur upload");
      setPhase("done");
      setTimeout(onComplete, 1500);
    } catch {
      setError("Erreur lors de l'envoi. Réessayez.");
      setPhase("preview");
    }
  };

  const retry = () => {
    setRecordedBlob(null);
    setPreviewUrl("");
    setPhase("intro");
  };

  if (phase === "intro") return (
    <div className="space-y-6">
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-6">
        <h3 className="font-display text-xl text-brun-chaud mb-4">
          Seuil {seuil} — Votre témoignage vidéo
        </h3>
        <p className="font-ui text-sm text-brun-mid mb-4">
          Prenez 60 secondes pour répondre à ces 4 intentions :
        </p>
        <ul className="space-y-2">
          {questions.map((q, i) => (
            <li key={i} className="flex items-start gap-2 font-ui text-sm text-brun-chaud">
              <span className="text-or-sacre mt-0.5">·</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </div>
      {error && <p className="text-red-600 font-ui text-sm">{error}</p>}
      <button
        onClick={startRecording}
        className="w-full py-3 bg-or-sacre text-white font-ui text-xs uppercase tracking-widest rounded-sharp hover:bg-ambre-vif transition-colors"
      >
        Commencer l'enregistrement
      </button>
    </div>
  );

  if (phase === "recording") return (
    <div className="space-y-4">
      <div className="relative rounded-sm overflow-hidden bg-black aspect-video">
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 px-2 py-1 rounded-full">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white font-ui text-xs">REC</span>
        </div>
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <ul className="space-y-1">
            {questions.map((q, i) => (
              <li key={i} className="text-white/80 font-ui text-xs">· {q}</li>
            ))}
          </ul>
        </div>
      </div>
      <button
        onClick={stopRecording}
        className="w-full py-3 bg-brun-chaud text-white font-ui text-xs uppercase tracking-widest rounded-sharp hover:opacity-80 transition-opacity"
      >
        Terminer l'enregistrement
      </button>
    </div>
  );

  if (phase === "preview") return (
    <div className="space-y-4">
      <video ref={previewRef} src={previewUrl} controls className="w-full rounded-sm aspect-video bg-black" />
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={retry}
          className="py-3 border border-or-pale text-brun-mid font-ui text-xs uppercase tracking-widest rounded-sharp hover:bg-cire-chaude transition-colors"
        >
          Recommencer
        </button>
        <button
          onClick={uploadVideo}
          className="py-3 bg-or-sacre text-white font-ui text-xs uppercase tracking-widest rounded-sharp hover:bg-ambre-vif transition-colors"
        >
          Envoyer
        </button>
      </div>
    </div>
  );

  if (phase === "uploading") return (
    <div className="text-center py-12">
      <p className="font-ui text-sm text-brun-mid">Envoi en cours...</p>
    </div>
  );

  return (
    <div className="text-center py-12">
      <p className="font-display text-2xl text-brun-chaud mb-2">✓</p>
      <p className="font-ui text-sm text-brun-mid">Vidéo enregistrée.</p>
    </div>
  );
}
