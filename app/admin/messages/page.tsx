"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import MessageBubble from "@/components/shared/MessageBubble";
import MessageInput from "@/components/shared/MessageInput";

interface Thread {
  clientId: string;
  clientName: string;
  clientEmail: string;
  lastMessage: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
  hasJourneyMessages?: boolean;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  tag: string | null;
  readAt: string | null;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
}

interface ClientOption {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
}

// Messagerie admin — liste des fils à gauche, conversation à droite
export default function AdminMessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New conversation modal
  const [showNewConvo, setShowNewConvo] = useState(false);
  const [allClients, setAllClients] = useState<ClientOption[]>([]);
  const [newConvoClientId, setNewConvoClientId] = useState("");
  const [newConvoMessage, setNewConvoMessage] = useState("");
  const [sendingNew, setSendingNew] = useState(false);

  // Scroll automatique vers le bas quand les messages changent
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Récupère l'userId courant (admin)
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (res.ok && data.user) {
          setCurrentUserId(data.user.id);
        }
      } catch {
        // Silencieux — l'auth est gérée par le layout
      }
    }
    fetchMe();
  }, []);

  // Charge la liste des fils
  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (res.ok) {
        setThreads(data.threads || []);
      }
    } catch {
      // Erreur silencieuse
    }
  }, []);

  // Charge les messages du fil actif
  const fetchMessages = useCallback(async () => {
    if (!activeClientId) return;
    try {
      const res = await fetch(`/api/messages?clientId=${activeClientId}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      }
    } catch {
      // Erreur silencieuse
    }
  }, [activeClientId]);

  // Marque les messages comme lus quand on ouvre un fil
  const markAsRead = useCallback(async () => {
    if (!activeClientId) return;
    try {
      await fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: activeClientId }),
      });
    } catch {
      // Erreur silencieuse
    }
  }, [activeClientId]);

  // Chargement initial des fils
  useEffect(() => {
    fetchThreads().then(() => setLoading(false));
  }, [fetchThreads]);

  // Quand le fil actif change, charge les messages et marque comme lu
  useEffect(() => {
    if (activeClientId) {
      fetchMessages();
      markAsRead();
    }
  }, [activeClientId, fetchMessages, markAsRead]);

  // Polling toutes les 10 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchThreads();
      if (activeClientId) {
        fetchMessages();
        markAsRead();
      }
    }, 10_000);

    return () => clearInterval(interval);
  }, [activeClientId, fetchThreads, fetchMessages, markAsRead]);

  // Charge la liste des clients pour le modal "Nouvelle conversation"
  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/clients");
      const data = await res.json();
      if (res.ok && data.clients) {
        setAllClients(
          data.clients.map((c: { id: string; user: { id: string; name: string; email: string } }) => ({
            id: c.id,
            userId: c.user.id,
            userName: c.user.name,
            userEmail: c.user.email,
          }))
        );
      }
    } catch {
      // Erreur silencieuse
    }
  }, []);

  // Ouvre le modal nouvelle conversation
  const openNewConvo = () => {
    setNewConvoClientId("");
    setNewConvoMessage("");
    fetchClients();
    setShowNewConvo(true);
  };

  // Envoie le premier message de la nouvelle conversation
  const handleSendNewConvo = async () => {
    if (!newConvoClientId || !newConvoMessage.trim()) return;
    setSendingNew(true);

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: newConvoClientId, content: newConvoMessage.trim() }),
    });

    if (res.ok) {
      setShowNewConvo(false);
      await fetchThreads();
      setActiveClientId(newConvoClientId);
      await fetchMessages();
    }
    setSendingNew(false);
  };

  // Envoi d'un message
  const handleSend = async (content: string) => {
    if (!activeClientId) return;

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: activeClientId, content }),
    });

    if (res.ok) {
      await fetchMessages();
      await fetchThreads();
    }
  };

  // Sélection d'un fil
  const selectThread = (clientId: string) => {
    setActiveClientId(clientId);
    setMessages([]);
  };

  // Fil actif (pour le nom dans le header)
  const activeThread = threads.find((t) => t.clientId === activeClientId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="font-ui text-sm text-brun-mid/60">
          Chargement des messages…
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-light text-brun-chaud">
          Messagerie
        </h1>
        <button
          onClick={openNewConvo}
          className="px-4 py-2.5 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-[10px] hover:bg-ambre-vif transition-colors"
        >
          Nouvelle conversation
        </button>
      </div>

      <div className="flex gap-6 h-[calc(100vh-12rem)]">
        {/* Liste des fils — colonne gauche */}
        <div className="w-80 shrink-0 bg-cire-chaude border border-or-pale rounded-sm overflow-y-auto">
          <div className="p-4 border-b border-or-pale">
            <h2 className="font-caps text-xs text-brun-mid uppercase tracking-wider">
              Conversations
            </h2>
          </div>

          {threads.length === 0 ? (
            <p className="p-4 text-sm text-brun-mid/60 font-ui">
              Aucune conversation
            </p>
          ) : (
            <ul>
              {threads.map((thread) => (
                <li key={thread.clientId}>
                  <button
                    onClick={() => selectThread(thread.clientId)}
                    className={`w-full text-left px-4 py-3 border-b border-or-pale/30 hover:bg-creme-sacree/50 transition-colors duration-150 ${
                      activeClientId === thread.clientId
                        ? "bg-creme-sacree"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-ui text-brun-chaud font-normal">
                        {thread.clientName}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {thread.hasJourneyMessages && (
                          <span className="text-[10px] text-ambre-vif" title="Messages parcours">🐝</span>
                        )}
                        {thread.unreadCount > 0 && (
                          <span className="bg-or-sacre text-white text-[10px] font-ui px-1.5 py-0.5 rounded-sharp min-w-[20px] text-center">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs font-ui text-brun-mid/60 truncate">
                      {thread.lastMessage.content}
                    </p>
                    <p className="text-[10px] font-ui text-brun-mid/40 mt-0.5">
                      {new Date(thread.lastMessage.createdAt).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Zone de conversation — colonne droite */}
        <div className="flex-1 flex flex-col bg-cire-chaude border border-or-pale rounded-sm">
          {!activeClientId ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="font-ui text-sm text-brun-mid/60">
                Sélectionnez une conversation
              </p>
            </div>
          ) : (
            <>
              {/* Header du fil */}
              <div className="px-5 py-3 border-b border-or-pale">
                <h3 className="font-ui text-sm text-brun-chaud">
                  {activeThread?.clientName || "Conversation"}
                </h3>
                <p className="font-ui text-xs text-brun-mid/60">
                  {activeThread?.clientEmail}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-brun-mid/60 font-ui mt-8">
                    Aucun message dans cette conversation
                  </p>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      content={msg.content}
                      createdAt={msg.createdAt}
                      isMine={msg.senderId === currentUserId}
                      senderName={msg.sender.name}
                      tag={msg.tag}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-5 py-3 border-t border-or-pale">
                <MessageInput onSend={handleSend} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal — Nouvelle conversation */}
      {showNewConvo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-creme-sacree border border-or-pale rounded-[10px] p-6 w-full max-w-md shadow-xl">
            <h3 className="font-display text-lg text-brun-chaud mb-4">
              Nouvelle conversation
            </h3>

            <div className="space-y-4">
              {/* Sélecteur client */}
              <div>
                <label className="block text-xs font-ui text-brun-mid/60 mb-1">
                  Client
                </label>
                <select
                  value={newConvoClientId}
                  onChange={(e) => setNewConvoClientId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud focus:outline-none focus:border-or-sacre transition-colors"
                >
                  <option value="">Sélectionner un client…</option>
                  {allClients.map((c) => (
                    <option key={c.userId} value={c.userId}>
                      {c.userName} — {c.userEmail}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-ui text-brun-mid/60 mb-1">
                  Message
                </label>
                <textarea
                  value={newConvoMessage}
                  onChange={(e) => setNewConvoMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud resize-none focus:outline-none focus:border-or-sacre transition-colors"
                  placeholder="Votre message…"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowNewConvo(false)}
                  className="px-4 py-2 border border-or-pale text-brun-mid text-xs font-ui uppercase rounded-sharp hover:bg-cire-chaude transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSendNewConvo}
                  disabled={sendingNew || !newConvoClientId || !newConvoMessage.trim()}
                  className="px-4 py-2 bg-or-sacre text-white text-xs font-ui uppercase rounded-sharp hover:bg-ambre-vif disabled:opacity-50 transition-colors"
                >
                  {sendingNew ? "Envoi…" : "Envoyer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
