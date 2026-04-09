"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ─── Types ───

type SubStep = "video1" | "audio" | "video2";
type VideoPhase = "intro" | "recording" | "preview" | "uploading" | "done";

const VIDEO1_QUESTIONS = [
  "Ce que je ressens en arrivant ici.",
  "Ce qui est vraiment présent en moi.",
  "Quel est mon intention en venant ici ?",
];

const VIDEO2_QUESTION = "Et si tout était possible… Qu'est-ce que j'ai profondément envie de vivre ?";

interface SeuilOneFlowProps {
  onComplete: () => void;
  lang: "FR" | "EN";
}

export default function SeuilOneFlow({ onComplete, lang }: SeuilOneFlowProps) {
  const [subStep, setSubStep] = useState<SubStep>("video1");
  const [video1Done, setVideo1Done] = useState(false);
  const [video2Done, setVideo2Done] = useState(false);

  const T = (key: { EN: string; FR: string }) => key[lang];

  if (subStep === "video1") {
    return (
      <VideoStep
        seuil="1"
        title={T({ EN: "Seuil 1 — Starting point", FR: "Seuil 1 — Point de départ" })}
        questions={VIDEO1_QUESTIONS}
        locked={video1Done}
        onUploaded={() => {
          setVideo1Done(true);
          onComplete(); // Skip audio + video2, go to Convention
        }}
        lang={lang}
      />
    );
  }

  if (subStep === "audio") {
    return (
      <AudioInduction
        onComplete={() => setSubStep("video2")}
        lang={lang}
      />
    );
  }

  // video2
  return (
    <VideoStep
      seuil="1b"
      title={T({ EN: "Seuil 1 — If everything were possible", FR: "Seuil 1 — Et si tout était possible" })}
      questions={[VIDEO2_QUESTION]}
      locked={video2Done}
      onUploaded={() => {
        setVideo2Done(true);
        setTimeout(onComplete, 800);
      }}
      lang={lang}
    />
  );
}

// ═══════════════════════════════════════
// Composant VideoStep — réutilisable pour Video 1 et Video 2
// ═══════════════════════════════════════

function VideoStep({
  seuil,
  title,
  questions,
  locked,
  onUploaded,
  lang,
}: {
  seuil: string;
  title: string;
  questions: string[];
  locked: boolean;
  onUploaded: () => void;
  lang: "FR" | "EN";
}) {
  const [phase, setPhase] = useState<VideoPhase>(locked ? "done" : "intro");
  const [error, setError] = useState("");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const T = (key: { EN: string; FR: string }) => key[lang];

  const startRecording = useCallback(async () => {
    try {
      setError("");
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

      setTimeout(() => {
        if (mediaRecorder.state === "recording") mediaRecorder.stop();
      }, 90000);
    } catch {
      setError(T({
        EN: "Unable to access camera. Check permissions.",
        FR: "Impossible d'accéder à la caméra. Vérifiez les permissions.",
      }));
    }
  }, [T]);

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const uploadVideo = async () => {
    if (!recordedBlob) return;
    setPhase("uploading");
    try {
      const formData = new FormData();
      formData.append("video", recordedBlob, `seuil-${seuil}.webm`);
      formData.append("seuil", seuil);
      await fetch("/api/videos/upload", { method: "POST", body: formData });
    } catch (e) {
      console.error("Video upload failed", e);
    }
    setPhase("done");
    setTimeout(onUploaded, 800);
  };

  const retry = () => {
    setRecordedBlob(null);
    setPreviewUrl("");
    setPhase("intro");
  };

  if (phase === "done") {
    return (
      <div className="text-center py-12">
        <p className="font-display text-2xl text-foret mb-2">&#10003;</p>
        <p className="font-ui text-sm text-brun-mid">
          {T({ EN: "Video recorded and sent.", FR: "Vidéo enregistrée et envoyée." })}
        </p>
      </div>
    );
  }

  if (phase === "uploading") {
    return (
      <div className="text-center py-12">
        <p className="font-ui text-sm text-brun-mid animate-pulse">
          {T({ EN: "Sending...", FR: "Envoi en cours..." })}
        </p>
      </div>
    );
  }

  if (phase === "recording") {
    return (
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
                <li key={i} className="text-white/90 font-display text-sm italic">&middot; {q}</li>
              ))}
            </ul>
          </div>
        </div>
        <button
          onClick={stopRecording}
          className="w-full py-3 bg-brun-chaud text-white font-ui text-xs uppercase tracking-widest rounded-sharp hover:opacity-80 transition-opacity"
        >
          {T({ EN: "Stop recording", FR: "Terminer l'enregistrement" })}
        </button>
      </div>
    );
  }

  if (phase === "preview") {
    return (
      <div className="space-y-4">
        <video ref={previewRef} src={previewUrl} controls className="w-full rounded-sm aspect-video bg-black" />
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={retry}
            className="py-3 border border-or-pale text-brun-mid font-ui text-xs uppercase tracking-widest rounded-sharp hover:bg-cire-chaude transition-colors"
          >
            {T({ EN: "Redo", FR: "Recommencer" })}
          </button>
          <button
            onClick={uploadVideo}
            className="py-3 bg-or-sacre text-white font-ui text-xs uppercase tracking-widest rounded-sharp hover:bg-ambre-vif transition-colors"
          >
            {T({ EN: "Send", FR: "Envoyer" })}
          </button>
        </div>
      </div>
    );
  }

  // intro
  return (
    <div className="space-y-6">
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-6">
        <h3 className="font-display text-xl text-brun-chaud mb-4">{title}</h3>
        <p className="font-ui text-base text-brun-mid mb-4">
          {T({
            EN: "Take 60 seconds to respond to these intentions:",
            FR: "Prends 60 secondes pour répondre à ces intentions :",
          })}
        </p>
        <ul className="space-y-3">
          {questions.map((q, i) => (
            <li key={i} className="flex items-start gap-2 font-display text-lg text-brun-chaud italic">
              <span className="text-or-sacre mt-0.5">&middot;</span>
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
        {T({ EN: "Start recording", FR: "Commencer l'enregistrement" })}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════
// Composant AudioInduction
// ═══════════════════════════════════════

function AudioInduction({
  onComplete,
  lang,
}: {
  onComplete: () => void;
  lang: "FR" | "EN";
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [progress, setProgress] = useState(0);

  const T = (key: { EN: string; FR: string }) => key[lang];
  const audioUrl = process.env.NEXT_PUBLIC_AUDIO_SEUIL1_URL || "";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setPlaying(true);
    const onEnded = () => { setEnded(true); setPlaying(false); onComplete(); };
    const onTimeUpdate = () => {
      if (audio.duration > 0) {
        setProgress(Math.round((audio.currentTime / audio.duration) * 100));
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [onComplete]);

  function startAudio() {
    audioRef.current?.play();
  }

  return (
    <div className="space-y-6 text-center py-4">
      <h3 className="font-display text-xl text-brun-chaud">
        {T({ EN: "Listen to the audio", FR: "Écouter l'audio" })}
      </h3>

      <audio ref={audioRef} src={audioUrl} preload="auto" />

      {!playing && !ended && (
        <button
          onClick={startAudio}
          disabled={!audioUrl}
          className="px-8 py-3 bg-or-sacre text-white rounded-sharp uppercase font-caps text-sm tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-40"
        >
          {T({ EN: "Start listening", FR: "Commencer l'écoute" })}
        </button>
      )}

      {playing && (
        <div className="max-w-xs mx-auto">
          <div className="h-1.5 bg-creme-sacree rounded-full overflow-hidden">
            <div
              className="h-full bg-or-sacre rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="font-ui text-[10px] text-brun-mid/50 mt-1">{progress}%</p>
        </div>
      )}

      {playing && !ended && (
        <p className="font-ui text-sm text-brun-mid/60 animate-pulse">
          {T({ EN: "Listening in progress...", FR: "Écoute en cours..." })}
        </p>
      )}
    </div>
  );
}
