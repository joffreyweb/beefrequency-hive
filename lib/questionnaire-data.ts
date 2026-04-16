// ═══════════════════════════════════════
// Questionnaire d'Entrée BeeFrequency ·8 sections
// ═══════════════════════════════════════

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  text: string;
  type: "mcq" | "textarea" | "checkbox";
  options?: QuestionOption[];
  conditional?: string; // ID of a textarea that appears if any checkbox is checked
}

export interface Section {
  id: string;
  number: number;
  icon: string;
  title: string;
  intro: string;
  questions: Question[];
}

export const SECTIONS: Section[] = [
  // ─── Section 1 ·LA FRÉQUENCE ───
  {
    id: "frequence",
    number: 1,
    icon: "🐝",
    title: "LA FRÉQUENCE ·Sensibilités & Réactivité de ton Système Immunitaire",
    intro: "Ces informations me permettent d'évaluer la réactivité de ton système et d'adapter avec soin tout protocole impliquant le venin ou les produits de la ruche.",
    questions: [
      {
        id: "s1q1", text: "As-tu des allergies saisonnières (rhume des foins, pollens) ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "parfois", label: "Parfois / selon les saisons" }],
      },
      {
        id: "s1q2", text: "As-tu déjà présenté de l'urticaire ou des plaques cutanées ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "occasionnellement", label: "Occasionnellement" }],
      },
      {
        id: "s1q3", text: "Souffres-tu d'eczéma ou de rougeurs récurrentes ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "episodes", label: "Par épisodes" }],
      },
      {
        id: "s1q4", text: "As-tu les yeux qui piquent ou des larmoiements fréquents ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }],
      },
      {
        id: "s1q5", text: "As-tu déjà ressenti une gorge qui se serre ou se ferme ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }],
      },
      {
        id: "s1q6", text: "As-tu de l'asthme ou des difficultés respiratoires ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "diagnostique", label: "Diagnostiqué" }, { value: "non_diagnostique", label: "Non diagnostiqué mais symptomatique" }],
      },
      {
        id: "s1q7", text: "As-tu des épisodes de tachycardie (cœur qui s'emballe) sans cause cardiaque connue ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "rarement", label: "Rarement" }],
      },
      {
        id: "s1q8", text: "Deviens-tu très rouge après une douche chaude, l'effort ou le stress ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }],
      },
      {
        id: "s1q9", text: "As-tu une forte intolérance aux odeurs (parfums, produits chimiques, fumée) ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "legere", label: "Légère" }],
      },
      {
        id: "s1q10", text: "Tolères-tu mal l'alcool, même en petite quantité ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }],
      },
    ],
  },

  // ─── Section 2 ·LE TERRAIN ───
  {
    id: "terrain",
    number: 2,
    icon: "🌿",
    title: "LE TERRAIN ·Intestin, Microbiome & Équilibre Digestif",
    intro: "L'intestin est le premier terrain de toute transformation. Ces questions m'aident à évaluer l'état de ton microbiome et à adapter les fondations de ton protocole.",
    questions: [
      {
        id: "s2q1", text: "Es-tu souvent ballonné(e) après les repas ?", type: "mcq",
        options: [{ value: "oui", label: "Oui, régulièrement" }, { value: "parfois", label: "Parfois" }, { value: "non", label: "Non" }],
      },
      {
        id: "s2q2", text: "As-tu des gaz fréquents ou des fermentations digestives ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "parfois", label: "Parfois" }],
      },
      {
        id: "s2q3", text: "Souffres-tu de constipation, de diarrhée, ou d'une alternance des deux ?", type: "mcq",
        options: [{ value: "constipation", label: "Constipation" }, { value: "diarrhee", label: "Diarrhée" }, { value: "alternance", label: "Alternance" }, { value: "aucun", label: "Aucun" }],
      },
      {
        id: "s2q4", text: "As-tu des nausées, notamment après les repas ou le matin ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "parfois", label: "Parfois" }],
      },
      {
        id: "s2q5", text: "As-tu déjà été diagnostiqué(e) avec un SIBO, une dysbiose ou un syndrome de l'intestin irritable ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "suspicion", label: "Suspicion non confirmée" }],
      },
    ],
  },

  // ─── Section 3 ·LES ÉMONCTOIRES ───
  {
    id: "emonctoires",
    number: 3,
    icon: "🔥",
    title: "LES ÉMONCTOIRES ·Drainage, Vitalité du Foie & Voies d'Élimination",
    intro: "Le bon fonctionnement de tes organes de drainage est essentiel avant tout protocole. Ces informations guident la préparation de ton terrain.",
    questions: [
      {
        id: "s3q1", text: "As-tu des antécédents de problèmes hépatiques ou de vésicule biliaire ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "vesicule_retiree", label: "Vésicule retirée" }],
      },
      {
        id: "s3q2", text: "As-tu un flux biliaire difficile (digestion des graisses lente, nausées après repas gras) ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "parfois", label: "Parfois" }],
      },
      {
        id: "s3q3", text: "As-tu une bilirubine élevée ou des résultats hépatiques anormaux dans tes bilans ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "pas_de_bilan", label: "Pas de bilan récent" }],
      },
      {
        id: "s3q4", text: "As-tu des problèmes thyroïdiens connus ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "en_cours", label: "En cours d'investigation" }],
      },
      {
        id: "s3q5", text: "As-tu tendance à être très sensible aux médicaments ou aux substances (effets plus forts ou plus lents que la normale) ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }],
      },
    ],
  },

  // ─── Section 4 ·LE MENTAL & LA CHIMIE ───
  {
    id: "mental",
    number: 4,
    icon: "🧠",
    title: "LE MENTAL & LA CHIMIE ·Clarté, Détox Cellulaire & Équilibre Neurochimique",
    intro: "La capacité naturelle de ton corps à se détoxifier influence directement ta clarté mentale, ton humeur et ta résilience. Ces questions évaluent cet équilibre invisible.",
    questions: [
      {
        id: "s4q1", text: "As-tu une hypersensibilité forte à certains aliments, additifs ou substances ?", type: "mcq",
        options: [{ value: "oui_plusieurs", label: "Oui, plusieurs" }, { value: "quelques_unes", label: "Quelques-unes" }, { value: "non", label: "Non" }],
      },
      {
        id: "s4q2", text: "Ressens-tu des fluctuations d'humeur récurrentes (anxiété, phases dépressives) ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "occasionnellement", label: "Occasionnellement" }],
      },
      {
        id: "s4q3", text: "As-tu des troubles du sommeil (insomnie, réveil en milieu de nuit, sommeil non réparateur) ?", type: "mcq",
        options: [{ value: "oui", label: "Oui, fréquemment" }, { value: "parfois", label: "Parfois" }, { value: "non", label: "Non" }],
      },
      {
        id: "s4q4", text: "As-tu des difficultés de concentration, du brouillard mental ou une sensation de flou ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "parfois", label: "Parfois" }],
      },
      {
        id: "s4q5", text: "As-tu déjà fait une analyse génétique ou un bilan spécialisé sur ta capacité à éliminer les toxines ?", type: "mcq",
        options: [{ value: "oui_positifs", label: "Oui, résultats positifs" }, { value: "oui_normal", label: "Oui, tout est normal" }, { value: "non", label: "Non, jamais fait" }],
      },
    ],
  },

  // ─── Section 5 ·LE FLUX ───
  {
    id: "flux",
    number: 5,
    icon: "❤️",
    title: "LE FLUX ·Circulation, Inflammation & Vitalité du Sang",
    intro: "La qualité de ta circulation et l'état inflammatoire de ton corps conditionnent la vitesse et la profondeur de ta transformation.",
    questions: [
      {
        id: "s5q1", text: "As-tu un bilan sanguin récent (moins de 6 mois) ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }],
      },
      {
        id: "s5q2", text: "As-tu des antécédents de problèmes circulatoires (varices, jambes lourdes, mauvaise microcirculation) ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }],
      },
      {
        id: "s5q3", text: "As-tu un terrain inflammatoire connu (douleurs chroniques, articulations, marqueurs élevés) ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "possible", label: "Possible" }],
      },
      {
        id: "s5q4", text: "As-tu des migraines ou des maux de tête fréquents ?", type: "mcq",
        options: [{ value: "oui", label: "Oui, réguliers" }, { value: "occasionnels", label: "Occasionnels" }, { value: "non", label: "Non" }],
      },
      {
        id: "s5q5", text: "Prends-tu des anticoagulants ou des médicaments affectant la coagulation ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }],
      },
    ],
  },

  // ─── Section 6 ·L'EAU ───
  {
    id: "eau",
    number: 6,
    icon: "💧",
    title: "L'EAU ·Hydratation, Minéralité & Équilibre Électrolytique",
    intro: "L'eau est le premier vecteur de toute transformation cellulaire. Un équilibre électrolytique sain est un prérequis fondamental à tout protocole de soutien.",
    questions: [
      {
        id: "s6q1", text: "Bois-tu suffisamment d'eau au quotidien (1,5 à 2 litres) ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "irregulierement", label: "Irrégulièrement" }],
      },
      {
        id: "s6q2", text: "Utilises-tu du sel de qualité (Himalaya, sel gris) dans ton alimentation ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "peu", label: "Peu" }],
      },
      {
        id: "s6q3", text: "As-tu des signes de déshydratation ou de carence en minéraux (crampes, fatigue, maux de tête) ?", type: "mcq",
        options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "parfois", label: "Parfois" }],
      },
      {
        id: "s6q4", text: "As-tu une activité physique régulière ou intense ?", type: "mcq",
        options: [{ value: "intensive", label: "Oui, intensive" }, { value: "moderee", label: "Modérée" }, { value: "non", label: "Non" }],
      },
    ],
  },

  // ─── Section 7 ·LE RYTHME & LES CYCLES ───
  {
    id: "rythme",
    number: 7,
    icon: "🌿",
    title: "LE RYTHME & LES CYCLES ·Saisons, Cycles Naturels & Intelligence du Corps",
    intro: "Tout protocole vivant respecte les cycles. Ces questions me permettent de t'accompagner en cohérence avec ta nature profonde et les rythmes qui te gouvernent.",
    questions: [
      {
        id: "s7q1", text: "Te sens-tu en phase avec les saisons (énergie, humeur, vitalité qui varient selon les cycles naturels) ?", type: "mcq",
        options: [{ value: "oui_tres", label: "Oui, très" }, { value: "un_peu", label: "Un peu" }, { value: "pas_vraiment", label: "Pas vraiment" }],
      },
      {
        id: "s7q2", text: "Ton énergie suit-elle des cycles réguliers dans la journée ?", type: "mcq",
        options: [{ value: "oui", label: "Oui, clairement" }, { value: "difficilement", label: "Difficilement" }, { value: "irreguliere", label: "Irrégulière" }],
      },
      {
        id: "s7q3", text: "As-tu tendance à vivre des phases d'excès d'énergie suivies de phases de fatigue profonde ?", type: "mcq",
        options: [{ value: "oui", label: "Oui, souvent" }, { value: "parfois", label: "Parfois" }, { value: "non", label: "Non" }],
      },
      {
        id: "s7q4", text: "As-tu une pratique quotidienne (méditation, rituel, mouvement, souffle) ?", type: "mcq",
        options: [{ value: "reguliere", label: "Oui, régulière" }, { value: "occasionnelle", label: "Occasionnelle" }, { value: "non", label: "Non" }],
      },
    ],
  },

  // ─── Section 8 ·TON UNIVERS ───
  {
    id: "univers",
    number: 8,
    icon: "🗺️",
    title: "TON UNIVERS ·Contexte, Intentions & Ce Que Tu Portes",
    intro: "Ces questions ouvertes sont les plus importantes. Elles me permettent de te voir, toi ·pas seulement ton corps.",
    questions: [
      {
        id: "s8q2", text: "Prends-tu actuellement des compléments alimentaires ? Si oui, lesquels ?", type: "textarea",
      },
      {
        id: "s8q3", text: "As-tu des pathologies diagnostiquées ou des traitements médicaux en cours ?", type: "textarea",
      },
      {
        id: "s8q4", text: "Y a-t-il autre chose que tu souhaites me signaler avant de commencer ton parcours ?", type: "textarea",
      },
    ],
  },

  // ─── Section 9 ·SANTÉ & SÉCURITÉ ───
  {
    id: "screening",
    number: 9,
    icon: "🛡️",
    title: "SANTÉ & SÉCURITÉ ·Screening",
    intro: "Ces informations sont essentielles pour adapter ton accompagnement en toute sécurité. Elles restent strictement confidentielles.",
    questions: [
      {
        id: "s9_checks",
        text: "As-tu actuellement ou récemment l'un des éléments suivants :",
        type: "checkbox",
        options: [
          { value: "antidepresseur", label: "Antidépresseur ou psychotrope" },
          { value: "changement_traitement", label: "Changement récent de traitement" },
          { value: "bipolarite", label: "Bipolarité / manie / psychose" },
          { value: "idees_suicidaires", label: "Idées suicidaires ou dépression sévère" },
          { value: "epilepsie", label: "Épilepsie / convulsions" },
          { value: "substances", label: "Usage de substances psychoactives" },
          { value: "complements_humeur", label: "Prise de compléments influençant l'humeur" },
          { value: "instabilite_psychique", label: "Instabilité psychique importante" },
        ],
        conditional: "s9_details",
      },
      {
        id: "s9_details",
        text: "Précisez :",
        type: "textarea",
      },
      {
        id: "s9_confirm",
        text: "Aucun de ces éléments ne me concerne.",
        type: "checkbox",
        options: [{ value: "confirmed", label: "Aucun de ces éléments ne me concerne" }],
      },
    ],
  },
];
