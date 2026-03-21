"use client";

interface MessageBubbleProps {
  content: string;
  createdAt: string;
  isMine: boolean;
  senderName: string;
  tag?: string | null;
}

// Bulle de message — alignée à droite si isMine, à gauche sinon
export default function MessageBubble({
  content,
  createdAt,
  isMine,
  senderName,
  tag,
}: MessageBubbleProps) {
  const date = new Date(createdAt);
  const timeStr = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-sm ${
          isMine
            ? "bg-or-sacre text-white"
            : "bg-cire-chaude text-brun-chaud"
        }`}
      >
        {/* Nom de l'expéditeur (affiché seulement si ce n'est pas mon message) */}
        {!isMine && (
          <p className="text-xs font-caps uppercase tracking-wider text-brun-mid mb-1">
            {senderName}
          </p>
        )}

        {/* Label message de parcours */}
        {tag === "JOURNEY" && (
          <p className="text-xs text-ambre-vif font-ui mb-1">
            🐝 Message de parcours
          </p>
        )}

        {/* Contenu du message */}
        <p className="text-sm font-ui font-light whitespace-pre-wrap">
          {content}
        </p>

        {/* Horodatage */}
        <p
          className={`text-[10px] font-ui mt-1.5 ${
            isMine ? "text-white/60" : "text-brun-mid/50"
          }`}
        >
          {dateStr} · {timeStr}
        </p>
      </div>
    </div>
  );
}
