export type Lang = "EN" | "FR";

export const t = {
  // === INVITE PAGE ===
  invite: {
    title: { EN: "Welcome.", FR: "Bienvenue." },
    subtitle: {
      EN: "You've been invited into the Hive.",
      FR: "Tu as \u00e9t\u00e9 invit\u00e9 dans la Hive.",
    },
    passwordLabel: { EN: "Choose your password", FR: "Choisir ton mot de passe" },
    confirmPassword: { EN: "Confirm password", FR: "Confirmer le mot de passe" },
    button: { EN: "Activate my account", FR: "Activer mon compte" },
    activating: { EN: "Activating...", FR: "Activation..." },
    errorInvalid: { EN: "Invalid invitation", FR: "Invitation invalide" },
    errorExpired: {
      EN: "This invitation link is no longer valid or has already been used.",
      FR: "Ce lien d\u2019invitation n\u2019est plus valide ou a d\u00e9j\u00e0 \u00e9t\u00e9 utilis\u00e9.",
    },
    errorName: { EN: "Name is required", FR: "Le nom est requis" },
    errorPasswordMin: {
      EN: "Password must be at least 8 characters",
      FR: "Le mot de passe doit contenir au moins 8 caract\u00e8res",
    },
    errorPasswordMatch: {
      EN: "Passwords do not match",
      FR: "Les mots de passe ne correspondent pas",
    },
    errorCreate: {
      EN: "Error creating account",
      FR: "Erreur lors de la cr\u00e9ation du compte",
    },
    errorServer: {
      EN: "Server connection error",
      FR: "Erreur de connexion au serveur",
    },
    verifying: {
      EN: "Verifying invitation...",
      FR: "V\u00e9rification de l\u2019invitation...",
    },
  },

  // === LOGIN PAGE ===
  login: {
    tagline: { EN: "Welcome back.", FR: "Bienvenue." },
    subtitle: { EN: "Your space is waiting.", FR: "Votre espace vous attend." },
    email: { EN: "Email", FR: "Email" },
    password: { EN: "Password", FR: "Mot de passe" },
    button: { EN: "Enter", FR: "Entrer" },
    loading: { EN: "Connecting...", FR: "Connexion..." },
    error: { EN: "Connection error", FR: "Erreur de connexion" },
    errorServer: {
      EN: "Server connection error",
      FR: "Erreur de connexion au serveur",
    },
  },

  // === ONBOARDING ===
  onboarding: {
    // Step 1 - Welcome
    welcomeTitle: { EN: "Welcome.", FR: "Bienvenue." },
    welcomeBody: {
      EN: "This is a private space. What happens here stays between you and Joffrey.",
      FR: "Ceci est un espace priv\u00e9. Ce qui se passe ici reste entre toi et Joffrey.",
    },
    welcomeButton: { EN: "I'm ready", FR: "Je suis pr\u00eat\u00b7e" },

    // Step 2 - Personal info
    infoTitle: {
      EN: "A few things to set up your space.",
      FR: "Quelques \u00e9l\u00e9ments pour configurer ton espace.",
    },
    firstName: { EN: "First name", FR: "Pr\u00e9nom" },
    birthDate: { EN: "Date of birth", FR: "Date de naissance" },
    birthTime: { EN: "Time of birth", FR: "Heure de naissance" },
    birthTimeUnknown: {
      EN: "I don't know my time of birth",
      FR: "Je ne connais pas mon heure de naissance",
    },
    birthCity: { EN: "City of birth", FR: "Ville de naissance" },
    birthCountry: { EN: "Country of birth", FR: "Pays de naissance" },
    deliveryAddress: {
      EN: "Delivery address (for your elixirs)",
      FR: "Adresse de livraison (pour tes \u00e9lixirs)",
    },
    addressLine1: { EN: "Address line 1", FR: "Adresse ligne 1" },
    addressLine2: { EN: "Address line 2 (optional)", FR: "Adresse ligne 2 (optionnel)" },
    postalCode: { EN: "Postal code", FR: "Code postal" },
    city: { EN: "City", FR: "Ville" },
    country: { EN: "Country", FR: "Pays" },
    phone: { EN: "Phone number", FR: "Num\u00e9ro de t\u00e9l\u00e9phone" },
    continueButton: { EN: "Continue", FR: "Continuer" },
    backButton: { EN: "Back", FR: "Retour" },

    // Step 3 - Video Seuil 1
    videoTitle: {
      EN: "Where I want to go.",
      FR: "L\u00e0 o\u00f9 je souhaite aller.",
    },
    videoInstruction: {
      EN: "Record a short video. 60 seconds max.",
      FR: "Enregistre une courte vid\u00e9o. 60 secondes max.",
    },
    videoDescription: {
      EN: "Take a moment to settle in. Simply let what is here express itself. This video opens something. It is a starting point.",
      FR: "Prends un moment pour te poser. Laisse simplement ce qui est l\u00e0 s\u2019exprimer. Cette vid\u00e9o ouvre quelque chose. C\u2019est un point de d\u00e9part.",
    },

    // Step 4 - Charter
    charterIntroText: {
      EN: "Before entering the Passage\u2026\nTake a moment.",
      FR: "Avant d\u2019entrer dans le Passage\u2026\nPrends un moment.",
    },
    charterScrollButton: {
      EN: "I have read and understood",
      FR: "J\u2019ai lu et compris",
    },
    charterCheck1: {
      EN: "I understand this accompaniment is not a medical treatment",
      FR: "Je comprends que cet accompagnement ne remplace pas un suivi m\u00e9dical",
    },
    charterCheck2: {
      EN: "I commit to respecting the session framework (48h, presence, rhythm)",
      FR: "Je m\u2019engage \u00e0 respecter le cadre des s\u00e9ances (48h, pr\u00e9sence, rythme)",
    },
    charterCheck3: {
      EN: "I commit to staying connected and not leaving without dialogue",
      FR: "Je m\u2019engage \u00e0 rester en lien et ne pas interrompre le processus sans \u00e9change",
    },
    charterSignedBy: { EN: "Signed by", FR: "Sign\u00e9 par" },
    charterCommitButton: {
      EN: "I commit to this Passage",
      FR: "Je m\u2019engage dans ce Passage",
    },
    charterSigning: { EN: "Signing...", FR: "Signature..." },
  },

  // === CHARTER TEXT ===
  charterEN: `Convention & Engagement

Purpose of this Agreement
This agreement governs the terms of booking, cancellation and commitment within the proposed accompaniment. It is based on mutual responsibility and the quality of presence required for the work engaged.

1. Session Booking
Every session is confirmed only after payment or within a prepaid package. Without prior payment, no time slot is reserved.

2. Modification & Cancellation
Any session not honored or cancelled less than 48 hours in advance is due and non-reschedulable. Modification requests made more than 48 hours in advance are possible, subject to availability. One exceptional adjustment (joker) is authorized over the entire journey.

3. Participant Commitment
The participant commits to a process involving active presence, continuity in exchanges and use of the proposed tools. Phases of discomfort or resistance are an integral part of the process. In these moments, the participant commits to staying connected and not interrupting the process without communication.

4. Personal Responsibility
This accompaniment does not constitute a medical act, diagnosis or treatment. It does not replace medical follow-up. The participant is solely responsible for their choices, decisions and actions.

5. Nature of the Process
The work includes breathing and meditation practices, use of elixirs and processes of inner observation. The elixirs are natural preparations \u2014 they do not constitute medication and make no therapeutic claims. The participant engages freely in these practices.

6. Interruption of the Journey
The participant may decide to interrupt the journey. This decision must be accompanied by a closing session. No interruption happens without this exchange.

7. Personal Data \u2014 GDPR
Personal data collected (videos, journal, birth data) is processed confidentially, hosted in Switzerland (Infomaniak) and is never shared with third parties. The participant has the right of access, rectification and deletion.

---
MONITORING ENGAGEMENT FRAMEWORK

1. Reference day — You choose a fixed day each week that becomes your reference appointment throughout the program.

2. Rescheduling — Only one reschedule allowed over the 3 cycles. Travel: notify at least 7 days in advance.

3. Missed appointments — Any forgotten or missed appointment is considered lost. Rescheduling possible but must be paid in advance, and cannot be moved again.

4. Cancellation — 48 hours minimum before the appointment.

5. Right to terminate — In case of repeated non-compliance, I reserve the right to suspend the program without refund.`,

  charterFR: `Convention & Engagement

Objet de la Convention
Cette convention encadre les modalit\u00e9s de r\u00e9servation, d\u2019annulation et d\u2019engagement dans le cadre de l\u2019accompagnement propos\u00e9. Elle repose sur une responsabilit\u00e9 mutuelle et une qualit\u00e9 de pr\u00e9sence n\u00e9cessaire au travail engag\u00e9.

1. R\u00e9servation des s\u00e9ances
Toute s\u00e9ance est confirm\u00e9e uniquement apr\u00e8s r\u00e8glement ou dans le cadre d\u2019un forfait pr\u00e9pay\u00e9. Sans paiement pr\u00e9alable, aucun cr\u00e9neau n\u2019est r\u00e9serv\u00e9.

2. Modification & Annulation
Toute s\u00e9ance non honor\u00e9e ou annul\u00e9e moins de 48 heures \u00e0 l\u2019avance est due et non reportable. Les demandes de modification effectu\u00e9es plus de 48 heures \u00e0 l\u2019avance sont possibles, sous r\u00e9serve de disponibilit\u00e9s. Un seul ajustement exceptionnel (joker) est autoris\u00e9 sur l\u2019ensemble du parcours.

3. Engagement du participant
Le participant s\u2019engage dans un processus impliquant une pr\u00e9sence active, une continuit\u00e9 dans les \u00e9changes et l\u2019utilisation des outils propos\u00e9s. Des phases d\u2019inconfort ou de r\u00e9sistance font partie int\u00e9grante du processus. Dans ces moments, le participant s\u2019engage \u00e0 rester en lien et ne pas interrompre le processus sans communication.

4. Responsabilit\u00e9 personnelle
Cet accompagnement ne constitue en aucun cas un acte m\u00e9dical, un diagnostic ou un traitement. Il ne remplace pas un suivi m\u00e9dical. Le participant est seul responsable de ses choix, d\u00e9cisions et actions.

5. Nature du processus
Le travail inclut des pratiques de respiration, m\u00e9ditation, \u00e9lixirs et observation int\u00e9rieure. Les \u00e9lixirs sont des pr\u00e9parations naturelles \u2014 ils ne constituent pas des m\u00e9dicaments et ne font l\u2019objet d\u2019aucune all\u00e9gation th\u00e9rapeutique. Le participant s\u2019engage librement dans ces pratiques.

6. Interruption du parcours
Le participant peut d\u00e9cider d\u2019interrompre le parcours. Cette d\u00e9cision doit \u00eatre accompagn\u00e9e d\u2019une s\u00e9ance de cl\u00f4ture. Aucune interruption ne se fait sans cet \u00e9change.

7. Donn\u00e9es personnelles \u2014 RGPD
Les donn\u00e9es personnelles collect\u00e9es (vid\u00e9os, journal, donn\u00e9es de naissance) sont trait\u00e9es de mani\u00e8re confidentielle, h\u00e9berg\u00e9es en Suisse (Infomaniak) et ne sont jamais partag\u00e9es avec des tiers. Droit d\u2019acc\u00e8s, rectification et suppression garantis.

---
CADRE D'ENGAGEMENT MONITORING

1. Jour de référence — Vous choisissez un jour fixe par semaine qui devient votre RDV de référence pendant tout le programme.

2. Reports — Un seul report autorisé sur les 3 cycles. Voyage : prévenir 7 jours à l'avance minimum.

3. Rendez-vous non honorés — Tout RDV oublié ou non honoré est considéré comme perdu. Reprogrammation possible mais payante à l'avance, et non déplaçable.

4. Annulation — 48 heures minimum avant le RDV.

5. Droit de fin — En cas de non-respect répété des règles, je me réserve le droit de suspendre l'accompagnement sans remboursement.`,

  // === HOME / DASHBOARD ===
  home: {
    day: { EN: "Day", FR: "Jour" },
    morningCheckin: { EN: "Good morning. How do you arrive today?", FR: "Bonjour. Comment arrives-tu ce matin ?" },
    eveningCheckin: { EN: "Before you rest. What stays with you today?", FR: "Avant de te reposer. Qu\u2019est-ce qui reste avec toi aujourd\u2019hui ?" },
    morningAvailable: { EN: "Available until 1pm", FR: "Disponible jusqu\u2019\u00e0 13h" },
    eveningAvailable: { EN: "Available until midnight", FR: "Disponible jusqu\u2019\u00e0 minuit" },
    morningOpens: { EN: "Opens at 5am", FR: "Ouvre \u00e0 5h" },
    eveningOpens: { EN: "Opens at 4pm", FR: "Ouvre \u00e0 16h" },
    morningCheckinFull: { EN: "Morning check-in", FR: "Check-in matin" },
    eveningCheckinFull: { EN: "Evening check-in", FR: "Check-in soir" },
    yourElixirs: { EN: "Your elixirs", FR: "Tes \u00e9lixirs" },
    todaysPractice: { EN: "Today's Practice", FR: "Pratique du jour" },
    start: { EN: "Start", FR: "Commencer" },
    nextSession: { EN: "Next Session", FR: "Prochaine s\u00e9ance" },
    noSession: { EN: "No session scheduled", FR: "Aucune s\u00e9ance pr\u00e9vue" },
    joinZoom: { EN: "Join on Zoom", FR: "Rejoindre sur Zoom" },
    shareDocument: { EN: "Share a document", FR: "Partager un document" },
  },

  // === MORNING CHECK-IN ===
  morning: {
    step0: { EN: "How are you feeling?", FR: "Comment te sens-tu ?" },
    step1Title: { EN: "Energy", FR: "\u00c9nergie" },
    step1Sub: { EN: "Without analyzing.", FR: "Sans analyser." },
    step2Title: { EN: "Sleep", FR: "Sommeil" },
    step2Sub: { EN: "Just feel.", FR: "Ressens simplement." },
    sleepDeep: { EN: "Deep", FR: "Profond" },
    sleepLight: { EN: "Light", FR: "L\u00e9ger" },
    sleepFragmented: { EN: "Fragmented", FR: "Fragment\u00e9" },
    sleepNone: { EN: "No sleep", FR: "Sans sommeil" },
    dreamYes: { EN: "Yes", FR: "Oui" },
    dreamNo: { EN: "No", FR: "Non" },
    dreamBlurry: { EN: "Blurry", FR: "Flou" },
    dreamPlaceholder: { EN: "What do you remember...", FR: "De quoi te souviens-tu..." },
    step5Title: {
      EN: "What is present for me this morning.",
      FR: "Ressenti matin libre",
    },
    step5Placeholder: {
      EN: "No expectations. Just what is here.",
      FR: "Pas d\u2019attente. Juste ce qui est l\u00e0.",
    },
    doneTitle: { EN: "It's noted.", FR: "C\u2019est not\u00e9." },
    doneSub: { EN: "Have a beautiful day.", FR: "Belle journ\u00e9e." },
    closedTitle: {
      EN: "The morning space opens at 5am.",
      FR: "L\u2019espace matin ouvre \u00e0 5h.",
    },
    closedSub: {
      EN: "Come back between 5am and 1pm.",
      FR: "Reviens entre 5h et 13h.",
    },
    start: { EN: "Start", FR: "Commencer" },
    next: { EN: "Next", FR: "Suivant" },
    back: { EN: "Back", FR: "Retour" },
    save: { EN: "Save", FR: "Enregistrer" },
    saving: { EN: "Saving...", FR: "Enregistrement..." },
    home: { EN: "Home", FR: "Accueil" },
  },

  // === EVENING CHECK-IN ===
  evening: {
    title: { EN: "My moments of the day.", FR: "Mes moments de la journ\u00e9e." },
    subtitle: {
      EN: "Light and shadow carry equal value here.",
      FR: "La lumi\u00e8re et l\u2019ombre ont ici la m\u00eame valeur.",
    },
    placeholder1: { EN: "What touched me.", FR: "Ce qui m\u2019a touch\u00e9." },
    placeholder2: { EN: "What I felt.", FR: "Ce que j\u2019ai senti." },
    placeholder3: { EN: "What emerged.", FR: "Ce qui a \u00e9merg\u00e9." },
    placeholder4: { EN: "What I observed tonight.", FR: "Ce que j\u2019ai observ\u00e9 ce soir." },
    doneTitle: { EN: "It's noted.", FR: "C\u2019est not\u00e9." },
    doneSub: { EN: "Rest well tonight.", FR: "Repose-toi bien ce soir." },
    closedTitle: {
      EN: "The evening space opens at 4pm.",
      FR: "L\u2019espace soir ouvre \u00e0 16h.",
    },
    closedSub: {
      EN: "Come back between 4pm and midnight.",
      FR: "Reviens entre 16h et minuit.",
    },
    save: { EN: "Save", FR: "Enregistrer" },
    saving: { EN: "Saving...", FR: "Enregistrement..." },
    home: { EN: "Home", FR: "Accueil" },
  },

  // === JOURNAL ===
  journal: {
    title: { EN: "Journal", FR: "Journal" },
    question1: { EN: "How do you feel today?", FR: "Comment te sens-tu aujourd\u2019hui ?" },
    question2: {
      EN: "What is present for you right now?",
      FR: "Qu\u2019est-ce qui est pr\u00e9sent pour toi maintenant ?",
    },
    keepPrivate: { EN: "Keep private", FR: "Garder priv\u00e9" },
    newEntry: { EN: "New entry", FR: "Nouvelle entr\u00e9e" },
    writePlaceholder: { EN: "Write here...", FR: "\u00c9cris ici..." },
    moodPlaceholder: { EN: "Mood (optional)", FR: "Humeur (optionnel)" },
    add: { EN: "Add", FR: "Ajouter" },
    sending: { EN: "Sending...", FR: "Envoi..." },
    send: { EN: "Send", FR: "Envoyer" },
    alreadySubmitted: { EN: "Already submitted today", FR: "D\u00e9j\u00e0 soumis aujourd\u2019hui" },
    goMorning: {
      EN: "Go to morning check-in",
      FR: "Aller au check-in matin",
    },
    goEvening: {
      EN: "Go to evening check-in",
      FR: "Aller au check-in soir",
    },
    moodDifficult: { EN: "Difficult", FR: "Difficile" },
    moodNeutral: { EN: "Neutral", FR: "Neutre" },
    moodGood: { EN: "Good", FR: "Bien" },
    moodVeryGood: { EN: "Very good", FR: "Tr\u00e8s bien" },
    moodExcellent: { EN: "Excellent", FR: "Excellent" },
  },

  // === MESSAGES ===
  messages: {
    title: { EN: "Messages", FR: "Messages" },
    placeholder: { EN: "Write a message\u2026", FR: "\u00c9crire un message\u2026" },
    conversation: { EN: "Conversation", FR: "Conversation" },
    journey: { EN: "Journey", FR: "Parcours" },
    conversationWith: { EN: "Conversation with", FR: "Conversation avec" },
    journeyMessages: { EN: "Journey messages", FR: "Messages du parcours" },
    journeyAuto: {
      EN: "Automated and personalized messages from Joffrey",
      FR: "Messages automatis\u00e9s et personnalis\u00e9s de Joffrey",
    },
    noMessages: {
      EN: "No messages yet.\nWrite your first message below.",
      FR: "Pas encore de messages.\n\u00c9cris ton premier message ci-dessous.",
    },
    noJourney: {
      EN: "No journey messages received.",
      FR: "Aucun message de parcours re\u00e7u.",
    },
    readOnly: { EN: "These messages are read-only", FR: "Ces messages sont en lecture seule" },
    loading: { EN: "Loading messages...", FR: "Chargement des messages..." },
  },

  // === FROM JOFFREY ===
  fromJoffrey: {
    title: { EN: "From Joffrey", FR: "De Joffrey" },
    resources: { EN: "Resources", FR: "Ressources" },
    recommendations: { EN: "Recommendations", FR: "Recommandations" },
    noResources: { EN: "No resources shared yet.", FR: "Aucune ressource partag\u00e9e." },
    noRecommendations: { EN: "No recommendations yet.", FR: "Aucune recommandation." },
    access: { EN: "Access", FR: "Acc\u00e9der" },
    discover: { EN: "Discover", FR: "D\u00e9couvrir" },
    selectedForYou: { EN: "Selected for you", FR: "S\u00e9lectionn\u00e9 pour toi" },
    generalCatalogue: { EN: "General catalogue", FR: "Catalogue g\u00e9n\u00e9ral" },
    categoryWater: { EN: "Water", FR: "Eau" },
    categorySupplements: { EN: "Supplements", FR: "Compl\u00e9ments" },
    categoryTools: { EN: "Tools", FR: "Outils" },
    categoryCare: { EN: "Care", FR: "Soins" },
    categoryApitherapy: { EN: "Apitherapy", FR: "Apith\u00e9rapie" },
    categoryOther: { EN: "Other", FR: "Autre" },
  },

  // === NAVIGATION ===
  nav: {
    home: { EN: "Home", FR: "Accueil" },
    journal: { EN: "Journal", FR: "Journal" },
    practices: { EN: "Practices", FR: "Pratiques" },
    messages: { EN: "Messages", FR: "Messages" },
    fromJoffrey: { EN: "From Joffrey", FR: "De Joffrey" },
    reminders: { EN: "Reminders", FR: "Rappels" },
    signOut: { EN: "Sign out", FR: "Se d\u00e9connecter" },
  },

  // === SETTINGS ===
  settings: {
    title: { EN: "Settings", FR: "Param\u00e8tres" },
    changeLanguage: { EN: "Language", FR: "Langue" },
    changePhoto: { EN: "Change profile photo", FR: "Changer ma photo" },
    save: { EN: "Save", FR: "Enregistrer" },
    saving: { EN: "Saving...", FR: "Enregistrement..." },
    // Adresse livraison
    deliveryAddress: { EN: "Delivery address", FR: "Adresse de livraison" },
    addressLine1: { EN: "Address", FR: "Adresse" },
    addressLine2: { EN: "Address line 2", FR: "Compl\u00e9ment d\u2019adresse" },
    city: { EN: "City", FR: "Ville" },
    postalCode: { EN: "Postal code", FR: "Code postal" },
    country: { EN: "Country", FR: "Pays" },
    edit: { EN: "Edit", FR: "Modifier" },
    cancel: { EN: "Cancel", FR: "Annuler" },
    saved: { EN: "Saved!", FR: "Enregistr\u00e9 !" },
    // Engagement
    myEngagement: { EN: "My engagement", FR: "Mon engagement" },
    referenceDay: { EN: "Reference day", FR: "Jour de r\u00e9f\u00e9rence" },
    reportsUsed: { EN: "Reschedules used", FR: "Reports utilis\u00e9s" },
    acceptedOn: { EN: "Accepted on", FR: "Accept\u00e9 le" },
    notYetAccepted: { EN: "Not yet accepted", FR: "Pas encore accept\u00e9" },
    // Contact
    contact: { EN: "Contact", FR: "Contact" },
    email: { EN: "Email", FR: "Email" },
    phone: { EN: "Phone", FR: "T\u00e9l\u00e9phone" },
    // Timezone
    timezone: { EN: "Timezone", FR: "Fuseau horaire" },
    // Password
    password: { EN: "Password", FR: "Mot de passe" },
    currentPassword: { EN: "Current password", FR: "Mot de passe actuel" },
    newPassword: { EN: "New password", FR: "Nouveau mot de passe" },
    confirmPassword: { EN: "Confirm password", FR: "Confirmer le mot de passe" },
    changePassword: { EN: "Change password", FR: "Changer le mot de passe" },
    passwordChanged: { EN: "Password changed!", FR: "Mot de passe chang\u00e9 !" },
    passwordMismatch: { EN: "Passwords do not match", FR: "Les mots de passe ne correspondent pas" },
    passwordTooShort: { EN: "Minimum 8 characters", FR: "Minimum 8 caract\u00e8res" },
    passwordWrong: { EN: "Current password is incorrect", FR: "Mot de passe actuel incorrect" },
  },

  // === ADMIN — PROSPECTS CRM ===
  prospects: {
    title: { EN: "Prospects", FR: "Prospects" },
    newProspect: { EN: "New prospect", FR: "Nouveau prospect" },
    kanban: { EN: "Kanban", FR: "Kanban" },
    list: { EN: "List", FR: "Liste" },
    search: { EN: "Search...", FR: "Rechercher..." },
    allStatuses: { EN: "All statuses", FR: "Tous statuts" },
    allTemperatures: { EN: "All temperatures", FR: "Toutes temp." },
    statusNew: { EN: "New", FR: "Nouveau" },
    statusContacted: { EN: "Contacted", FR: "Contact\u00e9" },
    statusQualified: { EN: "Qualified", FR: "Qualifi\u00e9" },
    statusNegotiation: { EN: "Negotiation", FR: "N\u00e9gociation" },
    statusWon: { EN: "Won", FR: "Gagn\u00e9" },
    statusLost: { EN: "Lost", FR: "Perdu" },
    statusNurturing: { EN: "Nurturing", FR: "Nurturing" },
    cold: { EN: "Cold", FR: "Froid" },
    warm: { EN: "Warm", FR: "Ti\u00e8de" },
    hot: { EN: "Hot", FR: "Chaud" },
    addActivity: { EN: "Add activity", FR: "Ajouter activit\u00e9" },
    convertToClient: { EN: "Convert to client", FR: "Convertir en client" },
    information: { EN: "Information", FR: "Informations" },
    history: { EN: "History", FR: "Historique" },
    nextFollowUp: { EN: "Next follow-up", FR: "Prochain suivi" },
    noActivity: { EN: "No activity", FR: "Aucune activit\u00e9" },
    exportCsv: { EN: "Export CSV", FR: "Export CSV" },
  },

  // === ADMIN — NEWSLETTER ===
  newsletter: {
    title: { EN: "Newsletter", FR: "Newsletter" },
    subscribers: { EN: "Subscribers", FR: "Abonn\u00e9s" },
    campaigns: { EN: "Campaigns", FR: "Campagnes" },
    segments: { EN: "Segments", FR: "Segments" },
    addSubscriber: { EN: "Add subscriber", FR: "Ajouter un abonn\u00e9" },
    newCampaign: { EN: "New campaign", FR: "Nouvelle campagne" },
    send: { EN: "Send", FR: "Envoyer" },
    sent: { EN: "Sent", FR: "Envoy\u00e9" },
    draft: { EN: "Draft", FR: "Brouillon" },
    noSubscribers: { EN: "No subscribers", FR: "Aucun abonn\u00e9" },
    noCampaigns: { EN: "No campaigns", FR: "Aucune campagne" },
    exportCsv: { EN: "Export CSV", FR: "Export CSV" },
    search: { EN: "Search...", FR: "Rechercher..." },
    allStatuses: { EN: "All statuses", FR: "Tous les statuts" },
    allSources: { EN: "All sources", FR: "Toutes les sources" },
    activeSubscribers: { EN: "Active subscribers", FR: "Abonn\u00e9s actifs" },
    overview: { EN: "Overview", FR: "Vue d\u2019ensemble" },
    sources: { EN: "Sources", FR: "Sources" },
  },

  // === ADMIN — INACTIVE CLIENTS ===
  inactive: {
    title: { EN: "Clients to follow up", FR: "Clients \u00e0 relancer" },
    daysInactive: { EN: "days without activity", FR: "jours sans activit\u00e9" },
    sendRelance: { EN: "Send follow-up", FR: "Envoyer relance" },
    sent: { EN: "Sent", FR: "Envoy\u00e9" },
    noInactive: { EN: "All clients are active", FR: "Tous les clients sont actifs" },
  },

  // === COMMON ===
  common: {
    loading: { EN: "Loading...", FR: "Chargement..." },
    error: { EN: "Error", FR: "Erreur" },
    continue: { EN: "Continue", FR: "Continuer" },
    back: { EN: "Back", FR: "Retour" },
    next: { EN: "Next", FR: "Suivant" },
    save: { EN: "Save", FR: "Enregistrer" },
    home: { EN: "Home", FR: "Accueil" },
    stop: { EN: "Stop", FR: "Arr\u00eater" },
    dictate: { EN: "Dictate", FR: "Dicter" },
  },
} as const;
