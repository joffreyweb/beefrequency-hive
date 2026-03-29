"use client";

import { useState, useRef, useCallback } from "react";

interface MessageInputProps {
  onSend: (content: string) => void | Promise<void>;
  placeholder?: string;
}

// Input de message — textarea + bouton envoyer
export default function MessageInput({ onSend, placeholder }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await onSend(trimmed);
      setContent("");
      // Remet le focus sur le textarea après envoi
      textareaRef.current?.focus();
    } finally {
      setSending(false);
    }
  }, [content, sending, onSend]);

  // Envoi avec Entrée (sans Shift)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-3 items-end">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "\u00c9crire un message\u2026"}
        rows={2}
        className="flex-1 px-3 py-2.5 bg-cire-chaude border border-or-pale rounded-sm text-brun-chaud font-ui font-light text-sm focus:outline-none focus:border-or-sacre transition-colors duration-200 resize-none"
      />
      <button
        onClick={handleSend}
        disabled={!content.trim() || sending}
        className="px-5 py-2.5 bg-or-sacre text-white font-ui text-xs uppercase tracking-[0.06em] rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50 shrink-0"
      >
        {sending ? "…" : "Envoyer"}
      </button>
    </div>
  );
}
