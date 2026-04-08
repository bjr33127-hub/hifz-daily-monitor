const state = {
  payload: null,
  activePage: null,
  activeView: "today",
  activeViewRenderToken: 0,
  quickNoteDrafts: {},
  expandedCards: {},
  collapsedJuzs: {},
  mushafPageCache: {},
  errorTrackingRenderCache: {
    pageErrorsRef: null,
    summaryRef: null,
    planRef: null,
    language: "",
    collapsedKey: "",
  },
  reviewState: {
    revealedItemIds: [],
    completedItemsByPage: {},
    selectedPage: null,
  },
  pageEditor: {
    open: false,
    page: null,
    scope: "word",
    note: "",
    rawRect: null,
    rect: null,
    anchor: null,
    selectionOrigin: null,
    needsTrackingRefresh: false,
  },
  reviewSwipe: {
    itemId: "",
    startX: 0,
    currentX: 0,
  },
  surahGame: {
    rangeStartId: 1,
    rangeEndId: 114,
    gameMode: "quiz",
    isStarted: false,
    signature: "",
    answered: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
    question: null,
    memoryRound: null,
  },
  pwa: {
    installPrompt: null,
    canInstall: false,
  },
  notificationsRuntime: {
    supported: false,
    native: false,
    display: "prompt",
    exactAlarm: "prompt",
    pendingCount: 0,
    synced: false,
    scheduledCount: 0,
    reason: "unsupported",
  },
  onboarding: {
    open: false,
    stepIndex: 0,
    hasSeen: false,
  },
  lastLocalizedLanguage: "",
};
const dataClient = window.dabtDataClient;
const MUSHAF_TOTAL_PAGES = 604;
const PROGRESS_UNITS_PER_PAGE = 30;
const LINES_PER_PAGE = 15;
const MUSHAF_TOTAL_HALF_PAGES = MUSHAF_TOTAL_PAGES * PROGRESS_UNITS_PER_PAGE;
const SERVICE_WORKER_VERSION = "2026-04-03-2";
const TOUCH_SELECTION_LONG_PRESS_MS = 320;
const TOUCH_SELECTION_MOVE_PX = 12;
let mushafSurfacesRenderQueued = false;

function getOnboardingStorageKey() {
  return isNativeAppRuntime() ? "dabt-mobile-onboarding-native-v1" : "dabt-mobile-onboarding-web-v1";
}

const MUSHAF_PAGE_IMAGE_BASE = "https://www.ahadees.com/images/quran/pages";
const MUSHAF_API_BASE = "https://api.quran.com/api/v4";
const MUSHAF_FONT_BASE = "https://verses.quran.foundation/fonts/quran";
const loadedMushafFonts = new Set();
let uthmanicFontPromise = null;

const SURAH_PAGE_RANGES = Array.isArray(window.SURAH_STARTS)
  ? window.SURAH_STARTS.map((entry, index, list) => ({
      id: entry[0],
      simple: entry[1],
      arabic: entry[2],
      startPage: entry[3],
      endPage: (list[index + 1]?.[3] || 605) - 1 < entry[3] ? entry[3] : (list[index + 1]?.[3] || 605) - 1,
    }))
  : [];

const SURAH_BY_ID = new Map(SURAH_PAGE_RANGES.map((surah) => [surah.id, surah]));
const JUZ_START_PAGES = Object.freeze([
  1,
  22,
  42,
  63,
  82,
  102,
  122,
  142,
  162,
  182,
  202,
  222,
  242,
  262,
  282,
  302,
  322,
  342,
  362,
  382,
  402,
  422,
  442,
  462,
  482,
  503,
  522,
  542,
  562,
  582,
]);
const JUZ_NAMES = Object.freeze([
  { latin: "Alif Lam Mim", arabic: "الم" },
  { latin: "Sayaqool", arabic: "سيقول" },
  { latin: "Tilka-r-Rusul", arabic: "تلك الرسل" },
  { latin: "Lan Tanaaloo", arabic: "لن تنالوا" },
  { latin: "Wal Muhsanat", arabic: "والمحصنات" },
  { latin: "La Yuhibbullah", arabic: "لا يحب الله" },
  { latin: "Wa Iza Samiu", arabic: "وإذا سمعوا" },
  { latin: "Wa Lau Annana", arabic: "ولو أننا" },
  { latin: "Qalal Malao", arabic: "قال الملا" },
  { latin: "Wa A'lamu", arabic: "واعلموا" },
  { latin: "Ya'tazirun", arabic: "يعتذرون" },
  { latin: "Wa Ma Min Dabbah", arabic: "وما من دابة" },
  { latin: "Wa Ma Ubarri'u", arabic: "وما أبرئ" },
  { latin: "Rubama", arabic: "ربما" },
  { latin: "Subhanalladhi", arabic: "سبحان الذي" },
  { latin: "Qal Alam", arabic: "قال ألم" },
  { latin: "Iqtaraba", arabic: "اقترب" },
  { latin: "Qad Aflaha", arabic: "قد أفلح" },
  { latin: "Wa Qalalladhina", arabic: "وقال الذين" },
  { latin: "Aman Khalaq", arabic: "أمن خلق" },
  { latin: "Utlu Ma Uhiya", arabic: "اتل ما أوحي" },
  { latin: "Wa Man Yaqnut", arabic: "ومن يقنت" },
  { latin: "Wa Mali", arabic: "وما لي" },
  { latin: "Faman Azlam", arabic: "فمن أظلم" },
  { latin: "Ilayhi Yuraddu", arabic: "إليه يرد" },
  { latin: "Ha Mim", arabic: "حم" },
  { latin: "Qala Fama Khatbukum", arabic: "قال فما خطبكم" },
  { latin: "Qad Sami Allah", arabic: "قد سمع الله" },
  { latin: "Tabarak", arabic: "تبارك" },
  { latin: "Amma", arabic: "عم" },
]);
const SURAH_MEMORY_LENGTH = 7;
const SURAH_MEMORY_PREVIEW_MS = 60000;
let surahGamePreviewTimer = null;

const I18N = {
  fr: {
    "hero.title": "Bismillah, voici ton plan du jour{{name}} !✨",
    "hero.text": "Retrouve ici [[uniquement]] ce qu'il faut réciter [[aujourd'hui]], dans l'[[ordre exact]] du programme.",
    "hero.markerLabel": "Repère",
    "hero.installApp": "Installer Dabt",
    "hero.markerText":
      "Le but est de [[clôturer]] la révision de l'ancien (< J-30) tous les 7 jours, la consolidation (de J-8 à J-30) tous les 3 jours, puis de réviser le récent (de J-1 à J-7), puis la veille (J-1), avant d'apprendre le [[nouveau]].",
    "nav.today": "Aujourd'hui",
    "nav.pages": "Pages",
    "nav.review": "Revoir ses erreurs",
    "nav.surahs": "Mini jeu",
    "nav.settings": "Paramètres",
    "onboarding.skip": "Passer",
    "onboarding.next": "Suivant",
    "onboarding.start": "Commencer",
    "onboarding.step": "Écran {{current}} sur {{total}}",
    "onboarding.today.title": "La section Aujourd'hui te guide bloc par bloc",
    "onboarding.today.body": "La section Aujourd'hui organise ta journee: quoi reciter maintenant, dans quel ordre avancer, puis comment valider chaque bloc au bon moment.",
    "onboarding.pages.title": "La section Pages te montre le mushaf d'un seul coup d'oeil",
    "onboarding.pages.body": "La section Pages te permet d'ouvrir la vraie page du Coran, placer une erreur precise et suivre ton etat page par page, puis juz par juz.",
    "onboarding.review.title": "La section Revoir ses erreurs retravaille les zones fragiles",
    "onboarding.review.body": "La section Revoir ses erreurs utilise FSRS pour faire revenir chaque erreur au meilleur moment selon tes reponses, directement sur la page du Coran.",
    "onboarding.surahs.title": "La section Mini jeu consolide l'ordre des sourates",
    "onboarding.surahs.body": "La section Mini jeu te propose deux facons de t'entrainer: retrouver la sourate suivante ou remettre une serie dans le bon ordre.",
    "onboarding.today.title": "Aujourd'hui te guide bloc par bloc",
    "onboarding.today.body": "Aujourd'hui applique une methodologie de repetition espacee: tout est remis dans le bon ordre pour revoir au bon moment, du plus ancien au plus recent, puis apprendre le nouveau.",
    "onboarding.pages.title": "Pages te montre le mushaf d'un seul coup d'oeil",
    "onboarding.pages.body": "Chaque page garde son etat. Tu peux ouvrir la vraie page du Coran, placer une erreur precise et suivre ton avancée juz par juz.",
    "onboarding.review.title": "Revoir ses erreurs replante les zones fragiles",
    "onboarding.review.body": "Revoir ses erreurs utilise FSRS, un systeme de repetition espacee base sur la science, pour faire revenir chaque erreur au meilleur moment selon tes reponses.",
    "onboarding.surahs.title": "Mini jeu consolide l'ordre des sourates",
    "onboarding.surahs.body": "Deux modes de jeu pour apprendre plus vite: retrouver la sourate suivante ou remettre une serie dans le bon ordre.",
    "today.dayLabel": "Journée",
    "today.validationTitle": "État de validation",
    "today.validationHelp": "Valide les blocs dans l'ordre, puis passe au lendemain.",
    "today.resetButton": "Réinitialiser les validations du jour",
    "today.skipMemorizationButton": "Ne rien mémoriser aujourd'hui",
    "today.advanceButton": "Valider la journée et passer au lendemain",
    "today.focusLabel": "Maintenant",
    "today.focusTitle": "Ce que tu fais maintenant",
    "today.focusHelp": "Le [[bloc actif]] passe devant. Tout le reste reste visible, mais secondaire.",
    "today.focusReady": "Bloc en focus",
    "today.focusDoneTitle": "La journee est prete a etre cloturee",
    "today.focusDoneHelp": "Tous les blocs du jour sont valides. Tu peux passer au lendemain.",
    "today.focusStep": "Etape {{current}} sur {{total}}",
    "today.focusWaveProgress": "{{count}} / 9 validations du nouveau completees.",
    "today.focusWaveGuide": "Les vagues du nouveau se completent dans la carte ci-dessous.",
    "today.focusValidate": "Valider ce bloc maintenant",
    "today.focusUndo": "Retirer la validation",
    "today.focusOpenNew": "Ouvrir les vagues du nouveau",
    "today.focusScroll": "Aller au detail du bloc",
    "today.routeLabel": "Ordre du jour",
    "today.routeTitle": "Chemin de [[récitation]]",
    "today.routeHelp": "Toujours du [[plus ancien]] vers le [[plus neuf]], sans mélanger les niveaux.",
    "route.oldTitle": "Ancien",
    "route.oldHelp": "Pool complet avant [[J-30]], découpé en 7 parties visibles.",
    "route.consolidationTitle": "Consolidation",
    "route.consolidationHelp": "Révision des 30 derniers jours, sur la tranche [[J-8 à J-30]].",
    "route.recentTitle": "Récent",
    "route.recentHelp": "Bloc continu [[J-1 à J-7]] pour garder le fragile très proche.",
    "route.yesterdayTitle": "Veille",
    "route.yesterdayHelp": "Le bloc d'hier isolé, pour vérifier le passage immédiat.",
    "route.newTitle": "Nouveau",
    "route.newHelp": "Le bloc du jour, avec [[3 vagues]] et [[9 validations]] au total.",
    "pages.eyebrow": "Suivi des erreurs",
    "pages.title": "Carte des [[pages]]",
    "pages.help":
      "Renseigne une page après une récitation, puis visualise à la fois les [[zones fragiles]] et les [[repères du programme]] du jour sur tout le mushaf.",
    "pages.quickLabel": "Saisie Rapide",
    "pages.quickTitle": "Une page, un clic, une erreur",
    "pages.quickHelp":
      "Clique une page dans la grille, ouvre la vraie page du mushaf, puis encadre la [[zone exacte]] de l'erreur.",
    "pages.insightsLabel": "Lecture",
    "pages.insightsTitle": "État et lecture de la carte",
    "pages.insightsHelp": "Lis les états d'un coup d'œil, puis clique une page pour ouvrir la vraie page du mushaf.",
    "pages.summaryLabel": "Synthèse",
    "pages.summaryTitle": "État de la carte",
    "pages.legendLabel": "Lecture",
    "pages.legendTitle": "Lire la carte",
    "pages.mapLabel": "Mushaf",
    "pages.mapTitle": "Représentation du Coran",
    "pages.mapHelp": "Clique une page pour ouvrir la vraie page du mushaf et placer ta [[zone d'erreur]].",
    "pages.definitionsLabel": "Définitions",
    "pages.definitionsHelp": "Les zones du programme sont visibles directement au-dessus de la carte.",
    "pages.juzLabel": "Juz {{number}}",
    "pages.juzPages": "Pages {{start}}-{{end}}",
    "pages.juzPageCount": "{{count}} pages",
    "pages.juzErrorCount": "{{count}} fragile(s)",
    "pages.juzLearnedCount": "{{count}} apprise(s)",
    "pages.juzExpand": "Ouvrir",
    "pages.juzCollapse": "Réduire",
    "review.eyebrow": "Répétition espacée",
    "review.title": "Revoir ses [[erreurs]]",
    "review.help": "Chaque carte reprend une [[erreur précise]], masque la zone fautive et la repropose selon son [[prochain rappel]].",
    "review.dueNow": "À revoir maintenant",
    "review.upcoming": "À venir",
    "review.mastered": "Stables",
    "review.libraryLabel": "Bibliothèque",
    "review.libraryTitle": "Toutes les pages avec erreurs",
    "review.libraryHelp": "Clique une page pour la consulter librement sans perdre la file des cartes dues.",
    "review.returnToQueue": "Revenir à la file",
    "review.status.due": "À revoir",
    "review.status.upcoming": "Plus tard",
    "review.status.mastered": "Stable",
    "review.selectedLabel": "Page sélectionnée",
    "review.browseHelp": "Cette page n'est pas due maintenant. Toutes ses erreurs sont visibles pour une révision libre.",
    "review.browseListLabel": "Erreurs visibles sur cette page",
    "review.emptyTitle": "Aucune erreur détaillée à revoir.",
    "review.emptyHelp": "Ajoute d'abord une erreur depuis une vraie page du mushaf pour lancer ce mode.",
    "review.emptyUpcoming": "Aucune carte n'est due pour l'instant. Reviens plus tard ou ajoute une nouvelle erreur.",
    "review.nextDue": "Prochain rappel",
    "review.cardLabel": "Carte {{current}} sur {{total}}",
    "review.pageLabel": "Page {{page}}",
    "review.pageErrorCount": "{{count}} erreur(s) sur cette page",
    "review.revealProgress": "{{count}} / {{total}} erreurs dévoilées",
    "review.revealNextHelp": "Clique sur Vérifier pour dévoiler l'erreur suivante sur cette même page.",
    "review.revealDoneHelp": "Toutes les erreurs de la page sont dévoilées. Note-les maintenant une par une.",
    "review.revealDoneButton": "Tout est dévoilé",
    "review.answerCurrentHelp": "Tu peux noter cette erreur maintenant, puis cliquer sur Verifier pour la suivante.",
    "review.nextPagePeek": "Début page {{page}}",
    "review.scopeLabel": "Type",
    "review.noteLabel": "Note",
    "review.noteEmpty": "Sans note",
    "review.swipeHelp": "Glisse à droite si tu as eu bon, à gauche si tu t'es trompé.",
    "review.revealHelp": "Retire d'abord le masque pour vérifier si tu avais bien retrouvé l'endroit.",
    "review.revealButton": "Vérifier",
    "review.hideButton": "Remettre le masque",
    "review.successButton": "Bon",
    "review.failureButton": "Raté",
    "review.successToast": "Erreur revue avec succès.",
    "review.failureToast": "Erreur à revoir plus vite.",
    "review.mask.harakah": "",
    "review.mask.word": "",
    "review.mask.line": "",
    "review.mask.next-page-link": "",
    "editor.eyebrow": "Page reelle",
    "editor.title": "Place la zone d'erreur",
    "editor.help":
      "Fais glisser sur la page pour entourer l'endroit exact, puis choisis si c'etait une harakat, un mot, une ligne entiere ou une liaison avec la page suivante.",
    "editor.scopeLabel": "Type d'erreur",
    "editor.scope.harakah": "Harakats",
    "editor.scope.word": "Mot",
    "editor.scope.line": "Ligne entiere",
    "editor.scope.next-page-link": "Liaison page suivante",
    "editor.noteLabel": "Note optionnelle",
    "editor.notePlaceholder": "Ex: confusion sur une fin d'ayah, oubli au milieu de la ligne...",
    "editor.selectionEmpty": "Aucune zone selectionnee pour le moment.",
    "editor.selectionReady": "Zone selectionnee. Tu peux enregistrer cette erreur.",
    "editor.selectionAutoLink": "Aucune zone a tracer : cette erreur ouvrira automatiquement les 3 premieres lignes de la page suivante.",
    "editor.selectionAutoLinkUsed": "Une liaison avec la page suivante existe deja sur cette page.",
    "editor.touchSelectionHint": "Sur mobile, fais un appui long sur la page pour commencer la selection. Sinon le geste fait simplement defiler le menu.",
    "editor.save": "Enregistrer l'erreur",
    "editor.cancel": "Fermer",
    "editor.clearSelection": "Effacer la zone",
    "editor.deleteError": "Supprimer",
    "editor.recentLabel": "Erreurs deja placees sur cette page",
    "editor.recentEmpty": "Aucune erreur detaillee sur cette page pour l'instant.",
    "editor.openFromInspector": "Ajouter une erreur precise",
    "surahs.eyebrow": "Ordre des sourates",
    "surahs.title": "Mini [[jeu]]",
    "surahs.help":
      "Travaille l'[[enchaînement des sourates]] avec des questions avant / après, en choisissant la [[plage exacte]] que tu veux renforcer.",
    "surahs.playModeLabel": "Mode de jeu",
    "surahs.playModeQuiz": "Avant / apres",
    "surahs.playModeQuizHint": "Reponds a des questions rapides sur la sourate juste avant ou juste apres.",
    "surahs.playModeMemory": "Mémo 7 sourates",
    "surahs.playModeMemoryHint": "Observe 7 sourates pendant 1 min, puis remets-les dans le bon ordre.",
    "surahs.playButton": "Jouer",
    "surahs.readyTitle": "La partie est prete",
    "surahs.readyHelpQuiz": "Choisis ton mode et ta plage, puis clique sur Jouer pour lancer la premiere question.",
    "surahs.readyHelpMemory": "Choisis ta plage, puis clique sur Jouer pour afficher les 7 sourates a memoriser.",
    "surahs.settingsCompactLabel": "Réglages",
    "surahs.settingsToggle": "Mode et plage de jeu",
    "surahs.rangeLabel": "Plage de jeu",
    "surahs.rangeHint": "Choisis une portion continue de sourates pour te concentrer sur un ordre précis.",
    "surahs.rangeFrom": "De",
    "surahs.rangeTo": "A",
    "surahs.rangeQuickAll": "Tout le Coran",
    "surahs.activeSpanLabel": "Plage active",
    "surahs.activeSpanAll": "Tout le Coran",
    "surahs.countLabel": "Sourates disponibles",
    "surahs.countValue": "{{count}} sourates dans cette plage",
    "surahs.coverageLabel": "Zones couvertes",
    "surahs.coverageEmpty": "Aucune plage jouable pour le moment.",
    "surahs.statsScore": "Bonnes reponses",
    "surahs.statsAnswered": "Questions faites",
    "surahs.statsStreak": "Serie en cours",
    "surahs.statsBestStreak": "Meilleure serie",
    "surahs.statsAccuracy": "Précision",
    "surahs.heatLabel": "Chaleur",
    "surahs.heatCalm": "Echauffement",
    "surahs.heatWarm": "Ça chauffe",
    "surahs.heatFire": "En feu",
    "surahs.heatBlazing": "Incandescent",
    "surahs.heatLegend": "Legende",
    "surahs.heatNext": "Encore {{count}} bonne(s) reponse(s) pour passer au niveau suivant.",
    "surahs.heatMax": "Tu es au niveau maximal. Garde la flamme allumee.",
    "surahs.streakValue": "{{count}} de serie",
    "surahs.accuracyValue": "{{count}}%",
    "surahs.milestoneToast": "Serie de {{count}} !",
    "surahs.restart": "Recommencer",
    "surahs.promptNext": "Quelle sourate vient juste apres celle-ci ?",
    "surahs.promptPrevious": "Quelle sourate vient juste avant celle-ci ?",
    "surahs.answerLabel": "Choisis la bonne reponse",
    "surahs.feedbackCorrect": "Bonne reponse. Tu gardes le bon ordre.",
    "surahs.feedbackWrong": "Pas encore. La bonne reponse etait {{name}}.",
    "surahs.sequenceLabel": "Repere rapide",
    "surahs.nextQuestion": "Question suivante",
    "surahs.memoryPreviewTitle": "Memorise cette suite",
    "surahs.memoryPreviewHelp": "Tu as 1 minute pour retenir l'ordre exact avant le melange.",
    "surahs.memoryCountdownLabel": "Melange dans",
    "surahs.memoryCountdownValue": "{{count}}s",
    "surahs.memoryPreviewSkip": "Passer au melange",
    "surahs.memoryReorderTitle": "Remets-les dans l'ordre",
    "surahs.memoryReorderHelp": "Clique les cartes restantes dans l'ordre exact de memorisation.",
    "surahs.memorySelectedLabel": "Ton ordre",
    "surahs.memoryRemainingLabel": "Cartes restantes",
    "surahs.memoryRemove": "Retirer",
    "surahs.memoryClear": "Vider",
    "surahs.memoryReplay": "Revoir 1 min",
    "surahs.memoryNewRound": "Nouvelle serie",
    "surahs.memoryCorrect": "Ordre parfait. Tu as retenu les 7 sourates.",
    "surahs.memoryWrong": "Pas encore. Voici l'ordre exact pour rejouer plus proprement.",
    "surahs.memoryRemainingDone": "Toutes les cartes sont placees.",
    "surahs.memoryAnswerProgress": "{{count}} / 7 placees",
    "surahs.emptyMemoryTitle": "Il faut au moins 7 sourates dans la plage.",
    "surahs.emptyMemoryHelp": "Elargis la plage choisie pour lancer ce mode memoire.",
    "surahs.emptyRangeTitle": "Choisis au moins deux sourates dans ta plage.",
    "surahs.emptyRangeHelp": "Avec une seule sourate, le jeu ne peut pas poser de question avant / apres.",
    "surahs.emptyAllTitle": "Le jeu n'a pas pu preparer de question.",
    "surahs.emptyAllHelp": "Recharge la page ou recommence le jeu.",
    "surahs.currentLabel": "Sourate repere",
    "surahs.pagesLabel": "Pages {{start}}-{{end}}",
    "surahs.flamesLabel": "Flammes de serie",
    "legend.noneTitle": "Neutre",
    "legend.noneHelp": "Aucune erreur enregistree.",
    "legend.minorTitle": "Mineur",
    "legend.minorHelp": "Voyelle ou petite correction locale.",
    "legend.mediumTitle": "Moyenne",
    "legend.mediumHelp": "Erreur dans un mot ou hesitation plus nette.",
    "legend.graveTitle": "Grave",
    "legend.graveHelp": "Oubli, blocage ou cassure majeure.",
    "legend.learnedTitle": "Apprise",
    "legend.learnedHelp": "Page deja memorisee, visible meme sans erreur.",
    "settings.eyebrow": "Réglages",
    "settings.title": "[[Paramètres]]",
    "settings.help": "Ajuste ton [[point de départ]] et ton [[rythme]], puis laisse le plan se [[recalculer]].",
    "settings.firstNameLabel": "Prénom",
    "settings.firstNamePlaceholder": "Ton prénom",
    "settings.languageLabel": "Langue",
    "settings.languageFrenchOption": "Français",
    "settings.languageEnglishOption": "English",
    "settings.languageArabicOption": "Arabe",
    "settings.identityLabel": "Identité",
    "settings.identityTitle": "Qui apprend ?",
    "settings.identityHelp": "Renseigne juste le prénom et la langue de l'interface.",
    "settings.progressLabel": "Progression",
    "settings.progressTitle": "Où en es-tu aujourd'hui ?",
    "settings.progressHelp": "Indique le sens du parcours, la phase active, puis la page et la moitié à partir desquelles le plan doit repartir.",
    "settings.programModeLabel": "Parcours",
    "settings.programModeForwardOption": "Début -> fin",
    "settings.programModeReverseOption": "Fin -> début",
    "settings.programModeReverseForwardOption": "Fin -> début puis début -> fin",
    "settings.phaseLabel": "Phase actuelle",
    "settings.phaseSingleOption": "Phase unique - {{direction}}",
    "settings.phaseReverseOption": "Phase 1 - fin -> début",
    "settings.phaseForwardOption": "Phase 2 - début -> fin",
    "settings.phaseCoveredLabel": "Pages déjà couvertes",
    "settings.phaseCoveredHelp": "Tu peux mettre .5 si tu es à la moitié d'une page.",
    "settings.phaseNextLabel": "Prochain point",
    "settings.phaseStatusLabel": "État",
    "settings.phaseStatusActive": "En cours",
    "settings.phaseStatusDone": "Phase terminée",
    "settings.phaseAutoHelp": "Les deux phases peuvent avancer en parallèle. Choisis simplement celle que tu veux afficher dans le plan du jour.",
    "settings.phaseDisplayLabel": "Plan affiché",
    "settings.phaseDisplayButton": "Afficher cette phase",
    "settings.phaseDisplayActive": "Phase affichée",
    "settings.rhythmLabel": "Rythme",
    "settings.rhythmTitle": "Quel rythme veux-tu tenir ?",
    "settings.rhythmHelp": "Choisis simplement ta part de [[nouveau quotidienne]]. Le mushaf suivi reste fixe sur [[604 pages]].",
    "settings.previewLabel": "Aperçu",
    "settings.previewTitle": "Ce que le plan va produire",
    "settings.previewHelp": "Le récap se met à jour avec l'état actuel du programme.",
    "settings.previewPath": "Sens actif",
    "settings.previewPhase": "Phase",
    "settings.previewCurrent": "Point actuel",
    "settings.previewNew": "Nouveau du jour",
    "settings.previewOld": "Ancien aujourd'hui",
    "settings.previewConsolidation": "Consolidation",
    "settings.previewRecent": "Récent",
    "settings.previewProgramDay": "Jour de programme",
    "settings.previewTotal": "Corpus suivi",
    "settings.previewMissing": "Aucun bloc pour cette zone aujourd'hui.",
    "settings.currentPageLabel": "Page actuelle",
    "settings.currentHalfLabel": "Moitié actuelle",
    "settings.lineLabel": "Ligne",
    "settings.upperHalfOption": "Haute",
    "settings.lowerHalfOption": "Basse",
    "settings.dailyNewLabel": "Nouveau / jour (pages)",
    "settings.programDayLabel": "Jour du programme",
    "settings.totalHalfPagesLabel": "Total de demi-pages",
    "settings.submitButton": "Valider et recalculer la journée",
    "settings.submitHelp": "Valide les réglages pour enregistrer puis recalculer le programme du jour.",
    "route.status.notRequired": "Non requis",
    "route.status.done": "Valide",
    "route.status.focus": "En focus",
    "route.status.waiting": "En attente",
    "status.unavailable": "Indisponible",
    "status.done": "Valide",
    "status.locked": "Verrouillé",
    "status.pending": "À valider",
    "lockNote": "Valide d'abord : {{items}}.",
    "emptyNote": "Aucun bloc disponible pour cette section aujourd'hui.",
    "meta.range": "Plage",
    "meta.size": "Taille",
    "meta.surahs": "Sourates",
    "card.expand": "Voir le détail",
    "card.collapse": "Replier",
    "toggle.undo": "Annuler la validation",
    "toggle.validate": "Marquer comme valide",
    "card.old.pool": "Pool ancien",
    "card.old.rotation": "Roulement complet : {{count}} partie(s) équilibrée(s) sur tout l'ancien > 30 jours.",
    "card.consolidation.noRange": "Aucune plage",
    "card.consolidation.active": "Partie active du jour",
    "card.consolidation.inactive": "Partie inactive aujourd'hui",
    "card.consolidation.concerned": "Partie concernée : révision des 30 derniers jours, sur la tranche J-8 à J-30.",
    "card.consolidation.activeToday": "Partie active aujourd'hui : {{part}}",
    "card.consolidation.blockToValidate": "Bloc à valider : {{block}}",
    "card.new.morning": "matin",
    "card.new.noon": "midi",
    "card.new.evening": "soir",
    "card.new.inProgress": "En cours",
    "card.new.complete": "Complète",
    "card.new.checked": "Validations complètes : {{count}} / 9",
    "card.new.rule": "Règle : les [[9 emplacements]] doivent être validés pour clore le [[nouveau du jour]].",
    "card.new.locked": "Verrouillé : valide d'abord {{items}}.",
    "summary.progress": "Progression",
    "summary.learned": "{{count}} apprises",
    "summary.totalPages": "{{count}} pages au total",
    "summary.phase": "Phase",
    "summary.day": "Jour",
    "summary.currentPoint": "Point actuel",
    "summary.dailyNew": "Nouveau / jour",
    "hero.genericName": "",
    "hero.namedName": " {{name}}",
    "day.completeTitle": "Journée complète.",
    "day.completeHelper": "{{done}} / {{total}} blocs valides, le programme peut avancer.",
    "day.completeText":
      "Tu peux passer au lendemain. Le plan de demain sera recalculé automatiquement à partir de ta progression.",
    "day.skippedTitle": "Journée clôturée sans nouveau.",
    "day.skippedHelper": "{{done}} / {{total}} blocs du jour sont clôturés, mais le nouveau reste au même point.",
    "day.skippedText": "Tu as terminé la journée sans faire avancer la mémorisation. Le programme reste sur le même nouveau.",
    "day.openTitle": "Journée encore ouverte.",
    "day.openHelper": "{{done}} / {{total}} blocs valides pour aujourd'hui.",
    "day.remaining": "Il reste a valider : {{items}}.",
    "errorSummary.pagesWithErrors": "Pages avec erreurs",
    "errorSummary.pagesWithErrorsHelp": "pages fragiles sur {{total}}.",
    "errorSummary.learnedPages": "Pages apprises",
    "errorSummary.learnedPagesHelp": "inclut le marquage automatique selon le parcours actif.",
    "errorSummary.minor": "Mineur",
    "errorSummary.minorHelp": "occurrences de voyelles.",
    "errorSummary.medium": "Moyenne",
    "errorSummary.mediumHelp": "occurrences dans un mot.",
    "errorSummary.grave": "Grave",
    "errorSummary.graveHelp": "occurrences de blocage ou oubli.",
    "page.neutral": "Neutre",
    "page.minor": "Mineur",
    "page.medium": "Moyenne",
    "page.grave": "Grave",
    "page.learned": "Apprise",
    "page.learnedWithSeverity": "Apprise - {{severity}}",
    "page.learnedBadge": "A",
    "count.minor": "V",
    "count.medium": "M",
    "count.grave": "G",
    "page.label": "Page {{page}}",
    "program.old": "Ancien",
    "program.oldShort": "Anc.",
    "program.oldDef": "Tout ce qui est avant J-30.",
    "program.oldToday": "Ancien du jour",
    "program.oldTodayShort": "Anc. jour",
    "program.oldTodayDef": "La partie d'ancien a reviser aujourd'hui.",
    "program.consolidation": "Consolidation",
    "program.consolidationShort": "Cons.",
    "program.consolidationDef": "Tout ce qui est entre J-8 et J-30.",
    "program.recent": "Récent",
    "program.recentShort": "Récent",
    "program.recentDef": "Tout ce qui est entre J-1 et J-7.",
    "program.yesterday": "Veille",
    "program.yesterdayShort": "Veille",
    "program.yesterdayDef": "Le bloc appris hier, soit J-1.",
    "program.new": "Nouveau",
    "program.newShort": "Nouveau",
    "program.newDef": "Le bloc a apprendre aujourd'hui.",
    "quick.noneLabel": "Inspecteur",
    "quick.noneTitle": "Aucune page sélectionnée",
    "quick.noneHelp": "Clique une page dans la grille pour afficher son contexte, ses erreurs et tes notes.",
    "quick.title": "Inspecteur",
    "quick.close": "Fermer",
    "quick.pageTitle": "Page {{page}}",
    "quick.help": "Consulte l'état de la page, son historique détaillé, puis ouvre la vraie page pour placer une erreur précise.",
    "quick.stateLabel": "Statut actuel",
    "quick.surahLabel": "Sourates",
    "quick.surahEmpty": "Aucune sourate identifiée pour cette page.",
    "quick.zoneLabel": "Zone du programme",
    "quick.zoneEmpty": "Aucune zone marquée aujourd'hui.",
    "quick.countsLabel": "Compteurs",
    "quick.lastNoteLabel": "Dernière note",
    "quick.lastNoteEmpty": "Aucune note enregistrée pour cette page.",
    "quick.noteLabel": "Note d'erreur",
    "quick.notePlaceholder": "Ex: confusion avec une page proche, blocage au milieu...",
    "quick.noteHelp": "Les nouvelles erreurs se placent directement sur la vraie page du mushaf.",
    "quick.historyLabel": "Historique récent",
    "quick.historyEmpty": "Aucune erreur enregistrée pour le moment.",
    "quick.historyNoNote": "Sans note",
    "quick.reviewDueLabel": "À revoir",
    "quick.minor": "Mineur",
    "quick.minorHelp": "Voyelle ou correction légère",
    "quick.medium": "Moyenne",
    "quick.mediumHelp": "Erreur dans un mot",
    "quick.grave": "Grave",
    "quick.graveHelp": "Oubli ou blocage",
    "quick.clear": "Effacer",
    "quick.clearHelp": "Effacer erreurs et notes",
    "quick.openEditor": "Ouvrir la page reelle",
    "toast.pageSelected": "Page {{page}} sélectionnée.",
    "toast.pageClosed": "Page {{page}} fermée.",
    "toast.errorAdded": "Erreur {{severity}} ajoutée à la page {{page}}.",
    "toast.errorDeleted": "Erreur supprimée de la page {{page}}.",
    "toast.errorsCleared": "Erreurs retirées de la page {{page}}.",
    "toast.dayRecalculated": "Journée recalculée.",
    "toast.dayReset": "Validations du jour réinitialisées.",
    "toast.nextDay": "Passage au jour suivant.",
    "toast.skipMemorizationDay": "Journée clôturée sans nouvelle mémorisation.",
    "toast.networkError": "Erreur réseau.",
    "toast.offlineMode": "Mode hors ligne active. Dabt utilise le cache local.",
    "toast.backOnline": "Connexion retablie.",
    "toast.snapshotMode": "Connexion absente. Dabt affiche le dernier etat local disponible.",
    "toast.appInstalled": "Dabt est maintenant installe sur cet appareil.",
    "toast.notificationsUpdated": "Rappels mis a jour.",
    "toast.notificationsPermissionDenied": "Autorise les notifications pour activer les rappels quotidiens.",
    "nav.statistics": "Statistiques",
    "summary.streak": "Streak",
    "summary.streakHintToday": "cloturee aujourd'hui",
    "summary.streakHintOpen": "en cours de continuation",
    "statistics.eyebrow": "Regularite",
    "statistics.title": "Statistiques",
    "statistics.help": "Observe ta streak, les derniers jours clotures et la solidite de ta routine.",
    "statistics.currentStreak": "Streak actuelle",
    "statistics.bestStreak": "Meilleure streak",
    "statistics.last7": "Jours clotures (7j)",
    "statistics.last30": "Jours clotures (30j)",
    "statistics.completionRate": "Regularite 30 jours",
    "statistics.skippedNew": "Jours sans nouveau",
    "statistics.timelineTitle": "30 derniers jours",
    "statistics.timelineHelp": "Chaque case represente un jour reel. La couleur montre si la journee a ete cloturee.",
    "statistics.closed": "Cloturee",
    "statistics.missed": "Non cloturee",
    "statistics.todayPending": "Aujourd'hui en cours",
    "statistics.recentClosures": "Dernieres clotures",
    "statistics.recentClosuresEmpty": "Aucune journee cloturee pour l'instant.",
    "statistics.recentClosureSkipped": "Sans nouveau",
    "statistics.recentClosureFull": "Journee complete",
    "statistics.pendingToday": "Pas encore cloturee aujourd'hui",
    "settings.notificationsLabel": "Notifications",
    "settings.notificationsTitle": "Rappels quotidiens",
    "settings.notificationsHelp": "Active les rappels puis ajuste l'heure de la revision et des 3 vagues du nouveau.",
    "settings.notificationsEnabledLabel": "Activer les notifications",
    "settings.notificationsEnabledHelp": "Les rappels seront planifies dans l'app mobile.",
    "settings.notificationReviewLabel": "Revision",
    "settings.notificationReviewTitle": "Revision du jour",
    "settings.notificationReviewHelp": "Un rappel pour l'ancien, la consolidation, le recent et la veille.",
    "settings.notificationMorningLabel": "Matin",
    "settings.notificationMorningTitle": "Nouveau - vague 1",
    "settings.notificationMorningHelp": "Premier rappel pour lancer la premiere vague du nouveau.",
    "settings.notificationNoonLabel": "Midi",
    "settings.notificationNoonTitle": "Nouveau - vague 2",
    "settings.notificationNoonHelp": "Deuxieme rappel pour reforcer le meme nouveau au milieu de la journee.",
    "settings.notificationEveningLabel": "Soir",
    "settings.notificationEveningTitle": "Nouveau - vague 3",
    "settings.notificationEveningHelp": "Dernier rappel pour cloturer la troisieme vague du nouveau.",
    "settings.notificationsStatusUnsupported": "Les rappels locaux seront actifs dans l'app mobile installee.",
    "settings.notificationsStatusDisabled": "Les rappels sont desactives.",
    "settings.notificationsStatusPermissionDenied": "Autorisation manquante: active les notifications systeme pour recevoir les rappels.",
    "settings.notificationsStatusScheduled": "{{count}} rappel(s) planifie(s) chaque jour.",
    "settings.notificationsStatusExactAlarm": "Les alarmes peuvent etre legerement differees par Android.",
    "notifications.reminder.review.title": "Dabt - revision du jour",
    "notifications.reminder.review.body": "Ouvre Dabt pour lancer ta revision du jour: {{items}}.",
    "notifications.reminder.review.empty": "Ouvre Dabt pour reprendre ta revision du jour.",
    "notifications.reminder.morning.title": "Dabt - nouveau du matin",
    "notifications.reminder.morning.body": "Premiere vague du nouveau: {{range}}.",
    "notifications.reminder.noon.title": "Dabt - nouveau de midi",
    "notifications.reminder.noon.body": "Deuxieme vague du nouveau: {{range}}.",
    "notifications.reminder.evening.title": "Dabt - nouveau du soir",
    "notifications.reminder.evening.body": "Troisieme vague du nouveau: {{range}}.",
    "error.invalidPageFormat": "Format de pages invalide.",
    "error.invalidPageFormatExample": "Format de pages invalide. Utilise 12, 14, 20-25.",
    "error.pageOutOfRange": "Une page est hors limite.",
    "error.selectPageFirst": "Choisis d'abord une page.",
    "part.label": "Partie {{number}}",
  },
  en: {
    "hero.title": "Bismillah, here is your plan for today{{name}}!✨",
    "hero.text": "Find only what you need to recite today here, in the exact order of the program.",
    "hero.markerLabel": "Guide",
    "hero.installApp": "Install Dabt",
    "hero.markerText":
      "The goal is to complete old review (< J-30) every 7 days, consolidation (from J-8 to J-30) every 3 days, then review the recent block (from J-1 to J-7), then yesterday (J-1), and finally learn the new block.",
    "nav.today": "Today",
    "nav.pages": "Pages",
    "nav.review": "Review errors",
    "nav.surahs": "Mini game",
    "nav.settings": "Settings",
    "onboarding.skip": "Skip",
    "onboarding.next": "Next",
    "onboarding.start": "Start",
    "onboarding.step": "Screen {{current}} of {{total}}",
    "onboarding.today.title": "The Today section guides you block by block",
    "onboarding.today.body": "The Today section organizes your day: what to recite now, which order to follow, and how to validate each block at the right moment.",
    "onboarding.pages.title": "The Pages section shows the mushaf at a glance",
    "onboarding.pages.body": "The Pages section lets you open the real Quran page, place a precise mistake, and track your state page by page, then juz by juz.",
    "onboarding.review.title": "The Review errors section revisits weak spots",
    "onboarding.review.body": "The Review errors section uses FSRS to bring each mistake back at the best moment based on your answers, directly on the Quran page.",
    "onboarding.surahs.title": "The Mini game section strengthens surah order",
    "onboarding.surahs.body": "The Mini game section gives you two ways to practice: find the next surah or reorder a short sequence correctly.",
    "onboarding.today.title": "Today guides you block by block",
    "onboarding.today.body": "Today follows a spaced-repetition methodology: everything is reordered so you review at the right moment, from the oldest material to the most recent, before learning the new part.",
    "onboarding.pages.title": "Pages lets you scan the mushaf at a glance",
    "onboarding.pages.body": "Each page keeps its own state. Open the real Quran page, place a precise mistake, and follow your progress juz by juz.",
    "onboarding.review.title": "Mistake review brings back weak spots",
    "onboarding.review.body": "Mistake review uses FSRS, a science-based spaced repetition system, to bring each error back at the best moment according to your answers.",
    "onboarding.surahs.title": "Mini game strengthens surah order",
    "onboarding.surahs.body": "Two playful modes help you memorize faster: find the next surah or reorder a short sequence correctly.",
    "today.dayLabel": "Day",
    "today.validationTitle": "Validation Status",
    "today.validationHelp": "Validate the blocks in order, then move to the next day.",
    "today.resetButton": "Reset today's validations",
    "today.skipMemorizationButton": "Skip memorizing today",
    "today.advanceButton": "Validate the day and move on",
    "today.focusLabel": "Now",
    "today.focusTitle": "What you do right now",
    "today.focusHelp": "The active block comes first. Everything else stays visible, but secondary.",
    "today.focusReady": "Block in focus",
    "today.focusDoneTitle": "The day is ready to be closed",
    "today.focusDoneHelp": "All blocks for today are validated. You can move to the next day.",
    "today.focusStep": "Step {{current}} of {{total}}",
    "today.focusWaveProgress": "{{count}} / 9 new checks completed.",
    "today.focusWaveGuide": "The new waves can be completed in the card below.",
    "today.focusValidate": "Validate this block now",
    "today.focusUndo": "Undo validation",
    "today.focusOpenNew": "Open the new waves",
    "today.focusScroll": "Go to block details",
    "today.routeLabel": "Today's Order",
    "today.routeTitle": "Recitation Path",
    "today.routeHelp": "Always go from the oldest to the newest, without mixing levels.",
    "route.oldTitle": "Old",
    "route.oldHelp": "Full pool before J-30, split into 7 visible parts.",
    "route.consolidationTitle": "Consolidation",
    "route.consolidationHelp": "Review from the last 30 days, on the J-8 to J-30 range.",
    "route.recentTitle": "Recent",
    "route.recentHelp": "Continuous J-1 to J-7 block to keep the fragile material close.",
    "route.yesterdayTitle": "Yesterday",
    "route.yesterdayHelp": "Yesterday's block on its own, to verify the immediate transition.",
    "route.newTitle": "New",
    "route.newHelp": "Today's new block, with 3 waves and 9 checks in total.",
    "pages.eyebrow": "Error Tracking",
    "pages.title": "Page Map",
    "pages.help":
      "Log a page after recitation, then visualize both fragile zones and today's program markers across the whole mushaf.",
    "pages.quickLabel": "Quick Input",
    "pages.quickTitle": "One page, one click, one error",
    "pages.quickHelp":
      "Click a page in the grid, open the real mushaf page, then draw the exact area of the mistake.",
    "pages.insightsLabel": "Reading",
    "pages.insightsTitle": "Map Status And Reading Guide",
    "pages.insightsHelp": "Read the states at a glance, then click a page to open the real mushaf page.",
    "pages.summaryLabel": "Summary",
    "pages.summaryTitle": "Map Status",
    "pages.legendLabel": "Legend",
    "pages.legendTitle": "How To Read The Map",
    "pages.mapLabel": "Mushaf",
    "pages.mapTitle": "Quran Overview",
    "pages.mapHelp": "Click a page to open the real mushaf page and place the exact error area.",
    "pages.definitionsLabel": "Definitions",
    "pages.definitionsHelp": "Program zones are shown directly above the map.",
    "pages.juzLabel": "Juz {{number}}",
    "pages.juzPages": "Pages {{start}}-{{end}}",
    "pages.juzPageCount": "{{count}} pages",
    "pages.juzErrorCount": "{{count}} fragile",
    "pages.juzLearnedCount": "{{count}} learned",
    "pages.juzExpand": "Open",
    "pages.juzCollapse": "Collapse",
    "review.eyebrow": "Spaced Repetition",
    "review.title": "Review your errors",
    "review.help": "Each card hides the exact mistake zone and brings it back according to its next spaced repetition slot.",
    "review.dueNow": "Due now",
    "review.upcoming": "Upcoming",
    "review.mastered": "Stable",
    "review.libraryLabel": "Library",
    "review.libraryTitle": "All pages with errors",
    "review.libraryHelp": "Click any page to inspect it freely without losing the due review queue.",
    "review.returnToQueue": "Back to due queue",
    "review.status.due": "Due",
    "review.status.upcoming": "Later",
    "review.status.mastered": "Stable",
    "review.selectedLabel": "Selected page",
    "review.browseHelp": "This page is not due right now. All its errors are visible for free review.",
    "review.browseListLabel": "Visible errors on this page",
    "review.emptyTitle": "No detailed errors to review yet.",
    "review.emptyHelp": "Add an error from a real mushaf page first to start this mode.",
    "review.emptyUpcoming": "Nothing is due right now. Come back later or add a new error.",
    "review.nextDue": "Next review",
    "review.cardLabel": "Card {{current}} of {{total}}",
    "review.pageLabel": "Page {{page}}",
    "review.pageErrorCount": "{{count}} error(s) on this page",
    "review.revealProgress": "{{count}} / {{total}} errors revealed",
    "review.revealNextHelp": "Click Reveal to uncover the next error on this same page.",
    "review.revealDoneHelp": "All errors on this page are revealed. Mark them one by one now.",
    "review.revealDoneButton": "All revealed",
    "review.answerCurrentHelp": "You can score this error now, then click Reveal for the next one.",
    "review.nextPagePeek": "Start of page {{page}}",
    "review.scopeLabel": "Type",
    "review.noteLabel": "Note",
    "review.noteEmpty": "No note",
    "review.swipeHelp": "Swipe right if you got it right, left if you missed it.",
    "review.revealHelp": "Remove the mask first to check whether you found the exact place.",
    "review.revealButton": "Reveal",
    "review.hideButton": "Hide mask",
    "review.successButton": "Correct",
    "review.failureButton": "Missed",
    "review.successToast": "Error reviewed successfully.",
    "review.failureToast": "This error will come back sooner.",
    "review.mask.harakah": "",
    "review.mask.word": "",
    "review.mask.line": "",
    "review.mask.next-page-link": "",
    "editor.eyebrow": "Real page",
    "editor.title": "Place the error area",
    "editor.help":
      "Drag on the page to surround the exact location, then choose whether it was a harakah, a word, a whole line, or the link with the next page.",
    "editor.scopeLabel": "Error type",
    "editor.scope.harakah": "Harakahs",
    "editor.scope.word": "Word",
    "editor.scope.line": "Whole line",
    "editor.scope.next-page-link": "Link to next page",
    "editor.noteLabel": "Optional note",
    "editor.notePlaceholder": "Example: confusion on the end of an ayah, forgetting in the middle of the line...",
    "editor.selectionEmpty": "No area selected yet.",
    "editor.selectionReady": "Area selected. You can save this error now.",
    "editor.selectionAutoLink": "No area to draw: this error will automatically open the first 3 lines of the next page.",
    "editor.selectionAutoLinkUsed": "A next-page link already exists on this page.",
    "editor.touchSelectionHint": "On mobile, long-press the page to start selecting. Otherwise the gesture just scrolls the sheet.",
    "editor.save": "Save error",
    "editor.cancel": "Close",
    "editor.clearSelection": "Clear area",
    "editor.deleteError": "Delete",
    "editor.recentLabel": "Errors already placed on this page",
    "editor.recentEmpty": "No detailed errors on this page yet.",
    "editor.openFromInspector": "Open real page",
    "surahs.eyebrow": "Surah order",
    "surahs.title": "Mini game",
    "surahs.help":
      "Practice the surah sequence with before / after questions by choosing the exact surah range you want to reinforce.",
    "surahs.playModeLabel": "Play mode",
    "surahs.playModeQuiz": "Before / after",
    "surahs.playModeQuizHint": "Answer quick questions about the surah just before or just after.",
    "surahs.playModeMemory": "Memory 7 surahs",
    "surahs.playModeMemoryHint": "Study 7 surahs for 1 minute, then put them back in the correct order.",
    "surahs.playButton": "Play",
    "surahs.readyTitle": "Your round is ready",
    "surahs.readyHelpQuiz": "Choose your mode and range, then click Play to launch the first question.",
    "surahs.readyHelpMemory": "Choose your range, then click Play to reveal the 7 surahs you need to memorize.",
    "surahs.settingsCompactLabel": "Settings",
    "surahs.settingsToggle": "Mode and play range",
    "surahs.rangeLabel": "Play range",
    "surahs.rangeHint": "Choose one continuous span of surahs so the game stays focused on a precise sequence.",
    "surahs.rangeFrom": "From",
    "surahs.rangeTo": "To",
    "surahs.rangeQuickAll": "Full Quran",
    "surahs.activeSpanLabel": "Active span",
    "surahs.activeSpanAll": "Full Quran",
    "surahs.countLabel": "Available surahs",
    "surahs.countValue": "{{count}} surahs in this range",
    "surahs.coverageLabel": "Covered spans",
    "surahs.coverageEmpty": "No playable span yet.",
    "surahs.statsScore": "Correct answers",
    "surahs.statsAnswered": "Questions answered",
    "surahs.statsStreak": "Current streak",
    "surahs.statsBestStreak": "Best streak",
    "surahs.statsAccuracy": "Accuracy",
    "surahs.heatLabel": "Heat",
    "surahs.heatCalm": "Warm-up",
    "surahs.heatWarm": "Heating up",
    "surahs.heatFire": "On fire",
    "surahs.heatBlazing": "Blazing",
    "surahs.heatLegend": "Legend",
    "surahs.heatNext": "{{count}} more correct answer(s) to reach the next level.",
    "surahs.heatMax": "You are at the max level. Keep the flame alive.",
    "surahs.streakValue": "{{count}} streak",
    "surahs.accuracyValue": "{{count}}%",
    "surahs.milestoneToast": "{{count}} streak!",
    "surahs.restart": "Restart",
    "surahs.promptNext": "Which surah comes right after this one?",
    "surahs.promptPrevious": "Which surah comes right before this one?",
    "surahs.answerLabel": "Pick the right answer",
    "surahs.feedbackCorrect": "Correct. The sequence is holding.",
    "surahs.feedbackWrong": "Not yet. The correct answer was {{name}}.",
    "surahs.sequenceLabel": "Quick sequence cue",
    "surahs.nextQuestion": "Next question",
    "surahs.memoryPreviewTitle": "Memorize this sequence",
    "surahs.memoryPreviewHelp": "You have 1 minute to retain the exact order before the shuffle.",
    "surahs.memoryCountdownLabel": "Shuffle in",
    "surahs.memoryCountdownValue": "{{count}}s",
    "surahs.memoryPreviewSkip": "Shuffle now",
    "surahs.memoryReorderTitle": "Put them back in order",
    "surahs.memoryReorderHelp": "Click the remaining cards in the exact memorized order.",
    "surahs.memorySelectedLabel": "Your order",
    "surahs.memoryRemainingLabel": "Remaining cards",
    "surahs.memoryRemove": "Remove",
    "surahs.memoryClear": "Clear",
    "surahs.memoryReplay": "Replay 1 min",
    "surahs.memoryNewRound": "New sequence",
    "surahs.memoryCorrect": "Perfect order. You retained all 7 surahs.",
    "surahs.memoryWrong": "Not yet. Here is the exact order so you can replay it cleanly.",
    "surahs.memoryRemainingDone": "All cards have been placed.",
    "surahs.memoryAnswerProgress": "{{count}} / 7 placed",
    "surahs.emptyMemoryTitle": "This mode needs at least 7 surahs in the selected range.",
    "surahs.emptyMemoryHelp": "Widen the selected span to start the memory mode.",
    "surahs.emptyRangeTitle": "Choose at least two surahs in your range.",
    "surahs.emptyRangeHelp": "With only one surah, the game cannot ask before / after questions.",
    "surahs.emptyAllTitle": "The game could not prepare a question.",
    "surahs.emptyAllHelp": "Reload the page or restart the game.",
    "surahs.currentLabel": "Anchor surah",
    "surahs.pagesLabel": "Pages {{start}}-{{end}}",
    "surahs.flamesLabel": "Streak flames",
    "legend.noneTitle": "Neutral",
    "legend.noneHelp": "No recorded error.",
    "legend.minorTitle": "Minor",
    "legend.minorHelp": "Harakah or small local correction.",
    "legend.mediumTitle": "Medium",
    "legend.mediumHelp": "A word error or clearer hesitation.",
    "legend.graveTitle": "Grave",
    "legend.graveHelp": "Forgetting, blocking, or major break.",
    "legend.learnedTitle": "Learned",
    "legend.learnedHelp": "Page already memorized, even without errors.",
    "settings.eyebrow": "Setup",
    "settings.title": "Settings",
    "settings.help": "Adjust your starting point and pace, then let the plan recalculate itself.",
    "settings.firstNameLabel": "First name",
    "settings.firstNamePlaceholder": "Your first name",
    "settings.languageLabel": "Language",
    "settings.languageFrenchOption": "French",
    "settings.languageEnglishOption": "English",
    "settings.languageArabicOption": "Arabic",
    "settings.identityLabel": "Identity",
    "settings.identityTitle": "Who is learning?",
    "settings.identityHelp": "Just set the first name and the interface language.",
    "settings.progressLabel": "Progress",
    "settings.progressTitle": "Where are you today?",
    "settings.progressHelp": "Set the program path, the active phase, then the page and half from which the plan should resume.",
    "settings.programModeLabel": "Program path",
    "settings.programModeForwardOption": "Start -> end",
    "settings.programModeReverseOption": "End -> start",
    "settings.programModeReverseForwardOption": "End -> start then start -> end",
    "settings.phaseLabel": "Current phase",
    "settings.phaseSingleOption": "Single phase - {{direction}}",
    "settings.phaseReverseOption": "Phase 1 - end -> start",
    "settings.phaseForwardOption": "Phase 2 - start -> end",
    "settings.phaseCoveredLabel": "Pages already covered",
    "settings.phaseCoveredHelp": "You can use .5 if you are halfway through a page.",
    "settings.phaseNextLabel": "Next point",
    "settings.phaseStatusLabel": "Status",
    "settings.phaseStatusActive": "In progress",
    "settings.phaseStatusDone": "Phase completed",
    "settings.phaseAutoHelp": "Both phases can progress in parallel. Just choose which one should be shown in today's plan.",
    "settings.phaseDisplayLabel": "Displayed plan",
    "settings.phaseDisplayButton": "Show this phase",
    "settings.phaseDisplayActive": "Displayed phase",
    "settings.rhythmLabel": "Pace",
    "settings.rhythmTitle": "What pace do you want to keep?",
    "settings.rhythmHelp": "Just choose your daily new portion. The tracked mushaf stays fixed at 604 pages.",
    "settings.previewLabel": "Preview",
    "settings.previewTitle": "What the plan will generate",
    "settings.previewHelp": "This recap updates from the current program state.",
    "settings.previewPath": "Active direction",
    "settings.previewPhase": "Phase",
    "settings.previewCurrent": "Current point",
    "settings.previewNew": "Today's new",
    "settings.previewOld": "Old today",
    "settings.previewConsolidation": "Consolidation",
    "settings.previewRecent": "Recent",
    "settings.previewProgramDay": "Program day",
    "settings.previewTotal": "Tracked corpus",
    "settings.previewMissing": "No block for this zone today.",
    "settings.currentPageLabel": "Current page",
    "settings.currentHalfLabel": "Current half",
    "settings.lineLabel": "Line",
    "settings.upperHalfOption": "Upper",
    "settings.lowerHalfOption": "Lower",
    "settings.dailyNewLabel": "New / day (pages)",
    "settings.programDayLabel": "Program day",
    "settings.totalHalfPagesLabel": "Total half-pages",
    "settings.submitButton": "Save and recalculate the day",
    "settings.submitHelp": "Save these settings to refresh today's plan.",
    "route.status.notRequired": "Not required",
    "route.status.done": "Done",
    "route.status.focus": "In focus",
    "route.status.waiting": "Waiting",
    "status.unavailable": "Unavailable",
    "status.done": "Done",
    "status.locked": "Locked",
    "status.pending": "To validate",
    "lockNote": "Validate first: {{items}}.",
    "emptyNote": "No block is available for this section today.",
    "meta.range": "Range",
    "meta.size": "Size",
    "meta.surahs": "Surahs",
    "card.expand": "Show details",
    "card.collapse": "Collapse",
    "toggle.undo": "Undo validation",
    "toggle.validate": "Mark as done",
    "card.old.pool": "Old pool",
    "card.old.rotation": "Full rotation: {{count}} balanced part(s) across all old material > 30 days.",
    "card.consolidation.noRange": "No range",
    "card.consolidation.active": "Active part today",
    "card.consolidation.inactive": "Inactive part today",
    "card.consolidation.concerned": "Concerned part: review of the last 30 days, on the J-8 to J-30 range.",
    "card.consolidation.activeToday": "Active part today: {{part}}",
    "card.consolidation.blockToValidate": "Block to validate: {{block}}",
    "card.new.morning": "morning",
    "card.new.noon": "midday",
    "card.new.evening": "evening",
    "card.new.inProgress": "In progress",
    "card.new.complete": "Complete",
    "card.new.checked": "Completed checks: {{count}} / 9",
    "card.new.rule": "Rule: all 9 slots must be checked to close today's new block.",
    "card.new.locked": "Locked: validate {{items}} first.",
    "summary.progress": "Progress",
    "summary.learned": "{{count}} learned",
    "summary.totalPages": "{{count}} total pages",
    "summary.phase": "Phase",
    "summary.day": "Day",
    "summary.currentPoint": "Current point",
    "summary.dailyNew": "New / day",
    "hero.genericName": "",
    "hero.namedName": " {{name}}",
    "day.completeTitle": "Day complete.",
    "day.completeHelper": "{{done}} / {{total}} blocks validated, the program can move on.",
    "day.completeText":
      "You can move to the next day. Tomorrow's plan will be recalculated automatically from your progress.",
    "day.skippedTitle": "Day closed without new memorization.",
    "day.skippedHelper": "{{done}} / {{total}} day blocks are closed, but the new section stays on the same point.",
    "day.skippedText": "You finished the day without advancing memorization. The program stays on the same new section.",
    "day.openTitle": "Day still open.",
    "day.openHelper": "{{done}} / {{total}} blocks validated for today.",
    "day.remaining": "Still to validate: {{items}}.",
    "errorSummary.pagesWithErrors": "Pages with errors",
    "errorSummary.pagesWithErrorsHelp": "fragile pages out of {{total}}.",
    "errorSummary.learnedPages": "Learned pages",
    "errorSummary.learnedPagesHelp": "includes automatic marking based on the active path.",
    "errorSummary.minor": "Minor",
    "errorSummary.minorHelp": "harakah occurrences.",
    "errorSummary.medium": "Medium",
    "errorSummary.mediumHelp": "word-level occurrences.",
    "errorSummary.grave": "Grave",
    "errorSummary.graveHelp": "blocking or forgetting occurrences.",
    "page.neutral": "Neutral",
    "page.minor": "Minor",
    "page.medium": "Medium",
    "page.grave": "Grave",
    "page.learned": "Learned",
    "page.learnedWithSeverity": "Learned - {{severity}}",
    "page.learnedBadge": "L",
    "count.minor": "Mi",
    "count.medium": "Md",
    "count.grave": "Gr",
    "page.label": "Page {{page}}",
    "program.old": "Old",
    "program.oldShort": "Old",
    "program.oldDef": "Everything before J-30.",
    "program.oldToday": "Old today",
    "program.oldTodayShort": "Old today",
    "program.oldTodayDef": "The old part to review today.",
    "program.consolidation": "Consolidation",
    "program.consolidationShort": "Cons.",
    "program.consolidationDef": "Everything from J-8 to J-30.",
    "program.recent": "Recent",
    "program.recentShort": "Recent",
    "program.recentDef": "Everything from J-1 to J-7.",
    "program.yesterday": "Yesterday",
    "program.yesterdayShort": "Yesterday",
    "program.yesterdayDef": "The block learned yesterday, J-1.",
    "program.new": "New",
    "program.newShort": "New",
    "program.newDef": "The block to learn today.",
    "quick.noneLabel": "Inspector",
    "quick.noneTitle": "No page selected",
    "quick.noneHelp": "Click a page in the grid to see its context, errors, and notes.",
    "quick.title": "Inspector",
    "quick.close": "Close",
    "quick.pageTitle": "Page {{page}}",
    "quick.help": "Review the page state, its detailed history, then open the real page to place a precise error.",
    "quick.stateLabel": "Current state",
    "quick.surahLabel": "Surahs",
    "quick.surahEmpty": "No surah identified for this page.",
    "quick.zoneLabel": "Program zone",
    "quick.zoneEmpty": "No program zone marked today.",
    "quick.countsLabel": "Counters",
    "quick.lastNoteLabel": "Latest note",
    "quick.lastNoteEmpty": "No note recorded for this page yet.",
    "quick.noteLabel": "Error note",
    "quick.notePlaceholder": "Example: confusion with a nearby page, block in the middle...",
    "quick.noteHelp": "New errors are now placed directly on the real mushaf page.",
    "quick.historyLabel": "Recent history",
    "quick.historyEmpty": "No error recorded yet.",
    "quick.historyNoNote": "No note",
    "quick.reviewDueLabel": "Due",
    "quick.minor": "Minor",
    "quick.minorHelp": "Harakah or light correction",
    "quick.medium": "Medium",
    "quick.mediumHelp": "Word-level mistake",
    "quick.grave": "Grave",
    "quick.graveHelp": "Blocking or forgetting",
    "quick.clear": "Clear",
    "quick.clearHelp": "Clear errors and notes",
    "quick.openEditor": "Open real page",
    "toast.pageSelected": "Page {{page}} selected.",
    "toast.pageClosed": "Page {{page}} closed.",
    "toast.errorAdded": "{{severity}} error added to page {{page}}.",
    "toast.errorDeleted": "Error deleted from page {{page}}.",
    "toast.errorsCleared": "Errors cleared from page {{page}}.",
    "toast.dayRecalculated": "Day recalculated.",
    "toast.dayReset": "Today's validations reset.",
    "toast.nextDay": "Moved to the next day.",
    "toast.skipMemorizationDay": "Day closed without new memorization.",
    "toast.networkError": "Network error.",
    "toast.offlineMode": "Offline mode is active. Dabt is using the local cache.",
    "toast.backOnline": "Connection restored.",
    "toast.snapshotMode": "Connection unavailable. Dabt is showing the latest local state snapshot.",
    "toast.appInstalled": "Dabt is now installed on this device.",
    "toast.notificationsUpdated": "Reminders updated.",
    "toast.notificationsPermissionDenied": "Allow notifications to activate daily reminders.",
    "nav.statistics": "Statistics",
    "summary.streak": "Streak",
    "summary.streakHintToday": "closed today",
    "summary.streakHintOpen": "still alive today",
    "statistics.eyebrow": "Consistency",
    "statistics.title": "Statistics",
    "statistics.help": "Track your streak, your latest closed days, and how steady your routine has been.",
    "statistics.currentStreak": "Current streak",
    "statistics.bestStreak": "Best streak",
    "statistics.last7": "Closed days (7d)",
    "statistics.last30": "Closed days (30d)",
    "statistics.completionRate": "30-day consistency",
    "statistics.skippedNew": "Days without new work",
    "statistics.timelineTitle": "Last 30 days",
    "statistics.timelineHelp": "Each tile represents a real day. Color shows whether the day was closed.",
    "statistics.closed": "Closed",
    "statistics.missed": "Not closed",
    "statistics.todayPending": "Today still open",
    "statistics.recentClosures": "Recent closures",
    "statistics.recentClosuresEmpty": "No closed day yet.",
    "statistics.recentClosureSkipped": "Without new work",
    "statistics.recentClosureFull": "Full day",
    "statistics.pendingToday": "Not closed yet today",
    "settings.notificationsLabel": "Notifications",
    "settings.notificationsTitle": "Daily reminders",
    "settings.notificationsHelp": "Enable reminders, then set the review time and the 3 new-work waves.",
    "settings.notificationsEnabledLabel": "Enable notifications",
    "settings.notificationsEnabledHelp": "Reminders will be scheduled inside the mobile app.",
    "settings.notificationReviewLabel": "Review",
    "settings.notificationReviewTitle": "Daily review",
    "settings.notificationReviewHelp": "One reminder for old work, consolidation, recent work, and yesterday.",
    "settings.notificationMorningLabel": "Morning",
    "settings.notificationMorningTitle": "New work - wave 1",
    "settings.notificationMorningHelp": "First reminder to start the first new-work wave.",
    "settings.notificationNoonLabel": "Noon",
    "settings.notificationNoonTitle": "New work - wave 2",
    "settings.notificationNoonHelp": "Second reminder to reinforce the same new block in the middle of the day.",
    "settings.notificationEveningLabel": "Evening",
    "settings.notificationEveningTitle": "New work - wave 3",
    "settings.notificationEveningHelp": "Last reminder to close the third new-work wave.",
    "settings.notificationsStatusUnsupported": "Local reminders will work inside the installed mobile app.",
    "settings.notificationsStatusDisabled": "Reminders are disabled.",
    "settings.notificationsStatusPermissionDenied": "Missing permission: enable system notifications to receive reminders.",
    "settings.notificationsStatusScheduled": "{{count}} reminder(s) scheduled every day.",
    "settings.notificationsStatusExactAlarm": "Android may delay reminders slightly.",
    "notifications.reminder.review.title": "Dabt - daily review",
    "notifications.reminder.review.body": "Open Dabt for today's review: {{items}}.",
    "notifications.reminder.review.empty": "Open Dabt to continue today's review.",
    "notifications.reminder.morning.title": "Dabt - morning new work",
    "notifications.reminder.morning.body": "First new-work wave: {{range}}.",
    "notifications.reminder.noon.title": "Dabt - noon new work",
    "notifications.reminder.noon.body": "Second new-work wave: {{range}}.",
    "notifications.reminder.evening.title": "Dabt - evening new work",
    "notifications.reminder.evening.body": "Third new-work wave: {{range}}.",
    "error.invalidPageFormat": "Invalid page format.",
    "error.invalidPageFormatExample": "Invalid page format. Use 12, 14, 20-25.",
    "error.pageOutOfRange": "A page is out of range.",
    "error.selectPageFirst": "Choose a page first.",
    "part.label": "Part {{number}}",
  },
  ar: {
    "hero.title": "بسم الله، هذه خطتك لليوم{{name}} ✨",
    "hero.text": "ستجد هنا فقط ما تحتاج إلى مراجعته اليوم، بالترتيب الصحيح للبرنامج.",
    "hero.markerLabel": "دليل",
    "hero.installApp": "تثبيت Dabt",
    "nav.today": "اليوم",
    "nav.pages": "الصفحات",
    "nav.review": "مراجعة الاخطاء",
    "nav.statistics": "الاحصائيات",
    "nav.surahs": "اللعبة",
    "nav.settings": "الاعدادات",
    "onboarding.skip": "تخطي",
    "onboarding.next": "التالي",
    "onboarding.start": "ابدأ",
    "onboarding.step": "الشاشة {{current}} من {{total}}",
    "settings.eyebrow": "الاعدادات",
    "settings.title": "الاعدادات",
    "settings.help": "عدّل نقطة الانطلاق والوتيرة ثم اترك الخطة تعيد حساب اليوم.",
    "settings.firstNameLabel": "الاسم",
    "settings.firstNamePlaceholder": "اسمك",
    "settings.languageLabel": "اللغة",
    "settings.languageFrenchOption": "الفرنسية",
    "settings.languageEnglishOption": "الانجليزية",
    "settings.languageArabicOption": "العربية",
    "today.dayLabel": "اليوم",
    "today.validationTitle": "حالة التحقق",
    "today.validationHelp": "تحقق من الكتل بالترتيب ثم انتقل إلى اليوم التالي.",
    "today.focusLabel": "الآن",
    "today.focusTitle": "ما الذي تفعله الآن",
    "today.routeLabel": "ترتيب اليوم",
    "today.routeTitle": "مسار التلاوة",
    "pages.eyebrow": "متابعة الاخطاء",
    "pages.title": "خريطة الصفحات",
    "review.eyebrow": "التكرار المتباعد",
    "review.title": "مراجعة الاخطاء",
    "review.help": "كل بطاقة تعيد خطأ محددا وتعرضه في الوقت المناسب.",
    "surahs.eyebrow": "اللعبة",
    "surahs.title": "اللعبة المصغرة",
    "surahs.help": "تدريب سريع على ترتيب السور.",
  },
};

const AR_I18N_PATCH = {
  "hero.namedName": " {{name}}",
  "today.resetButton": "إعادة ضبط تحقق اليوم",
  "today.skipMemorizationButton": "عدم حفظ شيء اليوم",
  "today.advanceButton": "إنهاء اليوم والانتقال",
  "today.focusHelp": "تظهر الكتلة النشطة أولا، بينما تبقى بقية العناصر مرئية بشكل ثانوي.",
  "today.focusReady": "الكتلة الحالية",
  "today.focusDoneTitle": "اليوم جاهز للإغلاق",
  "today.focusDoneHelp": "تم التحقق من جميع كتل اليوم. يمكنك الانتقال إلى اليوم التالي.",
  "today.focusStep": "الخطوة {{current}} من {{total}}",
  "today.focusWaveProgress": "{{count}} / 9 من مراجعات الجديد مكتملة.",
  "today.focusWaveGuide": "يمكن إكمال موجات الجديد داخل البطاقة في الأسفل.",
  "today.focusValidate": "تحقق من هذه الكتلة الآن",
  "today.focusUndo": "إلغاء التحقق",
  "today.focusOpenNew": "فتح موجات الجديد",
  "today.focusScroll": "الذهاب إلى تفاصيل الكتلة",
  "today.routeHelp": "ابدأ دائما من الأقدم إلى الأحدث من دون خلط المستويات.",
  "route.oldTitle": "القديم",
  "route.oldHelp": "كل المحفوظ الأقدم من 30 يوما، مقسم إلى 7 أجزاء متوازنة.",
  "route.consolidationTitle": "التثبيت",
  "route.consolidationHelp": "مراجعة آخر 30 يوما ضمن المجال من J-8 إلى J-30.",
  "route.recentTitle": "القريب",
  "route.recentHelp": "كتلة متصلة من J-1 إلى J-7 حتى يبقى الجديد قريبا.",
  "route.yesterdayTitle": "الأمس",
  "route.yesterdayHelp": "كتلة الأمس وحدها للتحقق من المرور المباشر.",
  "route.newTitle": "الجديد",
  "route.newHelp": "كتلة اليوم الجديدة مع 3 موجات و9 تثبيتات.",
  "pages.help": "سجّل الصفحة بعد التلاوة، ثم شاهد المناطق الضعيفة وعلامات البرنامج على كامل المصحف.",
  "pages.quickLabel": "إدخال سريع",
  "pages.quickTitle": "صفحة واحدة، نقرة واحدة، خطأ واحد",
  "pages.quickHelp": "اضغط صفحة من الشبكة، افتح الصفحة الحقيقية من المصحف، ثم حدد موضع الخطأ بدقة.",
  "pages.insightsLabel": "القراءة",
  "pages.insightsTitle": "قراءة الخريطة بسرعة",
  "pages.insightsHelp": "اقرأ الحالات بسرعة، ثم افتح الصفحة التي تريدها من المصحف الحقيقي.",
  "pages.summaryLabel": "الملخص",
  "pages.summaryTitle": "حالة الخريطة",
  "pages.legendLabel": "الدليل",
  "pages.legendTitle": "كيف تقرأ الخريطة",
  "pages.mapLabel": "المصحف",
  "pages.mapTitle": "تمثيل المصحف",
  "pages.mapHelp": "اضغط أي صفحة لفتح المصحف الحقيقي وتحديد الخطأ.",
  "pages.definitionsLabel": "تعريفات",
  "pages.definitionsHelp": "مناطق البرنامج تظهر مباشرة فوق الخريطة.",
  "pages.juzLabel": "الجزء {{number}}",
  "pages.juzPages": "الصفحات {{start}}-{{end}}",
  "pages.juzPageCount": "{{count}} صفحة",
  "pages.juzErrorCount": "{{count}} صفحة هشة",
  "pages.juzLearnedCount": "{{count}} صفحة محفوظة",
  "pages.juzExpand": "فتح",
  "pages.juzCollapse": "طي",
  "review.dueNow": "للمراجعة الآن",
  "review.upcoming": "لاحقا",
  "review.mastered": "ثابتة",
  "review.libraryLabel": "المكتبة",
  "review.libraryTitle": "كل الصفحات التي فيها أخطاء",
  "review.libraryHelp": "اضغط صفحة لفتحها بحرية من دون أن تفقد صف البطاقات المستحقة.",
  "review.returnToQueue": "العودة إلى الصف",
  "review.status.due": "للمراجعة",
  "review.status.upcoming": "لاحقا",
  "review.status.mastered": "ثابتة",
  "review.selectedLabel": "الصفحة المحددة",
  "review.browseHelp": "هذه الصفحة ليست مستحقة الآن. يمكنك مراجعة كل أخطائها بحرية.",
  "review.browseListLabel": "الأخطاء الظاهرة في هذه الصفحة",
  "review.emptyTitle": "لا توجد أخطاء مفصلة للمراجعة.",
  "review.emptyHelp": "أضف أولا خطأ من صفحة حقيقية من المصحف لبدء هذا الوضع.",
  "review.emptyUpcoming": "لا توجد بطاقات مستحقة الآن. عد لاحقا أو أضف خطأ جديدا.",
  "review.nextDue": "المراجعة التالية",
  "review.cardLabel": "بطاقة {{current}} من {{total}}",
  "review.pageLabel": "الصفحة {{page}}",
  "review.pageErrorCount": "{{count}} خطأ في هذه الصفحة",
  "review.revealProgress": "{{count}} / {{total}} أخطاء مكشوفة",
  "review.revealNextHelp": "اضغط على تحقق لكشف الخطأ التالي في الصفحة نفسها.",
  "review.revealDoneHelp": "كل أخطاء الصفحة أصبحت مكشوفة. قيّمها الآن واحدا واحدا.",
  "review.revealDoneButton": "تم كشف الكل",
  "review.answerCurrentHelp": "يمكنك تقييم هذا الخطأ الآن، ثم الضغط على تحقق للخطأ التالي.",
  "review.nextPagePeek": "بداية الصفحة {{page}}",
  "review.scopeLabel": "النوع",
  "review.noteLabel": "ملاحظة",
  "review.noteEmpty": "بلا ملاحظة",
  "review.swipeHelp": "اسحب إلى اليمين إذا أصبت، وإلى اليسار إذا أخطأت.",
  "review.revealHelp": "اكشف الموضع أولا لترى هل تذكرته بشكل صحيح.",
  "review.revealButton": "تحقق",
  "review.hideButton": "أخف القناع",
  "review.successButton": "صحيح",
  "review.failureButton": "خطأ",
  "review.successToast": "تمت مراجعة الخطأ بنجاح.",
  "review.failureToast": "سيعود هذا الخطأ أسرع للمراجعة.",
  "editor.eyebrow": "الصفحة الحقيقية",
  "editor.title": "حدد موضع الخطأ",
  "editor.help": "اسحب على الصفحة لتحديد المكان بدقة، ثم اختر نوع الخطأ.",
  "editor.scopeLabel": "نوع الخطأ",
  "editor.scope.harakah": "حركات",
  "editor.scope.word": "كلمة",
  "editor.scope.line": "سطر كامل",
  "editor.scope.next-page-link": "نسيان الربط بالصفحة التالية",
  "editor.noteLabel": "ملاحظة اختيارية",
  "editor.notePlaceholder": "مثال: تردد في وسط السطر...",
  "editor.selectionEmpty": "لا توجد منطقة محددة حاليا.",
    "editor.selectionReady": "المنطقة جاهزة للحفظ.",
    "editor.selectionAutoLink": "هذا النوع لا يحتاج إلى تحديد يدوي.",
    "editor.selectionAutoLinkUsed": "سيتم عرض أول 3 أسطر من الصفحة التالية عند المراجعة.",
    "editor.touchSelectionHint": "على الجوال اضغط ضغطا مطولا على الصفحة لبدء التحديد، وإلا فسيقوم السحب فقط بتمرير النافذة.",
    "editor.save": "حفظ الخطأ",
  "editor.cancel": "إغلاق",
  "editor.clearSelection": "مسح التحديد",
  "editor.deleteError": "حذف",
  "editor.recentLabel": "أخطاء موجودة في هذه الصفحة",
  "editor.recentEmpty": "لا يوجد خطأ محفوظ في هذه الصفحة بعد.",
  "editor.openFromInspector": "فتح الصفحة الحقيقية",
  "surahs.playModeLabel": "وضع اللعب",
  "surahs.playModeQuiz": "قبل / بعد",
  "surahs.playModeQuizHint": "اختر السورة الصحيحة قبلها أو بعدها.",
  "surahs.playModeMemory": "حفظ الترتيب",
  "surahs.playModeMemoryHint": "احفظ 7 سور ثم أعد ترتيبها.",
  "surahs.playButton": "ابدأ",
  "surahs.readyTitle": "كل شيء جاهز",
  "surahs.readyHelpQuiz": "ابدأ جولة سريعة لاختبار ترتيب السور في المجال الذي اخترته.",
  "surahs.readyHelpMemory": "ابدأ جولة لحفظ ترتيب 7 سور ثم إعادة ترتيبها.",
  "surahs.settingsCompactLabel": "الاعدادات",
  "surahs.settingsToggle": "وضع اللعب ومجاله",
  "surahs.rangeLabel": "مجال اللعب",
  "surahs.rangeHint": "اختر مجال السور الذي تريد اللعب عليه.",
  "surahs.rangeFrom": "من",
  "surahs.rangeTo": "إلى",
  "surahs.rangeQuickAll": "كل السور",
  "surahs.activeSpanLabel": "المجال النشط",
  "surahs.activeSpanAll": "كل القرآن",
  "surahs.countLabel": "العدد",
  "surahs.countValue": "{{count}} سورة",
  "surahs.coverageLabel": "يغطي",
  "surahs.coverageEmpty": "لا توجد سورة في هذا المجال.",
  "surahs.statsScore": "الصحيح",
  "surahs.statsAnswered": "المجاب",
  "surahs.statsStreak": "السلسلة",
  "surahs.statsBestStreak": "أفضل سلسلة",
  "surahs.statsAccuracy": "الدقة",
  "surahs.heatLabel": "الزخم",
  "surahs.heatCalm": "بداية هادئة",
  "surahs.heatWarm": "يبدأ يسخن",
  "surahs.heatFire": "مشتعل",
  "surahs.heatBlazing": "لهيب قوي",
  "surahs.heatLegend": "أسطوري",
  "surahs.heatNext": "بقي {{count}} للوصول إلى المستوى التالي",
  "surahs.heatMax": "أنت في أعلى مستوى.",
  "surahs.streakValue": "سلسلة {{count}}",
  "surahs.accuracyValue": "{{count}}٪",
  "surahs.milestoneToast": "وصلت إلى {{label}}.",
  "surahs.restart": "إعادة",
  "surahs.promptNext": "ما السورة التالية؟",
  "surahs.promptPrevious": "ما السورة السابقة؟",
  "surahs.answerLabel": "اختر الجواب الصحيح",
  "surahs.feedbackCorrect": "أحسنت، هذا هو الجواب الصحيح.",
  "surahs.feedbackWrong": "ليس تماما. الجواب الصحيح هو {{name}}.",
  "surahs.sequenceLabel": "التسلسل",
  "surahs.nextQuestion": "السؤال التالي",
  "surahs.memoryPreviewTitle": "احفظ هذا الترتيب",
  "surahs.memoryPreviewHelp": "تأمل السور السبع جيدا قبل أن تختفي.",
  "surahs.memoryCountdownLabel": "الوقت المتبقي",
  "surahs.memoryCountdownValue": "{{count}} ث",
  "surahs.memoryPreviewSkip": "أظهر البطاقات الآن",
  "surahs.memoryReorderTitle": "أعد ترتيب السور",
  "surahs.memoryReorderHelp": "اضغط على البطاقات لتعيدها إلى الترتيب الصحيح.",
  "surahs.memorySelectedLabel": "ما اخترته",
  "surahs.memoryRemainingLabel": "البطاقات المتبقية",
  "surahs.memoryRemove": "إزالة",
  "surahs.memoryClear": "مسح",
  "surahs.memoryReplay": "إعادة المشاهدة",
  "surahs.memoryNewRound": "جولة جديدة",
  "surahs.memoryCorrect": "الترتيب صحيح تماما.",
  "surahs.memoryWrong": "ليس هذا هو الترتيب الصحيح بعد.",
  "surahs.memoryRemainingDone": "تم اختيار كل البطاقات.",
  "surahs.memoryAnswerProgress": "{{count}} / {{total}} في الترتيب",
  "surahs.emptyMemoryTitle": "المجال صغير جدا",
  "surahs.emptyMemoryHelp": "اختر مجالا أكبر لتتوفر 7 سور على الأقل.",
  "surahs.emptyRangeTitle": "المجال لا يكفي",
  "surahs.emptyRangeHelp": "اختر مجالا أوسع حتى يصبح اللعب ممكنا.",
  "surahs.emptyAllTitle": "لا توجد جولة الآن",
  "surahs.emptyAllHelp": "وسّع المجال أو ارجع إلى كل السور.",
  "surahs.currentLabel": "السورة الحالية",
  "surahs.pagesLabel": "الصفحات",
  "surahs.flamesLabel": "لهب",
  "legend.noneTitle": "محايدة",
  "legend.noneHelp": "لا يوجد خطأ مسجل.",
  "legend.minorTitle": "خفيف",
  "legend.minorHelp": "حركة أو تصحيح بسيط.",
  "legend.mediumTitle": "متوسط",
  "legend.mediumHelp": "خطأ في كلمة أو تردد أوضح.",
  "legend.graveTitle": "شديد",
  "legend.graveHelp": "نسيان أو توقف أو كسر كبير.",
  "legend.learnedTitle": "محفوظة",
  "legend.learnedHelp": "صفحة محفوظة حتى من دون خطأ.",
  "settings.identityLabel": "الهوية",
  "settings.identityTitle": "من الذي يحفظ؟",
  "settings.identityHelp": "يكفي إدخال الاسم ولغة الواجهة.",
  "settings.progressLabel": "التقدم",
  "settings.progressTitle": "أين وصلت اليوم؟",
  "settings.progressHelp": "حدد اتجاه البرنامج والمرحلة الحالية ثم الموضع الذي يجب أن تستأنف منه الخطة.",
  "settings.programModeLabel": "المسار",
  "settings.programModeForwardOption": "من البداية إلى النهاية",
  "settings.programModeReverseOption": "من النهاية إلى البداية",
  "settings.programModeReverseForwardOption": "من النهاية إلى البداية ثم من البداية إلى النهاية",
  "settings.phaseLabel": "المرحلة الحالية",
  "settings.phaseSingleOption": "مرحلة واحدة - {{direction}}",
  "settings.phaseReverseOption": "المرحلة 1 - النهاية إلى البداية",
  "settings.phaseForwardOption": "المرحلة 2 - البداية إلى النهاية",
  "settings.phaseCoveredLabel": "الصفحات المغطاة",
  "settings.phaseCoveredHelp": "يمكنك كتابة 0.5 إذا كنت في نصف صفحة.",
  "settings.phaseNextLabel": "الموضع التالي",
  "settings.phaseStatusLabel": "الحالة",
  "settings.phaseStatusActive": "جارية",
  "settings.phaseStatusDone": "مكتملة",
  "settings.phaseAutoHelp": "يمكن للمرحلتين أن تتقدما معا. اختر فقط أي مرحلة تريد إظهارها في خطة اليوم.",
  "settings.phaseDisplayLabel": "الخطة المعروضة",
  "settings.phaseDisplayButton": "اعرض هذه المرحلة",
  "settings.phaseDisplayActive": "هذه هي المرحلة المعروضة",
  "settings.rhythmLabel": "الوتيرة",
  "settings.rhythmTitle": "ما الوتيرة التي تريدها؟",
  "settings.rhythmHelp": "اختر فقط مقدار الجديد اليومي. المصحف المتابع ثابت على 604 صفحات.",
    "settings.currentPageLabel": "الصفحة الحالية",
    "settings.currentHalfLabel": "نصف الصفحة الحالي",
    "settings.lineLabel": "السطر",
  "settings.upperHalfOption": "الأعلى",
  "settings.lowerHalfOption": "الأسفل",
    "settings.dailyNewLabel": "الجديد في اليوم (صفحات)",
  "settings.programDayLabel": "يوم البرنامج",
  "settings.submitButton": "حفظ الإعدادات وإعادة حساب اليوم",
  "settings.submitHelp": "احفظ الإعدادات لتحديث خطة اليوم.",
  "summary.progress": "التقدم",
  "summary.learned": "{{count}} محفوظة",
  "summary.totalPages": "{{count}} صفحة إجمالا",
  "summary.phase": "المرحلة",
  "summary.day": "اليوم",
  "summary.currentPoint": "الموضع الحالي",
  "summary.dailyNew": "الجديد / اليوم",
  "day.completeTitle": "اليوم مكتمل.",
  "day.completeHelper": "{{done}} / {{total}} كتل تم التحقق منها، ويمكن للبرنامج أن ينتقل.",
  "day.completeText": "يمكنك الانتقال إلى اليوم التالي. ستتم إعادة حساب خطة الغد تلقائيا.",
  "day.skippedTitle": "أغلق اليوم من دون جديد.",
  "day.skippedHelper": "{{done}} / {{total}} من كتل اليوم مغلقة، لكن موضع الجديد لم يتقدم.",
  "day.skippedText": "أنهيت اليوم من دون تقدم في الحفظ الجديد. سيبقى البرنامج في الموضع نفسه.",
  "day.openTitle": "اليوم ما زال مفتوحا.",
  "day.openHelper": "{{done}} / {{total}} كتل تم التحقق منها اليوم.",
  "day.remaining": "المتبقي للتحقق: {{items}}.",
  "errorSummary.pagesWithErrors": "صفحات فيها أخطاء",
  "errorSummary.pagesWithErrorsHelp": "صفحات هشة من أصل {{total}}.",
  "errorSummary.learnedPages": "صفحات محفوظة",
  "errorSummary.learnedPagesHelp": "يشمل ذلك التعليم التلقائي بحسب المسار النشط.",
  "errorSummary.minor": "خفيف",
  "errorSummary.minorHelp": "مرات أخطاء الحركات.",
  "errorSummary.medium": "متوسط",
  "errorSummary.mediumHelp": "مرات أخطاء الكلمات.",
  "errorSummary.grave": "شديد",
  "errorSummary.graveHelp": "مرات التوقف أو النسيان.",
  "page.neutral": "محايدة",
  "page.minor": "خفيف",
  "page.medium": "متوسط",
  "page.grave": "شديد",
  "page.learned": "محفوظة",
  "page.learnedWithSeverity": "محفوظة - {{severity}}",
  "page.learnedBadge": "ح",
  "count.minor": "خ",
  "count.medium": "م",
  "count.grave": "ش",
  "page.label": "الصفحة {{page}}",
  "program.old": "القديم",
  "program.oldShort": "قديم",
  "program.oldDef": "كل ما قبل J-30.",
  "program.oldToday": "القديم اليوم",
  "program.oldTodayShort": "قديم اليوم",
  "program.oldTodayDef": "جزء القديم المطلوب اليوم.",
  "program.consolidation": "التثبيت",
  "program.consolidationShort": "تثبيت",
  "program.consolidationDef": "كل ما بين J-8 و J-30.",
  "program.recent": "القريب",
  "program.recentShort": "قريب",
  "program.recentDef": "كل ما بين J-1 و J-7.",
  "program.yesterday": "الأمس",
  "program.yesterdayShort": "أمس",
  "program.yesterdayDef": "الكتلة المحفوظة أمس، J-1.",
  "program.new": "الجديد",
  "program.newShort": "جديد",
  "program.newDef": "الكتلة التي ستتعلمها اليوم.",
  "toast.pageSelected": "تم اختيار الصفحة {{page}}.",
  "toast.pageClosed": "تم إغلاق الصفحة {{page}}.",
  "toast.errorAdded": "تمت إضافة خطأ {{severity}} إلى الصفحة {{page}}.",
  "toast.errorDeleted": "تم حذف الخطأ من الصفحة {{page}}.",
  "toast.errorsCleared": "تم حذف أخطاء الصفحة {{page}}.",
  "toast.dayRecalculated": "تمت إعادة حساب اليوم.",
  "toast.dayReset": "تمت إعادة ضبط تحقق اليوم.",
  "toast.nextDay": "تم الانتقال إلى اليوم التالي.",
  "toast.skipMemorizationDay": "أغلق اليوم من دون حفظ جديد.",
  "toast.networkError": "خطأ في الشبكة.",
  "toast.offlineMode": "الوضع غير المتصل مفعل. يستخدم Dabt الذاكرة المحلية.",
  "toast.backOnline": "عادت الشبكة.",
  "toast.snapshotMode": "لا يوجد اتصال. يعرض Dabt آخر حالة محلية متاحة.",
  "toast.appInstalled": "تم تثبيت Dabt على هذا الجهاز.",
  "error.invalidPageFormat": "تنسيق الصفحات غير صالح.",
  "error.invalidPageFormatExample": "تنسيق الصفحات غير صالح. استعمل 12، 14، 20-25.",
  "error.pageOutOfRange": "إحدى الصفحات خارج النطاق.",
  "error.selectPageFirst": "اختر صفحة أولا.",
  "hero.markerText": "الهدف هو إكمال مراجعة القديم كل 7 أيام، والتثبيت كل 3 أيام، ثم مراجعة القريب، ثم الأمس، ثم تعلم الجديد.",
  "onboarding.today.title": 'قسم "اليوم" يوجهك خطوة بخطوة',
  "onboarding.today.body": 'قسم "اليوم" ينظم يومك بمنطق التكرار المتباعد: ماذا تقرأ الآن، بأي ترتيب تتقدم، ومتى تثبت كل كتلة.',
  "onboarding.pages.title": 'قسم "الصفحات" يعطيك نظرة شاملة على المصحف',
  "onboarding.pages.body": 'قسم "الصفحات" يسمح لك بفتح الصفحة الحقيقية من القرآن، تحديد الخطأ بدقة، ثم متابعة حالتك صفحة صفحة وجزءا جزءا.',
  "onboarding.review.title": 'قسم "مراجعة الاخطاء" يعيد المناطق الضعيفة',
  "onboarding.review.body": 'قسم "مراجعة الاخطاء" يستخدم التكرار المتباعد مع FSRS ليعيد كل خطأ في أفضل وقت بحسب إجاباتك.',
  "onboarding.surahs.title": 'قسم "اللعبة" يثبت ترتيب السور',
  "onboarding.surahs.body": 'قسم "اللعبة" يقدم لك طريقتين للتدريب: معرفة السورة التالية أو ترتيب سلسلة قصيرة بالشكل الصحيح.',
  "review.mask.harakah": "",
  "review.mask.word": "",
  "review.mask.line": "",
  "review.mask.next-page-link": "",
  "settings.previewLabel": "المعاينة",
  "settings.previewTitle": "ما الذي ستنتجه الخطة",
  "settings.previewHelp": "يتحدث هذا الملخص حسب حالة البرنامج الحالية.",
  "settings.previewPath": "الاتجاه النشط",
  "settings.previewPhase": "المرحلة",
  "settings.previewCurrent": "الموضع الحالي",
  "settings.previewNew": "جديد اليوم",
  "settings.previewOld": "قديم اليوم",
  "settings.previewConsolidation": "التثبيت",
  "settings.previewRecent": "القريب",
  "settings.previewProgramDay": "يوم البرنامج",
  "settings.previewTotal": "المصحف المتابع",
  "settings.previewMissing": "لا توجد كتلة لهذا المجال اليوم.",
  "settings.totalHalfPagesLabel": "إجمالي أنصاف الصفحات",
  "route.status.notRequired": "غير مطلوب",
  "route.status.done": "تم",
  "route.status.focus": "الآن",
  "route.status.waiting": "بانتظارك",
  "status.unavailable": "غير متاح",
  "status.done": "تم",
  "status.locked": "مقفل",
  "status.pending": "قيد الانتظار",
  "lockNote": "اقفل هذا الجزء حتى تنتهي مما قبله.",
  "emptyNote": "لا شيء هنا حاليا.",
  "meta.range": "المجال",
  "meta.size": "الحجم",
  "meta.surahs": "السور",
  "card.expand": "فتح",
  "card.collapse": "طي",
  "toggle.undo": "إلغاء التحقق",
  "toggle.validate": "تحقق",
  "card.old.pool": "مجموعة القديم",
  "card.old.rotation": "الدورة الكاملة: {{count}} جزءا متوازنا على كل القديم الأقدم من 30 يوما.",
  "card.consolidation.noRange": "لا يوجد مجال",
  "card.consolidation.active": "الجزء النشط اليوم",
  "card.consolidation.inactive": "جزء غير نشط اليوم",
  "card.consolidation.concerned": "الجزء المعني: مراجعة آخر 30 يوما ضمن المجال من J-8 إلى J-30.",
  "card.consolidation.activeToday": "الجزء النشط اليوم: {{part}}",
  "card.consolidation.blockToValidate": "الكتلة المطلوب التحقق منها: {{block}}",
  "card.new.morning": "صباحا",
  "card.new.noon": "ظهرا",
  "card.new.evening": "مساء",
  "card.new.inProgress": "جار",
  "card.new.complete": "مكتمل",
  "card.new.checked": "المراجعات المكتملة: {{count}} / 9",
  "card.new.rule": "القاعدة: يجب إكمال 9 خانات لإغلاق الجديد اليوم.",
  "card.new.locked": "مقفل: تحقق من {{items}} أولا.",
  "hero.genericName": "",
  "quick.noneLabel": "المعاين",
  "quick.noneTitle": "لا توجد صفحة محددة",
  "quick.noneHelp": "اضغط صفحة من الشبكة لرؤية سياقها وأخطائها وملاحظاتها.",
  "quick.title": "المعاين",
  "quick.close": "إغلاق",
  "quick.pageTitle": "الصفحة {{page}}",
  "quick.help": "راجع حالة الصفحة وتاريخها، ثم افتح الصفحة الحقيقية لتحديد خطأ دقيق.",
  "quick.stateLabel": "الحالة الحالية",
  "quick.surahLabel": "السور",
  "quick.surahEmpty": "لم يتم التعرف على سورة لهذه الصفحة.",
  "quick.zoneLabel": "منطقة البرنامج",
  "quick.zoneEmpty": "لا توجد منطقة برنامج معلمة اليوم.",
  "quick.countsLabel": "العدادات",
  "quick.lastNoteLabel": "آخر ملاحظة",
  "quick.lastNoteEmpty": "لا توجد ملاحظة محفوظة لهذه الصفحة بعد.",
  "quick.noteLabel": "ملاحظة الخطأ",
  "quick.notePlaceholder": "مثال: خلط مع صفحة قريبة، توقف في الوسط...",
  "quick.noteHelp": "الأخطاء الجديدة توضع الآن مباشرة على صفحة المصحف الحقيقية.",
  "quick.historyLabel": "السجل الحديث",
  "quick.historyEmpty": "لا يوجد خطأ مسجل بعد.",
  "quick.historyNoNote": "بلا ملاحظة",
  "quick.reviewDueLabel": "مستحق",
  "quick.minor": "خفيف",
  "quick.minorHelp": "حركة أو تصحيح خفيف",
  "quick.medium": "متوسط",
  "quick.mediumHelp": "خطأ على مستوى الكلمة",
  "quick.grave": "شديد",
  "quick.graveHelp": "توقف أو نسيان",
  "quick.clear": "مسح",
  "quick.clearHelp": "حذف الأخطاء والملاحظات",
  "quick.openEditor": "فتح الصفحة الحقيقية",
  "part.label": "الجزء {{number}}",
};
I18N.ar = { ...I18N.ar, ...AR_I18N_PATCH };

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderUiRichText(value = "") {
  return escapeHtml(value).replace(/\[\[(.+?)\]\]/g, '<span class="ui-emphasis">$1</span>');
}

function getLanguage(payload = state.payload) {
  if (payload?.settings?.language === "en") {
    return "en";
  }
  if (payload?.settings?.language === "ar") {
    return "ar";
  }
  return "fr";
}

function interpolate(template, variables = {}) {
  return String(template).replace(/\{\{(\w+)\}\}/g, (_match, key) => String(variables[key] ?? ""));
}

function t(key, variables = {}, payload = state.payload) {
  const language = getLanguage(payload);
  const dictionary = I18N[language] || I18N.fr;
  const fallback = I18N.fr[key] || key;
  return interpolate(dictionary[key] || fallback, variables);
}

function isMobileViewport() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 720px)").matches;
}

function isCoarsePointerDevice() {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

function isNativeAppRuntime() {
  try {
    if (window.Capacitor && typeof window.Capacitor.isNativePlatform === "function") {
      return Boolean(window.Capacitor.isNativePlatform());
    }

    const protocol = String(window.location?.protocol || "").toLowerCase();
    const host = String(window.location?.host || "").toLowerCase();
    return protocol === "capacitor:" || protocol === "ionic:" || (host === "localhost" && Boolean(window.Capacitor));
  } catch (_error) {
    return false;
  }
}

function normalizeNotificationTime(value, fallback = "09:00") {
  const match = String(value || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return fallback;
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return fallback;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getDefaultNotificationPreferences() {
  return {
    enabled: false,
    reminders: {
      review: { enabled: true, time: "07:30" },
      newMorning: { enabled: true, time: "09:00" },
      newNoon: { enabled: true, time: "13:00" },
      newEvening: { enabled: true, time: "20:00" },
    },
  };
}

function getNotificationPreferences(payload = state.payload) {
  const fallback = getDefaultNotificationPreferences();
  const source = payload?.preferences?.notifications || {};
  const reminders = source.reminders || {};

  return {
    enabled: Boolean(source.enabled),
    reminders: {
      review: {
        enabled: typeof reminders.review?.enabled === "boolean" ? reminders.review.enabled : fallback.reminders.review.enabled,
        time: normalizeNotificationTime(reminders.review?.time, fallback.reminders.review.time),
      },
      newMorning: {
        enabled:
          typeof reminders.newMorning?.enabled === "boolean"
            ? reminders.newMorning.enabled
            : fallback.reminders.newMorning.enabled,
        time: normalizeNotificationTime(reminders.newMorning?.time, fallback.reminders.newMorning.time),
      },
      newNoon: {
        enabled: typeof reminders.newNoon?.enabled === "boolean" ? reminders.newNoon.enabled : fallback.reminders.newNoon.enabled,
        time: normalizeNotificationTime(reminders.newNoon?.time, fallback.reminders.newNoon.time),
      },
      newEvening: {
        enabled:
          typeof reminders.newEvening?.enabled === "boolean"
            ? reminders.newEvening.enabled
            : fallback.reminders.newEvening.enabled,
        time: normalizeNotificationTime(reminders.newEvening?.time, fallback.reminders.newEvening.time),
      },
    },
  };
}

function getNotificationsBridge() {
  return window.dabtBrowserLocalApi?.notifications || null;
}

function parseDateKey(dateKey) {
  const match = String(dateKey || "")
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateKey(dateKey, payload = state.payload, options = {}) {
  const date = parseDateKey(dateKey);
  if (!date) {
    return "";
  }

  const locale = getLanguage(payload) === "en" ? "en-GB" : getLanguage(payload) === "ar" ? "ar" : "fr-FR";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    ...options,
  }).format(date);
}

function formatTimeValue(timeValue, payload = state.payload) {
  const safeTime = normalizeNotificationTime(timeValue, "09:00");
  const [hours, minutes] = safeTime.split(":").map((value) => Number.parseInt(value, 10));
  const sample = new Date();
  sample.setHours(hours, minutes, 0, 0);
  const locale = getLanguage(payload) === "en" ? "en-GB" : getLanguage(payload) === "ar" ? "ar" : "fr-FR";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(sample);
}

function formatTimestampTime(value, payload = state.payload) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) {
    return formatTimeValue(value, payload);
  }

  const locale = getLanguage(payload) === "en" ? "en-GB" : getLanguage(payload) === "ar" ? "ar" : "fr-FR";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getReviewReminderItems(payload = state.payload) {
  const blocks = payload?.plan?.blocks || {};
  return ["old", "consolidation", "recent", "yesterday"]
    .filter((key) => blocks[key]?.present)
    .map((key) => blocks[key]?.title)
    .filter(Boolean);
}

function buildNotificationSchedulePayload(payload = state.payload, options = {}) {
  const preferences = getNotificationPreferences(payload);
  const reminders = [];
  const newRangeLabel =
    payload?.plan?.blocks?.new?.range?.label || payload?.plan?.summary?.dailyNewLabel || t("route.newTitle", {}, payload);
  const reviewItems = getReviewReminderItems(payload);

  reminders.push({
    key: "review",
    enabled: preferences.reminders.review.enabled,
    time: preferences.reminders.review.time,
    title: t("notifications.reminder.review.title", {}, payload),
    body: t(
      reviewItems.length ? "notifications.reminder.review.body" : "notifications.reminder.review.empty",
      { items: reviewItems.join(", ") },
      payload,
    ),
  });

  if (payload?.plan?.blocks?.new?.present) {
    reminders.push(
      {
        key: "newMorning",
        enabled: preferences.reminders.newMorning.enabled,
        time: preferences.reminders.newMorning.time,
        title: t("notifications.reminder.morning.title", {}, payload),
        body: t("notifications.reminder.morning.body", { range: newRangeLabel }, payload),
      },
      {
        key: "newNoon",
        enabled: preferences.reminders.newNoon.enabled,
        time: preferences.reminders.newNoon.time,
        title: t("notifications.reminder.noon.title", {}, payload),
        body: t("notifications.reminder.noon.body", { range: newRangeLabel }, payload),
      },
      {
        key: "newEvening",
        enabled: preferences.reminders.newEvening.enabled,
        time: preferences.reminders.newEvening.time,
        title: t("notifications.reminder.evening.title", {}, payload),
        body: t("notifications.reminder.evening.body", { range: newRangeLabel }, payload),
      },
    );
  }

  return {
    enabled: preferences.enabled,
    requestPermission: Boolean(options.requestPermission),
    reminders,
  };
}

function getNotificationStatusText(payload = state.payload) {
  const runtime = state.notificationsRuntime || {};
  const preferences = getNotificationPreferences(payload);
  if (!runtime.native) {
    return t("settings.notificationsStatusUnsupported", {}, payload);
  }

  if (!preferences.enabled) {
    return t("settings.notificationsStatusDisabled", {}, payload);
  }

  if (runtime.display !== "granted") {
    return t("settings.notificationsStatusPermissionDenied", {}, payload);
  }

  let message = t(
    "settings.notificationsStatusScheduled",
    { count: runtime.scheduledCount || runtime.pendingCount || 0 },
    payload,
  );
  if (runtime.exactAlarm && runtime.exactAlarm !== "granted") {
    message += ` ${t("settings.notificationsStatusExactAlarm", {}, payload)}`;
  }
  return message;
}

function renderNotificationRuntimeStatus(payload = state.payload) {
  const runtimeNode = $("#notification-runtime-status");
  if (!runtimeNode) {
    return;
  }

  runtimeNode.textContent = getNotificationStatusText(payload);
}

async function refreshNotificationStatus(payload = state.payload, options = {}) {
  const bridge = getNotificationsBridge();

  if (!bridge) {
    state.notificationsRuntime = {
      supported: false,
      native: false,
      display: "prompt",
      exactAlarm: "prompt",
      pendingCount: 0,
      synced: false,
      scheduledCount: 0,
      reason: "unsupported",
    };
    renderNotificationRuntimeStatus(payload);
    return state.notificationsRuntime;
  }

  try {
    const result = options.sync
      ? await bridge.sync(buildNotificationSchedulePayload(payload, { requestPermission: options.requestPermission }))
      : await bridge.getStatus();
    state.notificationsRuntime = {
      ...state.notificationsRuntime,
      ...result,
    };
  } catch (error) {
    if (!options.silent) {
      showToast(error.message || t("toast.networkError", {}, payload), true);
    }
  }

  renderNotificationRuntimeStatus(payload);
  return state.notificationsRuntime;
}

function syncNotificationFormState() {
  const masterEnabled = Boolean($("#notifications-enabled")?.checked);
  const reminderPairs = [
    ["#notification-review-enabled", "#notification-review-time"],
    ["#notification-morning-enabled", "#notification-morning-time"],
    ["#notification-noon-enabled", "#notification-noon-time"],
    ["#notification-evening-enabled", "#notification-evening-time"],
  ];

  reminderPairs.forEach(([toggleSelector, timeSelector]) => {
    const toggle = $(toggleSelector);
    const timeInput = $(timeSelector);
    const card = timeInput?.closest(".notification-reminder-card");
    const reminderEnabled = Boolean(toggle?.checked);

    if (timeInput) {
      timeInput.disabled = !masterEnabled || !reminderEnabled;
    }

    card?.classList.toggle("is-disabled", !masterEnabled || !reminderEnabled);
  });
}

function readOnboardingSeen() {
  try {
    return window.localStorage?.getItem(getOnboardingStorageKey()) === "seen";
  } catch (_error) {
    return false;
  }
}

function markOnboardingSeen() {
  try {
    window.localStorage?.setItem(getOnboardingStorageKey(), "seen");
  } catch (_error) {
    // Ignore storage failures and continue.
  }
  state.onboarding.hasSeen = true;
}

function updateOnboardingVisibility(force = false) {
  const shouldOpen = !state.onboarding.hasSeen && (isMobileViewport() || isNativeAppRuntime());
  if (shouldOpen || force) {
    state.onboarding.open = shouldOpen;
    if (!shouldOpen) {
      state.onboarding.stepIndex = 0;
    }
  }
}

function localizeStaticUi(payload = state.payload) {
  const language = getLanguage(payload);
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.body.classList.toggle("is-rtl", language === "ar");

  if (state.lastLocalizedLanguage === language) {
    return;
  }
  state.lastLocalizedLanguage = language;

  $all("[data-i18n]").forEach((node) => {
    const nestedLabel = node.querySelector(".section-tab-label");
    if (nestedLabel) {
      nestedLabel.innerHTML = renderUiRichText(t(node.dataset.i18n, {}, payload));
      return;
    }
    node.innerHTML = renderUiRichText(t(node.dataset.i18n, {}, payload));
  });

  $all("[data-i18n-placeholder]").forEach((node) => {
    node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder, {}, payload));
  });

  $all("[data-i18n-option]").forEach((node) => {
    node.textContent = t(node.dataset.i18nOption, {}, payload);
  });
}

function getMushafPageImageUrl(page) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  return `${MUSHAF_PAGE_IMAGE_BASE}/p${String(safePage).padStart(4, "0")}.gif`;
}

async function ensureUthmanicFont() {
  if (loadedMushafFonts.has("UthmanicHafs")) {
    return "UthmanicHafs";
  }

  if (!uthmanicFontPromise) {
    uthmanicFontPromise = (async () => {
      const fontFace = new FontFace(
        "UthmanicHafs",
        `url('${MUSHAF_FONT_BASE}/hafs/uthmanic_hafs/UthmanicHafs1Ver18.woff2')`,
      );
      fontFace.display = "swap";
      await fontFace.load();
      document.fonts.add(fontFace);
      loadedMushafFonts.add("UthmanicHafs");
      return "UthmanicHafs";
    })().catch((error) => {
      uthmanicFontPromise = null;
      throw error;
    });
  }

  return uthmanicFontPromise;
}

async function ensureMushafPageFont(page) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const fontName = `mushaf-p${safePage}-v2`;
  if (loadedMushafFonts.has(fontName)) {
    return fontName;
  }

  const fontFace = new FontFace(
    fontName,
    `url('${MUSHAF_FONT_BASE}/hafs/v2/woff2/p${safePage}.woff2')`,
  );
  fontFace.display = "swap";
  await fontFace.load();
  document.fonts.add(fontFace);
  loadedMushafFonts.add(fontName);
  return fontName;
}

function rerenderMushafSurfaces() {
  if (mushafSurfacesRenderQueued) {
    return;
  }

  mushafSurfacesRenderQueued = true;
  window.requestAnimationFrame(() => {
    mushafSurfacesRenderQueued = false;
    if (state.pageEditor.open) {
      refreshPageEditorSurface(state.payload);
    }
    if (state.activeView === "review") {
      renderErrorReview(state.payload);
      bindErrorReviewActions();
    }
  });
}

function normalizeMushafWord(rawWord, fallbackPage) {
  if (!rawWord || typeof rawWord !== "object") {
    return null;
  }

  return {
    id: Number(rawWord.id || 0),
    pageNumber: Number(rawWord.page_number || fallbackPage || 0),
    lineNumber: Math.max(1, Number(rawWord.line_number || 1)),
    charTypeName: String(rawWord.char_type_name || "word"),
    codeV2: String(rawWord.code_v2 || rawWord.text || ""),
    fallbackText: String(rawWord.text_qpc_hafs || rawWord.text_uthmani || rawWord.text || "").trim(),
  };
}

function groupMushafWordsByLine(verses, page) {
  const lines = new Map();

  verses.forEach((verse) => {
    (verse.words || []).forEach((rawWord) => {
      const word = normalizeMushafWord(rawWord, page);
      if (!word) {
        return;
      }
      const lineNumber = word.lineNumber;
      if (!lines.has(lineNumber)) {
        lines.set(lineNumber, []);
      }
      lines.get(lineNumber).push(word);
    });
  });

  const maxLine = Math.max(15, ...lines.keys(), 15);
  return Array.from({ length: maxLine }, (_item, index) => ({
    number: index + 1,
    words: lines.get(index + 1) || [],
  }));
}

function ensureMushafPageData(page) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const key = String(safePage);
  const cached = state.mushafPageCache[key];
  if (cached?.status === "ready" || cached?.status === "loading") {
    return cached;
  }

  state.mushafPageCache[key] = {
    status: "loading",
    lines: [],
    page: safePage,
    fontName: "",
    error: "",
  };

  Promise.all([
    ensureUthmanicFont(),
    ensureMushafPageFont(safePage),
    api(`${MUSHAF_API_BASE}/verses/by_page/${safePage}?words=true&word_fields=code_v2,text_qpc_hafs&per_page=50&mushaf=1`),
  ])
    .then(([_unicodeFont, fontName, data]) => {
      const lines = groupMushafWordsByLine(Array.isArray(data?.verses) ? data.verses : [], safePage);
      state.mushafPageCache[key] = {
        status: "ready",
        lines,
        page: safePage,
        fontName,
        error: "",
      };
      rerenderMushafSurfaces();
    })
    .catch((error) => {
      state.mushafPageCache[key] = {
        status: "error",
        lines: [],
        page: safePage,
        fontName: "",
        error: error?.message || "Unable to load mushaf page.",
      };
      rerenderMushafSurfaces();
    });

  return state.mushafPageCache[key];
}

function prefetchMushafPages(pages = []) {
  pages.forEach((page) => {
    const safePage = Math.max(1, Number.parseInt(page, 10) || 0);
    if (!safePage || safePage > MUSHAF_TOTAL_PAGES) {
      return;
    }

    ensureMushafPageData(safePage);
  });
}

function buildMushafWordMarkup(word, fontName) {
  if (!word) {
    return "";
  }

  if (word.charTypeName === "end" || word.charTypeName === "pause" || word.charTypeName === "rub-el-hizb" || !fontName) {
    return `<span class="mushaf-word unicode">${escapeHtml(word.fallbackText)}</span>`;
  }

  const selectableAttributes =
    word.charTypeName === "word"
      ? ` data-selectable-word="true" data-word-id="${escapeHtml(word.id)}" data-line-number="${escapeHtml(word.lineNumber)}"`
      : "";

  return `<span class="mushaf-word glyph" style="font-family:'${escapeHtml(fontName)}'"${selectableAttributes}>${word.codeV2}</span>`;
}

function buildMushafPageMarkup(page, { blurred = false } = {}) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const entry = ensureMushafPageData(safePage);

  if (!entry || entry.status === "loading") {
    return `
      <div class="mushaf-page-shell ${blurred ? "blurred" : ""}">
        <div class="mushaf-loading">${escapeHtml(t("status.loading", {}, state.payload))}</div>
      </div>
    `;
  }

  if (entry.status === "error") {
    return `
      <div class="mushaf-page-shell ${blurred ? "blurred" : ""}">
        <div class="mushaf-loading">${escapeHtml(entry.error || t("toast.networkError", {}, state.payload))}</div>
      </div>
    `;
  }

  return `
    <div class="mushaf-page-shell ${blurred ? "blurred" : ""}" dir="rtl">
      <div class="mushaf-page-header">
        <span>${escapeHtml(t("quick.pageTitle", { page: safePage }, state.payload))}</span>
      </div>
      <div class="mushaf-page-lines">
        ${entry.lines
          .map(
            (line) => `
              <div class="mushaf-line ${line.words.length ? "" : "empty"}" data-line-number="${escapeHtml(line.number)}">
                ${line.words.map((word) => buildMushafWordMarkup(word, entry.fontName)).join("")}
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function buildMushafNextPagePreviewMarkup(page, payload = state.payload) {
  const nextPage = Math.max(1, Number.parseInt(page, 10) || 1) + 1;
  const entry = ensureMushafPageData(nextPage);

  if (!entry || entry.status === "loading") {
    return `
      <div class="review-next-page-preview-shell">
        <div class="mushaf-loading">${escapeHtml(t("status.loading", {}, payload))}</div>
      </div>
    `;
  }

  if (entry.status === "error") {
    return `
      <div class="review-next-page-preview-shell">
        <div class="mushaf-loading">${escapeHtml(entry.error || t("toast.networkError", {}, payload))}</div>
      </div>
    `;
  }

  const visibleLines = entry.lines.filter((line) => Array.isArray(line.words) && line.words.length).slice(0, 3);

  return `
    <div class="review-next-page-preview-shell" dir="rtl">
      <div class="review-next-page-preview-head">
        <span>${escapeHtml(t("review.nextPagePeek", { page: nextPage }, payload))}</span>
      </div>
      <div class="review-next-page-preview-lines">
        ${visibleLines
          .map(
            (line) => `
              <div class="mushaf-line review-next-page-line" data-line-number="${escapeHtml(line.number)}">
                ${line.words.map((word) => buildMushafWordMarkup(word, entry.fontName)).join("")}
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function errorScopeToSeverity(scope) {
  if (scope === "line" || scope === "next-page-link") {
    return "grave";
  }
  if (scope === "word") {
    return "medium";
  }
  return "minor";
}

function errorScopeLabel(scope, payload = state.payload) {
  return t(`editor.scope.${scope}`, {}, payload);
}

function normalizeFirstName(value = "") {
  return String(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

function getProgramPhasesForMode(mode = "forward") {
  if (mode === "reverse") {
    return ["reverse"];
  }

  if (mode === "reverse-forward") {
    return ["reverse", "forward"];
  }

  return ["forward"];
}

function getDirectionLabel(direction, payload = state.payload) {
  return direction === "reverse" ? t("settings.programModeReverseOption", {}, payload) : t("settings.programModeForwardOption", {}, payload);
}

function getPhaseDirectionForMode(mode = "forward", phaseIndex = 1) {
  const phases = getProgramPhasesForMode(mode);
  const safeIndex = Math.min(Math.max(Number(phaseIndex) || 1, 1), phases.length);
  return phases[safeIndex - 1] || phases[0];
}

function sequenceHalfPageToPhysicalHalfPage(currentHalfPage, totalHalfPages, direction = "forward") {
  const safeTotal = Math.max(2, Number(totalHalfPages) || 2);
  const safeHalfPage = Math.max(1, Math.min(Number(currentHalfPage) || 1, safeTotal));
  return direction === "reverse" ? safeTotal - safeHalfPage + 1 : safeHalfPage;
}

function physicalHalfPageToSequenceHalfPage(currentHalfPage, totalHalfPages, direction = "forward") {
  const safeTotal = Math.max(2, Number(totalHalfPages) || 2);
  const safeHalfPage = Math.max(1, Math.min(Number(currentHalfPage) || 1, safeTotal));
  return direction === "reverse" ? safeTotal - safeHalfPage + 1 : safeHalfPage;
}

function getCurrentPageFromHalfPage(currentHalfPage, totalHalfPages, direction = "forward") {
  const safeTotal = Math.max(2, Number(totalHalfPages) || 2);
  const safeHalfPage = sequenceHalfPageToPhysicalHalfPage(currentHalfPage, safeTotal, direction);
  return Math.ceil(safeHalfPage / PROGRESS_UNITS_PER_PAGE);
}

function getCurrentLineFromHalfPage(currentHalfPage, totalHalfPages, direction = "forward") {
  const safeTotal = Math.max(2, Number(totalHalfPages) || 2);
  const safeHalfPage = sequenceHalfPageToPhysicalHalfPage(currentHalfPage, safeTotal, direction);
  const unitInPage = ((safeHalfPage - 1) % PROGRESS_UNITS_PER_PAGE) + 1;
  return Math.max(1, Math.min(LINES_PER_PAGE, Math.ceil(unitInPage / (PROGRESS_UNITS_PER_PAGE / LINES_PER_PAGE))));
}

function getCurrentHalfLabelFromHalfPage(currentHalfPage, totalHalfPages, direction = "forward") {
  const safeTotal = Math.max(2, Number(totalHalfPages) || 2);
  const safeHalfPage = sequenceHalfPageToPhysicalHalfPage(currentHalfPage, safeTotal, direction);
  const unitInPage = ((safeHalfPage - 1) % PROGRESS_UNITS_PER_PAGE) + 1;
  return unitInPage <= PROGRESS_UNITS_PER_PAGE / 2 ? "haute" : "basse";
}

function syncCurrentPageMax() {
  const totalHalfPages = Math.max(2, Number($("#total-half-pages")?.value) || 2);
  const totalPages = Math.max(1, Math.ceil(totalHalfPages / PROGRESS_UNITS_PER_PAGE));
  const currentPageInput = $("#current-page");

  if (!currentPageInput) {
    return;
  }

  currentPageInput.max = String(totalPages);
  const currentPage = Math.max(1, Number(currentPageInput.value) || 1);
  if (currentPage > totalPages) {
    currentPageInput.value = String(totalPages);
  }
}

function syncDailyNewPresets() {
  const currentValue = Number($("#daily-new-half-pages")?.value || 0);
  $all("[data-daily-new-preset]").forEach((button) => {
    button.classList.toggle("active", Math.abs(Number(button.dataset.dailyNewPreset) - currentValue) < 0.01);
  });
}

function formatInputPagesValueFromHalfPages(halfPages) {
  const normalized = Math.max(0, Number(halfPages) || 0) / PROGRESS_UNITS_PER_PAGE;
  if (Number.isInteger(normalized)) {
    return String(normalized);
  }
  return normalized.toFixed(4).replace(/\.?0+$/, "");
}

function parseDailyNewPagesToHalfPages(rawValue) {
  const normalized = Number.parseFloat(String(rawValue || "").replace(",", "."));
  if (!Number.isFinite(normalized)) {
    return PROGRESS_UNITS_PER_PAGE / 2;
  }

  const safePages = Math.max(0, Math.min(normalized, 10));
  return Math.max(1, Math.min(Math.round(safePages * PROGRESS_UNITS_PER_PAGE), 10 * PROGRESS_UNITS_PER_PAGE));
}

function getPhaseLabel(mode, phaseIndex, payload = state.payload) {
  if (mode === "reverse-forward") {
    return phaseIndex === 1 ? t("settings.phaseReverseOption", {}, payload) : t("settings.phaseForwardOption", {}, payload);
  }

  return t("settings.phaseSingleOption", { direction: getDirectionLabel(getPhaseDirectionForMode(mode, phaseIndex), payload) }, payload);
}

function formatPagesValueFromHalfPages(halfPages, payload = state.payload) {
  return formatPageCountFromHalfPages(Math.max(0, Number(halfPages) || 0), payload);
}

function formatCoveredPagesValue(halfPages, payload = state.payload) {
  return formatPageCountFromHalfPages(Math.max(0, Number(halfPages) || 0), payload);
}

function parseCoveredPagesToHalfPages(rawValue, totalHalfPages) {
  const normalized = Number.parseFloat(String(rawValue || "").replace(",", "."));
  if (!Number.isFinite(normalized)) {
    return 0;
  }

  const safePages = Math.max(0, Math.min(normalized, totalHalfPages / PROGRESS_UNITS_PER_PAGE));
  return Math.round(safePages * PROGRESS_UNITS_PER_PAGE);
}

function getPhaseProgressHalfPagesFromPayload(payload = state.payload, mode = payload?.settings?.programMode || "forward") {
  const phases = getProgramPhasesForMode(mode);
  const totalHalfPages = Math.max(2, Number(payload?.settings?.totalHalfPages) || 2);
  const raw = Array.isArray(payload?.progress?.phaseProgressHalfPages) ? payload.progress.phaseProgressHalfPages : [];
  return phases.map((_, index) => Math.max(0, Math.min(Number(raw[index]) || 0, totalHalfPages)));
}

function getPhaseProgressHalfPagesFromForm() {
  const totalHalfPages = Math.max(2, Number($("#total-half-pages")?.value) || 2);
  const mode = $("#program-mode")?.value || "forward";
  const phases = getProgramPhasesForMode(mode);
  return phases.map((_phase, index) =>
    parseCoveredPagesToHalfPages($(`[data-phase-pages="${index + 1}"]`)?.value, totalHalfPages),
  );
}

function getSelectedPhaseIndex(payload = state.payload, mode = $("#program-mode")?.value || payload?.settings?.programMode || "forward") {
  const phases = getProgramPhasesForMode(mode);
  return Math.min(Math.max(Number($("#phase-index")?.value || payload?.progress?.phaseIndex || 1), 1), phases.length);
}

function getCurrentPointLabelFromPhaseProgress(completedHalfPages, totalHalfPages, direction, payload = state.payload) {
  const safeCompleted = Math.max(0, Math.min(Number(completedHalfPages) || 0, totalHalfPages));
  if (safeCompleted >= totalHalfPages) {
    return t("settings.phaseStatusDone", {}, payload);
  }

  const nextHalfPage = safeCompleted + 1;
  const page = getCurrentPageFromHalfPage(nextHalfPage, totalHalfPages, direction);
  const line = getCurrentLineFromHalfPage(nextHalfPage, totalHalfPages, direction);
  const half = getCurrentHalfLabelFromHalfPage(nextHalfPage, totalHalfPages, direction);
  const unitInPage = ((sequenceHalfPageToPhysicalHalfPage(nextHalfPage, totalHalfPages, direction) - 1) % PROGRESS_UNITS_PER_PAGE) + 1;
  if (unitInPage === 1) {
    return t("page.label", { page }, payload);
  }
  if (unitInPage === PROGRESS_UNITS_PER_PAGE / 2 + 1) {
    return `${t("page.label", { page }, payload)} - ${t("settings.lowerHalfOption", {}, payload)}`;
  }
  return `${t("page.label", { page }, payload)} - ${t("settings.lineLabel", {}, payload)} ${line}`;
}

function renderPhaseProgressEditor(payload = state.payload, options = {}) {
  const container = $("#phase-progress-grid");
  if (!container) {
    return;
  }

  const preserveDraft = Boolean(options.preserveDraft);
  const mode = $("#program-mode")?.value || payload?.settings?.programMode || "forward";
  const phases = getProgramPhasesForMode(mode);
  const totalHalfPages = Math.max(2, Number($("#total-half-pages")?.value || payload?.settings?.totalHalfPages) || 2);
  const phaseProgressHalfPages = preserveDraft
    ? getPhaseProgressHalfPagesFromForm()
    : getPhaseProgressHalfPagesFromPayload(payload, mode);
  const activePhaseIndex = getSelectedPhaseIndex(payload, mode);
  if ($("#phase-index")) {
    $("#phase-index").value = String(activePhaseIndex);
  }
  const cards = phases.map((direction, index) => {
    const phaseNumber = index + 1;
    const coveredHalfPages = Math.max(0, Math.min(phaseProgressHalfPages[index] || 0, totalHalfPages));
    const isDone = coveredHalfPages >= totalHalfPages;
    const isDisplayed = activePhaseIndex === phaseNumber;
    const statusLabel = isDone ? t("settings.phaseStatusDone", {}, payload) : t("settings.phaseStatusActive", {}, payload);
    const currentLabel = getCurrentPointLabelFromPhaseProgress(coveredHalfPages, totalHalfPages, direction, payload);
    const coveredPagesRaw = coveredHalfPages / PROGRESS_UNITS_PER_PAGE;
    const coveredPagesValue = Number.isInteger(coveredPagesRaw)
      ? String(coveredPagesRaw)
      : coveredPagesRaw.toFixed(2).replace(/\.?0+$/, "");
    const completionPercent = Math.max(0, Math.min(100, Math.round((coveredHalfPages / totalHalfPages) * 100)));

    return `
      <article class="phase-progress-card ${isDone ? "done" : ""} ${isDisplayed ? "displayed" : ""}">
        <div class="phase-progress-head">
          <div>
            <p class="eyebrow">${escapeHtml(getPhaseLabel(mode, phaseNumber, payload))}</p>
            <strong>${escapeHtml(getDirectionLabel(direction, payload))}</strong>
          </div>
          <div class="phase-progress-status-stack">
            <span class="phase-progress-status ${isDone ? "done" : "active"}">${escapeHtml(statusLabel)}</span>
            <button
              type="button"
              class="phase-progress-display ${isDisplayed ? "active" : ""}"
              data-phase-display="${escapeHtml(phaseNumber)}"
            >
              ${escapeHtml(isDisplayed ? t("settings.phaseDisplayActive", {}, payload) : t("settings.phaseDisplayButton", {}, payload))}
            </button>
          </div>
        </div>
        <label class="phase-progress-field">
          <span>${escapeHtml(t("settings.phaseCoveredLabel", {}, payload))}</span>
          <input
            type="number"
            min="0"
                  max="${escapeHtml(totalHalfPages / PROGRESS_UNITS_PER_PAGE)}"
            step="any"
            value="${escapeHtml(coveredPagesValue)}"
            data-phase-pages="${escapeHtml(phaseNumber)}"
          />
          <small>${escapeHtml(t("settings.phaseCoveredHelp", {}, payload))}</small>
        </label>
        <div class="phase-progress-meter">
          <div class="phase-progress-track" aria-hidden="true">
            <span style="width:${escapeHtml(completionPercent)}%"></span>
          </div>
          <span>${escapeHtml(formatCoveredPagesValue(coveredHalfPages, payload))}</span>
        </div>
        <div class="phase-progress-note">
          <span>${escapeHtml(t("settings.phaseNextLabel", {}, payload))}</span>
          <strong>${escapeHtml(currentLabel)}</strong>
        </div>
      </article>
    `;
  });

  container.innerHTML = `
    <div class="phase-progress-intro">
      <p class="helper">${escapeHtml(t("settings.phaseAutoHelp", {}, payload))}</p>
    </div>
    ${cards.join("")}
  `;

  $all("[data-phase-pages]").forEach((input) => {
    input.addEventListener("change", () => {
      renderPhaseProgressEditor(payload, { preserveDraft: true });
    });
  });

  $all("[data-phase-display]").forEach((button) => {
    button.addEventListener("click", () => {
      if ($("#phase-index")) {
        $("#phase-index").value = String(button.dataset.phaseDisplay || "1");
      }
      renderPhaseProgressEditor(payload, { preserveDraft: true });
    });
  });
}

async function api(path, options = {}) {
  if (!dataClient?.request) {
    throw new Error(t("toast.networkError"));
  }

  try {
    return await dataClient.request(path, options);
  } catch (error) {
    throw new Error(error.message || t("toast.networkError"));
  }
}

function showToast(message, isError = false) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.style.background = isError ? "rgba(141, 81, 71, 0.96)" : "rgba(17, 52, 45, 0.96)";
  toast.classList.add("visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("visible"), 2400);
}

function updateInstallButton() {
  const button = $("#install-app-button");
  if (!button) {
    return;
  }

  button.hidden = !state.pwa.canInstall;
  button.disabled = !state.pwa.canInstall;
}

function registerPwaFeatures() {
  if ("serviceWorker" in navigator) {
    let serviceWorkerRefreshPending = false;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (serviceWorkerRefreshPending) {
        return;
      }

      serviceWorkerRefreshPending = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register(`/service-worker.js?v=${SERVICE_WORKER_VERSION}`)
      .then((registration) => {
        registration.update().catch(() => {});

        if (registration.waiting) {
          registration.waiting.postMessage("SKIP_WAITING");
        }

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) {
            return;
          }

          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              worker.postMessage("SKIP_WAITING");
            }
          });
        });
      })
      .catch(() => {
        // Keep the app usable even if the worker fails to register.
      });
  }

  window.addEventListener("offline", () => {
    if (state.payload) {
      showToast(t("toast.offlineMode", {}, state.payload), true);
    }
  });

  window.addEventListener("online", () => {
    if (state.payload) {
      showToast(t("toast.backOnline", {}, state.payload));
    }
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.pwa.installPrompt = event;
    state.pwa.canInstall = true;
    updateInstallButton();
  });

  window.addEventListener("appinstalled", () => {
    state.pwa.installPrompt = null;
    state.pwa.canInstall = false;
    updateInstallButton();
    if (state.payload) {
      showToast(t("toast.appInstalled", {}, state.payload));
    }
  });
}

function formatHalfPageCount(value, payload = state.payload) {
  const normalized = Number(value || 0);
  const language = getLanguage(payload);
  const unit =
    language === "en"
      ? normalized === 1
        ? "half-page"
        : "half-pages"
      : language === "ar"
        ? normalized === 1
          ? "نصف صفحة"
          : "أنصاف صفحات"
        : `demi-page${normalized === 1 ? "" : "s"}`;
  return `${normalized} ${unit}`;
}

function formatLineCount(value, payload = state.payload) {
  const normalized = Number(value || 0);
  const formatted = Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(1).replace(/\.?0+$/, "");
  const numeric = Number(formatted);
  const language = getLanguage(payload);
  const unit =
    language === "en"
      ? numeric === 1
        ? "line"
        : "lines"
      : language === "ar"
        ? numeric === 1
          ? "سطر"
          : "أسطر"
        : `ligne${numeric === 1 ? "" : "s"}`;
  return `${formatted} ${unit}`;
}

function formatPageCountFromHalfPages(halfPageCount, payload = state.payload) {
  const units = Math.max(0, Number(halfPageCount || 0));
  if (units > 0 && units < PROGRESS_UNITS_PER_PAGE) {
    if (units === PROGRESS_UNITS_PER_PAGE / 2) {
      return formatHalfPageCount(1, payload);
    }

    if (units > PROGRESS_UNITS_PER_PAGE / 2) {
      const remainingUnits = units - PROGRESS_UNITS_PER_PAGE / 2;
      if (remainingUnits > 0 && remainingUnits % 2 === 0) {
        return `${formatHalfPageCount(1, payload)} + ${formatLineCount(remainingUnits / 2, payload)}`;
      }
    }

    if (units % 2 === 0) {
      return formatLineCount(units / 2, payload);
    }
  }

  const normalized = units / PROGRESS_UNITS_PER_PAGE;
  const formatted = Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(2).replace(/\.?0+$/, "");
  const numeric = Number(formatted);
  const language = getLanguage(payload);
  const isSingular = (numeric > 0 && numeric < 1) || numeric === 1;
  const unit =
    language === "en"
      ? isSingular
        ? "page"
        : "pages"
      : language === "ar"
        ? isSingular
          ? "صفحة"
          : "صفحات"
        : `page${isSingular ? "" : "s"}`;
  return `${formatted} ${unit}`;
}

function cardClassName(blockKey, block) {
  const focus = state.payload?.plan ? getCurrentFocusBlock(state.payload.plan) : null;
  const isCurrent = focus?.key === blockKey;
  return `card card-${blockKey} ${block.dayComplete ? "done" : ""} ${block.present ? "" : "empty"} ${block.locked ? "locked" : ""} ${isCurrent ? "current-card" : ""}`;
}

function isCardExpanded(blockKey, block) {
  const explicit = state.expandedCards[blockKey];
  if (typeof explicit === "boolean") {
    return explicit;
  }

  const focus = state.payload?.plan ? getCurrentFocusBlock(state.payload.plan) : null;
  if (!block?.present) {
    return false;
  }

  return focus?.key === blockKey;
}

function severityLabel(severity) {
  if (severity === "minor") {
    return t("page.minor");
  }
  if (severity === "medium") {
    return t("page.medium");
  }
  if (severity === "grave") {
    return t("page.grave");
  }
  return t("page.neutral");
}

function normalizePageEntry(entry) {
  const safeEntry = entry && typeof entry === "object" ? entry : {};
  const errors = safeEntry.errors && typeof safeEntry.errors === "object" ? safeEntry.errors : {};
  const events = Array.isArray(safeEntry.events) ? safeEntry.events : [];
  const normalized = {
    learned: Boolean(safeEntry.learned),
    errors: {
      minor: Math.max(0, Number(errors.minor || 0)),
      medium: Math.max(0, Number(errors.medium || 0)),
      grave: Math.max(0, Number(errors.grave || 0)),
    },
    events: events
      .map((event) => {
        if (!event || typeof event !== "object") {
          return null;
        }

        const severity = ["minor", "medium", "grave"].includes(event.severity) ? event.severity : null;
        if (!severity) {
          return null;
        }

        const scope = ["harakah", "word", "line", "next-page-link"].includes(event.scope)
          ? event.scope
          : severity === "grave"
            ? "line"
            : severity === "medium"
              ? "word"
              : "harakah";

        return {
          id: typeof event.id === "string" ? event.id : "",
          severity,
          scope,
          rect:
            event.rect &&
            typeof event.rect === "object" &&
            Number.isFinite(Number(event.rect.x)) &&
            Number.isFinite(Number(event.rect.y)) &&
            Number.isFinite(Number(event.rect.width)) &&
            Number.isFinite(Number(event.rect.height))
              ? {
                  x: Math.max(0, Math.min(1, Number(event.rect.x))),
                  y: Math.max(0, Math.min(1, Number(event.rect.y))),
                  width: Math.max(0, Math.min(1, Number(event.rect.width))),
                  height: Math.max(0, Math.min(1, Number(event.rect.height))),
                }
              : null,
          note: String(event.note || "").trim(),
          createdAt: typeof event.createdAt === "string" ? event.createdAt : "",
          review:
            event.review && typeof event.review === "object"
              ? {
                  dueAt: typeof event.review.dueAt === "string" ? event.review.dueAt : "",
                  lastReviewedAt: typeof event.review.lastReviewedAt === "string" ? event.review.lastReviewedAt : "",
                  lastResult: ["new", "success", "failure"].includes(event.review.lastResult) ? event.review.lastResult : "new",
                  intervalHours: Math.max(0, Number(event.review.intervalHours || 0)),
                  successCount: Math.max(0, Number(event.review.successCount || 0)),
                  failureCount: Math.max(0, Number(event.review.failureCount || 0)),
                }
              : {
                  dueAt: typeof event.createdAt === "string" ? event.createdAt : "",
                  lastReviewedAt: "",
                  lastResult: "new",
                  intervalHours: 0,
                  successCount: 0,
                  failureCount: 0,
                },
          anchor: normalizeSelectionAnchor(event.anchor, scope),
        };
      })
      .filter(Boolean),
  };

  normalized.totalErrors = normalized.errors.minor + normalized.errors.medium + normalized.errors.grave;
  normalized.dominantSeverity =
    normalized.errors.grave > 0
      ? "grave"
      : normalized.errors.medium > 0
        ? "medium"
        : normalized.errors.minor > 0
          ? "minor"
          : "none";
  normalized.latestEvent = normalized.events[0] || null;
  normalized.latestNoteEvent = normalized.events.find((event) => event.note) || null;
  normalized.hasNotes = Boolean(normalized.latestNoteEvent);

  return normalized;
}

function normalizeErrorReviewItem(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const severity = ["minor", "medium", "grave"].includes(item.severity) ? item.severity : null;
  if (!severity) {
    return null;
  }

  const scope = ["harakah", "word", "line", "next-page-link"].includes(item.scope)
    ? item.scope
    : severity === "grave"
      ? "line"
      : severity === "medium"
        ? "word"
        : "harakah";

  return {
    id: typeof item.id === "string" ? item.id : "",
    page: Math.max(1, Number.parseInt(item.page, 10) || 1),
    severity,
    scope,
    note: String(item.note || "").trim(),
    rect: sanitizeSelectionRect(item.rect),
    anchor: normalizeSelectionAnchor(item.anchor, scope),
    createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
    review:
      item.review && typeof item.review === "object"
        ? {
            dueAt: typeof item.review.dueAt === "string" ? item.review.dueAt : "",
            lastReviewedAt: typeof item.review.lastReviewedAt === "string" ? item.review.lastReviewedAt : "",
            lastResult: ["new", "success", "failure"].includes(item.review.lastResult) ? item.review.lastResult : "new",
            intervalHours: Math.max(0, Number(item.review.intervalHours || 0)),
            successCount: Math.max(0, Number(item.review.successCount || 0)),
            failureCount: Math.max(0, Number(item.review.failureCount || 0)),
          }
        : {
            dueAt: typeof item.createdAt === "string" ? item.createdAt : "",
            lastReviewedAt: "",
            lastResult: "new",
            intervalHours: 0,
            successCount: 0,
            failureCount: 0,
          },
  };
}

function getReviewRevealedItemIds() {
  return Array.isArray(state.reviewState?.revealedItemIds)
    ? [...new Set(state.reviewState.revealedItemIds.map((itemId) => String(itemId || "").trim()).filter(Boolean))]
    : [];
}

function setReviewRevealedItemIds(itemIds) {
  state.reviewState.revealedItemIds = [...new Set((Array.isArray(itemIds) ? itemIds : []).map((itemId) => String(itemId || "").trim()).filter(Boolean))];
}

function getReviewSelectedPage() {
  const page = Number.parseInt(state.reviewState?.selectedPage, 10);
  return Number.isInteger(page) && page > 0 ? page : null;
}

function setReviewSelectedPage(page) {
  const safePage = Number.parseInt(page, 10);
  state.reviewState.selectedPage = Number.isInteger(safePage) && safePage > 0 ? safePage : null;
}

function getReviewCompletedItemsForPage(page) {
  const safePage = Number.parseInt(page, 10);
  if (!Number.isInteger(safePage) || safePage < 1) {
    return [];
  }

  const map = state.reviewState?.completedItemsByPage;
  const rawItems = map && typeof map === "object" ? map[String(safePage)] : [];
  return Array.isArray(rawItems)
    ? rawItems.map((item) => normalizeErrorReviewItem(item)).filter(Boolean)
    : [];
}

function setReviewCompletedItemsForPage(page, items) {
  const safePage = Number.parseInt(page, 10);
  if (!Number.isInteger(safePage) || safePage < 1) {
    return;
  }

  const normalizedItems = Array.isArray(items)
    ? items
        .map((item) => normalizeErrorReviewItem(item))
        .filter(Boolean)
        .filter((item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index)
    : [];

  if (!state.reviewState.completedItemsByPage || typeof state.reviewState.completedItemsByPage !== "object") {
    state.reviewState.completedItemsByPage = {};
  }

  if (!normalizedItems.length) {
    delete state.reviewState.completedItemsByPage[String(safePage)];
    return;
  }

  state.reviewState.completedItemsByPage[String(safePage)] = normalizedItems;
}

function pruneReviewCompletedItems(activePage) {
  const safePage = Number.parseInt(activePage, 10);
  if (!state.reviewState.completedItemsByPage || typeof state.reviewState.completedItemsByPage !== "object") {
    state.reviewState.completedItemsByPage = {};
    return;
  }

  if (!Number.isInteger(safePage) || safePage < 1) {
    state.reviewState.completedItemsByPage = {};
    return;
  }

  const currentItems = state.reviewState.completedItemsByPage[String(safePage)];
  state.reviewState.completedItemsByPage = currentItems ? { [String(safePage)]: currentItems } : {};
}

function resetReviewSwipeState() {
  state.reviewSwipe.itemId = "";
  state.reviewSwipe.startX = 0;
  state.reviewSwipe.currentX = 0;
}

function getReviewItemVisualOrder(item) {
  const anchorLine = Number.parseInt(item?.anchor?.lineNumber, 10);
  const rect = sanitizeSelectionRect(item?.rect);
  const lineOrder = Number.isInteger(anchorLine) && anchorLine > 0 ? anchorLine : rect ? Math.round(rect.y * 1000) + 100 : 9999;
  const topOrder = rect ? rect.y : lineOrder / 1000;
  const horizontalOrder = rect ? -(rect.x + rect.width / 2) : 0;
  const sizeOrder = rect ? rect.width * rect.height : item?.scope === "next-page-link" ? 1 : 0;

  return {
    lineOrder,
    topOrder,
    horizontalOrder,
    sizeOrder,
    createdAt: typeof item?.createdAt === "string" ? item.createdAt : "",
  };
}

function compareReviewItemsOnPage(left, right) {
  const leftOrder = getReviewItemVisualOrder(left);
  const rightOrder = getReviewItemVisualOrder(right);

  if (leftOrder.lineOrder !== rightOrder.lineOrder) {
    return leftOrder.lineOrder - rightOrder.lineOrder;
  }

  if (Math.abs(leftOrder.topOrder - rightOrder.topOrder) > 0.002) {
    return leftOrder.topOrder - rightOrder.topOrder;
  }

  if (Math.abs(leftOrder.horizontalOrder - rightOrder.horizontalOrder) > 0.002) {
    return leftOrder.horizontalOrder - rightOrder.horizontalOrder;
  }

  if (Math.abs(leftOrder.sizeOrder - rightOrder.sizeOrder) > 0.0005) {
    return leftOrder.sizeOrder - rightOrder.sizeOrder;
  }

  return leftOrder.createdAt.localeCompare(rightOrder.createdAt);
}

function buildReviewPageGroups(items = []) {
  const groups = [];
  const byPage = new Map();

  items.forEach((item) => {
    if (!item) {
      return;
    }

    const pageKey = String(item.page || "");
    if (!byPage.has(pageKey)) {
      const group = {
        page: item.page,
        items: [],
      };
      byPage.set(pageKey, group);
      groups.push(group);
    }

    byPage.get(pageKey).items.push(item);
  });

  groups.forEach((group) => {
    group.items.sort(compareReviewItemsOnPage);
  });

  return groups;
}

function buildAllErrorReviewItems(payload = state.payload) {
  const pageErrors = payload?.pageErrors || {};
  return Object.entries(pageErrors).flatMap(([pageKey, rawEntry]) => {
    const page = Number.parseInt(pageKey, 10);
    const entry = normalizePageEntry(rawEntry, page);
    if (!entry?.events?.length) {
      return [];
    }

    return entry.events
      .filter((event) => event.rect || event.scope === "next-page-link")
      .map((event) =>
        normalizeErrorReviewItem({
          id: event.id,
          page,
          severity: event.severity,
          scope: event.scope,
          note: event.note,
          rect: event.rect,
          anchor: event.anchor,
          createdAt: event.createdAt,
          review: event.review,
        }),
      )
      .filter(Boolean);
  });
}

function isReviewItemMastered(item) {
  return Math.max(0, Number(item?.review?.successCount || 0)) >= 3 && Math.max(0, Number(item?.review?.intervalHours || 0)) >= 72;
}

function setQuickNoteDraft(page, value) {
  if (!Number.isInteger(page) || page < 1) {
    return;
  }

  const nextValue = String(value || "").slice(0, 280);

  if (!nextValue.trim()) {
    delete state.quickNoteDrafts[String(page)];
    return;
  }

  state.quickNoteDrafts[String(page)] = nextValue;
}

function getQuickNoteDraft(page) {
  if (!Number.isInteger(page) || page < 1) {
    return "";
  }

  return String(state.quickNoteDrafts[String(page)] || "");
}

function clearQuickNoteDraft(page) {
  if (!Number.isInteger(page) || page < 1) {
    return;
  }

  delete state.quickNoteDrafts[String(page)];
}

function formatEventTimestamp(createdAt, payload = state.payload) {
  if (!createdAt) {
    return "";
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const locale = getLanguage(payload) === "en" ? "en-GB" : "fr-FR";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatReviewTimestamp(createdAt, payload = state.payload) {
  if (!createdAt) {
    return "";
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const locale = getLanguage(payload) === "en" ? "en-GB" : "fr-FR";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function uniqueSortedPages(pages) {
  return [...new Set((pages || []).map((page) => Number(page)).filter((page) => Number.isInteger(page) && page > 0))].sort(
    (left, right) => left - right,
  );
}

function parsePagesInput(rawValue, totalPages) {
  const source = String(rawValue || "").trim();
  if (!source) {
    return [];
  }

  const pages = [];
  const chunks = source.split(",").map((chunk) => chunk.trim()).filter(Boolean);

  for (const chunk of chunks) {
    const rangeMatch = chunk.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = Number.parseInt(rangeMatch[1], 10);
        const end = Number.parseInt(rangeMatch[2], 10);
        if (!Number.isInteger(start) || !Number.isInteger(end)) {
          throw new Error(t("error.invalidPageFormat"));
        }

        const safeStart = Math.min(start, end);
        const safeEnd = Math.max(start, end);
        if (safeStart < 1 || safeEnd > totalPages) {
          throw new Error(t("error.pageOutOfRange"));
        }

      for (let page = safeStart; page <= safeEnd; page += 1) {
        pages.push(page);
      }
      continue;
    }

    const page = Number.parseInt(chunk, 10);
    if (!Number.isInteger(page)) {
      throw new Error(t("error.invalidPageFormatExample"));
    }

    if (page < 1 || page > totalPages) {
      throw new Error(t("error.pageOutOfRange"));
    }

    pages.push(page);
  }

  return uniqueSortedPages(pages);
}

function formatPagesSelection(pages) {
  const uniquePages = uniqueSortedPages(pages);
  if (!uniquePages.length) {
    return "";
  }

  const parts = [];
  let start = uniquePages[0];
  let previous = uniquePages[0];

  for (let index = 1; index <= uniquePages.length; index += 1) {
    const current = uniquePages[index];
    if (current === previous + 1) {
      previous = current;
      continue;
    }

    parts.push(start === previous ? String(start) : `${start}-${previous}`);
    start = current;
    previous = current;
  }

  return parts.join(", ");
}

function syncSelectedPages(pages) {
  state.activePage = uniqueSortedPages(pages)[0] || null;
}

function getSelectedPages(totalPages) {
  if (!Number.isInteger(state.activePage) || state.activePage < 1 || state.activePage > totalPages) {
    throw new Error(t("error.selectPageFirst"));
  }
  return [state.activePage];
}

function getCollapsedJuzRenderKey() {
  return Object.keys(state.collapsedJuzs)
    .sort((left, right) => Number(left) - Number(right))
    .map((juz) => `${juz}:${state.collapsedJuzs[juz] === false ? "open" : "closed"}`)
    .join("|");
}

function isErrorTrackingRenderReusable(payload) {
  const cache = state.errorTrackingRenderCache || {};
  return (
    cache.pageErrorsRef === (payload?.pageErrors || null) &&
    cache.summaryRef === (payload?.errorTracking?.summary || null) &&
    cache.planRef === (payload?.plan || null) &&
    cache.language === getLanguage(payload) &&
    cache.collapsedKey === getCollapsedJuzRenderKey()
  );
}

function rememberErrorTrackingRender(payload) {
  state.errorTrackingRenderCache = {
    pageErrorsRef: payload?.pageErrors || null,
    summaryRef: payload?.errorTracking?.summary || null,
    planRef: payload?.plan || null,
    language: getLanguage(payload),
    collapsedKey: getCollapsedJuzRenderKey(),
  };
}

function syncActivePageCellHighlight() {
  const activePage = Number.isInteger(state.activePage) ? state.activePage : null;
  $all("[data-page-cell]").forEach((button) => {
    button.classList.toggle("active-page", Number(button.dataset.pageCell) === activePage);
  });
}

function refreshPagesQuickUi(payload = state.payload) {
  renderPageQuickActions(payload);
  syncActivePageCellHighlight();
  bindPageQuickActions();
}

function setActiveView(view, options = {}) {
  const { skipDeferredRender = false } = options;
  state.activeView = view;
  state.activeViewRenderToken += 1;
  const renderToken = state.activeViewRenderToken;
  if (view !== "pages" && state.pageEditor.open) {
    closePageEditor();
    renderPageEditorModal(state.payload);
  }
  document.body.dataset.activeView = view;
  document.body.classList.toggle("pages-view-active", view === "pages");
  $all("[data-view-target]").forEach((button) => {
    button.classList.toggle("active", button.dataset.viewTarget === view);
  });
  $all(".content-view").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `view-${view}`);
  });
  resetHorizontalViewportOffset();
  if (options.scrollOnMobile && window.matchMedia("(max-width: 720px)").matches) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior = isNativeAppRuntime() || isCoarsePointerDevice() || prefersReducedMotion ? "auto" : "smooth";
    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior,
      });
    });
  }

  if (skipDeferredRender) {
    return;
  }

  if (view === "pages" || view === "review" || view === "today" || view === "surahs" || view === "statistics") {
    window.requestAnimationFrame(() => {
      if (renderToken !== state.activeViewRenderToken || state.activeView !== view) {
        return;
      }

      if (view === "pages") {
        renderErrorTracking(state.payload);
        bindPageQuickActions();
        if (state.pageEditor.open) {
          renderPageEditorModal(state.payload);
          bindPageEditorActions();
        }
      } else if (view === "review") {
        renderErrorReview(state.payload);
        bindErrorReviewActions();
      } else if (view === "surahs") {
        renderSurahGame(state.payload);
      } else if (view === "statistics") {
        renderStatistics(state.payload);
      } else if (view === "today") {
        refreshTodayExperience(state.payload, { rebind: true });
      }
    });
  }
}

function scrollTodayFocusIntoView() {
  const target = $("#today-focus");
  if (!target) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior = isNativeAppRuntime() || isCoarsePointerDevice() || prefersReducedMotion ? "auto" : "smooth";
  target.scrollIntoView({
    behavior,
    block: "start",
  });
}

function openPageEditor(page) {
  const safePage = Number(page);
  if (!Number.isInteger(safePage) || safePage < 1) {
    return;
  }

  prefetchMushafPages([safePage, safePage - 1, safePage + 1]);

  state.pageEditor = {
    open: true,
    page: safePage,
    scope: "word",
    note: "",
    rawRect: null,
    rect: null,
    anchor: null,
    selectionOrigin: null,
    needsTrackingRefresh: false,
  };
}

function closePageEditor() {
  state.pageEditor = {
    open: false,
    page: null,
    scope: "word",
    note: "",
    rawRect: null,
    rect: null,
    anchor: null,
    selectionOrigin: null,
    needsTrackingRefresh: false,
  };
}

function isPageEditorTouchSelectionRequired() {
  return isNativeAppRuntime() || isCoarsePointerDevice();
}

function getPageEditorSelectionState(payload = state.payload) {
  const page = Number(state.pageEditor.page);
  const entry = normalizePageEntry((payload?.pageErrors || {})[String(page)]);
  const detailedEvents = entry.events.filter((event) => event.rect || event.scope === "next-page-link");
  const placedEvents = detailedEvents.filter((event) => event.rect);
  const hasNextPageLink = detailedEvents.some((event) => event.scope === "next-page-link");
  const isNextPageLinkScope = state.pageEditor.scope === "next-page-link";
  const selectedRect = isNextPageLinkScope ? null : state.pageEditor.rect;
  const selectionStateKey = isNextPageLinkScope
    ? hasNextPageLink
      ? "editor.selectionAutoLinkUsed"
      : "editor.selectionAutoLink"
    : selectedRect
      ? "editor.selectionReady"
      : "editor.selectionEmpty";

  return {
    entry,
    detailedEvents,
    placedEvents,
    hasNextPageLink,
    isNextPageLinkScope,
    selectedRect,
    selectionStateKey,
    canSave: isNextPageLinkScope ? !hasNextPageLink : Boolean(selectedRect),
    showTouchSelectionHint: isPageEditorTouchSelectionRequired() && !isNextPageLinkScope,
  };
}

function updatePageEditorSelectionUi(payload = state.payload, modal = $("#page-editor-modal")) {
  if (!modal || modal.hidden) {
    return;
  }

  const selectionBox = modal.querySelector("#page-editor-selection-box");
  const status = modal.querySelector("[data-page-editor-selection-status]");
  const saveButton = modal.querySelector("[data-page-editor-save='true']");
  const touchHint = modal.querySelector("[data-page-editor-gesture-hint]");
  const stage = modal.querySelector("[data-page-editor-stage='true']");
  const { selectedRect, selectionStateKey, canSave, showTouchSelectionHint } = getPageEditorSelectionState(payload);

  if (selectionBox) {
    selectionBox.classList.toggle("active", Boolean(selectedRect));
    selectionBox.style.cssText = selectionRectStyle(selectedRect);
  }

  if (status) {
    status.textContent = t(selectionStateKey, {}, payload);
  }

  if (saveButton) {
    saveButton.disabled = !canSave;
  }

  if (touchHint) {
    touchHint.hidden = !showTouchSelectionHint;
  }

  if (stage) {
    const selectionInteractive = state.pageEditor.scope !== "next-page-link" && !isPageEditorTouchSelectionRequired();
    stage.classList.toggle("selection-disabled", state.pageEditor.scope === "next-page-link");
    stage.classList.toggle("selection-interactive", selectionInteractive);
  }

  modal.querySelectorAll("[data-page-editor-scope]").forEach((button) => {
    button.classList.toggle("active", button.dataset.pageEditorScope === state.pageEditor.scope);
  });
}

function clampUnit(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function buildNormalizedRectFromPoints(start, end) {
  if (!start || !end) {
    return null;
  }

  const x = clampUnit(Math.min(start.x, end.x));
  const y = clampUnit(Math.min(start.y, end.y));
  const right = clampUnit(Math.max(start.x, end.x));
  const bottom = clampUnit(Math.max(start.y, end.y));
  const width = Math.max(0, right - x);
  const height = Math.max(0, bottom - y);

  if (width < 0.01 || height < 0.01) {
    return null;
  }

  return {
    x: Number(x.toFixed(4)),
    y: Number(y.toFixed(4)),
    width: Number(width.toFixed(4)),
    height: Number(height.toFixed(4)),
  };
}

function getNormalizedPointerPosition(event, element) {
  const bounds = element.getBoundingClientRect();
  if (!bounds.width || !bounds.height) {
    return { x: 0, y: 0 };
  }

  return {
    x: clampUnit((event.clientX - bounds.left) / bounds.width),
    y: clampUnit((event.clientY - bounds.top) / bounds.height),
  };
}

function getNormalizedTouchPosition(touch, element) {
  if (!touch) {
    return { x: 0, y: 0 };
  }

  return getNormalizedPointerPosition(
    {
      clientX: touch.clientX,
      clientY: touch.clientY,
    },
    element,
  );
}

function cloneTouchSnapshot(touch) {
  if (!touch) {
    return null;
  }

  return {
    identifier: Number(touch.identifier),
    clientX: Number(touch.clientX || 0),
    clientY: Number(touch.clientY || 0),
  };
}

function selectionRectStyle(rect) {
  if (!rect) {
    return "";
  }

  return `left:${escapeHtml(rect.x * 100)}%;top:${escapeHtml(rect.y * 100)}%;width:${escapeHtml(rect.width * 100)}%;height:${escapeHtml(
    rect.height * 100,
  )}%;`;
}

function sanitizeSelectionRect(rawRect) {
  if (!rawRect || typeof rawRect !== "object") {
    return null;
  }

  const x = clampUnit(rawRect.x);
  const y = clampUnit(rawRect.y);
  const right = clampUnit(Number(rawRect.x) + Number(rawRect.width));
  const bottom = clampUnit(Number(rawRect.y) + Number(rawRect.height));
  const width = Math.max(0, right - x);
  const height = Math.max(0, bottom - y);

  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }

  if (width < 0.001 || height < 0.001) {
    return null;
  }

  return {
    x: Number(x.toFixed(4)),
    y: Number(y.toFixed(4)),
    width: Number(width.toFixed(4)),
    height: Number(height.toFixed(4)),
  };
}

function buildPointRect(point, size = 0.014) {
  if (!point || typeof point !== "object") {
    return null;
  }

  const half = Math.max(0.004, Number(size) || 0.014) / 2;
  return sanitizeSelectionRect({
    x: Number(point.x) - half,
    y: Number(point.y) - half,
    width: half * 2,
    height: half * 2,
  });
}

function normalizeSelectionAnchor(anchor, scope = "") {
  if (!anchor || typeof anchor !== "object") {
    return null;
  }

  const kind = anchor.kind === "line" ? "line" : anchor.kind === "word" ? "word" : "";
  if (!kind) {
    return null;
  }

  if ((scope === "line" || scope === "next-page-link") && kind !== "line") {
    return null;
  }

  if (scope && scope !== "line" && scope !== "next-page-link" && kind !== "word") {
    return null;
  }

  const lineNumber = Number.parseInt(anchor.lineNumber, 10);
  if (!Number.isInteger(lineNumber) || lineNumber < 1) {
    return null;
  }

  if (kind === "line") {
    return {
      kind,
      lineNumber,
    };
  }

  const wordId = Number.parseInt(anchor.wordId, 10);
  if (!Number.isInteger(wordId) || wordId < 1) {
    return null;
  }

  return {
    kind,
    lineNumber,
    wordId,
  };
}

function getRectCenter(rect) {
  if (!rect) {
    return { x: 0.5, y: 0.5 };
  }

  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

function getRectOverlapArea(left, right) {
  if (!left || !right) {
    return 0;
  }

  const overlapWidth = Math.max(0, Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x));
  const overlapHeight = Math.max(0, Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y));
  return overlapWidth * overlapHeight;
}

function getRectCenterDistance(left, right) {
  const leftCenter = getRectCenter(left);
  const rightCenter = getRectCenter(right);
  const deltaX = leftCenter.x - rightCenter.x;
  const deltaY = leftCenter.y - rightCenter.y;
  return deltaX * deltaX + deltaY * deltaY;
}

function getRelativeRectFromBounds(targetBounds, containerBounds) {
  if (!targetBounds || !containerBounds || !containerBounds.width || !containerBounds.height) {
    return null;
  }

  return sanitizeSelectionRect({
    x: (targetBounds.left - containerBounds.left) / containerBounds.width,
    y: (targetBounds.top - containerBounds.top) / containerBounds.height,
    width: targetBounds.width / containerBounds.width,
    height: targetBounds.height / containerBounds.height,
  });
}

function buildSelectionAnchorFromElement(element, scope = "") {
  if (!element) {
    return null;
  }

  if (scope === "line" || scope === "next-page-link") {
    return normalizeSelectionAnchor(
      {
        kind: "line",
        lineNumber: element.dataset.lineNumber,
      },
      scope,
    );
  }

  return normalizeSelectionAnchor(
    {
      kind: "word",
      wordId: element.dataset.wordId,
      lineNumber: element.dataset.lineNumber,
    },
    scope,
  );
}

function resolveSelectionRectFromAnchor(frame, anchor) {
  const safeAnchor = normalizeSelectionAnchor(anchor);
  if (!frame || !safeAnchor) {
    return null;
  }

  let target = null;
  if (safeAnchor.kind === "line") {
    target = frame.querySelector(`.mushaf-line[data-line-number="${safeAnchor.lineNumber}"]`);
  } else {
    target = frame.querySelector(`[data-selectable-word="true"][data-word-id="${safeAnchor.wordId}"]`);
  }

  if (!target) {
    return null;
  }

  return getRelativeRectFromBounds(target.getBoundingClientRect(), frame.getBoundingClientRect());
}

function applySelectionRectToElement(frame, element, item) {
  if (!frame || !element || !item) {
    return;
  }

  const anchoredRect = resolveSelectionRectFromAnchor(frame, item.anchor);
  const storedRect = sanitizeSelectionRect(item.rect);
  const baseRect = anchoredRect || storedRect;
  const rect =
    item.scope === "next-page-link" && baseRect
      ? sanitizeSelectionRect({
          x: 0.035,
          y: Math.max(0.02, baseRect.y - 0.01),
          width: 0.93,
          height: Math.max(baseRect.height + 0.02, 0.09),
        })
      : baseRect;
  if (!rect) {
    element.style.cssText = "";
    return;
  }

  element.style.cssText = selectionRectStyle(rect);
}

function snapPageEditorSelection(stage, rawRect, scope = "word") {
  const safeRawRect = sanitizeSelectionRect(rawRect);
  if (!stage || !safeRawRect) {
    return {
      rawRect: safeRawRect,
      rect: safeRawRect,
      anchor: null,
    };
  }

  const frame = stage.closest(".page-editor-image-viewport");
  if (!frame) {
    return {
      rawRect: safeRawRect,
      rect: safeRawRect,
      anchor: null,
    };
  }

  const selector = scope === "line" || scope === "next-page-link" ? ".mushaf-line:not(.empty)" : '[data-selectable-word="true"]';
  const targets = Array.from(frame.querySelectorAll(selector));
  const frameBounds = frame.getBoundingClientRect();
  if (!targets.length || !frameBounds.width || !frameBounds.height) {
    return {
      rawRect: safeRawRect,
      rect: safeRawRect,
      anchor: null,
    };
  }

  let bestTarget = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  targets.forEach((target) => {
    const targetRect = getRelativeRectFromBounds(target.getBoundingClientRect(), frameBounds);
    const anchor = buildSelectionAnchorFromElement(target, scope);
    if (!targetRect || !anchor) {
      return;
    }

    const overlapArea = getRectOverlapArea(safeRawRect, targetRect);
    const distanceScore = getRectCenterDistance(safeRawRect, targetRect);
    const score = overlapArea > 0 ? overlapArea * 1000 - distanceScore : -distanceScore;

    if (score > bestScore) {
      bestScore = score;
      bestTarget = {
        rect: targetRect,
        anchor,
      };
    }
  });

  return {
    rawRect: safeRawRect,
    rect: bestTarget?.rect || safeRawRect,
    anchor: bestTarget?.anchor || null,
  };
}

function getPrimaryProgramZone(programZones) {
  const priority = ["new", "yesterday", "recent", "consolidation", "old-today", "old-pool"];
  return priority.find((zoneKey) => programZones.some((zone) => zone.key === zoneKey)) || null;
}

function getPrimaryProgramZoneInfo(programZones) {
  const zoneKey = getPrimaryProgramZone(programZones);
  if (!zoneKey) {
    return null;
  }

  return programZones.find((zone) => zone.key === zoneKey) || null;
}

function buildLearnedRangeFromProgress(completedHalfPages, totalHalfPages, direction = "forward") {
  const safeCompleted = Math.max(0, Math.min(Number(completedHalfPages) || 0, totalHalfPages));
  if (!safeCompleted) {
    return null;
  }

  const physicalStart = sequenceHalfPageToPhysicalHalfPage(1, totalHalfPages, direction);
  const physicalEnd = sequenceHalfPageToPhysicalHalfPage(safeCompleted, totalHalfPages, direction);
  return {
    coverageStart: Math.min(physicalStart, physicalEnd),
    coverageEnd: Math.max(physicalStart, physicalEnd),
  };
}

function getLearnedRangesFromPayload(payload = state.payload) {
  const mode = payload?.settings?.programMode || "forward";
  const totalHalfPages = Math.max(2, Number(payload?.settings?.totalHalfPages) || 2);
  const phases = getProgramPhasesForMode(mode);
  const phaseProgressHalfPages = getPhaseProgressHalfPagesFromPayload(payload, mode);
  return phases
    .map((direction, index) => buildLearnedRangeFromProgress(phaseProgressHalfPages[index] || 0, totalHalfPages, direction))
    .filter(Boolean);
}

function isLearnedFromProgram(payload, page) {
  return getLearnedRangesFromPayload(payload).some((range) => pageIntersectsRange(page, range));
}

function pageCellClass(entry, page, effectiveLearned, programZones) {
  const classes = ["page-cell"];
  if (entry.dominantSeverity !== "none") {
    classes.push(entry.dominantSeverity);
  } else {
    classes.push("none");
  }

  if (effectiveLearned) {
    classes.push("learned");
    classes.push("learned-from-program");
  }

  const primaryZone = getPrimaryProgramZone(programZones);
  if (primaryZone) {
    classes.push(`zone-${primaryZone}`);
  }

  if (programZones.length > 1) {
    classes.push("multi-zone");
  }

  if (state.activePage === page) {
    classes.push("active-page");
  }

  return classes.join(" ");
}

function pageIntersectsRange(page, range) {
  if (!range) {
    return false;
  }

  const pageStart = (page - 1) * PROGRESS_UNITS_PER_PAGE + 1;
  const pageEnd = page * PROGRESS_UNITS_PER_PAGE;
  const coverageStart = Number.isFinite(range.coverageStart) ? range.coverageStart : range.start;
  const coverageEnd = Number.isFinite(range.coverageEnd) ? range.coverageEnd : range.end;
  return coverageStart <= pageEnd && coverageEnd >= pageStart;
}

function getSurahsForPage(page) {
  return SURAH_PAGE_RANGES.filter((surah) => page >= surah.startPage && page <= surah.endPage);
}

function buildJuzPageRanges(totalPages) {
  const safeTotalPages = Math.max(1, Number.parseInt(totalPages, 10) || 1);
  return JUZ_START_PAGES
    .map((startPage, index) => {
      const nextStart = JUZ_START_PAGES[index + 1];
      const naturalEnd = nextStart ? nextStart - 1 : 604;
      return {
        juz: index + 1,
        startPage,
        endPage: index === JUZ_START_PAGES.length - 1 ? safeTotalPages : Math.min(safeTotalPages, naturalEnd),
        name: JUZ_NAMES[index]?.latin || `Juz ${index + 1}`,
        arabicName: JUZ_NAMES[index]?.arabic || "",
      };
    })
    .filter((range) => range.startPage <= safeTotalPages && range.startPage <= range.endPage);
}

function ensureCollapsedJuzState(totalPages) {
  const groups = buildJuzPageRanges(totalPages);
  const nextCollapsedState = {};

  groups.forEach((group) => {
    nextCollapsedState[group.juz] =
      typeof state.collapsedJuzs?.[group.juz] === "boolean" ? state.collapsedJuzs[group.juz] : true;
  });

  state.collapsedJuzs = nextCollapsedState;
  return groups;
}

function getPrimarySurahForPage(page) {
  const surahs = getSurahsForPage(page);
  return surahs.find((surah) => surah.startPage === page) || surahs[0] || null;
}

function getSurahStartNamesForPage(page) {
  return getSurahsForPage(page).filter((surah) => surah.startPage === page);
}

function buildSurahCaption(page) {
  const primarySurah = getPrimarySurahForPage(page);
  if (!primarySurah) {
    return null;
  }

  return {
    simple: primarySurah.simple,
    arabic: primarySurah.arabic,
    startsHere: primarySurah.startPage === page,
  };
}

function getSurahsForRange(range) {
  if (!range) {
    return [];
  }

  const coverageStart = Number.isFinite(range.coverageStart)
    ? range.coverageStart
    : Math.min(range.physicalStart || range.start || 0, range.physicalEnd || range.end || 0);
  const coverageEnd = Number.isFinite(range.coverageEnd)
    ? range.coverageEnd
    : Math.max(range.physicalStart || range.start || 0, range.physicalEnd || range.end || 0);

  if (!coverageStart || !coverageEnd) {
    return [];
  }

  const startPage = Math.ceil(coverageStart / PROGRESS_UNITS_PER_PAGE);
  const endPage = Math.ceil(coverageEnd / PROGRESS_UNITS_PER_PAGE);
  return SURAH_PAGE_RANGES.filter((surah) => surah.endPage >= startPage && surah.startPage <= endPage);
}

function getRangeSurahSummary(range) {
  const surahs = getSurahsForRange(range);
  if (!surahs.length) {
    return null;
  }

  const firstSurah = surahs[0];
  const lastSurah = surahs[surahs.length - 1];
  const summary =
    surahs.length === 1
      ? firstSurah.simple
      : surahs.length === 2
        ? `${firstSurah.simple} -> ${lastSurah.simple}`
        : `${firstSurah.simple} -> ${lastSurah.simple} (+${surahs.length - 2})`;

  return {
    surahs,
    summary,
    firstSurah,
    lastSurah,
  };
}

function buildRangeSurahSummaryText(range) {
  return getRangeSurahSummary(range)?.summary || "";
}

function buildRangeSurahChips(range, { compact = false } = {}) {
  const summary = getRangeSurahSummary(range);
  if (!summary) {
    return "";
  }

  const startPage = Math.ceil(
    (Number.isFinite(range.coverageStart) ? range.coverageStart : range.physicalStart || range.start || 1) /
      PROGRESS_UNITS_PER_PAGE,
  );
  const visibleSurahs = summary.surahs.slice(0, compact ? 2 : 3);
  const extraCount = summary.surahs.length - visibleSurahs.length;

  return `
    <div class="surah-range-row ${compact ? "compact" : ""}">
      ${visibleSurahs
        .map(
          (surah) => `
            <span class="surah-chip ${surah.startPage === startPage ? "start" : ""}">
              <span>${escapeHtml(surah.simple)}</span>
              <strong>${escapeHtml(surah.arabic)}</strong>
            </span>
          `,
        )
        .join("")}
      ${extraCount > 0 ? `<span class="surah-chip more">+${escapeHtml(extraCount)}</span>` : ""}
    </div>
  `;
}

function getSurahById(id) {
  return SURAH_BY_ID.get(Number(id)) || null;
}

function shuffleList(list) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function clampSurahId(value, fallback = 1) {
  const maxId = SURAH_PAGE_RANGES.length || 114;
  const safeValue = Number(value);
  if (!Number.isFinite(safeValue)) {
    return Math.max(1, Math.min(fallback, maxId));
  }
  return Math.max(1, Math.min(Math.round(safeValue), maxId));
}

function sanitizeSurahGameRange(startId = state.surahGame.rangeStartId, endId = state.surahGame.rangeEndId) {
  const safeStart = clampSurahId(startId, 1);
  const safeEnd = clampSurahId(endId, SURAH_PAGE_RANGES.length || 114);
  return safeStart <= safeEnd ? { startId: safeStart, endId: safeEnd } : { startId: safeEnd, endId: safeStart };
}

function getSurahGameRangeLabel(startSurah, endSurah, payload = state.payload) {
  if (!startSurah || !endSurah) {
    return "";
  }

  if (startSurah.id === 1 && endSurah.id === SURAH_PAGE_RANGES.length) {
    return t("surahs.activeSpanAll", {}, payload);
  }

  return startSurah.id === endSurah.id ? startSurah.simple : `${startSurah.simple} -> ${endSurah.simple}`;
}

function getSurahGamePromptSeeds(surahs) {
  const ids = new Set(surahs.map((surah) => surah.id));
  return surahs.flatMap((surah) => {
    const seeds = [];
    if (ids.has(surah.id - 1)) {
      seeds.push({
        key: `${surah.id}:previous`,
        centerId: surah.id,
        promptType: "previous",
        correctId: surah.id - 1,
      });
    }
    if (ids.has(surah.id + 1)) {
      seeds.push({
        key: `${surah.id}:next`,
        centerId: surah.id,
        promptType: "next",
        correctId: surah.id + 1,
      });
    }
    return seeds;
  });
}

function getSurahGameCorpus(payload = state.payload, rangeStartId = state.surahGame.rangeStartId, rangeEndId = state.surahGame.rangeEndId) {
  const { startId, endId } = sanitizeSurahGameRange(rangeStartId, rangeEndId);
  const surahs = SURAH_PAGE_RANGES.filter((surah) => surah.id >= startId && surah.id <= endId);
  const promptSeeds = getSurahGamePromptSeeds(surahs);
  const startSurah = surahs[0] || null;
  const endSurah = surahs[surahs.length - 1] || null;
  return {
    startId,
    endId,
    surahs,
    ids: new Set(surahs.map((surah) => surah.id)),
    promptSeeds,
    playable: promptSeeds.length > 0,
    startSurah,
    endSurah,
    signature: `${startId}:${endId}`,
    label: getSurahGameRangeLabel(startSurah, endSurah, payload),
  };
}

function getSurahChoiceIds(seed, corpus) {
  const chosen = [];
  const seen = new Set([seed.correctId, seed.centerId]);
  const preferredOffsets = [-2, -1, 1, 2, -3, 3, -4, 4];
  const pushCandidate = (candidateId) => {
    if (candidateId >= 1 && candidateId <= SURAH_PAGE_RANGES.length && !seen.has(candidateId)) {
      chosen.push(candidateId);
      seen.add(candidateId);
    }
  };

  preferredOffsets.forEach((offset) => {
    const candidateId = seed.correctId + offset;
    if (corpus.ids.has(candidateId)) {
      pushCandidate(candidateId);
    }
  });

  corpus.surahs.forEach((surah) => {
    pushCandidate(surah.id);
  });

  preferredOffsets.forEach((offset) => {
    pushCandidate(seed.correctId + offset);
  });

  SURAH_PAGE_RANGES.forEach((surah) => {
    pushCandidate(surah.id);
  });

  return shuffleList(chosen.slice(0, 3));
}

function createSurahGameQuestion(corpus, previousQuestion = null) {
  if (!corpus.playable) {
    return null;
  }

  const availableSeeds =
    previousQuestion && corpus.promptSeeds.length > 1
      ? corpus.promptSeeds.filter((seed) => seed.key !== `${previousQuestion.centerId}:${previousQuestion.promptType}`)
      : corpus.promptSeeds;
  const pool = availableSeeds.length ? availableSeeds : corpus.promptSeeds;
  const seed = pool[Math.floor(Math.random() * pool.length)];
  const choiceIds = shuffleList([seed.correctId, ...getSurahChoiceIds(seed, corpus)]);

  return {
    centerId: seed.centerId,
    promptType: seed.promptType,
    correctId: seed.correctId,
    choiceIds,
    answeredId: null,
    isCorrect: null,
  };
}

function clearSurahGamePreviewTimer() {
  if (surahGamePreviewTimer) {
    window.clearTimeout(surahGamePreviewTimer);
    surahGamePreviewTimer = null;
  }
}

function buildDistinctShuffle(ids) {
  if (ids.length < 2) {
    return [...ids];
  }

  let shuffled = [...ids];
  let attempts = 0;
  while (attempts < 6 && shuffled.every((id, index) => id === ids[index])) {
    shuffled = shuffleList([...ids]);
    attempts += 1;
  }
  return shuffled;
}

function createSurahMemoryRound(corpus) {
  if (corpus.surahs.length < SURAH_MEMORY_LENGTH) {
    return null;
  }

  const maxStartIndex = Math.max(0, corpus.surahs.length - SURAH_MEMORY_LENGTH);
  const startIndex = Math.floor(Math.random() * (maxStartIndex + 1));
  const orderedIds = corpus.surahs.slice(startIndex, startIndex + SURAH_MEMORY_LENGTH).map((surah) => surah.id);

  return {
    orderedIds,
    shuffledIds: buildDistinctShuffle(orderedIds),
    selectedIds: [],
    phase: "preview",
    previewEndsAt: Date.now() + SURAH_MEMORY_PREVIEW_MS,
    isCorrect: null,
  };
}

function getSurahMemoryCountdown(round = state.surahGame.memoryRound) {
  if (!round || round.phase !== "preview" || !round.previewEndsAt) {
    return {
      remainingMs: 0,
      remainingSeconds: 0,
      progressPercent: 0,
    };
  }

  const remainingMs = Math.max(0, round.previewEndsAt - Date.now());
  return {
    remainingMs,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    progressPercent: Math.max(0, Math.min(100, (remainingMs / SURAH_MEMORY_PREVIEW_MS) * 100)),
  };
}

function revealSurahMemoryRound() {
  if (!state.surahGame.memoryRound || state.surahGame.memoryRound.phase !== "preview") {
    return;
  }

  clearSurahGamePreviewTimer();
  state.surahGame.memoryRound = {
    ...state.surahGame.memoryRound,
    phase: "reorder",
    previewEndsAt: null,
    selectedIds: [],
    shuffledIds: buildDistinctShuffle(state.surahGame.memoryRound.orderedIds),
  };
}

function scheduleSurahGamePreview(payload = state.payload) {
  clearSurahGamePreviewTimer();
  if (state.surahGame.gameMode !== "memory") {
    return;
  }

  const round = state.surahGame.memoryRound;
  if (!round || round.phase !== "preview") {
    return;
  }

  const countdown = getSurahMemoryCountdown(round);
  if (countdown.remainingMs <= 0) {
    revealSurahMemoryRound();
    renderSurahGame(payload);
    return;
  }

  surahGamePreviewTimer = window.setTimeout(() => {
    if (state.surahGame.gameMode !== "memory" || state.surahGame.memoryRound?.phase !== "preview") {
      return;
    }
    if (getSurahMemoryCountdown().remainingMs <= 0) {
      revealSurahMemoryRound();
    }
    renderSurahGame(payload);
  }, Math.min(250, countdown.remainingMs));
}

function updateSurahGameStats(isCorrect) {
  const previousStreak = state.surahGame.streak;
  const previousBestStreak = state.surahGame.bestStreak;
  state.surahGame.answered += 1;
  if (isCorrect) {
    state.surahGame.correct += 1;
    state.surahGame.streak += 1;
    state.surahGame.bestStreak = Math.max(state.surahGame.bestStreak, state.surahGame.streak);
  } else {
    state.surahGame.streak = 0;
  }

  return {
    isCorrect,
    streak: state.surahGame.streak,
    bestStreak: state.surahGame.bestStreak,
    previousStreak,
    previousBestStreak,
  };
}

function getSurahMemoryRemainingIds(round = state.surahGame.memoryRound) {
  if (!round) {
    return [];
  }
  return round.shuffledIds.filter((id) => !round.selectedIds.includes(id));
}

function addSurahMemoryChoice(choiceId) {
  const round = state.surahGame.memoryRound;
  if (!round || round.phase !== "reorder" || round.selectedIds.includes(choiceId)) {
    return null;
  }

  const selectedIds = [...round.selectedIds, Number(choiceId)];
  let nextRound = {
    ...round,
    selectedIds,
  };

  let outcome = null;
  if (selectedIds.length === round.orderedIds.length) {
    const isCorrect = selectedIds.every((id, index) => id === round.orderedIds[index]);
    nextRound = {
      ...nextRound,
      phase: "result",
      isCorrect,
    };
    outcome = updateSurahGameStats(isCorrect);
  }

  state.surahGame.memoryRound = nextRound;
  return outcome;
}

function removeSurahMemoryChoice(choiceId) {
  const round = state.surahGame.memoryRound;
  if (!round || round.phase === "preview") {
    return;
  }

  state.surahGame.memoryRound = {
    ...round,
    phase: "reorder",
    isCorrect: null,
    selectedIds: round.selectedIds.filter((id) => id !== Number(choiceId)),
  };
}

function clearSurahMemoryChoices() {
  const round = state.surahGame.memoryRound;
  if (!round || round.phase === "preview") {
    return;
  }

  state.surahGame.memoryRound = {
    ...round,
    phase: "reorder",
    isCorrect: null,
    selectedIds: [],
  };
}

function replaySurahMemoryRound() {
  const round = state.surahGame.memoryRound;
  if (!round) {
    return;
  }

  clearSurahGamePreviewTimer();
  state.surahGame.memoryRound = {
    ...round,
    phase: "preview",
    previewEndsAt: Date.now() + SURAH_MEMORY_PREVIEW_MS,
    selectedIds: [],
    isCorrect: null,
  };
}

function resetSurahGame(
  payload = state.payload,
  {
    rangeStartId = state.surahGame.rangeStartId || 1,
    rangeEndId = state.surahGame.rangeEndId || SURAH_PAGE_RANGES.length || 114,
    gameMode = state.surahGame.gameMode || "quiz",
    resetStats = true,
    autoStart = false,
  } = {},
) {
  clearSurahGamePreviewTimer();
  const corpus = getSurahGameCorpus(payload, rangeStartId, rangeEndId);
  state.surahGame.rangeStartId = corpus.startId;
  state.surahGame.rangeEndId = corpus.endId;
  state.surahGame.gameMode = gameMode;
  state.surahGame.isStarted = autoStart;
  state.surahGame.signature = corpus.signature;
  if (resetStats) {
    state.surahGame.answered = 0;
    state.surahGame.correct = 0;
    state.surahGame.streak = 0;
    state.surahGame.bestStreak = 0;
  }
  state.surahGame.question = autoStart && gameMode === "quiz" ? createSurahGameQuestion(corpus) : null;
  state.surahGame.memoryRound = autoStart && gameMode === "memory" ? createSurahMemoryRound(corpus) : null;
  return corpus;
}

function startSurahGame(payload = state.payload) {
  clearSurahGamePreviewTimer();
  const corpus = getSurahGameCorpus(payload, state.surahGame.rangeStartId, state.surahGame.rangeEndId);
  const canStart = state.surahGame.gameMode === "memory" ? corpus.surahs.length >= SURAH_MEMORY_LENGTH : corpus.playable;
  state.surahGame.rangeStartId = corpus.startId;
  state.surahGame.rangeEndId = corpus.endId;
  state.surahGame.signature = corpus.signature;
  state.surahGame.isStarted = canStart;
  state.surahGame.question = canStart && state.surahGame.gameMode === "quiz" ? createSurahGameQuestion(corpus) : null;
  state.surahGame.memoryRound = canStart && state.surahGame.gameMode === "memory" ? createSurahMemoryRound(corpus) : null;
  return corpus;
}

function ensureSurahGameState(payload = state.payload) {
  if (!state.surahGame.rangeStartId || !state.surahGame.rangeEndId) {
    state.surahGame.rangeStartId = 1;
    state.surahGame.rangeEndId = SURAH_PAGE_RANGES.length || 114;
  }
  if (!state.surahGame.gameMode) {
    state.surahGame.gameMode = "quiz";
  }

  let corpus = getSurahGameCorpus(payload, state.surahGame.rangeStartId, state.surahGame.rangeEndId);
  if (corpus.signature !== state.surahGame.signature) {
    corpus = resetSurahGame(payload, {
      rangeStartId: state.surahGame.rangeStartId,
      rangeEndId: state.surahGame.rangeEndId,
      gameMode: state.surahGame.gameMode,
      resetStats: true,
      autoStart: false,
    });
  } else if (state.surahGame.isStarted && state.surahGame.gameMode === "quiz" && !state.surahGame.question && corpus.playable) {
    state.surahGame.question = createSurahGameQuestion(corpus);
  } else if (
    state.surahGame.isStarted &&
    state.surahGame.gameMode === "memory" &&
    !state.surahGame.memoryRound &&
    corpus.surahs.length >= SURAH_MEMORY_LENGTH
  ) {
    state.surahGame.memoryRound = createSurahMemoryRound(corpus);
  }

  return corpus;
}

function answerSurahGameQuestion(choiceId) {
  if (!state.surahGame.question || state.surahGame.question.answeredId !== null) {
    return null;
  }

  const selectedId = Number(choiceId);
  const isCorrect = selectedId === state.surahGame.question.correctId;
  state.surahGame.question = {
    ...state.surahGame.question,
    answeredId: selectedId,
    isCorrect,
  };
  return updateSurahGameStats(isCorrect);
}

function getSurahGameAccuracy(correct = state.surahGame.correct, answered = state.surahGame.answered) {
  if (!answered) {
    return 0;
  }
  return Math.round((correct / answered) * 100);
}

function getSurahHeatTier(streak = state.surahGame.streak) {
  const tiers = [
    { min: 0, key: "surahs.heatCalm", flames: 1, theme: "calm", next: 3 },
    { min: 3, key: "surahs.heatWarm", flames: 2, theme: "warm", next: 5 },
    { min: 5, key: "surahs.heatFire", flames: 3, theme: "fire", next: 8 },
    { min: 8, key: "surahs.heatBlazing", flames: 4, theme: "blazing", next: 12 },
    { min: 12, key: "surahs.heatLegend", flames: 5, theme: "legend", next: null },
  ];

  const tier = tiers.reduce((current, candidate) => (streak >= candidate.min ? candidate : current), tiers[0]);
  const previousFloor = tier.min;
  const nextFloor = tier.next;
  const progress =
    nextFloor === null ? 100 : Math.max(0, Math.min(100, ((streak - previousFloor) / Math.max(1, nextFloor - previousFloor)) * 100));

  return {
    ...tier,
    progress,
    remaining: nextFloor === null ? 0 : Math.max(0, nextFloor - streak),
  };
}

function buildSurahFlamesMarkup(streak = state.surahGame.streak) {
  const tier = getSurahHeatTier(streak);
  const flames = "🔥".repeat(tier.flames);
  return `<span class="surah-heat-flames" aria-hidden="true">${escapeHtml(flames)}</span>`;
}

function buildSurahIdentityMarkup(surah, { compact = false } = {}) {
  if (!surah) {
    return "";
  }

  return `
    <div class="surah-identity ${compact ? "compact" : ""}">
      <em>${escapeHtml(surah.arabic)}</em>
      <strong>${escapeHtml(surah.simple)}</strong>
    </div>
  `;
}

function buildSurahFlamesClusterMarkup(streak = state.surahGame.streak) {
  const tier = getSurahHeatTier(streak);
  return `
    <span class="surah-heat-flames" aria-hidden="true">
      ${Array.from({ length: tier.flames }, (_, index) => {
        const delay = `${(index * 0.12).toFixed(2)}s`;
        return `
          <span class="surah-flame" style="--flame-delay:${delay}">
            <span class="surah-flame-core">🔥</span>
            <span class="surah-flame-particle particle-a"></span>
            <span class="surah-flame-particle particle-b"></span>
            <span class="surah-flame-particle particle-c"></span>
          </span>
        `;
      }).join("")}
    </span>
  `;
}

function buildSurahCoverageMarkup(corpus) {
  if (!corpus.startSurah || !corpus.endSurah) {
    return `<span class="helper">${escapeHtml(t("surahs.coverageEmpty"))}</span>`;
  }

  return `
    <div class="surah-span-list">
      <span class="surah-span-chip ${corpus.startId === 1 && corpus.endId === SURAH_PAGE_RANGES.length ? "all" : ""}">
        ${escapeHtml(corpus.label)}
      </span>
      <span class="surah-span-chip more">
        ${escapeHtml(t("surahs.pagesLabel", { start: corpus.startSurah.startPage, end: corpus.endSurah.endPage }))}
      </span>
    </div>
  `;
}

function buildSurahSelectOptions(selectedId) {
  return SURAH_PAGE_RANGES.map(
    (surah) => `
      <option value="${escapeHtml(surah.id)}" ${surah.id === selectedId ? "selected" : ""}>
        ${escapeHtml(`${surah.id}. ${surah.simple}`)}
      </option>
    `,
  ).join("");
}

function buildSurahSequenceMarkup(centerId) {
  const center = getSurahById(centerId);
  if (!center) {
    return "";
  }

  return [center.id - 1, center.id, center.id + 1]
    .map((surahId) => getSurahById(surahId))
    .filter(Boolean)
    .map(
      (surah) => `
        <article class="surah-sequence-card ${surah.id === center.id ? "current" : ""}">
          ${buildSurahIdentityMarkup(surah, { compact: true })}
        </article>
      `,
    )
    .join("");
}

function buildSurahGameModeMarkup(payload = state.payload, { compact = false } = {}) {
  const gameMode = state.surahGame.gameMode || "quiz";
  return `
    <div class="surah-mode-row ${compact ? "compact" : ""}">
      <button
        class="surah-mode-button ${compact ? "compact" : ""} ${gameMode === "quiz" ? "active" : ""}"
        type="button"
        data-surah-game-action="set-play-mode"
        data-play-mode="quiz"
      >
        <strong>${escapeHtml(t("surahs.playModeQuiz", {}, payload))}</strong>
        <span>${escapeHtml(t("surahs.playModeQuizHint", {}, payload))}</span>
      </button>
      <button
        class="surah-mode-button ${compact ? "compact" : ""} ${gameMode === "memory" ? "active" : ""}"
        type="button"
        data-surah-game-action="set-play-mode"
        data-play-mode="memory"
      >
        <strong>${escapeHtml(t("surahs.playModeMemory", {}, payload))}</strong>
        <span>${escapeHtml(t("surahs.playModeMemoryHint", {}, payload))}</span>
      </button>
    </div>
  `;
}

function buildSurahMemorySequenceMarkup(ids, { removable = false, reveal = false } = {}) {
  return ids
    .map((surahId, index) => {
      const surah = getSurahById(surahId);
      if (!surah) {
        return "";
      }
      return `
        <button
          class="surah-memory-chip ${reveal ? "reveal" : ""}"
          type="button"
          ${removable ? `data-surah-game-action="memory-remove" data-choice-id="${escapeHtml(surahId)}"` : "disabled"}
        >
          <span class="surah-memory-index">${escapeHtml(index + 1)}</span>
          ${buildSurahIdentityMarkup(surah, { compact: true })}
        </button>
      `;
    })
    .join("");
}

function buildSurahMemoryPoolMarkup(ids) {
  return ids
    .map((surahId) => {
      const surah = getSurahById(surahId);
      if (!surah) {
        return "";
      }
      return `
        <button
          class="surah-choice-button surah-memory-choice"
          type="button"
          data-surah-game-action="memory-pick"
          data-choice-id="${escapeHtml(surahId)}"
        >
          ${buildSurahIdentityMarkup(surah, { compact: true })}
        </button>
      `;
    })
    .join("");
}

function buildSurahMemoryMarkup(payload, corpus, heatTier) {
  const round = state.surahGame.memoryRound;
  if (corpus.surahs.length < SURAH_MEMORY_LENGTH) {
    return `
      <section class="surah-empty-state">
        <h3>${escapeHtml(t("surahs.emptyMemoryTitle", {}, payload))}</h3>
        <p class="muted">${escapeHtml(t("surahs.emptyMemoryHelp", {}, payload))}</p>
      </section>
    `;
  }

  if (!round) {
    return `
      <section class="surah-empty-state">
        <h3>${escapeHtml(t("surahs.emptyAllTitle", {}, payload))}</h3>
        <p class="muted">${escapeHtml(t("surahs.emptyAllHelp", {}, payload))}</p>
      </section>
    `;
  }

  const countdown = getSurahMemoryCountdown(round);
  const canEditSelection = round.phase === "reorder";
  const selectedMarkup = buildSurahMemorySequenceMarkup(round.selectedIds, { removable: canEditSelection });
  const remainingMarkup = buildSurahMemoryPoolMarkup(getSurahMemoryRemainingIds(round));
  const revealMarkup = buildSurahMemorySequenceMarkup(round.orderedIds, { reveal: true });

  if (round.phase === "preview") {
    return `
      <section class="surah-memory-shell">
        <article class="surah-memory-preview-card">
          <div class="surah-memory-preview-head">
            <div>
              <span class="eyebrow">${escapeHtml(t("surahs.memoryPreviewTitle", {}, payload))}</span>
              <h3>${escapeHtml(t("surahs.memoryPreviewHelp", {}, payload))}</h3>
            </div>
            <div class="surah-memory-countdown">
              <span>${escapeHtml(t("surahs.memoryCountdownLabel", {}, payload))}</span>
              <strong>${escapeHtml(t("surahs.memoryCountdownValue", { count: countdown.remainingSeconds }, payload))}</strong>
            </div>
          </div>
          <div class="surah-heat-track surah-memory-track" aria-hidden="true">
            <span style="width:${escapeHtml(countdown.progressPercent)}%"></span>
          </div>
          <div class="surah-memory-grid">
            ${revealMarkup}
          </div>
          <div class="surah-memory-actions">
            <button class="secondary-button" type="button" data-surah-game-action="memory-skip-preview">
              ${escapeHtml(t("surahs.memoryPreviewSkip", {}, payload))}
            </button>
          </div>
        </article>
      </section>
    `;
  }

  return `
    <section class="surah-memory-shell">
      <article class="surah-question-panel surah-memory-panel ${round.phase === "result" && !round.isCorrect ? "is-wrong-result" : ""}">
        <div class="surah-question-copy">
          <span class="eyebrow">${escapeHtml(t("surahs.memoryReorderTitle", {}, payload))}</span>
          <h3>${escapeHtml(t("surahs.memoryReorderHelp", {}, payload))}</h3>
        </div>
        <div class="surah-memory-progress-row">
          <div class="surah-feedback-heat">
            ${buildSurahFlamesClusterMarkup(state.surahGame.streak)}
            <strong>${escapeHtml(t(heatTier.key, {}, payload))}</strong>
            <span>${escapeHtml(t("surahs.memoryAnswerProgress", { count: round.selectedIds.length }, payload))}</span>
          </div>
          <div class="surah-memory-actions">
            <button class="secondary-button" type="button" data-surah-game-action="memory-clear">
              ${escapeHtml(t("surahs.memoryClear", {}, payload))}
            </button>
            <button class="secondary-button" type="button" data-surah-game-action="memory-replay">
              ${escapeHtml(t("surahs.memoryReplay", {}, payload))}
            </button>
          </div>
        </div>
        <div class="surah-memory-columns">
          <div class="surah-memory-stack">
            <span class="eyebrow">${escapeHtml(t("surahs.memorySelectedLabel", {}, payload))}</span>
            <div class="surah-memory-grid selected ${round.phase === "result" ? "result" : ""} ${round.phase === "result" && !round.isCorrect ? "wrong" : ""}">
              ${
                round.selectedIds.length
                  ? selectedMarkup
                  : `<span class="helper">${escapeHtml(t("surahs.memoryAnswerProgress", { count: 0 }, payload))}</span>`
              }
            </div>
          </div>
          <div class="surah-memory-stack">
            <span class="eyebrow">${escapeHtml(t("surahs.memoryRemainingLabel", {}, payload))}</span>
            <div class="surah-memory-grid">
              ${remainingMarkup || `<span class="helper">${escapeHtml(t("surahs.memoryRemainingDone", {}, payload))}</span>`}
            </div>
          </div>
        </div>
        ${
          round.phase === "result"
            ? `
              <div class="surah-feedback ${round.isCorrect ? "correct" : "wrong"}">
                <p>${escapeHtml(t(round.isCorrect ? "surahs.memoryCorrect" : "surahs.memoryWrong", {}, payload))}</p>
                <div class="surah-sequence-block">
                  <span class="eyebrow">${escapeHtml(t("surahs.sequenceLabel", {}, payload))}</span>
                  <div class="surah-memory-grid reveal">
                    ${revealMarkup}
                  </div>
                </div>
                <button class="primary-button" type="button" data-surah-game-action="memory-next">
                  ${escapeHtml(t("surahs.memoryNewRound", {}, payload))}
                </button>
              </div>
            `
            : ""
        }
      </article>
    </section>
  `;
}

function getProgramZones(plan) {
  const blocks = plan && plan.blocks ? plan.blocks : {};
  return [
    {
      key: "old-pool",
      label: t("program.old"),
      shortLabel: t("program.oldShort"),
      range: blocks.old && blocks.old.poolRange ? blocks.old.poolRange : null,
      definition: t("program.oldDef"),
    },
    {
      key: "old-today",
      label: t("program.oldToday"),
      shortLabel: t("program.oldTodayShort"),
      range: blocks.old && blocks.old.range ? blocks.old.range : null,
      definition: t("program.oldTodayDef"),
    },
    {
      key: "consolidation",
      label: t("program.consolidation"),
      shortLabel: t("program.consolidationShort"),
      range: blocks.consolidation && blocks.consolidation.fullRange ? blocks.consolidation.fullRange : null,
      definition: t("program.consolidationDef"),
    },
    {
      key: "recent",
      label: t("program.recent"),
      shortLabel: t("program.recentShort"),
      range: blocks.recent && blocks.recent.range ? blocks.recent.range : null,
      definition: t("program.recentDef"),
    },
    {
      key: "yesterday",
      label: t("program.yesterday"),
      shortLabel: t("program.yesterdayShort"),
      range: blocks.yesterday && blocks.yesterday.range ? blocks.yesterday.range : null,
      definition: t("program.yesterdayDef"),
    },
    {
      key: "new",
      label: t("program.new"),
      shortLabel: t("program.newShort"),
      range: blocks.new && blocks.new.range ? blocks.new.range : null,
      definition: t("program.newDef"),
    },
  ];
}

function getPageProgramZones(plan, page) {
  return getProgramZones(plan).filter((zone) => pageIntersectsRange(page, zone.range));
}

function renderProgramLegend(plan) {
  const markup = getProgramZones(plan)
    .map((zone) => {
      const surahSummary = buildRangeSurahSummaryText(zone.range);
      return `
        <article class="program-legend-chip ${zone.key} ${zone.range ? "" : "disabled"}">
          <span class="program-tag ${zone.key}">${escapeHtml(zone.label)}</span>
          <div class="program-definition-stack">
            <p class="program-definition">${escapeHtml(zone.definition)}</p>
            ${surahSummary ? `<p class="program-surah-line">${escapeHtml(surahSummary)}</p>` : ""}
          </div>
        </article>
      `;
    })
    .join("");

  $("#program-legend").innerHTML = markup;
}

function buildPageStateLabel(entry, effectiveLearned) {
  const severity = severityLabel(entry.dominantSeverity);
  if (!effectiveLearned) {
    return severity;
  }

  if (entry.dominantSeverity === "none") {
    return t("page.learned");
  }

  return t("page.learnedWithSeverity", { severity });
}

function buildPageGridStateLabel(entry, effectiveLearned) {
  if (entry.dominantSeverity !== "none") {
    return severityLabel(entry.dominantSeverity);
  }

  if (effectiveLearned) {
    return t("page.learned");
  }

  return t("page.neutral");
}

function renderPageQuickActions(payload) {
  const container = $("#page-quick-actions");
  if (!container) {
    return;
  }
  const totalPages = payload.errorTracking.totalPages;

  if (!Number.isInteger(state.activePage) || state.activePage < 1 || state.activePage > totalPages) {
    state.activePage = null;
    container.innerHTML = `
      <div class="quick-actions-card empty">
        <p class="eyebrow">${escapeHtml(t("quick.noneLabel"))}</p>
        <strong>${escapeHtml(t("quick.noneTitle"))}</strong>
        <p class="helper">${escapeHtml(t("quick.noneHelp"))}</p>
      </div>
    `;
    return;
  }

  const page = state.activePage;
  const entry = normalizePageEntry((payload.pageErrors || {})[String(page)]);
  const programZones = getPageProgramZones(payload.plan || {}, page);
  const pageSurahs = getSurahsForPage(page);
  const primaryZone = getPrimaryProgramZoneInfo(programZones);
  const effectiveLearned = isLearnedFromProgram(payload, page);
  const stateLabel = buildPageStateLabel(entry, effectiveLearned);
  const latestNoteEvent = entry.latestNoteEvent;
  const programTags = programZones
    .map((zone) => `<span class="program-tag ${escapeHtml(zone.key)}">${escapeHtml(zone.shortLabel)}</span>`)
    .join("");
  const countsMarkup = `
    <div class="quick-counts">
      <span class="count-pill minor ${entry.errors.minor > 0 ? "filled" : ""}">${escapeHtml(t("count.minor"))} ${escapeHtml(entry.errors.minor)}</span>
      <span class="count-pill medium ${entry.errors.medium > 0 ? "filled" : ""}">${escapeHtml(t("count.medium"))} ${escapeHtml(entry.errors.medium)}</span>
      <span class="count-pill grave ${entry.errors.grave > 0 ? "filled" : ""}">${escapeHtml(t("count.grave"))} ${escapeHtml(entry.errors.grave)}</span>
    </div>
  `;
  const surahTags = pageSurahs
    .map(
      (surah) => `
        <span class="surah-chip ${surah.startPage === page ? "start" : ""}">
          <span>${escapeHtml(surah.simple)}</span>
          <strong>${escapeHtml(surah.arabic)}</strong>
        </span>
      `,
    )
    .join("");
  const historyMarkup = entry.events.length
    ? entry.events
        .slice(0, 5)
        .map(
          (event) => `
            <article class="quick-history-item ${escapeHtml(event.severity)}">
              <div class="quick-history-row">
                <span class="quick-history-severity ${escapeHtml(event.severity)}">${escapeHtml(severityLabel(event.severity))}</span>
                <span class="quick-history-date">${escapeHtml(formatEventTimestamp(event.createdAt, payload))}</span>
              </div>
              <div class="quick-history-meta">
                <span class="program-tag subtle">${escapeHtml(errorScopeLabel(event.scope, payload))}</span>
                ${
                  event.rect
                    ? `<span class="quick-history-due">${escapeHtml(t("quick.reviewDueLabel", {}, payload))}: ${escapeHtml(
                        formatReviewTimestamp(event.review?.dueAt, payload) || formatEventTimestamp(event.createdAt, payload),
                      )}</span>`
                    : ""
                }
              </div>
              <p class="helper">${escapeHtml(event.note || t("quick.historyNoNote", {}, payload))}</p>
            </article>
          `,
        )
        .join("")
    : `<div class="quick-empty-state">${escapeHtml(t("quick.historyEmpty", {}, payload))}</div>`;

  container.innerHTML = `
    <div class="quick-actions-card">
      <div class="quick-actions-head">
        <div class="quick-title">
          <p class="eyebrow">${escapeHtml(t("quick.title"))}</p>
          <h3>${escapeHtml(t("quick.pageTitle", { page }))}</h3>
          <p class="helper">${escapeHtml(t("quick.help"))}</p>
        </div>
        <button class="quick-close" type="button" data-clear-active-page="true">${escapeHtml(t("quick.close"))}</button>
      </div>
      <div class="quick-overview-grid">
        <article class="quick-overview-card">
          <span class="eyebrow">${escapeHtml(t("quick.stateLabel", {}, payload))}</span>
          <strong>${escapeHtml(stateLabel)}</strong>
          <p class="helper">${escapeHtml(primaryZone ? primaryZone.label : t("quick.zoneEmpty", {}, payload))}</p>
        </article>
        <article class="quick-overview-card">
          <span class="eyebrow">${escapeHtml(t("quick.lastNoteLabel", {}, payload))}</span>
          ${
            latestNoteEvent
              ? `
                <div class="quick-note-preview">
                  <span class="quick-history-severity ${escapeHtml(latestNoteEvent.severity)}">${escapeHtml(severityLabel(latestNoteEvent.severity))}</span>
                  <span class="quick-history-date">${escapeHtml(formatEventTimestamp(latestNoteEvent.createdAt, payload))}</span>
                </div>
                <p class="helper">${escapeHtml(latestNoteEvent.note)}</p>
              `
              : `<p class="helper">${escapeHtml(t("quick.lastNoteEmpty", {}, payload))}</p>`
          }
        </article>
      </div>
      <div class="quick-detail-block">
        <span class="eyebrow">${escapeHtml(t("quick.countsLabel", {}, payload))}</span>
        ${countsMarkup}
      </div>
      <div class="quick-detail-block">
        <span class="eyebrow">${escapeHtml(t("quick.surahLabel", {}, payload))}</span>
        ${surahTags ? `<div class="quick-program-tags surah-tags">${surahTags}</div>` : `<p class="helper">${escapeHtml(t("quick.surahEmpty", {}, payload))}</p>`}
      </div>
      <div class="quick-detail-block">
        <span class="eyebrow">${escapeHtml(t("quick.zoneLabel", {}, payload))}</span>
        ${programTags ? `<div class="quick-program-tags">${programTags}</div>` : `<p class="helper">${escapeHtml(t("quick.zoneEmpty", {}, payload))}</p>`}
      </div>
      <div class="quick-action-row">
        <button class="primary-button" type="button" data-open-page-editor="${escapeHtml(page)}">
          ${escapeHtml(t("quick.openEditor", {}, payload))}
        </button>
        <button class="secondary-button danger-button" type="button" data-page-quick-clear="${escapeHtml(page)}">
          ${escapeHtml(t("quick.clear", {}, payload))}
        </button>
      </div>
      <div class="quick-history-block">
        <span class="eyebrow">${escapeHtml(t("quick.historyLabel", {}, payload))}</span>
        <div class="quick-history-list">${historyMarkup}</div>
      </div>
    </div>
  `;
}

function renderPageEditorModal(payload = state.payload) {
  const container = $("#page-editor-modal");
  if (!container) {
    return;
  }

  if (!state.pageEditor.open || !Number.isInteger(state.pageEditor.page)) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  const page = state.pageEditor.page;
  const { detailedEvents, placedEvents, isNextPageLinkScope, selectedRect, selectionStateKey, canSave, showTouchSelectionHint } =
    getPageEditorSelectionState(payload);

  container.hidden = false;
  container.innerHTML = `
    <div class="page-editor-backdrop" data-page-editor-close="true"></div>
    <div class="page-editor-shell" role="dialog" aria-modal="true" aria-label="${escapeHtml(t("editor.title", {}, payload))}">
      <div class="page-editor-head">
        <div>
          <p class="eyebrow">${escapeHtml(t("editor.eyebrow", {}, payload))}</p>
          <h2>${escapeHtml(t("quick.pageTitle", { page }, payload))}</h2>
          <p class="helper">${escapeHtml(t("editor.help", {}, payload))}</p>
        </div>
        <button class="secondary-button" type="button" data-page-editor-close="true">${escapeHtml(t("editor.cancel", {}, payload))}</button>
      </div>
      <div class="page-editor-layout">
        <aside class="page-editor-side">
          <div class="page-editor-scope-group">
            <span class="eyebrow">${escapeHtml(t("editor.scopeLabel", {}, payload))}</span>
            <div class="page-editor-scope-row">
              ${["harakah", "word", "line", "next-page-link"]
                .map(
                  (scope) => `
                    <button
                      class="page-editor-scope-button ${state.pageEditor.scope === scope ? "active" : ""}"
                      type="button"
                      data-page-editor-scope="${escapeHtml(scope)}"
                    >
                      ${escapeHtml(errorScopeLabel(scope, payload))}
                    </button>
                  `,
                )
                .join("")}
            </div>
          </div>
          <label class="quick-note-field">
            <span class="eyebrow">${escapeHtml(t("editor.noteLabel", {}, payload))}</span>
            <textarea
              class="quick-note-input"
              rows="4"
              maxlength="280"
              data-page-editor-note="true"
              placeholder="${escapeHtml(t("editor.notePlaceholder", {}, payload))}"
            >${escapeHtml(state.pageEditor.note || "")}</textarea>
          </label>
          <div class="page-editor-action-row">
            <button class="secondary-button" type="button" data-page-editor-clear="true">${escapeHtml(t("editor.clearSelection", {}, payload))}</button>
            <button class="primary-button" type="button" data-page-editor-save="true" ${canSave ? "" : "disabled"}>
              ${escapeHtml(t("editor.save", {}, payload))}
            </button>
          </div>
          <div class="quick-history-block">
            <span class="eyebrow">${escapeHtml(t("editor.recentLabel", {}, payload))}</span>
            <div class="quick-history-list" data-page-editor-recent-list="true">${buildPageEditorRecentHistoryMarkup(
              detailedEvents,
              payload,
              page,
            )}</div>
          </div>
        </aside>
        <section class="page-editor-stage-panel">
          <div class="page-editor-image-frame">
            <div class="page-editor-image-viewport">
              ${buildMushafPageMarkup(page)}
              <div class="page-editor-stage ${isNextPageLinkScope ? "selection-disabled" : ""}" data-page-editor-stage="true">
                ${placedEvents
                  .map(
                    (event, index) => `
                      <button
                        class="page-editor-existing-mark ${escapeHtml(event.scope)}"
                        type="button"
                        data-selection-index="${escapeHtml(index)}"
                        style="${selectionRectStyle(event.rect)}"
                        title="${escapeHtml(errorScopeLabel(event.scope, payload))}"
                      ></button>
                    `,
                  )
                  .join("")}
                <div
                  class="page-editor-selection ${selectedRect ? "active" : ""}"
                  id="page-editor-selection-box"
                  style="${selectionRectStyle(selectedRect)}"
                ></div>
              </div>
            </div>
          </div>
          <p class="page-editor-gesture-hint" data-page-editor-gesture-hint ${showTouchSelectionHint ? "" : "hidden"}>${escapeHtml(
            t("editor.touchSelectionHint", {}, payload),
          )}</p>
          <p class="helper" data-page-editor-selection-status="true">${escapeHtml(t(selectionStateKey, {}, payload))}</p>
        </section>
      </div>
    </div>
  `;

  const frame = container.querySelector(".page-editor-image-viewport");
  if (frame) {
    placedEvents.forEach((event, index) => {
      const mark = frame.querySelector(`[data-selection-index="${index}"]`);
      applySelectionRectToElement(frame, mark, event);
    });
    applySelectionRectToElement(frame, container.querySelector("#page-editor-selection-box"), {
      rect: state.pageEditor.rect,
      anchor: state.pageEditor.anchor,
    });
  }
}

function renderErrorReview(payload = state.payload) {
  const container = $("#error-review");
  if (!container) {
    return;
  }

  resetReviewSwipeState();

  const review = payload.errorReview || { dueItems: [], upcomingItems: [], summary: {} };
  const dueItems = Array.isArray(review.dueItems) ? review.dueItems.map((item) => normalizeErrorReviewItem(item)).filter(Boolean) : [];
  const upcomingItems = Array.isArray(review.upcomingItems)
    ? review.upcomingItems.map((item) => normalizeErrorReviewItem(item)).filter(Boolean)
    : [];
  const allItems = buildAllErrorReviewItems(payload);
  const duePageGroups = buildReviewPageGroups(dueItems);
  const dueItemIds = new Set(dueItems.map((item) => item.id));
  const reviewPageGroups = buildReviewPageGroups(allItems)
    .map((group) => {
      const dueCount = group.items.filter((item) => dueItemIds.has(item.id)).length;
      const masteredCount = group.items.filter((item) => isReviewItemMastered(item)).length;
      const nextDueAt =
        group.items.reduce((earliest, item) => {
          const timestamp = Date.parse(item.review?.dueAt || item.createdAt || "") || Number.POSITIVE_INFINITY;
          return Math.min(earliest, timestamp);
        }, Number.POSITIVE_INFINITY) || Number.POSITIVE_INFINITY;
      const status = dueCount ? "due" : masteredCount === group.items.length ? "mastered" : "upcoming";
      return {
        ...group,
        dueCount,
        masteredCount,
        nextDueAt,
        status,
      };
    })
    .sort((left, right) => {
      const statusRank = { due: 0, upcoming: 1, mastered: 2 };
      const leftRank = statusRank[left.status] ?? 9;
      const rightRank = statusRank[right.status] ?? 9;
      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }
      if (left.nextDueAt !== right.nextDueAt) {
        return left.nextDueAt - right.nextDueAt;
      }
      return left.page - right.page;
    });
  const activeDueGroup = duePageGroups[0] || null;
  const hasItems = reviewPageGroups.length > 0;

  if (!hasItems) {
    setReviewRevealedItemIds([]);
    setReviewSelectedPage(null);
    pruneReviewCompletedItems(null);
    container.innerHTML = `
      <div class="section-head">
        <div>
          <p class="eyebrow">${escapeHtml(t("review.eyebrow", {}, payload))}</p>
          <h2>${renderUiRichText(t("review.title", {}, payload))}</h2>
        </div>
        <p class="muted">${renderUiRichText(t("review.help", {}, payload))}</p>
      </div>
      <section class="surah-empty-state">
        <h3>${escapeHtml(t("review.emptyTitle", {}, payload))}</h3>
        <p class="muted">${escapeHtml(t("review.emptyHelp", {}, payload))}</p>
      </section>
    `;
    return;
  }

  let selectedPage = getReviewSelectedPage();
  if (selectedPage && !reviewPageGroups.some((group) => group.page === selectedPage)) {
    setReviewSelectedPage(null);
    selectedPage = null;
  }

  const selectedGroup = reviewPageGroups.find((group) => group.page === selectedPage) || null;
  const activeGroup = selectedGroup || activeDueGroup || null;
  const reviewPageBrowserMarkup = reviewPageGroups
    .map(
      (group) => `
        <button
          class="review-page-chip ${escapeHtml(group.status)} ${group.page === activeGroup?.page ? "active" : ""}"
          type="button"
          data-review-select-page="${escapeHtml(group.page)}"
        >
          <div class="review-page-chip-head">
            <strong>${escapeHtml(t("review.pageLabel", { page: group.page }, payload))}</strong>
            <span class="review-page-chip-count">${escapeHtml(group.items.length)}</span>
          </div>
          <span class="review-page-chip-meta">${escapeHtml(t("review.pageErrorCount", { count: group.items.length }, payload))}</span>
          <span class="review-page-chip-status ${escapeHtml(group.status)}">${escapeHtml(
            group.dueCount ? `${t("review.status.due", {}, payload)} Â· ${group.dueCount}` : t(`review.status.${group.status}`, {}, payload),
          )}</span>
        </button>
      `,
    )
    .join("");

  if (!activeGroup) {
    setReviewRevealedItemIds([]);
    pruneReviewCompletedItems(null);
    container.innerHTML = `
      <div class="section-head">
        <div>
          <p class="eyebrow">${escapeHtml(t("review.eyebrow", {}, payload))}</p>
          <h2>${renderUiRichText(t("review.title", {}, payload))}</h2>
        </div>
        <p class="muted">${renderUiRichText(t("review.help", {}, payload))}</p>
      </div>

      <section class="review-stat-grid">
        <article class="surah-stat-card">
          <span>${escapeHtml(t("review.dueNow", {}, payload))}</span>
          <strong>${escapeHtml(review.summary.dueCount || 0)}</strong>
        </article>
        <article class="surah-stat-card">
          <span>${escapeHtml(t("review.upcoming", {}, payload))}</span>
          <strong>${escapeHtml(review.summary.upcomingCount || 0)}</strong>
        </article>
        <article class="surah-stat-card">
          <span>${escapeHtml(t("review.mastered", {}, payload))}</span>
          <strong>${escapeHtml(review.summary.masteredCount || 0)}</strong>
        </article>
      </section>

      <section class="review-library-shell">
        <div class="review-library-head">
          <div>
            <p class="eyebrow">${escapeHtml(t("review.libraryLabel", {}, payload))}</p>
            <h3>${escapeHtml(t("review.libraryTitle", {}, payload))}</h3>
          </div>
        </div>
        <p class="helper">${escapeHtml(t("review.libraryHelp", {}, payload))}</p>
        <div class="review-page-browser">
          ${reviewPageBrowserMarkup}
        </div>
      </section>

      <section class="review-card-shell">
        <div class="surah-empty-state review-idle-state">
          <h3>${escapeHtml(t("review.emptyUpcoming", {}, payload))}</h3>
          <p class="muted">${escapeHtml(t("review.libraryHelp", {}, payload))}</p>
        </div>
      </section>
    `;
    return;
  }

  const activeDueGroupForPage = activeGroup ? duePageGroups.find((group) => group.page === activeGroup.page) || null : null;
  const hasDueFlow = Boolean(activeDueGroupForPage);

  let currentGroup = activeGroup;
  let completedItemIds = new Set();
  let revealedItemIds = [];
  let revealedItems = [];
  let nextHiddenItem = null;
  let currentAnswerItem = null;

  if (hasDueFlow) {
    pruneReviewCompletedItems(activeDueGroupForPage.page);
    const completedItems = getReviewCompletedItemsForPage(activeDueGroupForPage.page).filter(
      (completedItem) => !activeDueGroupForPage.items.some((item) => item.id === completedItem.id),
    );
    currentGroup = {
      ...activeGroup,
      items: [...activeDueGroupForPage.items, ...completedItems].sort(compareReviewItemsOnPage),
      completedItems,
    };
    completedItemIds = new Set(completedItems.map((item) => item.id));
    const groupItemIds = new Set(currentGroup.items.map((item) => item.id));
    revealedItemIds = [
      ...new Set([
        ...getReviewRevealedItemIds().filter((itemId) => groupItemIds.has(itemId)),
        ...completedItems.map((item) => item.id),
      ]),
    ];
    setReviewRevealedItemIds(revealedItemIds);
    revealedItems = currentGroup.items.filter((item) => revealedItemIds.includes(item.id));
    const revealedDueItems = activeDueGroupForPage.items.filter((item) => revealedItemIds.includes(item.id));
    nextHiddenItem = activeDueGroupForPage.items.find((item) => !revealedItemIds.includes(item.id)) || null;
    currentAnswerItem = revealedDueItems[revealedDueItems.length - 1] || null;
  } else {
    revealedItemIds = currentGroup.items.map((item) => item.id);
    revealedItems = currentGroup.items;
  }

  const canAnswerCurrentItem = Boolean(currentAnswerItem);
  const canSwipeCurrentPage = !nextHiddenItem && Boolean(currentAnswerItem);
  const dragOffset =
    canSwipeCurrentPage && state.reviewSwipe.itemId === currentAnswerItem.id ? state.reviewSwipe.currentX - state.reviewSwipe.startX : 0;
  const currentIndex = hasDueFlow ? Math.max(1, duePageGroups.findIndex((group) => group.page === currentGroup.page) + 1) : 0;
  const total = duePageGroups.length;
  const noteText = currentAnswerItem?.note || t("review.noteEmpty", {}, payload);
  const revealButtonLabel = nextHiddenItem ? t("review.revealButton", {}, payload) : t("review.revealDoneButton", {}, payload);
  const revealHelpText = nextHiddenItem ? t("review.revealNextHelp", {}, payload) : t("review.revealDoneHelp", {}, payload);
  const activeStatusKey = currentGroup?.status || (hasDueFlow ? "due" : "upcoming");
  const activeStatusLabel = t(`review.status.${activeStatusKey}`, {}, payload);
  const hasReturnToQueue = Boolean(selectedGroup && activeDueGroup);
  const nextPagePreviewItem = hasDueFlow
    ? currentAnswerItem?.scope === "next-page-link"
      ? currentAnswerItem
      : null
    : currentGroup.items.find((item) => item.scope === "next-page-link") || null;
  const browseListMarkup = currentGroup.items
    .map(
      (item) => `
        <article class="review-item-card ${escapeHtml(item.severity)}">
          <div class="quick-history-row">
            <span class="quick-history-severity ${escapeHtml(item.severity)}">${escapeHtml(errorScopeLabel(item.scope, payload))}</span>
            <span class="quick-history-date">${escapeHtml(
              formatReviewTimestamp(item.review?.dueAt, payload) || formatEventTimestamp(item.createdAt, payload),
            )}</span>
          </div>
          <p class="helper">${escapeHtml(item.note || t("review.noteEmpty", {}, payload))}</p>
        </article>
      `,
    )
    .join("");
  const sideActionsMarkup = hasDueFlow
    ? `
        <aside class="review-side-actions ${nextHiddenItem ? "with-reveal" : "without-reveal"}">
          ${
            nextHiddenItem
              ? `
                <button
                  class="secondary-button review-side-button"
                  type="button"
                  data-review-reveal-next="${escapeHtml(nextHiddenItem.id)}"
                >
                  ${escapeHtml(revealButtonLabel)}
                </button>
              `
              : ""
          }
          <button
            class="secondary-button danger-button review-side-button"
            type="button"
            data-review-answer="failure"
            data-review-id="${escapeHtml(currentAnswerItem?.id || "")}"
            data-review-page="${escapeHtml(currentGroup.page)}"
            ${canAnswerCurrentItem ? "" : "disabled"}
          >
            ${escapeHtml(t("review.failureButton", {}, payload))}
          </button>
          <button
            class="primary-button review-side-button"
            type="button"
            data-review-answer="success"
            data-review-id="${escapeHtml(currentAnswerItem?.id || "")}"
            data-review-page="${escapeHtml(currentGroup.page)}"
            ${canAnswerCurrentItem ? "" : "disabled"}
          >
            ${escapeHtml(t("review.successButton", {}, payload))}
          </button>
        </aside>
      `
    : hasReturnToQueue
      ? `
        <aside class="review-side-actions">
          <button class="secondary-button review-side-button" type="button" data-review-return-queue="true">
            ${escapeHtml(t("review.returnToQueue", {}, payload))}
          </button>
        </aside>
      `
      : "";
  const noteBlockMarkup = hasDueFlow
    ? `
        <div class="review-note-block">
          <span class="eyebrow">${escapeHtml(t("review.noteLabel", {}, payload))}</span>
          <p class="helper">${escapeHtml(noteText)}</p>
          <p class="helper">${escapeHtml(
            canAnswerCurrentItem ? (canSwipeCurrentPage ? t("review.swipeHelp", {}, payload) : t("review.answerCurrentHelp", {}, payload)) : revealHelpText,
          )}</p>
        </div>
      `
    : `
        <div class="review-note-block review-browse-block">
          <span class="eyebrow">${escapeHtml(t("review.browseListLabel", {}, payload))}</span>
          <p class="helper">${escapeHtml(t("review.browseHelp", {}, payload))}</p>
          <div class="review-item-list">${browseListMarkup}</div>
        </div>
      `;

  container.innerHTML = `
    <div class="section-head">
      <div>
        <p class="eyebrow">${escapeHtml(t("review.eyebrow", {}, payload))}</p>
          <h2>${renderUiRichText(t("review.title", {}, payload))}</h2>
      </div>
      <p class="muted">${renderUiRichText(t("review.help", {}, payload))}</p>
    </div>

    <section class="review-stat-grid">
      <article class="surah-stat-card">
        <span>${escapeHtml(t("review.dueNow", {}, payload))}</span>
        <strong>${escapeHtml(review.summary.dueCount || 0)}</strong>
      </article>
      <article class="surah-stat-card">
        <span>${escapeHtml(t("review.upcoming", {}, payload))}</span>
        <strong>${escapeHtml(review.summary.upcomingCount || 0)}</strong>
      </article>
      <article class="surah-stat-card">
        <span>${escapeHtml(t("review.mastered", {}, payload))}</span>
        <strong>${escapeHtml(review.summary.masteredCount || 0)}</strong>
      </article>
    </section>

    <section class="review-library-shell">
      <div class="review-library-head">
        <div>
          <p class="eyebrow">${escapeHtml(t("review.libraryLabel", {}, payload))}</p>
          <h3>${escapeHtml(t("review.libraryTitle", {}, payload))}</h3>
        </div>
        ${hasReturnToQueue ? `<button class="secondary-button" type="button" data-review-return-queue="true">${escapeHtml(t("review.returnToQueue", {}, payload))}</button>` : ""}
      </div>
      <p class="helper">${escapeHtml(t("review.libraryHelp", {}, payload))}</p>
      <div class="review-page-browser">
        ${reviewPageGroups
          .map(
            (group) => `
              <button
                class="review-page-chip ${escapeHtml(group.status)} ${group.page === currentGroup.page ? "active" : ""}"
                type="button"
                data-review-select-page="${escapeHtml(group.page)}"
              >
                <div class="review-page-chip-head">
                  <strong>${escapeHtml(t("review.pageLabel", { page: group.page }, payload))}</strong>
                  <span class="review-page-chip-count">${escapeHtml(group.items.length)}</span>
                </div>
                <span class="review-page-chip-meta">${escapeHtml(t("review.pageErrorCount", { count: group.items.length }, payload))}</span>
                <span class="review-page-chip-status ${escapeHtml(group.status)}">${escapeHtml(
                  group.dueCount ? `${t("review.status.due", {}, payload)} · ${group.dueCount}` : t(`review.status.${group.status}`, {}, payload),
                )}</span>
              </button>
            `,
          )
          .join("")}
      </div>
    </section>

    <section class="review-card-shell">
      <div class="review-card-meta">
        <span class="eyebrow">${escapeHtml(
          hasDueFlow ? t("review.cardLabel", { current: currentIndex, total }, payload) : t("review.selectedLabel", {}, payload),
        )}</span>
        <div class="quick-program-tags">
          <span class="program-tag subtle">${escapeHtml(t("review.pageLabel", { page: currentGroup.page }, payload))}</span>
          <span class="program-tag subtle">${escapeHtml(t("review.pageErrorCount", { count: currentGroup.items.length }, payload))}</span>
          <span class="program-tag subtle">${escapeHtml(activeStatusLabel)}</span>
          <span class="program-tag subtle">${escapeHtml(t("review.revealProgress", { count: revealedItems.length, total: currentGroup.items.length }, payload))}</span>
        </div>
      </div>
      <div class="review-card-body ${sideActionsMarkup ? "with-side-actions" : ""}">
        <div
          class="review-card-stage ${canSwipeCurrentPage ? "" : "swipe-locked"}"
          data-review-card="${escapeHtml(canSwipeCurrentPage ? currentAnswerItem?.id || "" : "")}"
          style="--review-drag:${escapeHtml(dragOffset)}px;"
        >
          <div class="review-swipe-hint success">${escapeHtml(t("review.successButton", {}, payload))}</div>
          <div class="review-swipe-hint failure">${escapeHtml(t("review.failureButton", {}, payload))}</div>
          <div class="review-card-page-frame">
            ${buildMushafPageMarkup(currentGroup.page)}
            ${currentGroup.items
              .map((item, index) => {
                const isRevealed = revealedItemIds.includes(item.id);
                const isCompleted = completedItemIds.has(item.id);
                return isRevealed
                  ? `<div class="review-card-reveal-ring ${currentAnswerItem?.id === item.id ? "active" : ""} ${isCompleted ? "completed" : ""}" data-review-selection="${escapeHtml(index)}"></div>`
                  : `
                    <div class="review-card-mask ${escapeHtml(item.scope)}" data-review-selection="${escapeHtml(index)}"></div>
                  `;
              })
              .join("")}
          </div>
          ${nextPagePreviewItem ? buildMushafNextPagePreviewMarkup(currentGroup.page, payload) : ""}
        </div>
        ${sideActionsMarkup}
      </div>
      ${noteBlockMarkup}
    </section>
  `;

  const frame = container.querySelector(".review-card-page-frame");
  if (frame) {
    currentGroup.items.forEach((item, index) => {
      const target = frame.querySelector(`[data-review-selection="${index}"]`);
      applySelectionRectToElement(frame, target, item);
    });
  }
}

function buildPageEditorRecentHistoryMarkup(detailedEvents, payload = state.payload, page = state.pageEditor.page) {
  return detailedEvents.length
    ? detailedEvents
        .slice(0, 6)
        .map(
          (event) => `
            <article class="quick-history-item ${escapeHtml(event.severity)}">
              <div class="quick-history-row">
                <span class="quick-history-severity ${escapeHtml(event.severity)}">${escapeHtml(errorScopeLabel(event.scope, payload))}</span>
                <span class="quick-history-date">${escapeHtml(
                  formatReviewTimestamp(event.review?.dueAt, payload) || formatEventTimestamp(event.createdAt, payload),
                )}</span>
              </div>
              <p class="helper">${escapeHtml(event.note || t("quick.historyNoNote", {}, payload))}</p>
              <div class="quick-history-actions">
                <button
                  class="secondary-button danger-button quick-history-delete"
                  type="button"
                  data-page-editor-delete-error="${escapeHtml(event.id)}"
                  data-page-editor-delete-page="${escapeHtml(page)}"
                >
                  ${escapeHtml(t("editor.deleteError", {}, payload))}
                </button>
              </div>
            </article>
          `,
        )
        .join("")
    : `<div class="quick-empty-state">${escapeHtml(t("editor.recentEmpty", {}, payload))}</div>`;
}

function refreshPageEditorSurface(payload = state.payload) {
  const modal = $("#page-editor-modal");
  if (!modal || modal.hidden || !state.pageEditor.open) {
    return;
  }

  const shell = modal.querySelector(".page-editor-shell");
  const frame = modal.querySelector(".page-editor-image-viewport");
  const stage = modal.querySelector("[data-page-editor-stage='true']");
  const selectionBox = modal.querySelector("#page-editor-selection-box");
  const noteInput = modal.querySelector("[data-page-editor-note='true']");
  const recentList = modal.querySelector("[data-page-editor-recent-list='true']");
  const scrollTop = shell ? shell.scrollTop : 0;
  const page = Number(state.pageEditor.page);
  const { detailedEvents, placedEvents, selectedRect, isNextPageLinkScope } = getPageEditorSelectionState(payload);

  if (frame) {
    const pageMarkup = buildMushafPageMarkup(page);
    const template = document.createElement("template");
    template.innerHTML = pageMarkup.trim();
    const nextPageShell = template.content.firstElementChild;
    const currentPageShell = frame.querySelector(".mushaf-page-shell");
    if (nextPageShell) {
      if (currentPageShell) {
        currentPageShell.replaceWith(nextPageShell);
      } else if (stage) {
        frame.insertBefore(nextPageShell, stage);
      } else {
        frame.appendChild(nextPageShell);
      }
    }
  }

  if (noteInput && noteInput.value !== (state.pageEditor.note || "")) {
    noteInput.value = state.pageEditor.note || "";
  }

  if (recentList) {
    recentList.innerHTML = buildPageEditorRecentHistoryMarkup(detailedEvents, payload, state.pageEditor.page);
  }

  if (stage && frame) {
    stage.classList.toggle("selection-disabled", isNextPageLinkScope);
    stage.querySelectorAll(".page-editor-existing-mark").forEach((mark) => mark.remove());
    placedEvents.forEach((event, index) => {
      const mark = document.createElement("button");
      mark.className = `page-editor-existing-mark ${event.scope}`;
      mark.type = "button";
      mark.dataset.selectionIndex = String(index);
      mark.title = errorScopeLabel(event.scope, payload);
      if (selectionBox) {
        stage.insertBefore(mark, selectionBox);
      } else {
        stage.appendChild(mark);
      }
      applySelectionRectToElement(frame, mark, event);
    });
  }

  if (selectionBox) {
    selectionBox.classList.toggle("active", Boolean(selectedRect));
    selectionBox.style.cssText = selectionRectStyle(selectedRect);
  }

  updatePageEditorSelectionUi(payload, modal);
  bindPageEditorDeleteButtons(modal);

  if (shell) {
    shell.scrollTop = scrollTop;
  }
}

function bindPageEditorDeleteButtons(modal = $("#page-editor-modal")) {
  if (!modal || modal.hidden) {
    return;
  }

  modal.querySelectorAll("[data-page-editor-delete-error]").forEach((button) => {
    if (button.dataset.pageEditorDeleteBound === "true") {
      return;
    }

    button.dataset.pageEditorDeleteBound = "true";
    button.addEventListener("click", async () => {
      if (button.disabled) {
        return;
      }

      button.disabled = true;
      try {
        const page = Number(button.dataset.pageEditorDeletePage);
        const id = String(button.dataset.pageEditorDeleteError || "").trim();
        if (!Number.isInteger(page) || page < 1 || !id) {
          return;
        }

        state.payload = await dataClient.removePageErrorItem(page, id);
        state.pageEditor.needsTrackingRefresh = true;
        refreshPageEditorSurface(state.payload);
        showToast(t("toast.errorDeleted", { page }));
      } catch (error) {
        showToast(error.message, true);
      } finally {
        button.disabled = false;
      }
    });
  });
}

function refreshErrorExperience(payload = state.payload, options = {}) {
  const {
    refreshSummary = true,
    refreshTracking = state.activeView === "pages" || state.pageEditor.open,
    refreshReview = state.activeView === "review",
    refreshEditor = state.pageEditor.open,
  } = options;

  if (refreshSummary) {
    renderSummary(payload);
    renderSettingsPreview(payload);
  }

  if (refreshTracking) {
    renderErrorTracking(payload);
    bindPageQuickActions();
  } else if (state.activeView === "pages" || state.pageEditor.open) {
    refreshPagesQuickUi(payload);
  }

  if (refreshReview) {
    renderErrorReview(payload);
    bindErrorReviewActions();
  }

  if (refreshEditor) {
    renderPageEditorModal(payload);
    bindPageEditorActions();
  }
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function getLearnedHalfPages(plan) {
  return Math.max(0, Number(plan?.summary?.learnedHalfPages || 0));
}

function getDashboardMetrics(payload) {
  const { plan, errorTracking } = payload;
  const presentKeys = plan.order.filter((key) => plan.blocks[key].present);
  const completedKeys = presentKeys.filter((key) => plan.blocks[key].dayComplete);
  const learnedHalfPages = getLearnedHalfPages(plan);
  const learnedPages = learnedHalfPages / PROGRESS_UNITS_PER_PAGE;
  const progressHalfPages = Math.max(0, Number(plan.summary.learnedHalfPagesOverall || learnedHalfPages));
  const progressTotalHalfPages = Math.max(1, Number(plan.summary.totalProgramHalfPages || plan.summary.totalHalfPages || 1));
  const waveCheckedCount = plan.blocks.new.present ? Number(plan.blocks.new.checkedCount || 0) : 9;
  const waveCompleteCount = plan.blocks.new.present
    ? (plan.blocks.new.waves || []).filter((wave) => wave.complete).length
    : 3;
  const dailyPercent = presentKeys.length ? (completedKeys.length / presentKeys.length) * 100 : 100;
  const learnedPercent = progressTotalHalfPages ? (progressHalfPages / progressTotalHalfPages) * 100 : 0;
  const wavePercent = (waveCheckedCount / 9) * 100;
  const stablePercent =
    learnedPages > 0
      ? Math.max(0, 100 - (errorTracking.summary.pagesWithErrors / Math.max(learnedPages, 1)) * 100)
      : 100;

  return {
    presentKeys,
    completedKeys,
    learnedHalfPages,
    learnedPages,
    progressHalfPages,
    progressTotalHalfPages,
    waveCheckedCount,
    waveCompleteCount,
    dailyPercent: clampPercent(dailyPercent),
    learnedPercent: clampPercent(learnedPercent),
    wavePercent: clampPercent(wavePercent),
    stablePercent: clampPercent(stablePercent),
  };
}

function getCurrentFocusBlock(plan) {
  const order = Array.isArray(plan?.order) ? plan.order : [];

  for (const key of order) {
    const block = plan.blocks?.[key];
    if (!block || !block.present || block.dayComplete) {
      continue;
    }

    return {
      key,
      block,
      index: order.indexOf(key) + 1,
      total: order.filter((orderKey) => plan.blocks?.[orderKey]?.present).length,
    };
  }

  return null;
}

function getRankFromProgress(learnedPercent) {
  if (learnedPercent >= 100) {
    return {
      label: "Khatma",
      helper: "Tout le corpus est couvert.",
      tone: "emerald",
    };
  }
  if (learnedPercent >= 75) {
    return {
      label: "Endurant",
      helper: "La plus grande partie est deja memorisee.",
      tone: "gold",
    };
  }
  if (learnedPercent >= 50) {
    return {
      label: "Solide",
      helper: "Le milieu du parcours est bien engage.",
      tone: "sky",
    };
  }
  if (learnedPercent >= 25) {
    return {
      label: "Bati",
      helper: "Le socle du programme commence a etre dense.",
      tone: "clay",
    };
  }
  if (learnedPercent >= 10) {
    return {
      label: "En elan",
      helper: "Le rythme s'installe.",
      tone: "leaf",
    };
  }
  return {
    label: "Mise en route",
    helper: "Le programme prend forme jour apres jour.",
    tone: "leaf",
  };
}

function progressBarMarkup({ label, value, helper, tone = "green" }) {
  return `
    <article class="progress-card tone-${escapeHtml(tone)}">
      <div class="progress-card-head">
        <span class="eyebrow">${escapeHtml(label)}</span>
        <strong>${escapeHtml(`${clampPercent(value)}%`)}</strong>
      </div>
      <div class="progress-bar ${escapeHtml(tone)}">
        <span style="width: ${escapeHtml(clampPercent(value))}%"></span>
      </div>
      <p class="summary-note">${escapeHtml(helper)}</p>
    </article>
  `;
}

function getCelebrationLayer() {
  return $("#celebration-layer");
}

function launchMiniCelebration(origin, tone = "success") {
  launchButtonPulse(origin, tone);
}

function launchButtonPulse(origin, tone = "success") {
  const layer = getCelebrationLayer();
  if (!layer || !origin) {
    return;
  }

  const ring = document.createElement("span");
  ring.className = `celebration-ring ${tone === "failure" ? "failure" : "success"}`;
  ring.style.left = `${origin.left + origin.width / 2}px`;
  ring.style.top = `${origin.top + origin.height / 2}px`;
  ring.style.width = `${Math.max(origin.width + 18, 92)}px`;
  ring.style.height = `${Math.max(origin.height + 18, 52)}px`;
  layer.appendChild(ring);
  setTimeout(() => ring.remove(), 560);
}

function launchFailureCelebration(origin) {
  launchButtonPulse(origin, "failure");
}

function launchGrandCelebration() {
  const layer = getCelebrationLayer();
  if (!layer) {
    return;
  }

  const pulse = document.createElement("span");
  pulse.className = "celebration-pulse green soft";
  layer.appendChild(pulse);
  setTimeout(() => pulse.remove(), 1100);
}

function launchDayCompletionCelebration(origin) {
  const layer = getCelebrationLayer();
  if (!layer) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobileRuntime = isNativeAppRuntime() || isCoarsePointerDevice();

  window.requestAnimationFrame(() => {
    launchGrandCelebration();

    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const centerX = isMobileRuntime ? viewportWidth / 2 : origin ? origin.left + origin.width / 2 : viewportWidth / 2;
    const centerY = isMobileRuntime ? viewportHeight * 0.48 : origin ? origin.top + origin.height / 2 : viewportHeight * 0.72;
    const starCount = prefersReducedMotion ? 10 : isMobileRuntime ? 24 : 28;
    const maxDistance = Math.min(isMobileRuntime ? 220 : 320, Math.max(160, viewportWidth * 0.32));
    const colors = ["#fff5cf", "#f4d88a", "#f7fbff", "#dfeee7", "#f2c76d"];

    if (isMobileRuntime) {
      const core = document.createElement("span");
      const coreDuration = prefersReducedMotion ? 760 : 1180;
      core.className = "celebration-core-star";
      core.style.left = `${centerX}px`;
      core.style.top = `${centerY}px`;
      layer.appendChild(core);
      window.setTimeout(() => core.remove(), coreDuration);
    }

    for (let index = 0; index < starCount; index += 1) {
      const star = document.createElement("span");
      const angle = (-Math.PI / 2) + ((Math.PI * 2) / starCount) * index + ((Math.random() - 0.5) * 0.45);
      const distance = maxDistance * (0.45 + Math.random() * 0.65);
      const driftX = Math.cos(angle) * distance;
      const driftY = Math.sin(angle) * distance - (isMobileRuntime ? 36 : 54);
      const size = prefersReducedMotion ? 18 + Math.random() * 10 : isMobileRuntime ? 18 + Math.random() * 16 : 22 + Math.random() * 22;
      const delay = prefersReducedMotion ? 0 : Math.random() * 180;
      const duration = prefersReducedMotion ? 560 : 980 + Math.random() * 420;
      const rotateStart = -28 + Math.random() * 56;
      const rotateEnd = rotateStart + 70 + Math.random() * 110;
      const scale = 0.92 + Math.random() * 0.52;

      star.className = "celebration-star";
      star.style.left = `${centerX + (Math.random() - 0.5) * 26}px`;
      star.style.top = `${centerY + (Math.random() - 0.5) * 18}px`;
      star.style.setProperty("--star-x", `${driftX.toFixed(1)}px`);
      star.style.setProperty("--star-y", `${driftY.toFixed(1)}px`);
      star.style.setProperty("--star-size", `${size.toFixed(1)}px`);
      star.style.setProperty("--star-delay", `${delay.toFixed(0)}ms`);
      star.style.setProperty("--star-duration", `${duration.toFixed(0)}ms`);
      star.style.setProperty("--star-scale", scale.toFixed(2));
      star.style.setProperty("--star-rotate-start", `${rotateStart.toFixed(1)}deg`);
      star.style.setProperty("--star-rotate-end", `${rotateEnd.toFixed(1)}deg`);
      star.style.setProperty("--star-color", colors[index % colors.length]);
      layer.appendChild(star);
      window.setTimeout(() => star.remove(), delay + duration + 220);
    }
  });
}

function resetHorizontalViewportOffset() {
  try {
    window.scrollTo({
      top: window.scrollY,
      left: 0,
      behavior: "auto",
    });
  } catch (_error) {
    window.scrollTo(0, window.scrollY);
  }
}

function renderRouteProgress(plan) {
  let currentAssigned = false;

  $all("[data-route-key]").forEach((step) => {
    const blockKey = step.dataset.routeKey;
    const block = plan.blocks[blockKey];
    if (!block) {
      return;
    }

    const status = step.querySelector(".route-status");
    step.classList.remove("done", "current", "locked", "inactive");

    if (!block.present) {
      step.classList.add("inactive");
      if (status) {
        status.textContent = t("route.status.notRequired");
      }
      return;
    }

    if (block.dayComplete) {
      step.classList.add("done");
      if (status) {
        status.textContent = t("route.status.done");
      }
      return;
    }

    if (!currentAssigned) {
      currentAssigned = true;
      step.classList.add("current");
      if (status) {
        status.textContent = t("route.status.focus");
      }
      return;
    }

    step.classList.add("locked");
    if (status) {
      status.textContent = t("route.status.waiting");
    }
  });
}

function focusActionMarkup(blockKey, block) {
  if (!block?.present) {
    return "";
  }

  if (blockKey === "new") {
    return `
      <div class="focus-action-row">
        <button class="primary-button" type="button" data-scroll-to-card="new">${escapeHtml(t("today.focusOpenNew"))}</button>
        <button class="secondary-button" type="button" data-scroll-to-card="new">${escapeHtml(t("today.focusScroll"))}</button>
      </div>
    `;
  }

  return `
    <div class="focus-action-row">
      <button class="primary-button" type="button" data-focus-toggle-block="${escapeHtml(blockKey)}">
        ${escapeHtml(block.done ? t("today.focusUndo") : t("today.focusValidate"))}
      </button>
      <button class="secondary-button" type="button" data-scroll-to-card="${escapeHtml(blockKey)}">${escapeHtml(t("today.focusScroll"))}</button>
    </div>
  `;
}

function renderTodayFocus(payload) {
  const container = $("#today-focus");
  const { plan } = payload;
  const focus = getCurrentFocusBlock(plan);

  if (!focus) {
    container.innerHTML = `
      <div class="focus-shell complete">
        <div class="focus-copy">
          <p class="eyebrow">${escapeHtml(t("today.focusLabel", {}, payload))}</p>
          <h2>${escapeHtml(t("today.focusDoneTitle", {}, payload))}</h2>
          <p class="muted">${escapeHtml(t("today.focusDoneHelp", {}, payload))}</p>
        </div>
        <div class="focus-meta">
          <article class="focus-chip">
            <span class="eyebrow">${escapeHtml(t("today.dayLabel", {}, payload))}</span>
            <strong>${escapeHtml(t("status.done", {}, payload))}</strong>
            <p class="helper">${escapeHtml(t("day.completeHelper", { done: plan.order.filter((key) => plan.blocks[key].present).length, total: plan.order.filter((key) => plan.blocks[key].present).length }, payload))}</p>
          </article>
        </div>
      </div>
    `;
    return;
  }

  const { key, block, index, total } = focus;
  const focusRange = block.fullRange || block.range || block.activeRange || null;
  const focusMeta = [];

  if (focusRange) {
    const focusSurahs = buildRangeSurahSummaryText(focusRange);
    focusMeta.push(`
      <article class="focus-chip">
        <span class="eyebrow">${escapeHtml(t("meta.range", {}, payload))}</span>
        <strong>${escapeHtml(focusRange.label)}</strong>
        ${focusSurahs ? `<p class="helper">${escapeHtml(focusSurahs)}</p>` : ""}
      </article>
    `);
    focusMeta.push(`
      <article class="focus-chip">
        <span class="eyebrow">${escapeHtml(t("meta.size", {}, payload))}</span>
        <strong>${escapeHtml(focusRange.countLabel || formatPageCountFromHalfPages(focusRange.count, payload))}</strong>
      </article>
    `);
  }

  focusMeta.push(`
    <article class="focus-chip">
      <span class="eyebrow">${escapeHtml(t("today.focusReady", {}, payload))}</span>
      <strong>${escapeHtml(t("today.focusStep", { current: index, total }, payload))}</strong>
    </article>
  `);

  if (key === "new") {
    focusMeta.push(`
      <article class="focus-chip">
        <span class="eyebrow">${escapeHtml(block.title)}</span>
        <strong>${escapeHtml(t("today.focusWaveProgress", { count: block.checkedCount }, payload))}</strong>
        <p class="helper">${escapeHtml(t("today.focusWaveGuide", {}, payload))}</p>
      </article>
    `);
  }

  container.innerHTML = `
    <div class="focus-shell focus-${escapeHtml(key)}">
      <div class="focus-copy">
        <p class="eyebrow">${escapeHtml(t("today.focusLabel", {}, payload))}</p>
        <h2>${escapeHtml(block.title)}</h2>
        <p class="muted">${renderUiRichText(block.helper || t("today.focusHelp", {}, payload))}</p>
        <div class="focus-status-row">
          <span class="status-pill pending">${escapeHtml(t("today.focusReady", {}, payload))}</span>
        </div>
        ${focusActionMarkup(key, block)}
      </div>
      <div class="focus-meta">
        ${focusMeta.join("")}
      </div>
    </div>
  `;
}

function renderTodayPhaseSwitcher(payload = state.payload) {
  const container = $("#today-phase-switcher");
  if (!container) {
    return;
  }
  container.hidden = true;
  container.innerHTML = "";
}

function statusMarkup(block) {
  if (!block.present) {
    return `<span class="status-pill empty">${escapeHtml(t("status.unavailable"))}</span>`;
  }
  if (block.dayComplete) {
    return `<span class="status-pill done">${escapeHtml(t("status.done"))}</span>`;
  }
  if (block.locked) {
    return `<span class="status-pill locked">${escapeHtml(t("status.locked"))}</span>`;
  }
  return `<span class="status-pill pending">${escapeHtml(t("status.pending"))}</span>`;
}

function lockNoteMarkup(block) {
  if (!block.locked || !block.blockedByLabels || !block.blockedByLabels.length) {
    return "";
  }

  return `<p class="helper lock-note">${escapeHtml(t("lockNote", { items: block.blockedByLabels.join(", ") }))}</p>`;
}

function rangeBlockMarkup(range) {
  if (!range) {
    return `<div class="empty-note">${escapeHtml(t("emptyNote"))}</div>`;
  }

  const surahSummary = buildRangeSurahSummaryText(range);
  const rangeHeading = surahSummary ? `${t("meta.range")} · ${t("meta.surahs")}` : t("meta.range");

  return `
    <div class="card-meta">
      <article class="mini-chip surah-range-chip">
        <span class="eyebrow">${escapeHtml(rangeHeading)}</span>
        <strong>${escapeHtml(range.label)}</strong>
        ${
          surahSummary
          ? `<p class="helper range-surah-summary">${escapeHtml(surahSummary)}</p>${buildRangeSurahChips(range, { compact: true })}`
          : ""
        }
      </article>
      <article class="mini-chip">
        <span class="eyebrow">${escapeHtml(t("meta.size"))}</span>
        <strong>${escapeHtml(range.countLabel || formatPageCountFromHalfPages(range.count, state.payload))}</strong>
      </article>
    </div>
  `;
}

function cardRangeSummaryLegacy(range) {
  if (!range) {
    return t("emptyNote");
  }

  return `${range.label} · ${range.countLabel || formatPageCountFromHalfPages(range.count, state.payload)}`;
}

function cardRangeSummary(range) {
  if (!range) {
    return t("emptyNote");
  }

  const summaryParts = [range.label, range.countLabel || formatPageCountFromHalfPages(range.count, state.payload)];
  const surahSummary = buildRangeSurahSummaryText(range);
  if (surahSummary) {
    summaryParts.push(surahSummary);
  }
  return summaryParts.join(" | ");
}

function cardFrameMarkup({ blockKey, block, headerContent, summaryText, detailContent, footerContent = "" }) {
  const expanded = isCardExpanded(blockKey, block);
  const detailId = `card-details-${blockKey}`;
  const hasDetail = Boolean(detailContent);

  return `
    <article class="${cardClassName(blockKey, block)} ${expanded ? "expanded-card" : "collapsed-card"}" id="card-${escapeHtml(blockKey)}" data-block-card="${escapeHtml(blockKey)}">
      <div class="card-body">
        ${headerContent}
        <div class="card-summary-row">
          <p class="helper card-summary-text">${escapeHtml(summaryText)}</p>
          ${
            hasDetail
              ? `<button class="card-expand-button" type="button" data-card-expand="${escapeHtml(blockKey)}" aria-expanded="${expanded}" aria-controls="${escapeHtml(detailId)}">${escapeHtml(
                  expanded ? t("card.collapse") : t("card.expand"),
                )}</button>`
              : ""
          }
        </div>
        <div id="${escapeHtml(detailId)}" class="card-detail-stack ${expanded ? "expanded" : "collapsed"}">
          ${detailContent}
          ${footerContent}
        </div>
      </div>
    </article>
  `;
}

function toggleButtonMarkup(blockKey, block) {
  if (!block.present) {
    return "";
  }

  return `
    <button class="toggle-button" type="button" data-block-key="${escapeHtml(blockKey)}" ${block.locked && !block.done ? "disabled" : ""}>
      ${escapeHtml(block.done ? t("toggle.undo") : t("toggle.validate"))}
    </button>
    ${lockNoteMarkup(block)}
  `;
}

function oldCardMarkup(block) {
  const windowsMarkup = (block.windows || [])
    .map((window) => {
      if (!window.range) {
        return "";
      }

      const windowSurahSummary = buildRangeSurahSummaryText(window.range);

      return `
        <article class="rotation-chip mini-window ${window.active ? "active-window" : ""}">
          <span class="eyebrow">${escapeHtml(window.label)}</span>
          <strong>${escapeHtml(window.range.label)}</strong>
          <p class="helper">${escapeHtml(window.range.countLabel)}</p>
          ${windowSurahSummary ? `<p class="helper range-surah-summary">${escapeHtml(windowSurahSummary)}</p>` : ""}
        </article>
      `;
    })
    .join("");

  const poolSurahSummary = buildRangeSurahSummaryText(block.poolRange);

  const headerContent = `
    <div class="card-head">
      <div>
        <p class="eyebrow">${escapeHtml(`${block.order}. ${block.title}`)}</p>
        <h2>${escapeHtml(block.title)}</h2>
      </div>
      ${statusMarkup(block)}
    </div>
    <p class="helper">${renderUiRichText(block.helper)}</p>
  `;

  const detailContent = `
    ${rangeBlockMarkup(block.range)}
    ${
      block.present
        ? `
          <div class="rotation-grid">
            <article class="rotation-chip pool">
              <span class="eyebrow">${escapeHtml(t("card.old.pool"))}</span>
              <strong>${escapeHtml(block.poolRange.label)}</strong>
              <p class="helper">${escapeHtml(block.poolRange.countLabel)}</p>
              ${poolSurahSummary ? `<p class="helper range-surah-summary">${escapeHtml(poolSurahSummary)}</p>` : ""}
            </article>
          </div>
          <div class="summary-lines">
            <p>${escapeHtml(t("card.old.rotation", { count: block.windowCount }))}</p>
          </div>
          <div class="old-windows-grid">
            ${windowsMarkup}
          </div>
        `
        : ""
    }
  `;

  return cardFrameMarkup({
    blockKey: "old",
    block,
    headerContent,
    summaryText: cardRangeSummary(block.range),
    detailContent,
    footerContent: toggleButtonMarkup("old", block),
  });
}

function simpleCardMarkup(blockKey, block) {
  const headerContent = `
    <div class="card-head">
      <div>
        <p class="eyebrow">${block.order}. ${escapeHtml(block.title)}</p>
        <h2>${escapeHtml(block.title)}</h2>
      </div>
      ${statusMarkup(block)}
    </div>
    <p class="helper">${renderUiRichText(block.helper)}</p>
  `;

  return cardFrameMarkup({
    blockKey,
    block,
    headerContent,
    summaryText: cardRangeSummary(block.range),
    detailContent: rangeBlockMarkup(block.range),
    footerContent: toggleButtonMarkup(blockKey, block),
  });
}

function consolidationCardMarkup(block) {
  const bandLabels = {
    A: t("part.label", { number: 1 }),
    B: t("part.label", { number: 2 }),
    C: t("part.label", { number: 3 }),
  };
  const bands = ["A", "B", "C"].map((bandKey) => {
    const band = block.bands[bandKey];
    const isActive = block.activeBand === bandKey;
    return `
      <article class="band-chip ${isActive ? "active" : ""}">
        <span class="eyebrow">${escapeHtml(bandLabels[bandKey] || bandKey)}</span>
        <strong>${band ? escapeHtml(band.label) : escapeHtml(t("card.consolidation.noRange"))}</strong>
        <p class="helper">${escapeHtml(isActive ? t("card.consolidation.active") : t("card.consolidation.inactive"))}</p>
      </article>
    `;
  });

  const headerContent = `
    <div class="card-head">
      <div>
        <p class="eyebrow">${escapeHtml(`${block.order}. ${block.title}`)}</p>
        <h2>${escapeHtml(block.title)}</h2>
      </div>
      ${statusMarkup(block)}
    </div>
    <p class="helper">${renderUiRichText(block.helper)}</p>
  `;

  const detailContent = `
    ${rangeBlockMarkup(block.fullRange)}
    ${
      block.fullRange
        ? `
          <div class="summary-lines">
            <p>${escapeHtml(t("card.consolidation.concerned"))}</p>
            <p>${escapeHtml(t("card.consolidation.activeToday", { part: bandLabels[block.activeBand] || "-" }))}</p>
            <p>${escapeHtml(t("card.consolidation.blockToValidate", { block: block.activeRange ? block.activeRange.label : t("card.consolidation.noRange") }))}</p>
          </div>
          <div class="band-grid">${bands.join("")}</div>
        `
        : ""
    }
  `;

  return cardFrameMarkup({
    blockKey: "consolidation",
    block,
    headerContent,
    summaryText: cardRangeSummary(block.activeRange || block.fullRange),
    detailContent,
    footerContent: toggleButtonMarkup("consolidation", block),
  });
}

function newCardMarkup(block) {
  const waveMoments = [t("card.new.morning"), t("card.new.noon"), t("card.new.evening")];
  const waveCards = block.waves.map((wave, waveIndex) => {
    const slots = wave.slots.map((slot) => {
      return `
        <button
          class="slot-button ${slot.checked ? "active" : ""}"
          type="button"
          data-wave-index="${waveIndex}"
          data-slot-index="${slot.index}"
          ${block.locked ? "disabled" : ""}
        >
          ${escapeHtml(slot.label)}
        </button>
      `;
    });

    return `
      <article class="wave-card ${wave.complete ? "complete" : ""}">
        <div>
          <p class="eyebrow">${escapeHtml(`${wave.label} - ${waveMoments[waveIndex] || ""}`)}</p>
          <h3>${escapeHtml(wave.complete ? t("card.new.complete") : t("card.new.inProgress"))}</h3>
        </div>
        <div class="slot-grid">${slots.join("")}</div>
      </article>
    `;
  });

  const headerContent = `
    <div class="card-head">
      <div>
        <p class="eyebrow">${escapeHtml(`${block.order}. ${block.title}`)}</p>
        <h2>${escapeHtml(block.title)}</h2>
      </div>
      ${statusMarkup(block)}
    </div>
    <p class="helper">${renderUiRichText(block.helper)}</p>
  `;

  const detailContent = `
    ${rangeBlockMarkup(block.range)}
    ${
      block.present
        ? `
          <div class="summary-lines">
            <p>${escapeHtml(t("card.new.checked", { count: block.checkedCount }))}</p>
            <p>${renderUiRichText(t("card.new.rule"))}</p>
            ${block.locked && block.blockedByLabels?.length ? `<p>${escapeHtml(t("card.new.locked", { items: block.blockedByLabels.join(", ") }))}</p>` : ""}
          </div>
          <div class="wave-grid">${waveCards.join("")}</div>
        `
        : ""
    }
  `;

  return cardFrameMarkup({
    blockKey: "new",
    block,
    headerContent,
    summaryText: block.present ? t("card.new.checked", { count: block.checkedCount }) : cardRangeSummary(block.range),
    detailContent,
  });
}

function renderSummary(payload) {
  const { plan } = payload;
  const metrics = getDashboardMetrics(payload);
  const streak = payload?.statistics?.streak || {};
  const rank = getRankFromProgress(metrics.learnedPercent);
  const phaseHeadline = plan.summary.phaseDirectionLabel;
  const coveredCorpusLabel = t(
    "summary.learned",
    { count: formatPageCountFromHalfPages(metrics.learnedHalfPages, payload) },
    payload,
  );
  const currentPointDetails = getCurrentPointDetails(plan, payload);
  const streakHint = streak.activeToday ? t("summary.streakHintToday", {}, payload) : t("summary.streakHintOpen", {}, payload);

  $("#summary").innerHTML = `
    <div class="summary-hero">
      <article class="summary-progress tone-${escapeHtml(rank.tone)} ${plan.dayClosed ? "complete" : ""}">
        <div class="summary-progress-head">
          <div class="summary-progress-copy">
            <span class="eyebrow">${escapeHtml(t("summary.progress", {}, payload))}</span>
            <strong>${escapeHtml(phaseHeadline)}</strong>
          </div>
          <span class="summary-progress-value">${escapeHtml(`${metrics.learnedPercent}%`)}</span>
        </div>
        <div class="summary-progress-track" aria-hidden="true">
          <span class="summary-progress-fill" style="width:${escapeHtml(metrics.learnedPercent)}%;"></span>
        </div>
        <p class="summary-progress-note">${escapeHtml(`${coveredCorpusLabel} | ${t("summary.totalPages", { count: plan.summary.totalPages }, payload)}`)}</p>
      </article>
      <div class="summary-grid">
        <article class="summary-chip">
          <span class="eyebrow">${escapeHtml(t("summary.day", {}, payload))}</span>
          <strong>${escapeHtml(plan.summary.programDayIndex)}</strong>
        </article>
        <article class="summary-chip">
          <span class="eyebrow">${escapeHtml(t("summary.dailyNew", {}, payload))}</span>
          <strong>${escapeHtml(plan.summary.dailyNewLabel)}</strong>
        </article>
        <article class="summary-chip current-point">
          <span class="eyebrow">${escapeHtml(t("summary.currentPoint", {}, payload))}</span>
          <div class="summary-current-copy">
            <strong>${escapeHtml(plan.summary.currentHalfPageLabel)}</strong>
            <div class="summary-current-meta">
              <span class="summary-current-pill">${escapeHtml(currentPointDetails.zoneLabel)}</span>
            </div>
          </div>
        </article>
        <article class="summary-chip streak-chip">
          <span class="eyebrow">${escapeHtml(t("summary.streak", {}, payload))}</span>
          <strong>${escapeHtml(String(streak.current || 0))}</strong>
          <p class="summary-note">${escapeHtml(streakHint)}</p>
        </article>
      </div>
    </div>
  `;
}

function renderStatistics(payload) {
  const container = $("#statistics-view");
  if (!container) {
    return;
  }

  const statistics = payload?.statistics || {};
  const streak = statistics.streak || {};
  const overview = statistics.overview || {};
  const timeline = Array.isArray(statistics.timeline) ? statistics.timeline : [];
  const recentClosures = Array.isArray(statistics.recentClosures) ? statistics.recentClosures : [];
  const streakStatus = streak.activeToday ? t("summary.streakHintToday", {}, payload) : t("statistics.pendingToday", {}, payload);

  container.innerHTML = `
    <div class="statistics-stack">
      <section class="statistics-kpi-grid">
        <article class="statistics-kpi-card primary">
          <span class="eyebrow">${escapeHtml(t("statistics.currentStreak", {}, payload))}</span>
          <strong>${escapeHtml(String(streak.current || 0))}</strong>
          <p class="helper">${escapeHtml(streakStatus)}</p>
        </article>
        <article class="statistics-kpi-card">
          <span class="eyebrow">${escapeHtml(t("statistics.bestStreak", {}, payload))}</span>
          <strong>${escapeHtml(String(streak.best || 0))}</strong>
          <p class="helper">${escapeHtml(t("summary.streak", {}, payload))}</p>
        </article>
        <article class="statistics-kpi-card">
          <span class="eyebrow">${escapeHtml(t("statistics.last7", {}, payload))}</span>
          <strong>${escapeHtml(`${overview.closedDaysLast7 || 0}/7`)}</strong>
          <p class="helper">${escapeHtml(t("statistics.closed", {}, payload))}</p>
        </article>
        <article class="statistics-kpi-card">
          <span class="eyebrow">${escapeHtml(t("statistics.last30", {}, payload))}</span>
          <strong>${escapeHtml(`${overview.closedDaysLast30 || 0}/30`)}</strong>
          <p class="helper">${escapeHtml(t("statistics.closed", {}, payload))}</p>
        </article>
        <article class="statistics-kpi-card">
          <span class="eyebrow">${escapeHtml(t("statistics.completionRate", {}, payload))}</span>
          <strong>${escapeHtml(`${overview.completionRateLast30 || 0}%`)}</strong>
          <p class="helper">${escapeHtml(t("statistics.timelineTitle", {}, payload))}</p>
        </article>
        <article class="statistics-kpi-card">
          <span class="eyebrow">${escapeHtml(t("statistics.skippedNew", {}, payload))}</span>
          <strong>${escapeHtml(String(overview.skippedNewLast30 || 0))}</strong>
          <p class="helper">${escapeHtml(t("statistics.recentClosureSkipped", {}, payload))}</p>
        </article>
      </section>

      <section class="statistics-panel-block">
        <div class="statistics-block-head">
          <div>
            <span class="eyebrow">${escapeHtml(t("statistics.timelineTitle", {}, payload))}</span>
            <h3>${escapeHtml(t("statistics.timelineTitle", {}, payload))}</h3>
          </div>
          <p class="helper">${escapeHtml(t("statistics.timelineHelp", {}, payload))}</p>
        </div>
        <div class="statistics-timeline-grid">
          ${timeline
            .map((entry) => {
              const statusKey = entry.closed ? "statistics.closed" : entry.isToday ? "statistics.todayPending" : "statistics.missed";
              const title = `${formatDateKey(entry.date, payload, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })} - ${t(statusKey, {}, payload)}`;
              return `
                <article
                  class="statistics-day-cell ${entry.closed ? "is-closed" : "is-open"} ${entry.skippedNew ? "is-skipped" : ""} ${entry.isToday ? "is-today" : ""}"
                  title="${escapeHtml(title)}"
                >
                  <strong>${escapeHtml(String(entry.dayOfMonth || ""))}</strong>
                  <span>${escapeHtml(entry.closed ? "•" : " ")}</span>
                </article>
              `;
            })
            .join("")}
        </div>
      </section>

      <section class="statistics-panel-block">
        <div class="statistics-block-head">
          <div>
            <span class="eyebrow">${escapeHtml(t("statistics.recentClosures", {}, payload))}</span>
            <h3>${escapeHtml(t("statistics.recentClosures", {}, payload))}</h3>
          </div>
        </div>
        ${
          recentClosures.length
            ? `
              <div class="statistics-closure-list">
                ${recentClosures
                  .map(
                    (entry) => `
                      <article class="statistics-closure-row">
                        <div>
                          <strong>${escapeHtml(formatDateKey(entry.date, payload, { weekday: "short", month: "short", day: "numeric" }))}</strong>
                          <p class="helper">${escapeHtml(entry.skippedNew ? t("statistics.recentClosureSkipped", {}, payload) : t("statistics.recentClosureFull", {}, payload))}</p>
                        </div>
                        <div class="statistics-closure-meta">
                          <span>${escapeHtml(`J${entry.programDayIndex || 0}`)}</span>
                          <span>${escapeHtml(formatTimestampTime(entry.completedAt, payload))}</span>
                        </div>
                      </article>
                    `,
                  )
                  .join("")}
              </div>
            `
            : `<p class="helper">${escapeHtml(t("statistics.recentClosuresEmpty", {}, payload))}</p>`
        }
      </section>
    </div>
  `;
}

function getCurrentPointDetails(plan, payload = state.payload) {
  const totalHalfPages = Math.max(1, Number(plan?.summary?.totalHalfPages || 1));
  const rawCurrentHalfPage = Number(plan?.summary?.currentHalfPage || 1);
  const safeCurrentHalfPage = Math.min(Math.max(rawCurrentHalfPage, 1), totalHalfPages);
  const direction = plan?.summary?.phaseDirection || "forward";
  const unitInPage = ((sequenceHalfPageToPhysicalHalfPage(safeCurrentHalfPage, totalHalfPages, direction) - 1) % PROGRESS_UNITS_PER_PAGE) + 1;
  const isLowerHalf = unitInPage > PROGRESS_UNITS_PER_PAGE / 2;
  const isFinished = rawCurrentHalfPage > totalHalfPages;
  const language = getLanguage(payload);
  let zoneLabel;
  if (isFinished) {
    zoneLabel = t("settings.phaseStatusDone", {}, payload);
  } else if (language === "en") {
    zoneLabel = isLowerHalf ? "Lower half" : "Upper half";
  } else if (language === "ar") {
    zoneLabel = isLowerHalf ? "النصف الأسفل" : "النصف الأعلى";
  } else {
    zoneLabel = isLowerHalf ? "Moitié basse" : "Moitié haute";
  }

  return {
    zoneLabel,
  };
}

function renderHero(payload) {
  const firstName = normalizeFirstName(payload?.settings?.firstName || "");
  const sparkle = '<span class="hero-title-sparkle" aria-hidden="true">✨</span>';
  if (getLanguage(payload) === "en") {
    $("#hero-title").innerHTML = firstName
      ? `Bismillah, here is your <span class="ui-emphasis title-emphasis">plan for today</span>, ${escapeHtml(firstName)}!${sparkle}`
      : `Bismillah, here is your <span class="ui-emphasis title-emphasis">plan for today</span>!${sparkle}`;
    return;
  }

  $("#hero-title").innerHTML = firstName
    ? `Bismillah, voici ton <span class="ui-emphasis title-emphasis">plan du jour</span>, ${escapeHtml(firstName)} !${sparkle}`
    : `Bismillah, voici ton <span class="ui-emphasis title-emphasis">plan du jour</span> !${sparkle}`;
}

function renderDayStatus(payload) {
  const { plan } = payload;
  const metrics = getDashboardMetrics(payload);
  const missing = [];
  if (!plan.blocks.old.dayComplete) {
    missing.push(plan.blocks.old.title);
  }
  if (!plan.blocks.consolidation.dayComplete) {
    missing.push(plan.blocks.consolidation.title);
  }
  if (!plan.blocks.recent.dayComplete) {
    missing.push(plan.blocks.recent.title);
  }
  if (!plan.blocks.yesterday.dayComplete) {
    missing.push(plan.blocks.yesterday.title);
  }
  if (!plan.blocks.new.dayComplete) {
    missing.push(plan.blocks.new.title);
  }

  $("#day-status").innerHTML = plan.dayClosed
    ? `
        <strong>${escapeHtml(t(plan.skippedMemorizationDay ? "day.skippedTitle" : "day.completeTitle", {}, payload))}</strong>
        <div class="status-progress">
          <div class="progress-bar green large"><span style="width: 100%"></span></div>
          <p class="helper">${escapeHtml(t(plan.skippedMemorizationDay ? "day.skippedHelper" : "day.completeHelper", { done: metrics.completedKeys.length, total: metrics.presentKeys.length }, payload))}</p>
        </div>
        <p>${escapeHtml(t(plan.skippedMemorizationDay ? "day.skippedText" : "day.completeText", {}, payload))}</p>
      `
    : `
        <strong>${escapeHtml(t("day.openTitle", {}, payload))}</strong>
        <div class="status-progress">
          <div class="progress-bar gold large"><span style="width: ${escapeHtml(metrics.dailyPercent)}%"></span></div>
          <p class="helper">${escapeHtml(t("day.openHelper", { done: metrics.completedKeys.length, total: metrics.presentKeys.length }, payload))}</p>
        </div>
        <p>${escapeHtml(t("day.remaining", { items: missing.join(", ") }, payload))}</p>
      `;

  $("#advance-button").disabled = !plan.canAdvanceDay;
  $("#skip-memorization-button").disabled = !plan.canSkipMemorizationDay;
}

function renderSettingsPreview(payload) {
  const container = $("#settings-preview");
  if (!container) {
    return;
  }

  const { plan } = payload;
  const mode = payload.settings.programMode || "forward";
  const phaseProgressItems = (plan.summary.phaseProgressHalfPages || []).map((halfPages, index) => ({
    label: getPhaseLabel(mode, index + 1, payload),
    value: formatCoveredPagesValue(halfPages, payload),
  }));
  const previewItems = [
    {
      label: t("settings.previewPhase", {}, payload),
      value: plan.summary.phaseLabel,
    },
    {
      label: t("settings.previewPath", {}, payload),
      value: plan.summary.phaseDirectionLabel,
    },
    ...phaseProgressItems,
    {
      label: t("settings.previewCurrent", {}, payload),
      value: plan.summary.currentHalfPageLabel,
    },
    {
      label: t("settings.previewNew", {}, payload),
      value: plan.blocks.new?.range?.label || t("settings.previewMissing", {}, payload),
    },
    {
      label: t("settings.previewOld", {}, payload),
      value: plan.blocks.old?.range?.label || t("settings.previewMissing", {}, payload),
    },
    {
      label: t("settings.previewConsolidation", {}, payload),
      value: plan.blocks.consolidation?.activeRange?.label || t("settings.previewMissing", {}, payload),
    },
    {
      label: t("settings.previewRecent", {}, payload),
      value: plan.blocks.recent?.range?.label || t("settings.previewMissing", {}, payload),
    },
    {
      label: t("settings.previewProgramDay", {}, payload),
      value: String(plan.summary.programDayIndex),
    },
    {
      label: t("settings.previewTotal", {}, payload),
      value: t("summary.totalPages", { count: plan.summary.totalPages }, payload),
    },
  ];

  container.innerHTML = previewItems
    .map(
      (item) => `
        <article class="settings-preview-card">
          <span class="eyebrow">${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
        </article>
      `,
    )
    .join("");
}

function renderErrorTracking(payload, options = {}) {
  const { forceFull = false } = options;
  const totalPages = payload.errorTracking.totalPages;
  const summary = payload.errorTracking.summary;
  const pageErrors = payload.pageErrors || {};
  const plan = payload.plan || {};
  const juzGroups = ensureCollapsedJuzState(totalPages).map((group) => ({
    ...group,
    collapsed: state.collapsedJuzs[group.juz] !== false,
    pageCells: [],
    errorPages: 0,
    learnedPages: 0,
  }));
  state.activePage =
    Number.isInteger(state.activePage) && state.activePage >= 1 && state.activePage <= totalPages ? state.activePage : null;

  renderProgramLegend(plan);
  renderPageQuickActions(payload);

  if (!forceFull && isErrorTrackingRenderReusable(payload)) {
    syncActivePageCellHighlight();
    return;
  }

  let effectiveLearnedPages = 0;
  for (let page = 1; page <= totalPages; page += 1) {
    const entry = normalizePageEntry(pageErrors[String(page)]);
    const programZones = getPageProgramZones(plan, page);
    const surahCaption = buildSurahCaption(page);
    const surahStarts = getSurahStartNamesForPage(page);
    const primaryZone = getPrimaryProgramZoneInfo(programZones);
    const learnedFromProgram = isLearnedFromProgram(payload, page);
    const effectiveLearned = learnedFromProgram;
    const programTitleSuffix = programZones.length ? ` - ${programZones.map((zone) => zone.label).join(", ")}` : "";
    const surahTitleSuffix = surahStarts.length
      ? ` - ${surahStarts.map((surah) => `${surah.simple} (${surah.arabic})`).join(", ")}`
      : surahCaption
        ? ` - ${surahCaption.simple} (${surahCaption.arabic})`
        : "";
    const stateLabel = buildPageStateLabel(entry, effectiveLearned);
    const compactStateLabel = buildPageGridStateLabel(entry, effectiveLearned);

    if (effectiveLearned) {
      effectiveLearnedPages += 1;
    }

    const currentJuzGroup = juzGroups.find((group) => page >= group.startPage && page <= group.endPage);
    if (currentJuzGroup) {
      if (entry.dominantSeverity !== "none") {
        currentJuzGroup.errorPages += 1;
      }
      if (effectiveLearned) {
        currentJuzGroup.learnedPages += 1;
      }
    }

    const cellMarkup = `
      <button
        class="${escapeHtml(pageCellClass(entry, page, effectiveLearned, programZones))}"
        type="button"
        data-page-cell="${escapeHtml(page)}"
        data-severity="${escapeHtml(entry.dominantSeverity)}"
        data-learned="${escapeHtml(effectiveLearned)}"
        title="${escapeHtml(t("page.label", { page }, payload))} - ${escapeHtml(stateLabel)}${escapeHtml(surahTitleSuffix)}${escapeHtml(programTitleSuffix)}"
      >
        <span class="page-cell-number">${escapeHtml(page)}</span>
        <span class="page-cell-state">${escapeHtml(compactStateLabel)}</span>
        ${
          surahCaption
            ? `<span class="page-cell-surah ${surahCaption.startsHere ? "start" : ""}">
                <em>${escapeHtml(surahCaption.arabic)}</em>
                <span>${escapeHtml(surahCaption.simple)}</span>
              </span>`
            : ""
        }
        ${
          primaryZone
            ? `
              <span class="page-cell-footer">
                ${primaryZone ? `<span class="page-cell-zone zone-${escapeHtml(primaryZone.key)}">${escapeHtml(primaryZone.shortLabel)}</span>` : ""}
              </span>
            `
            : ""
        }
      </button>
    `;

    if (currentJuzGroup) {
      currentJuzGroup.pageCells.push(cellMarkup);
    }
  }

  $("#error-summary").innerHTML = `
    <article class="summary-chip error-summary-chip neutral">
      <span class="eyebrow">${escapeHtml(t("errorSummary.pagesWithErrors", {}, payload))}</span>
      <strong>${escapeHtml(summary.pagesWithErrors)}</strong>
      <p class="summary-note">${escapeHtml(t("errorSummary.pagesWithErrorsHelp", { total: totalPages }, payload))}</p>
    </article>
    <article class="summary-chip error-summary-chip learned">
      <span class="eyebrow">${escapeHtml(t("errorSummary.learnedPages", {}, payload))}</span>
      <strong>${escapeHtml(effectiveLearnedPages)}</strong>
      <p class="summary-note">${escapeHtml(t("errorSummary.learnedPagesHelp", {}, payload))}</p>
    </article>
    <article class="summary-chip error-summary-chip minor">
      <span class="eyebrow">${escapeHtml(t("errorSummary.minor", {}, payload))}</span>
      <strong>${escapeHtml(summary.minor)}</strong>
      <p class="summary-note">${escapeHtml(t("errorSummary.minorHelp", {}, payload))}</p>
    </article>
    <article class="summary-chip error-summary-chip medium">
      <span class="eyebrow">${escapeHtml(t("errorSummary.medium", {}, payload))}</span>
      <strong>${escapeHtml(summary.medium)}</strong>
      <p class="summary-note">${escapeHtml(t("errorSummary.mediumHelp", {}, payload))}</p>
    </article>
    <article class="summary-chip error-summary-chip grave">
      <span class="eyebrow">${escapeHtml(t("errorSummary.grave", {}, payload))}</span>
      <strong>${escapeHtml(summary.grave)}</strong>
      <p class="summary-note">${escapeHtml(t("errorSummary.graveHelp", {}, payload))}</p>
    </article>
  `;

  $("#error-grid").innerHTML = juzGroups
    .map((group) => `
      <section class="juz-group ${group.collapsed ? "collapsed" : "expanded"}" data-juz-group="${escapeHtml(group.juz)}">
        <button
          class="juz-group-toggle"
          type="button"
          data-toggle-juz="${escapeHtml(group.juz)}"
          aria-expanded="${escapeHtml(!group.collapsed)}"
          aria-controls="juz-pages-${escapeHtml(group.juz)}"
        >
          <div class="juz-group-copy">
            <p class="eyebrow">${escapeHtml(t("pages.juzLabel", { number: group.juz }, payload))}</p>
            <div class="juz-group-title-line">
              <strong>${escapeHtml(group.name)}</strong>
              ${group.arabicName ? `<span class="juz-group-arabic">${escapeHtml(group.arabicName)}</span>` : ""}
            </div>
            <p class="juz-group-pages">${escapeHtml(t("pages.juzPages", { start: group.startPage, end: group.endPage }, payload))}</p>
          </div>
          <div class="juz-group-meta">
            <span class="juz-stat-pill">${escapeHtml(t("pages.juzPageCount", { count: group.endPage - group.startPage + 1 }, payload))}</span>
            <span class="juz-stat-pill ${group.errorPages ? "has-errors" : ""}">${escapeHtml(t("pages.juzErrorCount", { count: group.errorPages }, payload))}</span>
            <span class="juz-stat-pill ${group.learnedPages ? "is-learned" : ""}">${escapeHtml(t("pages.juzLearnedCount", { count: group.learnedPages }, payload))}</span>
            <span class="juz-toggle-pill">${escapeHtml(t(group.collapsed ? "pages.juzExpand" : "pages.juzCollapse", {}, payload))}</span>
            <span class="juz-group-chevron" aria-hidden="true"></span>
          </div>
        </button>
        <div id="juz-pages-${escapeHtml(group.juz)}" class="page-grid juz-page-grid" ${group.collapsed ? "hidden" : ""}>${group.pageCells.join("")}</div>
      </section>
    `)
    .join("");
  rememberErrorTrackingRender(payload);
  syncActivePageCellHighlight();
}

function renderSurahGame(payload) {
  const container = $("#surah-game");
  if (!container) {
    return;
  }

  const corpus = ensureSurahGameState(payload);
  const isMobileViewport = typeof window !== "undefined" && window.matchMedia("(max-width: 720px)").matches;
  const gameMode = state.surahGame.gameMode || "quiz";
  const question = state.surahGame.question;
  const memoryRound = state.surahGame.memoryRound;
  const centerSurah = getSurahById(question?.centerId);
  const feedbackSurah = getSurahById(question?.correctId);
  const isRangeTooSmall = corpus.surahs.length < 2;
  const canStartMemory = corpus.surahs.length >= SURAH_MEMORY_LENGTH;
  const canStartQuiz = corpus.playable;
  const canStartCurrentMode = gameMode === "memory" ? canStartMemory : canStartQuiz;
  const accuracy = getSurahGameAccuracy();
  const heatTier = getSurahHeatTier();
  const isFullRange = corpus.startId === 1 && corpus.endId === SURAH_PAGE_RANGES.length;
  const heatNote =
    heatTier.next === null
      ? t("surahs.heatMax", {}, payload)
      : t("surahs.heatNext", { count: heatTier.remaining }, payload);
  const settingsPanelMarkup = `
    <section class="surah-setup-shell">
      <div class="surah-setup-grid">
        <div class="surah-setup-block surah-setup-block-mode">
          <div class="surah-setup-head">
            <span class="eyebrow">${escapeHtml(t("surahs.playModeLabel", {}, payload))}</span>
          </div>
          ${buildSurahGameModeMarkup(payload, { compact: true })}
        </div>
        <div class="surah-setup-block surah-setup-block-range">
          <div class="surah-setup-head">
            <span class="eyebrow">${escapeHtml(t("surahs.rangeLabel", {}, payload))}</span>
            <span class="surah-setup-summary">${escapeHtml(corpus.label)}</span>
          </div>
          <div class="surah-range-controls compact">
            <label class="surah-select-field compact">
              <span>${escapeHtml(t("surahs.rangeFrom", {}, payload))}</span>
              <select data-surah-game-select="start">${buildSurahSelectOptions(corpus.startId)}</select>
            </label>
            <label class="surah-select-field compact">
              <span>${escapeHtml(t("surahs.rangeTo", {}, payload))}</span>
              <select data-surah-game-select="end">${buildSurahSelectOptions(corpus.endId)}</select>
            </label>
            <button
              class="secondary-button surah-range-button compact ${isFullRange ? "active" : ""}"
              type="button"
              data-surah-game-action="full-range"
            >
              ${escapeHtml(t("surahs.rangeQuickAll", {}, payload))}
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
  const settingsMarkup =
    state.surahGame.isStarted && isMobileViewport
      ? `
        <section class="surah-settings-shell">
          <details class="surah-settings-details">
            <summary class="surah-settings-summary">
              <div class="surah-settings-summary-copy">
                <span class="eyebrow">${escapeHtml(t("surahs.settingsCompactLabel", {}, payload))}</span>
                <strong>${escapeHtml(t(gameMode === "memory" ? "surahs.playModeMemory" : "surahs.playModeQuiz", {}, payload))}</strong>
              </div>
              <span class="surah-settings-summary-meta">${escapeHtml(corpus.label)}</span>
            </summary>
            <div class="surah-settings-stack">
              ${settingsPanelMarkup}
            </div>
          </details>
        </section>
      `
      : `
        <section class="surah-settings-shell surah-settings-shell-open">
          <div class="surah-settings-stack">
            ${settingsPanelMarkup}
          </div>
        </section>
      `;
  const liveStatusValue =
    gameMode === "memory" && memoryRound?.phase === "preview"
      ? t("surahs.memoryCountdownValue", { count: getSurahMemoryCountdown(memoryRound).remainingSeconds }, payload)
      : t("surahs.streakValue", { count: state.surahGame.streak }, payload);
  const liveStripMarkup = `
    <section class="surah-game-livebar">
      <article class="surah-live-pill">
        <span>${escapeHtml(t("surahs.playModeLabel", {}, payload))}</span>
        <strong>${escapeHtml(t(gameMode === "memory" ? "surahs.playModeMemory" : "surahs.playModeQuiz", {}, payload))}</strong>
      </article>
      <article class="surah-live-pill emphasis">
        <span>${escapeHtml(t("surahs.rangeLabel", {}, payload))}</span>
        <strong>${escapeHtml(corpus.label)}</strong>
        <em>${escapeHtml(t("surahs.countValue", { count: corpus.surahs.length }, payload))}</em>
      </article>
      <article class="surah-live-pill heat tier-${escapeHtml(heatTier.theme)}">
        <span>${escapeHtml(t("surahs.heatLabel", {}, payload))}</span>
        <strong>${escapeHtml(liveStatusValue)}</strong>
        <em>${escapeHtml(t(heatTier.key, {}, payload))}</em>
      </article>
    </section>
  `;
  const topActionMarkup = state.surahGame.isStarted
    ? `
        <button class="secondary-button" type="button" data-surah-game-action="restart">
          ${escapeHtml(t("surahs.restart", {}, payload))}
        </button>
      `
    : `
        <button class="primary-button" type="button" data-surah-game-action="start" ${canStartCurrentMode ? "" : "disabled"}>
          ${escapeHtml(t("surahs.playButton", {}, payload))}
        </button>
      `;

  const questionMarkup = gameMode === "memory" && !canStartMemory
    ? buildSurahMemoryMarkup(payload, corpus, heatTier)
    : gameMode !== "memory" && !canStartQuiz
    ? `
      <section class="surah-empty-state">
        <h3>${escapeHtml(t(isRangeTooSmall ? "surahs.emptyRangeTitle" : "surahs.emptyAllTitle", {}, payload))}</h3>
        <p class="muted">${escapeHtml(t(isRangeTooSmall ? "surahs.emptyRangeHelp" : "surahs.emptyAllHelp", {}, payload))}</p>
        <button class="secondary-button" type="button" data-surah-game-action="full-range">
          ${escapeHtml(t("surahs.rangeQuickAll", {}, payload))}
        </button>
      </section>
    `
    : !state.surahGame.isStarted
    ? `
      <section class="surah-empty-state">
        <h3>${escapeHtml(t("surahs.readyTitle", {}, payload))}</h3>
        <p class="muted">${escapeHtml(t(gameMode === "memory" ? "surahs.readyHelpMemory" : "surahs.readyHelpQuiz", {}, payload))}</p>
      </section>
    `
    : gameMode === "memory"
    ? buildSurahMemoryMarkup(payload, corpus, heatTier)
    : question && centerSurah
    ? `
      <section class="surah-question-shell">
        <article class="surah-spotlight">
          <span class="eyebrow">${escapeHtml(t("surahs.currentLabel", {}, payload))}</span>
          ${buildSurahIdentityMarkup(centerSurah)}
          <div class="surah-coverage">
            <span class="surah-coverage-label">${escapeHtml(t("surahs.activeSpanLabel", {}, payload))}</span>
            ${buildSurahCoverageMarkup(corpus)}
          </div>
        </article>

        <div class="surah-question-panel">
          <div class="surah-question-copy">
            <span class="eyebrow">${escapeHtml(
              t(question.promptType === "next" ? "surahs.promptNext" : "surahs.promptPrevious", {}, payload),
            )}</span>
            <h3>${escapeHtml(t("surahs.answerLabel", {}, payload))}</h3>
          </div>

          <div class="surah-choice-grid">
            ${question.choiceIds
              .map((choiceId) => {
                const surah = getSurahById(choiceId);
                const isAnswered = question.answeredId !== null;
                const isSelected = question.answeredId === choiceId;
                const isCorrectChoice = question.correctId === choiceId;
                const buttonClasses = ["surah-choice-button"];
                if (isAnswered && isCorrectChoice) {
                  buttonClasses.push("is-correct");
                }
                if (isAnswered && isSelected && !isCorrectChoice) {
                  buttonClasses.push("is-wrong");
                }
                if (isAnswered && !isSelected && !isCorrectChoice) {
                  buttonClasses.push("is-muted");
                }
                return `
                  <button
                    class="${buttonClasses.join(" ")}"
                    type="button"
                    data-surah-game-action="answer"
                    data-choice-id="${escapeHtml(choiceId)}"
                    ${isAnswered ? "disabled" : ""}
                  >
                    ${buildSurahIdentityMarkup(surah, { compact: true })}
                  </button>
                `;
              })
              .join("")}
          </div>

          ${
            question.answeredId !== null
              ? `
                <div class="surah-feedback ${question.isCorrect ? "correct" : "wrong"}">
                  <p>${escapeHtml(
                    question.isCorrect
                      ? t("surahs.feedbackCorrect", {}, payload)
                      : t("surahs.feedbackWrong", { name: feedbackSurah?.simple || "" }, payload),
                  )}</p>
                  ${
                    question.isCorrect
                      ? `
                        <div class="surah-feedback-heat">
                          ${buildSurahFlamesClusterMarkup(state.surahGame.streak)}
                          <strong>${escapeHtml(t(heatTier.key, {}, payload))}</strong>
                          <span>${escapeHtml(t("surahs.streakValue", { count: state.surahGame.streak }, payload))}</span>
                        </div>
                      `
                      : ""
                  }
                  <div class="surah-sequence-block">
                    <span class="eyebrow">${escapeHtml(t("surahs.sequenceLabel", {}, payload))}</span>
                    <div class="surah-sequence-grid">
                      ${buildSurahSequenceMarkup(question.centerId)}
                    </div>
                  </div>
                  <button class="primary-button" type="button" data-surah-game-action="next">
                    ${escapeHtml(t("surahs.nextQuestion", {}, payload))}
                  </button>
                </div>
              `
              : ""
          }
        </div>
      </section>
    `
    : `
      <section class="surah-empty-state">
        <h3>${escapeHtml(t("surahs.readyTitle", {}, payload))}</h3>
        <p class="muted">${escapeHtml(t(gameMode === "memory" ? "surahs.readyHelpMemory" : "surahs.readyHelpQuiz", {}, payload))}</p>
      </section>
    `;

  container.innerHTML = `
    <div class="surah-game-shell tier-${escapeHtml(heatTier.theme)} ${state.surahGame.isStarted ? "is-started" : "is-idle"} mode-${escapeHtml(gameMode)}">
      <div class="section-head surah-game-head">
        <div>
          <p class="eyebrow">${escapeHtml(t("surahs.eyebrow", {}, payload))}</p>
          <h2>${renderUiRichText(t("surahs.title", {}, payload))}</h2>
        </div>
        <div class="surah-game-head-actions">
          ${topActionMarkup}
        </div>
      </div>
      <p class="muted surah-game-help">${renderUiRichText(t("surahs.help", {}, payload))}</p>

      ${settingsMarkup}
      ${liveStripMarkup}

      <section class="surah-game-meta">
        <article class="surah-meta-card">
          <span class="eyebrow">${escapeHtml(t("surahs.activeSpanLabel", {}, payload))}</span>
          <strong>${escapeHtml(corpus.label)}</strong>
          <div class="surah-coverage">
            <span class="surah-coverage-label">${escapeHtml(t("surahs.coverageLabel", {}, payload))}</span>
            ${buildSurahCoverageMarkup(corpus)}
          </div>
          <p class="helper">${escapeHtml(t("surahs.countValue", { count: corpus.surahs.length }, payload))}</p>
        </article>

        <article class="surah-meta-card surah-heat-card tier-${escapeHtml(heatTier.theme)} ${state.surahGame.streak ? "is-live" : ""}">
          <span class="eyebrow">${escapeHtml(t("surahs.heatLabel", {}, payload))}</span>
          <div class="surah-heat-head">
            ${buildSurahFlamesClusterMarkup(state.surahGame.streak)}
            <div class="surah-heat-copy">
              <strong>${escapeHtml(t(heatTier.key, {}, payload))}</strong>
              <span>${escapeHtml(
                gameMode === "memory" && memoryRound?.phase === "preview"
                  ? t("surahs.memoryCountdownValue", { count: getSurahMemoryCountdown(memoryRound).remainingSeconds }, payload)
                  : t("surahs.streakValue", { count: state.surahGame.streak }, payload),
              )}</span>
            </div>
          </div>
          <div class="surah-heat-track" aria-hidden="true">
            <span style="width:${escapeHtml(heatTier.progress)}%"></span>
          </div>
          <p class="helper">${escapeHtml(heatNote)}</p>
        </article>
      </section>

      <section class="surah-stat-grid">
          <article class="surah-stat-card">
            <span>${escapeHtml(t("surahs.statsScore", {}, payload))}</span>
            <strong>${escapeHtml(state.surahGame.correct)}</strong>
          </article>
          <article class="surah-stat-card">
            <span>${escapeHtml(t("surahs.statsAnswered", {}, payload))}</span>
            <strong>${escapeHtml(state.surahGame.answered)}</strong>
          </article>
          <article class="surah-stat-card">
            <span>${escapeHtml(t("surahs.statsStreak", {}, payload))}</span>
            <strong>${escapeHtml(state.surahGame.streak)}</strong>
          </article>
          <article class="surah-stat-card">
            <span>${escapeHtml(t("surahs.statsBestStreak", {}, payload))}</span>
            <strong>${escapeHtml(state.surahGame.bestStreak)}</strong>
          </article>
          <article class="surah-stat-card">
            <span>${escapeHtml(t("surahs.statsAccuracy", {}, payload))}</span>
            <strong>${escapeHtml(t("surahs.accuracyValue", { count: accuracy }, payload))}</strong>
          </article>
      </section>

      ${questionMarkup}
    </div>
  `;

  if (state.surahGame.isStarted && gameMode === "memory") {
    scheduleSurahGamePreview(payload);
  } else {
    clearSurahGamePreviewTimer();
  }
}

function buildOnboardingPreviewMarkup(stepKey, payload = state.payload) {
  if (stepKey === "language") {
    const selectedLanguage = getLanguage(payload);
    return `
      <div class="onboarding-preview language">
        <div class="onboarding-language-grid">
          <button class="onboarding-language-chip ${selectedLanguage === "fr" ? "active" : ""}" type="button" data-onboarding-language="fr">
            <strong>Français</strong>
            <span>Interface en français</span>
          </button>
          <button class="onboarding-language-chip ${selectedLanguage === "en" ? "active" : ""}" type="button" data-onboarding-language="en">
            <strong>English</strong>
            <span>Interface in English</span>
          </button>
          <button class="onboarding-language-chip ${selectedLanguage === "ar" ? "active" : ""}" type="button" data-onboarding-language="ar">
            <strong>العربية</strong>
            <span>واجهة عربية</span>
          </button>
        </div>
      </div>
    `;
  }

  if (stepKey === "today") {
    return `
      <div class="onboarding-preview today">
        <div class="onboarding-preview-route">
          <span class="active"></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="onboarding-preview-card">
          <p class="eyebrow">${escapeHtml(t("today.focusLabel", {}, payload))}</p>
          <strong>${escapeHtml(t("route.recentTitle", {}, payload))}</strong>
          <small>${escapeHtml(t("today.focusValidate", {}, payload))}</small>
        </div>
      </div>
    `;
  }

  if (stepKey === "pages") {
    return `
      <div class="onboarding-preview pages">
        <div class="onboarding-preview-grid">
          <span class="learned"></span>
          <span class="learned"></span>
          <span class="fragile"></span>
          <span class="neutral"></span>
          <span class="neutral"></span>
          <span class="fragile"></span>
          <span class="learned"></span>
          <span class="neutral"></span>
        </div>
        <div class="onboarding-preview-page">
          <div class="onboarding-preview-line short"></div>
          <div class="onboarding-preview-line"></div>
          <div class="onboarding-preview-line medium"></div>
        </div>
      </div>
    `;
  }

  if (stepKey === "review") {
    return `
      <div class="onboarding-preview review">
        <div class="onboarding-preview-review-page">
          <div class="onboarding-preview-line medium"></div>
          <div class="onboarding-preview-mask"></div>
          <div class="onboarding-preview-line"></div>
          <div class="onboarding-preview-mask short"></div>
        </div>
        <div class="onboarding-preview-review-actions">
          <span>${escapeHtml(t("review.revealButton", {}, payload))}</span>
          <span class="success">${escapeHtml(t("review.successButton", {}, payload))}</span>
          <span class="danger">${escapeHtml(t("review.failureButton", {}, payload))}</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="onboarding-preview surahs">
      <div class="onboarding-preview-mode">
        <span>${escapeHtml(t("surahs.playModeQuiz", {}, payload))}</span>
        <span>${escapeHtml(t("surahs.rangeLabel", {}, payload))}</span>
      </div>
      <div class="onboarding-preview-question">
        <p>${escapeHtml(t("surahs.answerLabel", {}, payload))}</p>
        <div class="onboarding-preview-choice-row">
          <span class="good"></span>
          <span></span>
        </div>
        <div class="onboarding-preview-choice-row">
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  `;
}

function getOnboardingSteps(payload = state.payload) {
  const language = getLanguage(payload);

  if (language === "ar") {
    return [
      {
        key: "language",
        title: 'اختر لغة التطبيق',
        body: 'اختر اللغة التي تريد استعمالها داخل Dabt. يمكنك تغييرها لاحقا من قسم "الاعدادات".',
      },
      {
        key: "today",
        title: 'قسم "اليوم" يوجهك خطوة بخطوة',
        body: 'قسم "اليوم" ينظم يومك وفق منطق التكرار المتباعد: ماذا تقرأ الآن، بأي ترتيب تتقدم، ومتى تثبت كل كتلة.',
      },
      {
        key: "pages",
        title: 'قسم "الصفحات" يعطيك نظرة شاملة على المصحف',
        body: 'قسم "الصفحات" يسمح لك بفتح الصفحة الحقيقية من القرآن، تحديد الخطأ بدقة، ثم متابعة حالتك صفحة صفحة وجزءا جزءا.',
      },
      {
        key: "review",
        title: 'قسم "مراجعة الاخطاء" يعيد المناطق الضعيفة',
        body: 'قسم "مراجعة الاخطاء" يستخدم FSRS ليعيد كل خطأ في افضل وقت بحسب اجاباتك، مباشرة على صفحة القرآن.',
      },
      {
        key: "surahs",
        title: 'قسم "اللعبة" يثبت ترتيب السور',
        body: 'قسم "اللعبة" يقدم لك طريقتين للتدريب: معرفة السورة التالية او ترتيب سلسلة قصيرة بالشكل الصحيح.',
      },
    ];
  }

  if (language === "en") {
    return [
      {
        key: "language",
        title: 'Choose your app language',
        body: 'Choose the language you want to use in Dabt. You can always change it later from the "Settings" section.',
      },
      {
        key: "today",
        title: 'The "Today" section guides you block by block',
        body: 'The "Today" section organizes your day with a spaced repetition flow: what to recite now, which order to follow, and how to validate each block at the right moment.',
      },
      {
        key: "pages",
        title: 'The "Pages" section shows the mushaf at a glance',
        body: 'The "Pages" section lets you open the real Quran page, place a precise mistake, and track your state page by page, then juz by juz.',
      },
      {
        key: "review",
        title: 'The "Review errors" section revisits weak spots',
        body: 'The "Review errors" section uses spaced repetition with FSRS to bring each mistake back at the best moment based on your answers, directly on the Quran page.',
      },
      {
        key: "surahs",
        title: 'The "Mini game" section strengthens surah order',
        body: 'The "Mini game" section gives you two ways to practice: find the next surah or reorder a short sequence correctly.',
      },
    ];
  }

  return [
    {
      key: "language",
      title: 'Choisis la langue de l\'application',
      body: 'Choisis la langue que tu veux utiliser dans Dabt. Tu pourras la changer plus tard depuis la section "[[Paramètres]]".',
    },
    {
      key: "today",
      title: 'La section "[[Aujourd\'hui]]" te guide bloc par bloc',
      body: 'La section "[[Aujourd\'hui]]" organise ta journée avec une logique de [[répétition espacée]] : quoi réciter maintenant, dans quel ordre avancer, puis comment valider chaque bloc au bon moment.',
    },
    {
      key: "pages",
      title: 'La section "[[Pages]]" te montre le mushaf d\'un seul coup d\'œil',
      body: 'La section "[[Pages]]" te permet d\'ouvrir la vraie page du Coran, placer une [[erreur précise]] et suivre ton état page par page, puis juz par juz.',
    },
    {
      key: "review",
      title: 'La section "[[Revoir ses erreurs]]" retravaille les zones fragiles',
      body: 'La section "[[Revoir ses erreurs]]" utilise la [[répétition espacée]] avec [[FSRS]] pour faire revenir chaque erreur au meilleur moment selon tes réponses, directement sur la page du Coran.',
    },
    {
      key: "surahs",
      title: 'La section "[[Mini jeu]]" consolide l\'ordre des sourates',
      body: 'La section "[[Mini jeu]]" te propose deux façons de t\'entraîner : retrouver la sourate suivante ou remettre une série dans le bon ordre.',
    },
  ];
}

function renderOnboarding(payload = state.payload) {
  const container = $("#mobile-onboarding-root");
  if (!container) {
    return;
  }

  document.body.classList.toggle("onboarding-open", Boolean(state.onboarding.open));

  if (!state.onboarding.open) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  const steps = getOnboardingSteps(payload);
  const safeIndex = Math.max(0, Math.min(state.onboarding.stepIndex || 0, steps.length - 1));
  state.onboarding.stepIndex = safeIndex;
  const currentStep = steps[safeIndex];
  const isLastStep = safeIndex === steps.length - 1;

  container.hidden = false;
  container.innerHTML = `
    <div class="onboarding-overlay">
      <div class="onboarding-backdrop"></div>
      <section class="onboarding-shell">
        <div class="onboarding-topline">
          <p class="eyebrow">Dabt</p>
          <span class="onboarding-step-label">${escapeHtml(t("onboarding.step", { current: safeIndex + 1, total: steps.length }, payload))}</span>
        </div>
        <div class="onboarding-progress">
          ${steps
            .map(
              (_step, index) => `
                <button
                  class="onboarding-progress-dot ${index === safeIndex ? "active" : ""}"
                  type="button"
                  data-onboarding-step="${escapeHtml(index)}"
                  aria-label="${escapeHtml(t("onboarding.step", { current: index + 1, total: steps.length }, payload))}"
                ></button>
              `,
            )
            .join("")}
        </div>
        <div class="onboarding-copy">
          <h2>${renderUiRichText(currentStep.title)}</h2>
          <p>${renderUiRichText(currentStep.body)}</p>
        </div>
        ${buildOnboardingPreviewMarkup(currentStep.key, payload)}
        <div class="onboarding-actions">
          <button class="secondary-button" type="button" data-onboarding-action="skip">${escapeHtml(t("onboarding.skip", {}, payload))}</button>
          <button class="primary-button" type="button" data-onboarding-action="${isLastStep ? "finish" : "next"}">
            ${escapeHtml(t(isLastStep ? "onboarding.start" : "onboarding.next", {}, payload))}
          </button>
        </div>
      </section>
    </div>
  `;
}

function renderCards(payload) {
  const { blocks, order } = payload.plan;
  const markup = order.map((blockKey) => {
    if (blockKey === "old") {
      return oldCardMarkup(blocks[blockKey]);
    }
    if (blockKey === "consolidation") {
      return consolidationCardMarkup(blocks[blockKey]);
    }
    if (blockKey === "new") {
      return newCardMarkup(blocks[blockKey]);
    }
    return simpleCardMarkup(blockKey, blocks[blockKey]);
  });

  $("#cards").innerHTML = markup.join("");
}

function fillForm(payload) {
  const notifications = getNotificationPreferences(payload);
  $("#first-name").value = payload.settings.firstName || "";
  $("#language").value = getLanguage(payload);
  $("#program-mode").value = payload.settings.programMode || "forward";
  if ($("#phase-index")) {
    $("#phase-index").value = String(payload.progress.phaseIndex || 1);
  }
  $("#daily-new-half-pages").value = formatInputPagesValueFromHalfPages(payload.settings.dailyNewHalfPages);
  $("#program-day-index").value = payload.progress.programDayIndex;
  $("#total-half-pages").value = payload.settings.totalHalfPages;
  $("#notifications-enabled").checked = notifications.enabled;
  $("#notification-review-enabled").checked = notifications.reminders.review.enabled;
  $("#notification-review-time").value = notifications.reminders.review.time;
  $("#notification-morning-enabled").checked = notifications.reminders.newMorning.enabled;
  $("#notification-morning-time").value = notifications.reminders.newMorning.time;
  $("#notification-noon-enabled").checked = notifications.reminders.newNoon.enabled;
  $("#notification-noon-time").value = notifications.reminders.newNoon.time;
  $("#notification-evening-enabled").checked = notifications.reminders.newEvening.enabled;
  $("#notification-evening-time").value = notifications.reminders.newEvening.time;
  renderPhaseProgressEditor(payload);
  syncCurrentPageMax();
  syncDailyNewPresets();
  syncNotificationFormState();
  renderNotificationRuntimeStatus(payload);
}

function bindPageCellSelection() {
  return;
}

function bindJuzGroupToggles() {
  return;
}

function bindPageQuickActions() {
  $all("[data-open-page-editor]").forEach((button) => {
    button.addEventListener("click", () => {
      const page = Number(button.dataset.openPageEditor);
      state.activePage = page;
      openPageEditor(page);
      ensureMushafPageData(page);
      renderPageEditorModal(state.payload);
      bindPageEditorActions();
    });
  });

  $all("[data-page-quick-clear]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const page = Number(button.dataset.pageQuickClear);
        state.payload = await dataClient.clearPageError(page);
        refreshErrorExperience(state.payload);
        showToast(t("toast.errorsCleared", { page: button.dataset.pageQuickClear }));
      } catch (error) {
        showToast(error.message, true);
      }
    });
  });

  $all("[data-clear-active-page]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activePage = null;
      refreshPagesQuickUi(state.payload);
    });
  });
}

function bindPageEditorActions() {
  const modal = $("#page-editor-modal");
  if (!modal || modal.hidden) {
    return;
  }

  const frame = modal.querySelector(".page-editor-image-viewport");
  const shell = modal.querySelector(".page-editor-shell");

  $all("[data-page-editor-close]").forEach((button) => {
    button.addEventListener("click", () => {
      const shouldRefreshTracking = state.pageEditor.needsTrackingRefresh;
      closePageEditor();
      renderPageEditorModal(state.payload);
      if (shouldRefreshTracking && state.activeView === "pages") {
        renderErrorTracking(state.payload, { forceFull: true });
        bindPageQuickActions();
      }
    });
  });

  $all("[data-page-editor-scope]").forEach((button) => {
    button.addEventListener("click", () => {
      state.pageEditor.scope = String(button.dataset.pageEditorScope || "word");
      if (state.pageEditor.scope === "next-page-link") {
        state.pageEditor.rawRect = null;
        state.pageEditor.rect = null;
        state.pageEditor.anchor = null;
      } else if (state.pageEditor.rawRect && frame) {
        const snapped = snapPageEditorSelection(frame, state.pageEditor.rawRect, state.pageEditor.scope);
        state.pageEditor.rawRect = snapped.rawRect;
        state.pageEditor.rect = snapped.rect;
        state.pageEditor.anchor = snapped.anchor;
      }
      state.pageEditor.selectionOrigin = null;
      updatePageEditorSelectionUi(state.payload, modal);
    });
  });

  $all("[data-page-editor-note]").forEach((input) => {
    input.addEventListener("input", () => {
      state.pageEditor.note = input.value.slice(0, 280);
    });
  });

  $all("[data-page-editor-clear]").forEach((button) => {
    button.addEventListener("click", () => {
      state.pageEditor.rawRect = null;
      state.pageEditor.rect = null;
      state.pageEditor.anchor = null;
      state.pageEditor.selectionOrigin = null;
      updatePageEditorSelectionUi(state.payload, modal);
    });
  });

  $all("[data-page-editor-save]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (button.disabled) {
        return;
      }

      button.disabled = true;
      try {
        const scope = state.pageEditor.scope || "word";
        const requiresSelection = scope !== "next-page-link";
        if ((requiresSelection && !state.pageEditor.rect) || !Number.isInteger(state.pageEditor.page)) {
          return;
        }

        const page = state.pageEditor.page;
        state.payload = await dataClient.setPageError(page, {
          scope,
          rect: requiresSelection ? state.pageEditor.rect : null,
          anchor: requiresSelection ? state.pageEditor.anchor : null,
          note: state.pageEditor.note || "",
        });
        state.pageEditor.needsTrackingRefresh = true;
        state.pageEditor.rawRect = null;
        state.pageEditor.rect = null;
        state.pageEditor.anchor = null;
        state.pageEditor.note = "";
        refreshPageEditorSurface(state.payload);
        showToast(
          t("toast.errorAdded", {
            severity: severityLabel(errorScopeToSeverity(scope)),
            page,
          }),
        );
      } catch (error) {
        showToast(error.message, true);
      } finally {
        button.disabled = false;
      }
    });
  });

  bindPageEditorDeleteButtons(modal);

  const stage = modal.querySelector("[data-page-editor-stage='true']");
  const selectionBox = modal.querySelector("#page-editor-selection-box");

  if (!stage || !selectionBox || !frame || !shell) {
    return;
  }

  if (state.pageEditor.scope === "next-page-link") {
    state.pageEditor.selectionOrigin = null;
    updatePageEditorSelectionUi(state.payload, modal);
    return;
  }

  const bindToken = Symbol("page-editor-bind");
  state.pageEditor.bindingToken = bindToken;
  const requiresTouchGesture = isPageEditorTouchSelectionRequired();
  let activePointerId = null;
  let selectionTrackingAttached = false;
  let longPressTimer = null;
  let pendingTouch = null;
  let pendingTouchObserversAttached = false;
  let activeTouchTrackingAttached = false;

  const isBindingActive = () => state.pageEditor.bindingToken === bindToken && modal.isConnected && frame.isConnected && stage.isConnected;
  const setShellSelectionLock = (locked) => {
    shell.classList.toggle("page-editor-no-select", Boolean(locked));
  };
  const clearLongPressTimer = () => {
    if (longPressTimer) {
      window.clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };
  const getTouchByIdentifier = (touchList, identifier) =>
    Array.from(touchList || []).find((touch) => Number(touch.identifier) === Number(identifier)) || null;
  const detachPendingTouchObservers = () => {
    if (!pendingTouchObserversAttached) {
      return;
    }

    window.removeEventListener("touchmove", observePendingTouchMove);
    window.removeEventListener("touchend", cancelPendingTouchGesture);
    window.removeEventListener("touchcancel", cancelPendingTouchGesture);
    shell.removeEventListener("scroll", cancelPendingTouchGesture);
    pendingTouchObserversAttached = false;
  };
  const clearPendingTouch = () => {
    clearLongPressTimer();
    detachPendingTouchObservers();
    pendingTouch = null;
    setShellSelectionLock(false);
  };
  const attachPendingTouchObservers = () => {
    if (pendingTouchObserversAttached) {
      return;
    }

    window.addEventListener("touchmove", observePendingTouchMove, { passive: true });
    window.addEventListener("touchend", cancelPendingTouchGesture, { passive: true });
    window.addEventListener("touchcancel", cancelPendingTouchGesture, { passive: true });
    shell.addEventListener("scroll", cancelPendingTouchGesture, { passive: true });
    pendingTouchObserversAttached = true;
  };
  const getTouchDistance = (touch, origin) => {
    if (!touch || !origin) {
      return 0;
    }

    return Math.hypot(Number(touch.clientX || 0) - Number(origin.clientX || 0), Number(touch.clientY || 0) - Number(origin.clientY || 0));
  };
  const isTouchInsideFrame = (touch) => {
    if (!touch || !frame?.isConnected) {
      return false;
    }

    const bounds = frame.getBoundingClientRect();
    return touch.clientX >= bounds.left && touch.clientX <= bounds.right && touch.clientY >= bounds.top && touch.clientY <= bounds.bottom;
  };
  const detachSelectionTracking = () => {
    if (!selectionTrackingAttached) {
      return;
    }

    window.removeEventListener("pointermove", updateSelection);
    window.removeEventListener("pointerup", finishSelection);
    window.removeEventListener("pointercancel", finishSelection);
    selectionTrackingAttached = false;
  };
  const attachSelectionTracking = () => {
    if (selectionTrackingAttached) {
      return;
    }

    window.addEventListener("pointermove", updateSelection, { passive: false });
    window.addEventListener("pointerup", finishSelection);
    window.addEventListener("pointercancel", finishSelection);
    selectionTrackingAttached = true;
  };
  const detachActiveTouchTracking = () => {
    if (!activeTouchTrackingAttached) {
      return;
    }

    window.removeEventListener("touchmove", updateTouchSelection);
    window.removeEventListener("touchend", finishTouchSelectionFromEvent);
    window.removeEventListener("touchcancel", cancelTouchSelection);
    activeTouchTrackingAttached = false;
  };
  const attachActiveTouchTracking = () => {
    if (activeTouchTrackingAttached) {
      return;
    }

    window.addEventListener("touchmove", updateTouchSelection, { passive: false });
    window.addEventListener("touchend", finishTouchSelectionFromEvent, { passive: false });
    window.addEventListener("touchcancel", cancelTouchSelection, { passive: false });
    activeTouchTrackingAttached = true;
  };
  const activateSelection = (pointerId, point) => {
    if (!isBindingActive()) {
      return;
    }

    activePointerId = pointerId;
    state.pageEditor.selectionOrigin = point;
    const snapped = snapPageEditorSelection(frame, buildPointRect(point), state.pageEditor.scope);
    state.pageEditor.rawRect = snapped.rawRect;
    state.pageEditor.rect = snapped.rect;
    state.pageEditor.anchor = snapped.anchor;
    stage.classList.add("is-selecting");
    selectionBox.classList.add("active");
    selectionBox.style.cssText = selectionRectStyle(state.pageEditor.rect);
    if (pointerId !== undefined && pointerId !== null) {
      stage.setPointerCapture?.(pointerId);
    }
    attachSelectionTracking();
    updatePageEditorSelectionUi(state.payload, modal);
  };

  const beginSelection = (event) => {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    if (!isBindingActive()) {
      return;
    }

    const point = getNormalizedPointerPosition(event, frame);
    const isTouchLike = event.pointerType === "touch" || event.pointerType === "pen";
    if (state.pageEditor.scope === "next-page-link") {
      return;
    }
    if (!requiresTouchGesture || !isTouchLike) {
      if (event.cancelable) {
        event.preventDefault();
      }
      activateSelection(event.pointerId, point);
    }
  };

  const updateSelection = (event) => {
    if (!isBindingActive()) {
      detachSelectionTracking();
      return;
    }

    if (!state.pageEditor.selectionOrigin) {
      return;
    }

    if (activePointerId !== null && event.pointerId !== activePointerId) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const point = getNormalizedPointerPosition(event, frame);
    const midpoint = {
      x: (state.pageEditor.selectionOrigin.x + point.x) / 2,
      y: (state.pageEditor.selectionOrigin.y + point.y) / 2,
    };
    const rawRect = buildNormalizedRectFromPoints(state.pageEditor.selectionOrigin, point) || buildPointRect(midpoint);
    const snapped = snapPageEditorSelection(frame, rawRect, state.pageEditor.scope);
    state.pageEditor.rawRect = snapped.rawRect;
    state.pageEditor.rect = snapped.rect;
    state.pageEditor.anchor = snapped.anchor;
    selectionBox.classList.add("active");
    selectionBox.style.cssText = selectionRectStyle(state.pageEditor.rect);
  };

  const finishSelection = (event) => {
    if (!isBindingActive()) {
      detachSelectionTracking();
      return;
    }

    if (activePointerId !== null && event.pointerId !== activePointerId) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const point = getNormalizedPointerPosition(event, frame);
    const midpoint = {
      x: (state.pageEditor.selectionOrigin.x + point.x) / 2,
      y: (state.pageEditor.selectionOrigin.y + point.y) / 2,
    };
    const rawRect = buildNormalizedRectFromPoints(state.pageEditor.selectionOrigin, point) || buildPointRect(midpoint);
    const snapped = snapPageEditorSelection(frame, rawRect, state.pageEditor.scope);
    state.pageEditor.selectionOrigin = null;
    state.pageEditor.rawRect = snapped.rawRect;
    state.pageEditor.rect = snapped.rect;
    state.pageEditor.anchor = snapped.anchor;
    activePointerId = null;
    stage.classList.remove("is-selecting");
    detachSelectionTracking();
    stage.releasePointerCapture?.(event.pointerId);
    updatePageEditorSelectionUi(state.payload, modal);
  };

  updatePageEditorSelectionUi(state.payload, modal);

  if (!requiresTouchGesture) {
    stage.addEventListener("pointerdown", beginSelection);
    return;
  }

  const finishTouchSelection = (touch) => {
    if (!state.pageEditor.selectionOrigin) {
      detachActiveTouchTracking();
      clearPendingTouch();
      updatePageEditorSelectionUi(state.payload, modal);
      return;
    }

    const point = getNormalizedTouchPosition(touch || pendingTouch, frame);
    const midpoint = {
      x: (state.pageEditor.selectionOrigin.x + point.x) / 2,
      y: (state.pageEditor.selectionOrigin.y + point.y) / 2,
    };
    const rawRect = buildNormalizedRectFromPoints(state.pageEditor.selectionOrigin, point) || buildPointRect(midpoint);
    const snapped = snapPageEditorSelection(frame, rawRect, state.pageEditor.scope);
    state.pageEditor.selectionOrigin = null;
    state.pageEditor.rawRect = snapped.rawRect;
    state.pageEditor.rect = snapped.rect;
    state.pageEditor.anchor = snapped.anchor;
    activePointerId = null;
    stage.classList.remove("is-selecting");
    detachActiveTouchTracking();
    clearPendingTouch();
    updatePageEditorSelectionUi(state.payload, modal);
  };
  const cancelTouchSelection = () => {
    stage.classList.remove("is-selecting");
    state.pageEditor.selectionOrigin = null;
    activePointerId = null;
    detachActiveTouchTracking();
    clearPendingTouch();
    updatePageEditorSelectionUi(state.payload, modal);
  };
  const activateTouchSelection = () => {
    if (!isBindingActive() || !pendingTouch) {
      return;
    }

    detachPendingTouchObservers();
    clearLongPressTimer();
    setShellSelectionLock(true);
    const point = getNormalizedTouchPosition(pendingTouch, frame);
    activePointerId = Number(pendingTouch.identifier);
    state.pageEditor.selectionOrigin = point;
    const snapped = snapPageEditorSelection(frame, buildPointRect(point), state.pageEditor.scope);
    state.pageEditor.rawRect = snapped.rawRect;
    state.pageEditor.rect = snapped.rect;
    state.pageEditor.anchor = snapped.anchor;
    stage.classList.add("is-selecting");
    selectionBox.classList.add("active");
    selectionBox.style.cssText = selectionRectStyle(state.pageEditor.rect);
    attachActiveTouchTracking();
    updatePageEditorSelectionUi(state.payload, modal);
  };
  const observePendingTouchMove = (event) => {
    if (!isBindingActive() || !pendingTouch || state.pageEditor.selectionOrigin) {
      clearPendingTouch();
      return;
    }

    const touch = getTouchByIdentifier(event.touches, pendingTouch.identifier);
    if (!touch) {
      clearPendingTouch();
      return;
    }

    if (getTouchDistance(touch, pendingTouch) > TOUCH_SELECTION_MOVE_PX) {
      clearPendingTouch();
    }
  };
  const cancelPendingTouchGesture = (event) => {
    if (!pendingTouch) {
      return;
    }

    if (event?.type === "touchend" || event?.type === "touchcancel") {
      const touch = getTouchByIdentifier(event.changedTouches, pendingTouch.identifier);
      if (!touch) {
        return;
      }
    }

    clearPendingTouch();
  };
  const updateTouchSelection = (event) => {
    if (!isBindingActive()) {
      cancelTouchSelection();
      return;
    }

    if (!state.pageEditor.selectionOrigin) {
      return;
    }

    const touch = getTouchByIdentifier(event.touches, activePointerId);
    if (!touch) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const point = getNormalizedTouchPosition(touch, frame);
    const midpoint = {
      x: (state.pageEditor.selectionOrigin.x + point.x) / 2,
      y: (state.pageEditor.selectionOrigin.y + point.y) / 2,
    };
    const rawRect = buildNormalizedRectFromPoints(state.pageEditor.selectionOrigin, point) || buildPointRect(midpoint);
    const snapped = snapPageEditorSelection(frame, rawRect, state.pageEditor.scope);
    state.pageEditor.rawRect = snapped.rawRect;
    state.pageEditor.rect = snapped.rect;
    state.pageEditor.anchor = snapped.anchor;
    selectionBox.classList.add("active");
    selectionBox.style.cssText = selectionRectStyle(state.pageEditor.rect);
  };
  const finishTouchSelectionFromEvent = (event) => {
    if (!isBindingActive()) {
      cancelTouchSelection();
      return;
    }

    if (!state.pageEditor.selectionOrigin) {
      cancelTouchSelection();
      return;
    }

    const touch = getTouchByIdentifier(event.changedTouches, activePointerId) || event.changedTouches?.[0] || pendingTouch;
    if (!touch) {
      cancelTouchSelection();
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    finishTouchSelection(touch);
  };

  const handleTouchStart = (event) => {
    if (!isBindingActive() || state.pageEditor.scope === "next-page-link" || event.touches.length !== 1) {
      cancelTouchSelection();
      return;
    }

    if (state.pageEditor.selectionOrigin) {
      return;
    }

    const touch = cloneTouchSnapshot(event.touches[0]);
    if (!isTouchInsideFrame(touch)) {
      clearPendingTouch();
      return;
    }

    pendingTouch = touch;
    setShellSelectionLock(true);
    attachPendingTouchObservers();
    clearLongPressTimer();
    longPressTimer = window.setTimeout(() => {
      longPressTimer = null;
      activateTouchSelection();
    }, TOUCH_SELECTION_LONG_PRESS_MS);
  };

  shell.addEventListener("touchstart", handleTouchStart, { passive: true });
}

function bindErrorReviewActions() {
  $all("[data-review-select-page]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      button.blur?.();
      const page = Number(button.dataset.reviewSelectPage);
      if (!Number.isInteger(page) || page < 1) {
        return;
      }

      const isAlreadySelected = getReviewSelectedPage() === page;
      setReviewSelectedPage(isAlreadySelected ? null : page);
      setReviewRevealedItemIds([]);
      resetReviewSwipeState();
      renderErrorReview(state.payload);
      resetHorizontalViewportOffset();
      bindErrorReviewActions();
    });
  });

  $all("[data-review-return-queue]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      button.blur?.();
      setReviewSelectedPage(null);
      setReviewRevealedItemIds([]);
      resetReviewSwipeState();
      renderErrorReview(state.payload);
      resetHorizontalViewportOffset();
      bindErrorReviewActions();
    });
  });

  $all("[data-review-reveal-next]").forEach((button) => {
    button.addEventListener("click", () => {
      const itemId = String(button.dataset.reviewRevealNext || "").trim();
      if (!itemId) {
        return;
      }

      setReviewRevealedItemIds([...getReviewRevealedItemIds(), itemId]);
      renderErrorReview(state.payload);
      bindErrorReviewActions();
    });
  });

  $all("[data-review-answer]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (button.disabled) {
        return;
      }

      button.disabled = true;
      try {
        const result = String(button.dataset.reviewAnswer || "");
        const id = String(button.dataset.reviewId || "");
        const currentPage = Number(button.dataset.reviewPage || 0);
        if (!id) {
          return;
        }
        const wasSuccess = result === "success";
        const origin = button.getBoundingClientRect();
        const beforeDueItems = Array.isArray(state.payload?.errorReview?.dueItems)
          ? state.payload.errorReview.dueItems.map((item) => normalizeErrorReviewItem(item)).filter(Boolean)
          : [];
        const beforeGroups = buildReviewPageGroups(beforeDueItems);
        const beforeGroup = beforeGroups.find((group) => group.page === currentPage) || beforeGroups[0] || null;
        const beforePage = Number(beforeGroup?.page || currentPage || 0);
        const answeredItem = beforeGroup?.items.find((item) => item.id === id) || beforeDueItems.find((item) => item.id === id) || null;
        setReviewRevealedItemIds(getReviewRevealedItemIds().filter((itemId) => itemId !== id));
        state.payload = await dataClient.answerErrorReview(id, result);
        const afterDueItems = Array.isArray(state.payload?.errorReview?.dueItems)
          ? state.payload.errorReview.dueItems.map((item) => normalizeErrorReviewItem(item)).filter(Boolean)
          : [];
        const afterGroups = buildReviewPageGroups(afterDueItems);
        const samePageStillDue = afterGroups.some((group) => Number(group.page || 0) === beforePage);

        if (beforePage && samePageStillDue && answeredItem) {
          setReviewCompletedItemsForPage(beforePage, [...getReviewCompletedItemsForPage(beforePage), answeredItem]);
        } else if (beforePage) {
          setReviewCompletedItemsForPage(beforePage, []);
        }

        refreshErrorExperience(state.payload, {
          refreshSummary: false,
          refreshTracking: false,
          refreshReview: true,
          refreshEditor: false,
        });
        if (wasSuccess) {
          launchButtonPulse(origin, "success");
          if (beforePage && !samePageStillDue) {
            launchGrandCelebration();
          }
          showToast(t("review.successToast", {}, state.payload));
        } else {
          launchFailureCelebration(origin);
          showToast(t("review.failureToast", {}, state.payload), true);
        }
      } catch (error) {
        showToast(error.message, true);
      } finally {
        button.disabled = false;
      }
    });
  });

  const allowReviewSwipeGesture = !(isNativeAppRuntime() || isCoarsePointerDevice());

  $all("[data-review-card]").forEach((card) => {
    let activePointerId = null;

    const resetCard = () => {
      card.style.transform = "";
      card.classList.remove("accepting", "rejecting");
      if (state.reviewSwipe.itemId === String(card.dataset.reviewCard || "").trim()) {
        resetReviewSwipeState();
      }
      if (activePointerId !== null) {
        card.releasePointerCapture?.(activePointerId);
        activePointerId = null;
      }
    };

    if (!allowReviewSwipeGesture) {
      resetCard();
      return;
    }

    card.addEventListener("pointerdown", (event) => {
      const reviewCardId = String(card.dataset.reviewCard || "").trim();
      if (!reviewCardId) {
        return;
      }

      if (event.pointerType !== "touch" && event.pointerType !== "pen") {
        return;
      }

      state.reviewSwipe.itemId = reviewCardId;
      state.reviewSwipe.startX = event.clientX;
      state.reviewSwipe.currentX = event.clientX;
      activePointerId = event.pointerId;
      card.setPointerCapture?.(event.pointerId);
    });

    card.addEventListener("pointermove", (event) => {
      if (activePointerId === null || event.pointerId !== activePointerId) {
        return;
      }

      if (state.reviewSwipe.itemId !== card.dataset.reviewCard) {
        resetCard();
        return;
      }

      state.reviewSwipe.currentX = event.clientX;
      const deltaX = state.reviewSwipe.currentX - state.reviewSwipe.startX;
      card.style.transform = `translateX(${deltaX}px) rotate(${deltaX / 28}deg)`;
      card.classList.toggle("accepting", deltaX > 60);
      card.classList.toggle("rejecting", deltaX < -60);
    });

    const finish = async () => {
      if (activePointerId === null) {
        resetCard();
        return;
      }

      if (state.reviewSwipe.itemId !== card.dataset.reviewCard) {
        resetCard();
        return;
      }

      const deltaX = state.reviewSwipe.currentX - state.reviewSwipe.startX;
      resetReviewSwipeState();
      if (activePointerId !== null) {
        card.releasePointerCapture?.(activePointerId);
        activePointerId = null;
      }

      if (deltaX > 110 || deltaX < -110) {
        const result = deltaX > 0 ? "success" : "failure";
        const button = card.closest(".review-card-shell")?.querySelector(`[data-review-answer="${result}"]`);
        if (button) {
          button.click();
          return;
        }
      }

      resetCard();
    };

    card.addEventListener("pointerup", finish);
    card.addEventListener("pointercancel", finish);
    card.addEventListener("pointerleave", () => {
      if (activePointerId !== null) {
        resetCard();
      }
    });
  });
}

function refreshTodayExperience(payload = state.payload, options = {}) {
  const { rebind = false } = options;
  document.body.classList.toggle("day-complete", Boolean(payload?.plan?.dayClosed));
  renderHero(payload);
  renderSummary(payload);
  renderTodayFocus(payload);
  renderTodayPhaseSwitcher(payload);
  renderDayStatus(payload);
  renderSettingsPreview(payload);
  renderCards(payload);
  renderRouteProgress(payload?.plan);
  if (rebind) {
    bindDynamicActions();
  }
}

function bindDynamicActions() {
  $all("[data-focus-toggle-block]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const origin = button.getBoundingClientRect();
        const blockKey = button.dataset.focusToggleBlock;
        const previousScrollY = window.scrollY;
        const wasDone = Boolean(state.payload?.plan?.blocks?.[blockKey]?.done);
        const wasComplete = Boolean(state.payload?.plan?.canAdvanceDay);
        state.payload = await dataClient.toggleBlock(blockKey);
        refreshTodayExperience(state.payload, { rebind: true });
        window.requestAnimationFrame(() => {
          window.scrollTo({
            top: previousScrollY,
            left: 0,
            behavior: "auto",
          });
        });
        const isDone = Boolean(state.payload?.plan?.blocks?.[blockKey]?.done);
        const isComplete = Boolean(state.payload?.plan?.canAdvanceDay);
        if (!wasDone && isDone) {
          launchMiniCelebration(origin);
        }
        if (!wasComplete && isComplete) {
          launchGrandCelebration();
        }
      } catch (error) {
        showToast(error.message, true);
      }
    });
  });

  $all("[data-scroll-to-card]").forEach((button) => {
    button.addEventListener("click", () => {
      const blockKey = button.dataset.scrollToCard;
      state.expandedCards[blockKey] = true;
      refreshTodayExperience(state.payload, { rebind: true });
      const target = document.querySelector(`[data-block-card="${blockKey}"]`);
      if (!target) {
        return;
      }

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const behavior = isNativeAppRuntime() || isCoarsePointerDevice() || prefersReducedMotion ? "auto" : "smooth";
      target.scrollIntoView({ behavior, block: "start" });
    });
  });

  $all("[data-card-expand]").forEach((button) => {
    button.addEventListener("click", () => {
      const blockKey = button.dataset.cardExpand;
      const current = isCardExpanded(blockKey, state.payload?.plan?.blocks?.[blockKey]);
      state.expandedCards[blockKey] = !current;
      refreshTodayExperience(state.payload, { rebind: true });
    });
  });

  $all("[data-block-key]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const origin = button.getBoundingClientRect();
        const blockKey = button.dataset.blockKey;
        const wasDone = Boolean(state.payload?.plan?.blocks?.[blockKey]?.done);
        const wasComplete = Boolean(state.payload?.plan?.canAdvanceDay);
        state.payload = await dataClient.toggleBlock(blockKey);
        refreshTodayExperience(state.payload, { rebind: true });
        scrollTodayFocusIntoView();
        const isDone = Boolean(state.payload?.plan?.blocks?.[blockKey]?.done);
        const isComplete = Boolean(state.payload?.plan?.canAdvanceDay);
        if (!wasDone && isDone) {
          launchMiniCelebration(origin);
        }
        if (!wasComplete && isComplete) {
          launchGrandCelebration();
        }
      } catch (error) {
        showToast(error.message, true);
      }
    });
  });

  $all("[data-today-phase-display]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const phaseIndex = Number(button.dataset.todayPhaseDisplay);
        const mode = state.payload?.settings?.programMode || "forward";
        const phases = getProgramPhasesForMode(mode);
        if (!Number.isInteger(phaseIndex) || phaseIndex < 1 || phaseIndex > phases.length) {
          return;
        }

        state.payload = await dataClient.saveConfig({
          settings: {
            ...state.payload.settings,
            totalHalfPages: MUSHAF_TOTAL_HALF_PAGES,
          },
          progress: {
            programDayIndex: Number(state.payload?.progress?.programDayIndex || 1),
            phaseIndex,
            phaseProgressHalfPages: getPhaseProgressHalfPagesFromPayload(state.payload, mode),
          },
        });
        refreshTodayExperience(state.payload, { rebind: true });
        scrollTodayFocusIntoView();
      } catch (error) {
        showToast(error.message, true);
      }
    });
  });

  $all("[data-wave-index]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const origin = button.getBoundingClientRect();
        const waveIndex = Number(button.dataset.waveIndex);
        const slotIndex = Number(button.dataset.slotIndex);
        const wasChecked = Boolean(state.payload?.plan?.blocks?.new?.waves?.[waveIndex]?.slots?.[slotIndex]?.checked);
        const wasComplete = Boolean(state.payload?.plan?.canAdvanceDay);
        state.payload = await dataClient.toggleWaveSlot(waveIndex, slotIndex);
        refreshTodayExperience(state.payload, { rebind: true });
        const isChecked = Boolean(state.payload?.plan?.blocks?.new?.waves?.[waveIndex]?.slots?.[slotIndex]?.checked);
        const isComplete = Boolean(state.payload?.plan?.canAdvanceDay);
        if (!wasChecked && isChecked) {
          launchMiniCelebration(origin);
        }
        if (!wasComplete && isComplete) {
          launchGrandCelebration();
        }
      } catch (error) {
        showToast(error.message, true);
      }
    });
  });

  bindJuzGroupToggles();
  if (state.activeView === "pages" || state.pageEditor.open) {
    bindPageQuickActions();
    bindPageCellSelection();
    bindPageEditorActions();
  }
  if (state.activeView === "review") {
    bindErrorReviewActions();
  }
}

function render() {
  document.body.classList.toggle("day-complete", Boolean(state.payload?.plan?.dayClosed));
  document.body.classList.toggle("native-runtime", isNativeAppRuntime());
  localizeStaticUi(state.payload);
  updateInstallButton();
  renderHero(state.payload);
  renderSummary(state.payload);
  if (state.activeView === "today") {
    renderTodayFocus(state.payload);
    renderTodayPhaseSwitcher(state.payload);
    renderDayStatus(state.payload);
    renderCards(state.payload);
    renderRouteProgress(state.payload.plan);
  }
  if (state.activeView === "pages" || state.pageEditor.open) {
    renderErrorTracking(state.payload);
  }
  if (state.activeView === "review") {
    renderErrorReview(state.payload);
  }
  if (state.activeView === "statistics") {
    renderStatistics(state.payload);
  }
  if (state.activeView === "surahs") {
    renderSurahGame(state.payload);
  }
  renderPageEditorModal(state.payload);
  renderOnboarding(state.payload);
  renderSettingsPreview(state.payload);
  fillForm(state.payload);
  renderNotificationRuntimeStatus(state.payload);
  setActiveView(state.activeView, { scrollOnMobile: false, skipDeferredRender: true });
  bindDynamicActions();
}

function bindStaticActions() {
  $("#config-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = $("#config-form [data-settings-submit='true']");
    if (submitButton?.disabled) {
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
    }
    try {
      const notificationsEnabledBefore = Boolean(getNotificationPreferences(state.payload).enabled);
      state.payload = await dataClient.saveConfig({
        settings: {
          firstName: $("#first-name").value,
          language: $("#language").value,
          programMode: $("#program-mode").value,
          dailyNewHalfPages: parseDailyNewPagesToHalfPages($("#daily-new-half-pages").value),
          totalHalfPages: MUSHAF_TOTAL_HALF_PAGES,
        },
        progress: {
          programDayIndex: Number($("#program-day-index").value),
          phaseIndex: getSelectedPhaseIndex(state.payload),
          phaseProgressHalfPages: getPhaseProgressHalfPagesFromForm(),
        },
        preferences: {
          notifications: {
            enabled: Boolean($("#notifications-enabled").checked),
            reminders: {
              review: {
                enabled: Boolean($("#notification-review-enabled").checked),
                time: normalizeNotificationTime($("#notification-review-time").value, "07:30"),
              },
              newMorning: {
                enabled: Boolean($("#notification-morning-enabled").checked),
                time: normalizeNotificationTime($("#notification-morning-time").value, "09:00"),
              },
              newNoon: {
                enabled: Boolean($("#notification-noon-enabled").checked),
                time: normalizeNotificationTime($("#notification-noon-time").value, "13:00"),
              },
              newEvening: {
                enabled: Boolean($("#notification-evening-enabled").checked),
                time: normalizeNotificationTime($("#notification-evening-time").value, "20:00"),
              },
            },
          },
        },
      });
      const notificationsEnabledAfter = Boolean(getNotificationPreferences(state.payload).enabled);
      render();
      const notificationResult = await refreshNotificationStatus(state.payload, {
        sync: true,
        requestPermission: notificationsEnabledAfter && !notificationsEnabledBefore,
        silent: false,
      });
      setActiveView("today", { scrollOnMobile: true });
      showToast(t("toast.dayRecalculated"));
      if (notificationResult?.native && notificationsEnabledAfter && notificationResult?.display !== "granted") {
        showToast(t("toast.notificationsPermissionDenied", {}, state.payload), true);
      }
    } catch (error) {
      showToast(error.message, true);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });

  $("#reset-button").addEventListener("click", async () => {
    try {
      state.payload = await dataClient.resetToday();
      render();
      showToast(t("toast.dayReset"));
    } catch (error) {
      showToast(error.message, true);
    }
  });

  $("#advance-button").addEventListener("click", async () => {
    try {
      const origin = $("#advance-button")?.getBoundingClientRect?.() || null;
      state.payload = await dataClient.advanceDay();
      render();
      await refreshNotificationStatus(state.payload, { sync: true, silent: true });
      launchDayCompletionCelebration(origin);
      showToast(t("toast.nextDay"));
    } catch (error) {
      showToast(error.message, true);
    }
  });

  $("#skip-memorization-button").addEventListener("click", async () => {
    try {
      state.payload = await dataClient.skipMemorizationDay();
      render();
      launchGrandCelebration();
      showToast(t("toast.skipMemorizationDay"));
    } catch (error) {
      showToast(error.message, true);
    }
  });

  $("#install-app-button")?.addEventListener("click", async () => {
    try {
      if (!state.pwa.installPrompt) {
        return;
      }

      const promptEvent = state.pwa.installPrompt;
      state.pwa.installPrompt = null;
      state.pwa.canInstall = false;
      updateInstallButton();
      await promptEvent.prompt();
      await promptEvent.userChoice.catch(() => null);
    } catch (_error) {
      state.pwa.canInstall = Boolean(state.pwa.installPrompt);
      updateInstallButton();
    }
  });

  $("#mobile-onboarding-root")?.addEventListener("click", async (event) => {
    const stepButton = event.target.closest("[data-onboarding-step]");
    if (stepButton) {
      state.onboarding.stepIndex = Number(stepButton.dataset.onboardingStep) || 0;
      renderOnboarding(state.payload);
      return;
    }

    const languageButton = event.target.closest("[data-onboarding-language]");
    if (languageButton) {
      const previousPayload = state.payload;
      const previousStepIndex = Number(state.onboarding.stepIndex || 0);
      try {
        const language = String(languageButton.dataset.onboardingLanguage || "fr");
        const optimisticPayload = {
          ...previousPayload,
          settings: {
            ...previousPayload.settings,
            language,
            totalHalfPages: MUSHAF_TOTAL_HALF_PAGES,
          },
        };

        state.payload = optimisticPayload;
        state.onboarding.stepIndex = Math.min(previousStepIndex + 1, getOnboardingSteps(optimisticPayload).length - 1);
        render();

        state.payload = await dataClient.saveConfig({
          settings: {
            ...previousPayload.settings,
            language,
            totalHalfPages: MUSHAF_TOTAL_HALF_PAGES,
          },
          progress: {
            programDayIndex: Number(previousPayload?.progress?.programDayIndex || 1),
            phaseIndex: Number(previousPayload?.progress?.phaseIndex || 1),
            phaseProgressHalfPages: getPhaseProgressHalfPagesFromPayload(
              previousPayload,
              previousPayload?.settings?.programMode || "forward",
            ),
          },
        });
        render();
      } catch (error) {
        state.payload = previousPayload;
        state.onboarding.stepIndex = previousStepIndex;
        render();
        showToast(error.message, true);
      }
      return;
    }

    const actionButton = event.target.closest("[data-onboarding-action]");
    if (!actionButton) {
      return;
    }

    const action = actionButton.dataset.onboardingAction;
    if (action === "next") {
      state.onboarding.stepIndex = Math.min(state.onboarding.stepIndex + 1, getOnboardingSteps(state.payload).length - 1);
      renderOnboarding(state.payload);
      return;
    }

    if (action === "skip" || action === "finish") {
      const shouldOpenSettings = !state.onboarding.hasSeen;
      markOnboardingSeen();
      state.onboarding.open = false;
      state.onboarding.stepIndex = 0;
      if (shouldOpenSettings) {
        setActiveView("settings", { scrollOnMobile: true });
      }
      renderOnboarding(state.payload);
    }
  });

  $all("[data-view-target]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveView(button.dataset.viewTarget, { scrollOnMobile: true });
    });
  });

  window.addEventListener("resize", () => {
    const wasOpen = state.onboarding.open;
    updateOnboardingVisibility(true);
    if (state.onboarding.open !== wasOpen) {
      renderOnboarding(state.payload);
    }
  });

  $("#error-grid")?.addEventListener("click", (event) => {
    const toggleButton = event.target.closest("[data-toggle-juz]");
    if (toggleButton) {
      const juz = Number(toggleButton.dataset.toggleJuz);
      if (!Number.isInteger(juz) || juz < 1) {
        return;
      }

      state.collapsedJuzs[juz] = !state.collapsedJuzs[juz];
      renderErrorTracking(state.payload, { forceFull: true });
      bindPageQuickActions();
      return;
    }

    const pageCell = event.target.closest("[data-page-cell]");
    if (!pageCell) {
      return;
    }

    const page = Number(pageCell.dataset.pageCell);
    if (!Number.isInteger(page) || page < 1) {
      return;
    }

    state.activePage = page;
    openPageEditor(page);
    ensureMushafPageData(page);
    refreshPagesQuickUi(state.payload);
    renderPageEditorModal(state.payload);
    bindPageEditorActions();
    showToast(t("toast.pageSelected", { page }));
  });

  $all("[data-daily-new-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const value = Number(button.dataset.dailyNewPreset);
      if (!Number.isFinite(value) || value < 0) {
        return;
      }

      $("#daily-new-half-pages").value = String(value);
      syncDailyNewPresets();
    });
  });

  $("#total-half-pages")?.addEventListener("input", () => {
    syncCurrentPageMax();
    renderPhaseProgressEditor(state.payload, { preserveDraft: true });
  });

  $("#daily-new-half-pages").addEventListener("input", () => {
    syncDailyNewPresets();
  });

  $("#program-mode").addEventListener("change", () => {
    renderPhaseProgressEditor(state.payload, { preserveDraft: true });
  });

  [
    "#notifications-enabled",
    "#notification-review-enabled",
    "#notification-morning-enabled",
    "#notification-noon-enabled",
    "#notification-evening-enabled",
  ].forEach((selector) => {
    $(selector)?.addEventListener("change", () => {
      syncNotificationFormState();
    });
  });

  $("#surah-game").addEventListener("click", (event) => {
    const button = event.target.closest("[data-surah-game-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.surahGameAction;
    if (action === "set-play-mode") {
      resetSurahGame(state.payload, {
        rangeStartId: state.surahGame.rangeStartId,
        rangeEndId: state.surahGame.rangeEndId,
        gameMode: button.dataset.playMode || "quiz",
        resetStats: true,
        autoStart: false,
      });
      renderSurahGame(state.payload);
      return;
    }

    if (action === "start") {
      startSurahGame(state.payload);
      renderSurahGame(state.payload);
      return;
    }

    if (action === "answer") {
      const outcome = answerSurahGameQuestion(button.dataset.choiceId);
      if (outcome?.isCorrect) {
        launchMiniCelebration(button.getBoundingClientRect());
        const previousTier = getSurahHeatTier(outcome.previousStreak);
        const nextTier = getSurahHeatTier(outcome.streak);
        if (nextTier.min > previousTier.min) {
          showToast(`🔥 ${t("surahs.milestoneToast", { count: outcome.streak }, state.payload)}`);
          if (nextTier.min >= 8) {
            launchGrandCelebration();
          }
        }
      }
      renderSurahGame(state.payload);
      return;
    }

    if (action === "memory-pick") {
      const outcome = addSurahMemoryChoice(button.dataset.choiceId);
      if (outcome?.isCorrect) {
        launchMiniCelebration(button.getBoundingClientRect());
        const previousTier = getSurahHeatTier(outcome.previousStreak);
        const nextTier = getSurahHeatTier(outcome.streak);
        if (nextTier.min > previousTier.min) {
          showToast(`🔥 ${t("surahs.milestoneToast", { count: outcome.streak }, state.payload)}`);
          if (nextTier.min >= 8) {
            launchGrandCelebration();
          }
        }
      }
      renderSurahGame(state.payload);
      return;
    }

    if (action === "memory-remove") {
      removeSurahMemoryChoice(button.dataset.choiceId);
      renderSurahGame(state.payload);
      return;
    }

    if (action === "memory-clear") {
      clearSurahMemoryChoices();
      renderSurahGame(state.payload);
      return;
    }

    if (action === "memory-replay") {
      replaySurahMemoryRound();
      renderSurahGame(state.payload);
      return;
    }

    if (action === "memory-skip-preview") {
      revealSurahMemoryRound();
      renderSurahGame(state.payload);
      return;
    }

    if (action === "memory-next") {
      const corpus = ensureSurahGameState(state.payload);
      state.surahGame.memoryRound = createSurahMemoryRound(corpus);
      renderSurahGame(state.payload);
      return;
    }

    if (action === "next") {
      const corpus = ensureSurahGameState(state.payload);
      state.surahGame.question = createSurahGameQuestion(corpus, state.surahGame.question);
      renderSurahGame(state.payload);
      return;
    }

    if (action === "restart") {
      resetSurahGame(state.payload, {
        rangeStartId: state.surahGame.rangeStartId,
        rangeEndId: state.surahGame.rangeEndId,
        gameMode: state.surahGame.gameMode || "quiz",
        resetStats: true,
        autoStart: false,
      });
      renderSurahGame(state.payload);
      return;
    }

    if (action === "full-range") {
      resetSurahGame(state.payload, {
        rangeStartId: 1,
        rangeEndId: SURAH_PAGE_RANGES.length || 114,
        gameMode: state.surahGame.gameMode || "quiz",
        resetStats: true,
        autoStart: false,
      });
      renderSurahGame(state.payload);
    }
  });

  $("#surah-game").addEventListener("change", (event) => {
    const field = event.target.closest("[data-surah-game-select]");
    if (!field) {
      return;
    }

    let startId = state.surahGame.rangeStartId || 1;
    let endId = state.surahGame.rangeEndId || SURAH_PAGE_RANGES.length || 114;

    if (field.dataset.surahGameSelect === "start") {
      startId = clampSurahId(field.value, startId);
      if (startId > endId) {
        endId = startId;
      }
    } else {
      endId = clampSurahId(field.value, endId);
      if (endId < startId) {
        startId = endId;
      }
    }

    resetSurahGame(state.payload, {
      rangeStartId: startId,
      rangeEndId: endId,
      gameMode: state.surahGame.gameMode || "quiz",
      resetStats: true,
      autoStart: false,
    });
    renderSurahGame(state.payload);
  });
}

async function init() {
  bindStaticActions();
  if (!dataClient?.getState) {
    throw new Error("Dabt data client is unavailable.");
  }
  state.onboarding.hasSeen = readOnboardingSeen();
  state.payload = await dataClient.getState({ allowSnapshotFallback: true });
  if (dataClient.isSnapshotPayload?.(state.payload)) {
    showToast(t("toast.snapshotMode", {}, state.payload), true);
  }
  updateOnboardingVisibility(true);
  render();
  await refreshNotificationStatus(state.payload, { sync: true, silent: true });
  registerPwaFeatures();
}

window.addEventListener("DOMContentLoaded", () => {
  init().catch((error) => showToast(error.message, true));
});
