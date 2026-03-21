"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import MessageBubble from "@/components/shared/MessageBubble";
import MessageInput from "@/components/shared/MessageInput";

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

type Tab = "conversation" | "parcours";

// Page messages unifiée — conversation + messages parcours
export default function ClientMessagesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("conversation");
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string>("Joffrey");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Messages filtrés par onglet
  const conversationMessages = allMessages.filter((m) => m.tag !== "JOURNEY");
  const journeyMessages = allMessages.filter((m) => m.tag === "JOURNEY");

  // Messages non lus par onglet (reçus, non lus)
  const unreadConversation = conversationMessages.filter(
    (m) => m.senderId !== currentUserId && !m.readAt
  ).length;
  const unreadJourney = journeyMessages.filter(
    (m) => m.senderId !== currentUserId && !m.readAt
  ).length;

  // Messages affichés selon l'onglet actif
  const displayedMessages =
    activeTab === "conversation" ? conversationMessages : journeyMessages;

  // Scroll automatique vers le bas
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [displayedMessages, scrollToBottom]);

  // Récupère l'userId courant
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (res.ok && data.user) {
          setCurrentUserId(data.user.id);
        }
      } catch {
        // Silencieux
      }
    }
    fetchMe();
  }, []);

  // Charge tous les messages (conversation + parcours)
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (res.ok) {
        setAllMessages(data.messages || []);
        if (data.adminId) setAdminId(data.adminId);
        if (data.adminName) setAdminName(data.adminName);
      }
    } catch {
      // Erreur silencieuse
    }
  }, []);

  // Marque comme lus les messages de l'admin
  const markAsRead = useCallback(async () => {
    if (!adminId) return;
    try {
      await fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: adminId }),
      });
    } catch {
      // Erreur silencieuse
    }
  }, [adminId]);

  // Chargement initial
  useEffect(() => {
    fetchMessages().then(() => setLoading(false));
  }, [fetchMessages]);

  // Marque comme lus au mount et quand l'adminId est connu
  useEffect(() => {
    if (adminId) markAsRead();
  }, [adminId, markAsRead]);

  // Marque comme lus au focus de la fenêtre
  useEffect(() => {
    const handleFocus = () => {
      if (adminId) {
        markAsRead();
        fetchMessages();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [adminId, markAsRead, fetchMessages]);

  // Polling toutes les 10 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
      if (adminId) markAsRead();
    }, 10_000);
    return () => clearInterval(interval);
  }, [adminId, fetchMessages, markAsRead]);

  // Envoi d'un message
  const handleSend = async (content: string) => {
    if (!adminId) return;
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: adminId, content }),
    });
    if (res.ok) await fetchMessages();
  };

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
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl font-light text-brun-chaud mb-6">
        Messages
      </h1>

      {/* Onglets */}
      <div className="flex border-b border-or-pale mb-0">
        <button
          onClick={() => setActiveTab("conversation")}
          className={`relative px-5 py-3 text-sm font-ui transition-colors ${
            activeTab === "conversation"
              ? "text-or-sacre border-b-2 border-or-sacre -mb-px"
              : "text-brun-mid hover:text-or-sacre"
          }`}
        >
          Conversation
          {unreadConversation > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-ui bg-or-sacre text-white rounded-full">
              {unreadConversation}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("parcours")}
          className={`relative px-5 py-3 text-sm font-ui transition-colors ${
            activeTab === "parcours"
              ? "text-or-sacre border-b-2 border-or-sacre -mb-px"
              : "text-brun-mid hover:text-or-sacre"
          }`}
        >
          Parcours
          {unreadJourney > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-ui bg-ambre-vif text-white rounded-full">
              {unreadJourney}
            </span>
          )}
        </button>
      </div>

      {/* Contenu */}
      <div className="flex flex-col h-[calc(100vh-16rem)] bg-cire-chaude border border-t-0 border-or-pale rounded-b-sm">
        {/* Header contextuel */}
        <div className="px-5 py-3 border-b border-or-pale">
          <h2 className="font-ui text-sm text-brun-chaud">
            {activeTab === "conversation"
              ? `Conversation avec ${adminName}`
              : "Messages de parcours"}
          </h2>
          {activeTab === "parcours" && (
            <p className="text-xs font-ui text-brun-mid/60 mt-0.5">
              Messages automatiques et personnalisés de Joffrey
            </p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {displayedMessages.length === 0 ? (
            <p className="text-center text-sm text-brun-mid/60 font-ui mt-8">
              {activeTab === "conversation"
                ? "Aucun message pour le moment.\nÉcrivez votre premier message ci-dessous."
                : "Aucun message de parcours reçu."}
            </p>
          ) : (
            displayedMessages.map((msg) => (
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

        {/* Input — seulement pour l'onglet Conversation */}
        {activeTab === "conversation" && (
          <div className="px-5 py-3 border-t border-or-pale">
            <MessageInput onSend={handleSend} />
          </div>
        )}

        {/* Note lecture seule — pour l'onglet Parcours */}
        {activeTab === "parcours" && displayedMessages.length > 0 && (
          <div className="px-5 py-2 border-t border-or-pale/50 text-center">
            <p className="text-xs font-ui text-brun-mid/40">
              Ces messages sont en lecture seule
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
