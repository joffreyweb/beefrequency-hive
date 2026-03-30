"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

interface Question {
  id: string;
  type: "text" | "mcq" | "mcq_multiple";
  question: string;
  questionFr: string;
  options?: string[];
  required: boolean;
}

export default function ClientQuestionnairePage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const responseId = params.responseId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [error, setError] = useState("");
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const isFR = lang === "FR";

  useEffect(() => {
    fetch(`/api/client/questionnaire/${responseId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.submitted) {
          setAlreadySubmitted(true);
          setTitle(data.questionnaire?.title || "");
          return;
        }
        if (data.questionnaire) {
          setTitle(data.questionnaire.title);
          setQuestions(data.questionnaire.questions || []);
        }
        if (data.error) setError(data.error);
      })
      .catch(() => setError("Erreur de chargement"));
  }, [responseId]);

  function getQuestionText(q: Question) {
    return isFR && q.questionFr ? q.questionFr : q.question;
  }

  function setAnswer(qId: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  }

  function goNext() {
    setDirection("forward");
    setCurrentStep((s) => s + 1);
  }

  function goBack() {
    setDirection("back");
    setCurrentStep((s) => s - 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/client/questionnaire/${responseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json();
        setError(data.error || "Erreur");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <p className="font-display text-xl text-brun-chaud mb-2">{error}</p>
        <button onClick={() => router.push("/client/home")} className="mt-4 text-sm font-ui text-or-sacre hover:text-ambre-vif">
          &larr; {isFR ? "Retour" : "Back"}
        </button>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <p className="font-display text-2xl text-brun-chaud mb-2">
          {isFR ? "Merci" : "Thank you"}
        </p>
        <p className="font-ui text-sm text-brun-mid">
          {isFR ? "Tes reponses ont ete envoyees. Joffrey les consultera." : "Your answers have been submitted. Joffrey will review them."}
        </p>
        <button onClick={() => router.push("/client/home")} className="mt-6 px-8 py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif">
          {isFR ? "Retour" : "Back home"}
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <p className="font-display text-2xl text-brun-chaud mb-2">
          {isFR ? "Merci pour tes reponses" : "Thank you for your answers"}
        </p>
        <p className="font-ui text-sm text-brun-mid mt-2">
          {isFR ? "Joffrey les recevra et les analysera avant ton accompagnement." : "Joffrey will receive and review them before your program begins."}
        </p>
        <button onClick={() => router.push("/client/home")} className="mt-6 px-8 py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif">
          {isFR ? "Retour" : "Back home"}
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="font-ui text-sm text-brun-mid/60">{isFR ? "Chargement..." : "Loading..."}</p>
      </div>
    );
  }

  const q = questions[currentStep];
  const isLast = currentStep === questions.length - 1;
  const currentAnswer = answers[q?.id];
  const canProceed = !q?.required || (currentAnswer && (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : currentAnswer.trim() !== ""));

  return (
    <div className="min-h-[60vh] flex flex-col">
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {questions.map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full transition-colors" style={{ background: i === currentStep ? "#B8821E" : i < currentStep ? "#D4A042" : "#E8D5A8" }} />
        ))}
      </div>
      <p className="text-center text-xs font-ui text-brun-mid/50 mb-6">
        {currentStep + 1} / {questions.length}
      </p>

      <div
        key={currentStep}
        className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full"
        style={{ animation: `${direction === "forward" ? "fadeSlideIn" : "fadeSlideBack"} 0.3s ease-out` }}
      >
        <h2 className="font-display text-xl text-brun-chaud text-center mb-6">
          {getQuestionText(q)}
        </h2>

        {/* Text input */}
        {q.type === "text" && (
          <textarea
            value={(currentAnswer as string) || ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre resize-none"
            placeholder={isFR ? "Ta reponse..." : "Your answer..."}
          />
        )}

        {/* MCQ single */}
        {q.type === "mcq" && (
          <div className="w-full space-y-2">
            {(q.options || []).map((opt) => (
              <button
                key={opt}
                onClick={() => setAnswer(q.id, opt)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-ui transition-colors ${
                  currentAnswer === opt
                    ? "bg-or-sacre text-white"
                    : "bg-cire-chaude border border-or-pale text-brun-chaud hover:border-or-sacre"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* MCQ multiple */}
        {q.type === "mcq_multiple" && (
          <div className="w-full space-y-2">
            {(q.options || []).map((opt) => {
              const selected = Array.isArray(currentAnswer) && currentAnswer.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => {
                    const prev = Array.isArray(currentAnswer) ? currentAnswer : [];
                    setAnswer(q.id, selected ? prev.filter((o) => o !== opt) : [...prev, opt]);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-ui transition-colors ${
                    selected
                      ? "bg-or-sacre text-white"
                      : "bg-cire-chaude border border-or-pale text-brun-chaud hover:border-or-sacre"
                  }`}
                >
                  {selected ? "\u2713 " : ""}{opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-4 pt-6 w-full">
          {currentStep > 0 && (
            <button onClick={goBack} className="flex-1 py-3 text-brun-mid font-caps text-sm uppercase tracking-wider">
              {isFR ? "Retour" : "Back"}
            </button>
          )}
          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || !canProceed}
              className="flex-1 py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif disabled:opacity-50"
            >
              {submitting ? "..." : isFR ? "Envoyer mes reponses" : "Send my answers"}
            </button>
          ) : (
            <button
              onClick={goNext}
              disabled={!canProceed}
              className="flex-1 py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif disabled:opacity-50"
            >
              {isFR ? "Suivant" : "Next"}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeSlideBack {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
