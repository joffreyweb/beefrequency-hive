"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import MessageBubble from "@/components/shared/MessageBubble";
import MessageInput from "@/components/shared/MessageInput";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";

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

export default function ClientMessagesPage() {
  const { lang } = useLanguage();
  const T = (key: { EN: string; FR: string }) => key[lang];

  const [activeTab, setActiveTab] = useState<Tab>("conversation");
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string>("Joffrey");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationMessages = allMessages.filter((m) => m.tag !== "JOURNEY");
  const journeyMessages = allMessages.filter((m) => m.tag === "JOURNEY");

  const unreadConversation = conversationMessages.filter(
    (m) => m.senderId !== currentUserId && !m.readAt
  ).length;
  const unreadJourney = journeyMessages.filter(
    (m) => m.senderId !== currentUserId && !m.readAt
  ).length;

  const displayedMessages =
    activeTab === "conversation" ? conversationMessages : journeyMessages;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [displayedMessages, scrollToBottom]);

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (res.ok && data.user) setCurrentUserId(data.user.id);
      } catch { /* Silent */ }
    }
    fetchMe();
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (res.ok) {
        setAllMessages(data.messages || []);
        if (data.adminId) setAdminId(data.adminId);
        if (data.adminName) setAdminName(data.adminName);
      }
    } catch { /* Silent */ }
  }, []);

  const markAsRead = useCallback(async () => {
    if (!adminId) return;
    try {
      await fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: adminId }),
      });
    } catch { /* Silent */ }
  }, [adminId]);

  useEffect(() => {
    fetchMessages().then(() => setLoading(false));
  }, [fetchMessages]);

  useEffect(() => {
    if (adminId) markAsRead();
  }, [adminId, markAsRead]);

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

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
      if (adminId) markAsRead();
    }, 10_000);
    return () => clearInterval(interval);
  }, [adminId, fetchMessages, markAsRead]);

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
        <p className="font-ui text-sm text-brun-mid/60">{T(t.messages.loading)}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl font-light text-brun-chaud mb-6">
        {T(t.messages.title)}
      </h1>

      {/* Tabs */}
      <div className="flex border-b border-or-pale mb-0">
        <button
          onClick={() => setActiveTab("conversation")}
          className={`relative px-5 py-3 text-sm font-ui transition-colors ${
            activeTab === "conversation"
              ? "text-or-sacre border-b-2 border-or-sacre -mb-px"
              : "text-brun-mid hover:text-or-sacre"
          }`}
        >
          {T(t.messages.conversation)}
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
          {T(t.messages.journey)}
          {unreadJourney > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-ui bg-ambre-vif text-white rounded-full">
              {unreadJourney}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col h-[calc(100vh-16rem)] bg-cire-chaude border border-t-0 border-or-pale rounded-b-sm">
        <div className="px-5 py-3 border-b border-or-pale">
          <h2 className="font-ui text-sm text-brun-chaud">
            {activeTab === "conversation"
              ? `${T(t.messages.conversationWith)} ${adminName}`
              : T(t.messages.journeyMessages)}
          </h2>
          {activeTab === "parcours" && (
            <p className="text-xs font-ui text-brun-mid/60 mt-0.5">
              {T(t.messages.journeyAuto)}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {displayedMessages.length === 0 ? (
            <p className="text-center text-sm text-brun-mid/60 font-ui mt-8 whitespace-pre-line">
              {activeTab === "conversation" ? T(t.messages.noMessages) : T(t.messages.noJourney)}
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

        {activeTab === "conversation" && (
          <div className="px-5 py-3 border-t border-or-pale">
            <MessageInput onSend={handleSend} placeholder={T(t.messages.placeholder)} />
          </div>
        )}

        {activeTab === "parcours" && displayedMessages.length > 0 && (
          <div className="px-5 py-2 border-t border-or-pale/50 text-center">
            <p className="text-xs font-ui text-brun-mid/40">{T(t.messages.readOnly)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
