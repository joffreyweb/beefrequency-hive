"use client";

import { useState } from "react";

interface TaskItem {
  title: string;
  dueDate: string;
}

interface PostSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId?: string;
  sessionId?: string;
  clientId?: string;
  clientName: string;
  date: string;
}

export default function PostSessionModal({
  isOpen,
  onClose,
  appointmentId,
  sessionId,
  clientId,
  clientName,
  date,
}: PostSessionModalProps) {
  const [notes, setNotes] = useState("");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  function addTask() {
    const title = newTask.trim();
    if (!title) return;
    setTasks([...tasks, { title, dueDate: newTaskDate }]);
    setNewTask("");
    setNewTaskDate("");
  }

  function removeTask(index: number) {
    setTasks(tasks.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      // 1. Sauvegarder les notes
      if (notes.trim()) {
        const noteRes = await fetch("/api/admin/session-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionId || null,
            appointmentId: appointmentId || null,
            content: notes.trim(),
          }),
        });
        if (!noteRes.ok) throw new Error("Erreur sauvegarde notes");
      }

      // 2. Sauvegarder les tâches
      for (const task of tasks) {
        const taskRes = await fetch("/api/admin/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: task.title,
            clientId: clientId || null,
            sessionId: sessionId || null,
            appointmentId: appointmentId || null,
            dueDate: task.dueDate || null,
          }),
        });
        if (!taskRes.ok) throw new Error("Erreur création tâche");
      }

      // 3. Marquer la séance comme terminée
      if (appointmentId) {
        await fetch(`/api/admin/appointments/${appointmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "COMPLETED" }),
        });
      } else if (sessionId) {
        await fetch(`/api/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "COMPLETED" }),
        });
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  const dateFormatted = new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Brussels",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-5">
          <p className="font-caps text-xs text-foret uppercase tracking-wider mb-1">Séance terminée</p>
          <p className="font-display text-lg text-brun-chaud">{clientName}</p>
          <p className="font-ui text-sm text-brun-mid">{dateFormatted}</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 font-ui bg-red-50 px-3 py-2 rounded-sharp mb-4">{error}</p>
        )}

        {/* Notes de séance */}
        <div className="mb-5">
          <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-2">
            Notes de séance (privées)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Observations, ressentis, points importants..."
            className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre transition-colors resize-y min-h-[120px]"
          />
          <p className="text-[10px] font-ui text-ambre-vif/70 mt-1">
            Ces notes ne sont JAMAIS visibles par le client
          </p>
        </div>

        {/* Tâches */}
        <div className="mb-6">
          <label className="block text-xs font-caps text-brun-mid uppercase tracking-wider mb-2">
            Tâches à faire
          </label>

          {tasks.length > 0 && (
            <div className="space-y-2 mb-3">
              {tasks.map((task, i) => (
                <div key={i} className="flex items-center gap-2 bg-creme-sacree border border-or-pale/50 rounded-sharp px-3 py-2">
                  <span className="text-sm font-ui text-brun-chaud flex-1">{task.title}</span>
                  {task.dueDate && (
                    <span className="text-[10px] font-ui text-brun-mid/50">
                      {new Date(task.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  )}
                  <button
                    onClick={() => removeTask(i)}
                    className="text-xs text-brun-mid/40 hover:text-red-500 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTask())}
              placeholder="Nouvelle tâche..."
              className="flex-1 px-3 py-1.5 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre transition-colors"
            />
            <input
              type="date"
              value={newTaskDate}
              onChange={(e) => setNewTaskDate(e.target.value)}
              className="w-32 px-2 py-1.5 text-xs font-ui text-brun-mid bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre transition-colors"
            />
            <button
              onClick={addTask}
              disabled={!newTask.trim()}
              className="px-3 py-1.5 text-sm font-caps bg-or-sacre/10 text-or-sacre rounded-sharp hover:bg-or-sacre/20 transition-colors disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2 border-t border-or-pale/30">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-caps uppercase tracking-wider text-brun-mid border border-or-pale rounded-sharp hover:bg-creme-sacree transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs font-caps uppercase tracking-wider bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer et fermer"}
          </button>
        </div>
      </div>
    </div>
  );
}
