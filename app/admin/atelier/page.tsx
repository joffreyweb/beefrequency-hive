import Link from "next/link";

// Définition d'une carte de l'atelier
interface AtelierCard {
  href: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

// Cartes de navigation de l'Atelier
const cards: AtelierCard[] = [
  {
    href: "/admin/elixirs",
    title: "Catalogue élixirs",
    description: "Gérer les élixirs et suivre les stocks",
    icon: "🧪",
    color: "#B8821E",
  },
  {
    href: "/admin/journey-messages",
    title: "Templates messages",
    description: "Messages de parcours automatisés",
    icon: "✉️",
    color: "#4A5E44",
  },
  {
    href: "/admin/practices",
    title: "Bibliothèque pratiques",
    description: "Respirations, vidéos et méditations",
    icon: "🫁",
    color: "#7A5514",
  },
  {
    href: "/admin/recommendations",
    title: "Recommandations",
    description: "Produits et ressources recommandés",
    icon: "⭐",
    color: "#6B4423",
  },
];

// Page L'Atelier — hub de gestion avec grille de raccourcis
export default function AtelierPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-light text-brun-chaud mb-6">
        L&apos;Atelier
      </h1>

      {/* Grille 2x2 de cartes de navigation */}
      <div className="grid grid-cols-2 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-cire-chaude border border-or-pale rounded-[10px] p-6 hover:border-or-sacre transition-all duration-150 group"
          >
            {/* Icône avec couleur de fond */}
            <div
              className="w-10 h-10 rounded-[7px] flex items-center justify-center text-white text-lg mb-3"
              style={{ backgroundColor: card.color }}
            >
              {card.icon}
            </div>
            <h3 className="font-ui text-sm text-brun-chaud group-hover:text-or-sacre transition-colors">
              {card.title}
            </h3>
            <p className="text-xs font-ui text-brun-mid/60 mt-1">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
