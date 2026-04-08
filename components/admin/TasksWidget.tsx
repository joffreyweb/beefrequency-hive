"use client";

import { useState, useEffect } from "react";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  client: { user: { name: string } } | null;
}

export default function TasksWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  function fetchTasks() {
    fetch("/api/admin/tasks")
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks || []))
      .catch(() => {});
  }

  async function toggleTask(id: string, completed: boolean) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));
    await fetch(`/api/admin/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    // Remove after animation
    if (completed) {
      setTimeout(() => setTasks((prev) => prev.filter((t) => t.id !== id)), 600);
    }
  }

  async function addTask() {
    const title = newTitle.trim();
    if (!title) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        const { task } = await res.json();
        setTasks((prev) => [...prev, task]);
        setNewTitle("");
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  function isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < now;
  }

  function formatDue(dueDate: string | null): string {
    if (!dueDate) return "";
    const d = new Date(dueDate);
    const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
    if (diff === 0) return "Aujourd'hui";
    if (diff === -1) return "Hier";
    if (diff === 1) return "Demain";
    return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
  }

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">
            À faire
          </h2>
          {tasks.length > 0 && (
            <span className="text-xs font-ui text-or-sacre bg-or-sacre/10 px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-20">
            <p className="text-sm font-ui text-brun-mid/60">Aucune tâche en cours</p>
          </div>
        ) : (
          <div className="space-y-1.5 mb-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-start gap-2.5 py-2 px-2 rounded transition-all duration-500 ${
                  task.completed ? "opacity-40 scale-95" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(e) => toggleTask(task.id, e.target.checked)}
                  className="mt-0.5 accent-or-sacre"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-ui leading-tight ${
                    task.completed ? "line-through text-brun-mid/50" : "text-brun-chaud"
                  }`}>
                    {task.title}
                    {task.client && (
                      <span className="text-brun-mid/50"> — {task.client.user.name.split(" ")[0]}</span>
                    )}
                  </p>
                </div>
                {task.dueDate && (
                  <span className={`text-[10px] font-ui whitespace-nowrap mt-0.5 ${
                    isOverdue(task.dueDate) ? "text-red-500 font-medium" : "text-brun-mid/40"
                  }`}>
                    {formatDue(task.dueDate)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Ajout rapide */}
        <div className="flex gap-2 pt-2 border-t border-or-pale/30">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="+ Nouvelle tâche..."
            className="flex-1 px-3 py-1.5 text-sm font-ui text-brun-chaud bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre transition-colors"
          />
          <button
            onClick={addTask}
            disabled={creating || !newTitle.trim()}
            className="px-3 py-1.5 text-xs font-caps bg-or-sacre/10 text-or-sacre rounded-sharp hover:bg-or-sacre/20 transition-colors disabled:opacity-30"
          >
            {creating ? "..." : "+"}
          </button>
        </div>
      </div>
    </div>
  );
}
