"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Question {
  id: string;
  type: "text" | "mcq" | "mcq_multiple";
  question: string;
  questionFr: string;
  options?: string[];
  required: boolean;
}

export default function EditQuestionnairePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/questionnaires/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.questionnaire) {
          setTitle(data.questionnaire.title);
          setType(data.questionnaire.type);
          setQuestions(data.questionnaire.questions || []);
        }
      });
  }, [id]);

  function addQuestion() {
    setQuestions([
      ...questions,
      { id: crypto.randomUUID(), type: "text", question: "", questionFr: "", required: true },
    ]);
  }

  function updateQuestion(idx: number, patch: Partial<Question>) {
    setQuestions(questions.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }

  function removeQuestion(idx: number) {
    setQuestions(questions.filter((_, i) => i !== idx));
  }

  function moveQuestion(idx: number, dir: -1 | 1) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= questions.length) return;
    const arr = [...questions];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setQuestions(arr);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/questionnaires/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, questions }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Link href="/admin/questionnaires" className="text-[13px] font-ui text-brun-mid/50 hover:text-or-sacre transition-colors mb-4 inline-block">
        &larr; Questionnaires
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-display text-2xl text-brun-chaud bg-transparent border-b border-transparent hover:border-or-pale focus:border-or-sacre focus:outline-none transition-colors"
          />
          <p className="text-xs font-ui text-brun-mid/50 mt-1">
            {type === "PRE_START" ? "Pre-Start" : "Follow-Up"} · {questions.length} question{questions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs font-ui text-foret">Enregistre</span>}
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-or-sacre text-white text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-ambre-vif disabled:opacity-50">
            {saving ? "..." : "Enregistrer"}
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-ui text-brun-mid/50">Question {idx + 1}</span>
              <div className="flex gap-1">
                <button onClick={() => moveQuestion(idx, -1)} disabled={idx === 0} className="text-xs text-brun-mid/50 hover:text-brun-chaud disabled:opacity-30 px-1">{"\u2191"}</button>
                <button onClick={() => moveQuestion(idx, 1)} disabled={idx === questions.length - 1} className="text-xs text-brun-mid/50 hover:text-brun-chaud disabled:opacity-30 px-1">{"\u2193"}</button>
                <button onClick={() => removeQuestion(idx)} className="text-xs text-red-400 hover:text-red-600 px-1 ml-2">{"\u2715"}</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-ui text-brun-mid/60 mb-1">Question (EN)</label>
                <input type="text" value={q.question} onChange={(e) => updateQuestion(idx, { question: e.target.value })} className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" placeholder="English question..." />
              </div>
              <div>
                <label className="block text-xs font-ui text-brun-mid/60 mb-1">Question (FR)</label>
                <input type="text" value={q.questionFr} onChange={(e) => updateQuestion(idx, { questionFr: e.target.value })} className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" placeholder="Question en francais..." />
              </div>
            </div>

            <div className="flex gap-3 mb-3">
              <div>
                <label className="block text-xs font-ui text-brun-mid/60 mb-1">Type</label>
                <select value={q.type} onChange={(e) => updateQuestion(idx, { type: e.target.value as Question["type"], options: e.target.value !== "text" ? (q.options?.length ? q.options : ["Option 1"]) : undefined })} className="px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud">
                  <option value="text">Texte libre</option>
                  <option value="mcq">QCM (une reponse)</option>
                  <option value="mcq_multiple">QCM (plusieurs reponses)</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-xs font-ui text-brun-mid cursor-pointer">
                  <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(idx, { required: e.target.checked })} className="accent-or-sacre" />
                  Obligatoire
                </label>
              </div>
            </div>

            {/* Options MCQ */}
            {(q.type === "mcq" || q.type === "mcq_multiple") && (
              <div className="space-y-2">
                <label className="block text-xs font-ui text-brun-mid/60">Options</label>
                {(q.options || []).map((opt, oi) => (
                  <div key={oi} className="flex gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...(q.options || [])];
                        newOpts[oi] = e.target.value;
                        updateQuestion(idx, { options: newOpts });
                      }}
                      className="flex-1 px-3 py-1.5 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud"
                    />
                    <button onClick={() => updateQuestion(idx, { options: (q.options || []).filter((_, i) => i !== oi) })} className="text-xs text-red-400 hover:text-red-600">{"\u2715"}</button>
                  </div>
                ))}
                <button
                  onClick={() => updateQuestion(idx, { options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] })}
                  className="text-xs font-ui text-or-sacre hover:text-ambre-vif"
                >
                  + Ajouter option
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={addQuestion} className="mt-4 w-full py-3 border-2 border-dashed border-or-pale text-or-sacre text-sm font-ui rounded-[10px] hover:border-or-sacre hover:bg-or-sacre/5 transition-colors">
        + Ajouter une question
      </button>
    </div>
  );
}
