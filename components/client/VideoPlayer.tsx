"use client";

interface Practice {
  id: string;
  title: string;
  description: string;
  type: string;
  content: string;
}

interface VideoContent {
  url: string;
  duration?: number; // en minutes
}

interface VideoPlayerProps {
  practice: Practice;
  onComplete: () => void;
  onClose: () => void;
}

/**
 * VideoPlayer — Modal de lecture vidéo pour les pratiques de type VIDEO.
 * Affiche un iframe embed + bouton pour marquer comme vu.
 */
export default function VideoPlayer({
  practice,
  onComplete,
  onClose,
}: VideoPlayerProps) {
  const content: VideoContent = JSON.parse(practice.content);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-cire-chaude rounded-sm p-6 max-w-2xl w-full">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display text-xl text-brun-chaud mb-1">
              {practice.title}
            </h2>
            <p className="font-ui text-sm text-brun-mid">
              {practice.description}
            </p>
            {content.duration && (
              <p className="font-ui text-xs text-brun-mid/60 mt-1">
                Durée : {content.duration} min
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-brun-mid hover:text-brun-chaud transition-colors text-xl font-ui ml-4"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Iframe vidéo */}
        <div className="aspect-video w-full rounded-sm overflow-hidden mb-6">
          <iframe
            src={content.url}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={practice.title}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 font-ui text-sm text-brun-mid hover:text-brun-chaud transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={() => {
              onComplete();
              onClose();
            }}
            className="px-6 py-2 bg-or-sacre text-white rounded-sharp font-ui text-sm hover:opacity-90 transition-opacity"
          >
            Marquer comme vu
          </button>
        </div>
      </div>
    </div>
  );
}
