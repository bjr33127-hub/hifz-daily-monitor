const state = {
  payload: null,
  activePage: null,
  activeView: "today",
};

const I18N = {
  fr: {
    "hero.title": "Bismillah, voici ton plan du jour{{name}} !✨",
    "hero.text": "Le tableau affiche seulement ce qu'il faut reciter aujourd'hui, dans l'ordre du programme.",
    "hero.markerLabel": "Repere",
    "hero.markerText":
      "Le but est de cloturer la revision de l'ancien (< j-30) tout les 7 jours, la consolidation (de j-8 a j-30) tout les 3 jours puis de reviser le recent (de j-1 a j-7) puis de reviser la veille (j-1) et enfin apprendre le nouveau.",
    "nav.today": "Aujourd'hui",
    "nav.pages": "Pages",
    "nav.settings": "Parametres",
    "today.dayLabel": "Journee",
    "today.validationTitle": "Etat De Validation",
    "today.validationHelp": "Valide les blocs dans l'ordre, puis passe au lendemain.",
    "today.resetButton": "Reinitialiser les validations du jour",
    "today.advanceButton": "Valider la journee et passer au lendemain",
    "today.routeLabel": "Ordre Du Jour",
    "today.routeTitle": "Chemin De Recitation",
    "today.routeHelp": "Toujours du plus ancien vers le plus neuf, sans melanger les niveaux.",
    "route.oldTitle": "Ancien",
    "route.oldHelp": "Pool complet avant J-30, decoupe en 7 parties visibles.",
    "route.consolidationTitle": "Consolidation",
    "route.consolidationHelp": "Revision des 30 derniers jours, sur la tranche J-8 a J-30.",
    "route.recentTitle": "Recent",
    "route.recentHelp": "Bloc continu J-1 a J-7 pour garder le fragile tres proche.",
    "route.yesterdayTitle": "Veille",
    "route.yesterdayHelp": "Le bloc d'hier isole, pour verifier le passage immediat.",
    "route.newTitle": "Nouveau",
    "route.newHelp": "Le bloc du jour, avec 3 vagues et 9 validations au total.",
    "pages.eyebrow": "Suivi Des Erreurs",
    "pages.title": "Carte Des Pages",
    "pages.help":
      "Renseigne une page apres une recitation, puis visualise a la fois les zones fragiles et les reperes du programme du jour sur tout le mushaf.",
    "pages.quickLabel": "Saisie Rapide",
    "pages.quickTitle": "Une page, un clic, une erreur",
    "pages.quickHelp":
      "Clique une page dans la grille pour ouvrir ses actions rapides, puis choisis directement Mineur, Moyenne, Grave ou Effacer.",
    "pages.summaryLabel": "Synthese",
    "pages.summaryTitle": "Etat De La Carte",
    "pages.legendLabel": "Lecture",
    "pages.legendTitle": "Lire La Carte",
    "pages.mapLabel": "Mushaf",
    "pages.mapTitle": "Representation Du Coran",
    "pages.mapHelp": "Clique une page pour ouvrir les actions rapides a droite.",
    "pages.definitionsLabel": "Definitions",
    "pages.definitionsHelp": "Les zones du programme sont visibles directement au-dessus de la carte.",
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
    "settings.eyebrow": "Entrees",
    "settings.title": "Parametres Du Moteur",
    "settings.help": "Quelques champs suffisent pour reconstruire toute la journee.",
    "settings.firstNameLabel": "Prenom",
    "settings.firstNamePlaceholder": "Ton prenom",
    "settings.languageLabel": "Langue",
    "settings.languageFrenchOption": "Francais",
    "settings.languageEnglishOption": "English",
    "settings.currentPageLabel": "Page actuelle",
    "settings.currentHalfLabel": "Moitie actuelle",
    "settings.upperHalfOption": "Haute",
    "settings.lowerHalfOption": "Basse",
    "settings.dailyNewLabel": "Nouveau / jour (demi-pages)",
    "settings.programDayLabel": "Jour du programme",
    "settings.totalHalfPagesLabel": "Total de demi-pages",
    "settings.submitButton": "Recalculer la journee",
    "route.status.notRequired": "Non requis",
    "route.status.done": "Valide",
    "route.status.focus": "En focus",
    "route.status.waiting": "En attente",
    "status.unavailable": "Indisponible",
    "status.done": "Valide",
    "status.locked": "Verrouille",
    "status.pending": "A valider",
    "lockNote": "Valide d'abord : {{items}}.",
    "emptyNote": "Aucun bloc disponible pour cette section aujourd'hui.",
    "meta.range": "Plage",
    "meta.size": "Taille",
    "toggle.undo": "Annuler la validation",
    "toggle.validate": "Marquer comme valide",
    "card.old.pool": "Pool ancien",
    "card.old.rotation": "Roulement complet : {{count}} partie(s) equilibrees sur tout l'ancien > 30 jours.",
    "card.consolidation.noRange": "Aucune plage",
    "card.consolidation.active": "Partie active du jour",
    "card.consolidation.inactive": "Partie inactive aujourd'hui",
    "card.consolidation.concerned": "Partie concernee : revision des 30 derniers jours, sur la tranche J-8 a J-30.",
    "card.consolidation.activeToday": "Partie active aujourd'hui : {{part}}",
    "card.consolidation.blockToValidate": "Bloc a valider : {{block}}",
    "card.new.morning": "matin",
    "card.new.noon": "midi",
    "card.new.evening": "soir",
    "card.new.inProgress": "En cours",
    "card.new.complete": "Complete",
    "card.new.checked": "Validations completes : {{count}} / 9",
    "card.new.rule": "Regle : les 9 emplacements doivent etre valides pour clore le nouveau du jour.",
    "card.new.locked": "Verrouille : valide d'abord {{items}}.",
    "summary.progress": "Progression",
    "summary.learned": "{{count}} apprises",
    "summary.totalPages": "{{count}} pages au total",
    "summary.day": "Jour",
    "summary.currentPoint": "Point actuel",
    "summary.dailyNew": "Nouveau / jour",
    "hero.genericName": "",
    "hero.namedName": " {{name}}",
    "day.completeTitle": "Journee complete.",
    "day.completeHelper": "{{done}} / {{total}} blocs valides, le programme peut avancer.",
    "day.completeText":
      "Tu peux passer au lendemain. Le moteur fera avancer la demi-page actuelle et le jour du programme, puis recalculera automatiquement la rotation de l'ancien.",
    "day.openTitle": "Journee encore ouverte.",
    "day.openHelper": "{{done}} / {{total}} blocs valides pour aujourd'hui.",
    "day.remaining": "Il reste a valider : {{items}}.",
    "errorSummary.pagesWithErrors": "Pages avec erreurs",
    "errorSummary.pagesWithErrorsHelp": "pages fragiles sur {{total}}.",
    "errorSummary.learnedPages": "Pages apprises",
    "errorSummary.learnedPagesHelp": "inclut le marquage automatique jusqu'a la veille.",
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
    "program.recent": "Recent",
    "program.recentShort": "Recent",
    "program.recentDef": "Tout ce qui est entre J-1 et J-7.",
    "program.yesterday": "Veille",
    "program.yesterdayShort": "Veille",
    "program.yesterdayDef": "Le bloc appris hier, soit J-1.",
    "program.new": "Nouveau",
    "program.newShort": "Nouveau",
    "program.newDef": "Le bloc a apprendre aujourd'hui.",
    "quick.noneLabel": "Actions rapides",
    "quick.noneTitle": "Aucune page active",
    "quick.noneHelp": "Clique une page dans la grille pour ouvrir ce panneau fixe a droite.",
    "quick.title": "Actions rapides",
    "quick.close": "Fermer",
    "quick.pageTitle": "Page {{page}}",
    "quick.help": "Ajoute une erreur en un clic ou efface l'historique de cette page.",
    "quick.minor": "Mineur",
    "quick.medium": "Moyenne",
    "quick.grave": "Grave",
    "quick.clear": "Effacer",
    "toast.pageSelected": "Page {{page}} selectionnee.",
    "toast.pageClosed": "Page {{page}} fermee.",
    "toast.errorAdded": "Erreur {{severity}} ajoutee a la page {{page}}.",
    "toast.errorsCleared": "Erreurs retirees de la page {{page}}.",
    "toast.dayRecalculated": "Journee recalculee.",
    "toast.dayReset": "Validations du jour reinitialisees.",
    "toast.nextDay": "Passage au jour suivant.",
    "toast.networkError": "Erreur reseau.",
    "error.invalidPageFormat": "Format de pages invalide.",
    "error.invalidPageFormatExample": "Format de pages invalide. Utilise 12, 14, 20-25.",
    "error.pageOutOfRange": "Une page est hors limite.",
    "error.selectPageFirst": "Choisis d'abord une page.",
    "part.label": "Partie {{number}}",
  },
  en: {
    "hero.title": "Bismillah, here is your plan for today{{name}}!✨",
    "hero.text": "This board only shows what you need to recite today, in program order.",
    "hero.markerLabel": "Guide",
    "hero.markerText":
      "The goal is to complete old review (< J-30) every 7 days, consolidation (from J-8 to J-30) every 3 days, then review the recent block (from J-1 to J-7), then yesterday (J-1), and finally learn the new block.",
    "nav.today": "Today",
    "nav.pages": "Pages",
    "nav.settings": "Settings",
    "today.dayLabel": "Day",
    "today.validationTitle": "Validation Status",
    "today.validationHelp": "Validate the blocks in order, then move to the next day.",
    "today.resetButton": "Reset today's validations",
    "today.advanceButton": "Validate the day and move on",
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
      "Click a page in the grid to open quick actions, then choose Minor, Medium, Grave, or Clear.",
    "pages.summaryLabel": "Summary",
    "pages.summaryTitle": "Map Status",
    "pages.legendLabel": "Legend",
    "pages.legendTitle": "How To Read The Map",
    "pages.mapLabel": "Mushaf",
    "pages.mapTitle": "Quran Overview",
    "pages.mapHelp": "Click a page to open quick actions on the right.",
    "pages.definitionsLabel": "Definitions",
    "pages.definitionsHelp": "Program zones are shown directly above the map.",
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
    "settings.eyebrow": "Inputs",
    "settings.title": "Engine Settings",
    "settings.help": "A few fields are enough to rebuild the whole day.",
    "settings.firstNameLabel": "First name",
    "settings.firstNamePlaceholder": "Your first name",
    "settings.languageLabel": "Language",
    "settings.languageFrenchOption": "French",
    "settings.languageEnglishOption": "English",
    "settings.currentPageLabel": "Current page",
    "settings.currentHalfLabel": "Current half",
    "settings.upperHalfOption": "Upper",
    "settings.lowerHalfOption": "Lower",
    "settings.dailyNewLabel": "New / day (half-pages)",
    "settings.programDayLabel": "Program day",
    "settings.totalHalfPagesLabel": "Total half-pages",
    "settings.submitButton": "Recalculate the day",
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
    "summary.day": "Day",
    "summary.currentPoint": "Current point",
    "summary.dailyNew": "New / day",
    "hero.genericName": "",
    "hero.namedName": " {{name}}",
    "day.completeTitle": "Day complete.",
    "day.completeHelper": "{{done}} / {{total}} blocks validated, the program can move on.",
    "day.completeText":
      "You can move to the next day. The engine will advance the current half-page and program day, then recalculate old rotation automatically.",
    "day.openTitle": "Day still open.",
    "day.openHelper": "{{done}} / {{total}} blocks validated for today.",
    "day.remaining": "Still to validate: {{items}}.",
    "errorSummary.pagesWithErrors": "Pages with errors",
    "errorSummary.pagesWithErrorsHelp": "fragile pages out of {{total}}.",
    "errorSummary.learnedPages": "Learned pages",
    "errorSummary.learnedPagesHelp": "includes automatic marking up to yesterday.",
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
    "quick.noneLabel": "Quick actions",
    "quick.noneTitle": "No active page",
    "quick.noneHelp": "Click a page in the grid to open this fixed panel on the right.",
    "quick.title": "Quick actions",
    "quick.close": "Close",
    "quick.pageTitle": "Page {{page}}",
    "quick.help": "Add an error with one click or clear this page's history.",
    "quick.minor": "Minor",
    "quick.medium": "Medium",
    "quick.grave": "Grave",
    "quick.clear": "Clear",
    "toast.pageSelected": "Page {{page}} selected.",
    "toast.pageClosed": "Page {{page}} closed.",
    "toast.errorAdded": "{{severity}} error added to page {{page}}.",
    "toast.errorsCleared": "Errors cleared from page {{page}}.",
    "toast.dayRecalculated": "Day recalculated.",
    "toast.dayReset": "Today's validations reset.",
    "toast.nextDay": "Moved to the next day.",
    "toast.networkError": "Network error.",
    "error.invalidPageFormat": "Invalid page format.",
    "error.invalidPageFormatExample": "Invalid page format. Use 12, 14, 20-25.",
    "error.pageOutOfRange": "A page is out of range.",
    "error.selectPageFirst": "Choose a page first.",
    "part.label": "Part {{number}}",
  },
};

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

function getLanguage(payload = state.payload) {
  return payload?.settings?.language === "en" ? "en" : "fr";
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

function localizeStaticUi(payload = state.payload) {
  const language = getLanguage(payload);
  document.documentElement.lang = language;

  $all("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n, {}, payload);
  });

  $all("[data-i18n-placeholder]").forEach((node) => {
    node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder, {}, payload));
  });

  $all("[data-i18n-option]").forEach((node) => {
    node.textContent = t(node.dataset.i18nOption, {}, payload);
  });
}

function normalizeFirstName(value = "") {
  return String(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

function getCurrentPageFromHalfPage(currentHalfPage, totalHalfPages) {
  const safeTotal = Math.max(2, Number(totalHalfPages) || 2);
  const safeHalfPage = Math.max(1, Math.min(Number(currentHalfPage) || 1, safeTotal));
  return Math.ceil(safeHalfPage / 2);
}

function getCurrentHalfLabelFromHalfPage(currentHalfPage, totalHalfPages) {
  const safeTotal = Math.max(2, Number(totalHalfPages) || 2);
  const safeHalfPage = Math.max(1, Math.min(Number(currentHalfPage) || 1, safeTotal));
  return safeHalfPage % 2 === 0 ? "basse" : "haute";
}

function syncCurrentPageMax() {
  const totalHalfPages = Math.max(2, Number($("#total-half-pages")?.value) || 2);
  const totalPages = Math.max(1, Math.ceil(totalHalfPages / 2));
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

function getCurrentHalfPageFromForm() {
  const totalHalfPages = Math.max(2, Number($("#total-half-pages")?.value) || 2);
  const totalPages = Math.max(1, Math.ceil(totalHalfPages / 2));
  const currentPage = Math.min(totalPages, Math.max(1, Number($("#current-page")?.value) || 1));
  const currentHalf = $("#current-half")?.value === "basse" ? "basse" : "haute";
  return (currentPage - 1) * 2 + (currentHalf === "basse" ? 2 : 1);
}

async function api(path, options = {}) {
  const config = {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  };

  if (config.body && !config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }

  const response = await fetch(path, config);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || t("toast.networkError"));
  }
  return payload;
}

function showToast(message, isError = false) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.style.background = isError ? "rgba(141, 81, 71, 0.96)" : "rgba(17, 52, 45, 0.96)";
  toast.classList.add("visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("visible"), 2400);
}

function formatHalfPageCount(value, payload = state.payload) {
  const normalized = Number(value || 0);
  const language = getLanguage(payload);
  const unit = language === "en" ? (normalized === 1 ? "half-page" : "half-pages") : `demi-page${normalized === 1 ? "" : "s"}`;
  return `${normalized} ${unit}`;
}

function formatPageCountFromHalfPages(halfPageCount, payload = state.payload) {
  const normalized = Number(halfPageCount || 0) / 2;
  const formatted = Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(1);
  const numeric = Number(formatted);
  const language = getLanguage(payload);
  const unit = language === "en" ? (numeric === 1 || numeric === 0.5 ? "page" : "pages") : `page${numeric === 1 || numeric === 0.5 ? "" : "s"}`;
  return `${formatted} ${unit}`;
}

function cardClassName(blockKey, block) {
  return `card card-${blockKey} ${block.done ? "done" : ""} ${block.present ? "" : "empty"} ${block.locked ? "locked" : ""}`;
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
  const normalized = {
    learned: Boolean(safeEntry.learned),
    errors: {
      minor: Math.max(0, Number(errors.minor || 0)),
      medium: Math.max(0, Number(errors.medium || 0)),
      grave: Math.max(0, Number(errors.grave || 0)),
    },
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

  return normalized;
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

function setActiveView(view) {
  state.activeView = view;
  document.body.classList.toggle("pages-view-active", view === "pages");
  $all("[data-view-target]").forEach((button) => {
    button.classList.toggle("active", button.dataset.viewTarget === view);
  });
  $all(".content-view").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `view-${view}`);
  });
}

function getPrimaryProgramZone(programZones) {
  const priority = ["new", "yesterday", "recent", "consolidation", "old-today", "old-pool"];
  return priority.find((zoneKey) => programZones.some((zone) => zone.key === zoneKey)) || null;
}

function isLearnedFromProgram(programZones) {
  return programZones.some((zone) => zone.key !== "new");
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

  const pageStart = (page - 1) * 2 + 1;
  const pageEnd = page * 2;
  return range.start <= pageEnd && range.end >= pageStart;
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
      return `
        <article class="program-legend-chip ${zone.key} ${zone.range ? "" : "disabled"}">
          <span class="program-tag ${zone.key}">${escapeHtml(zone.label)}</span>
          <p class="program-definition">${escapeHtml(zone.definition)}</p>
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

function renderPageQuickActions(payload) {
  const container = $("#page-quick-actions");
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
  const effectiveLearned = entry.learned || isLearnedFromProgram(programZones);
  const stateLabel = buildPageStateLabel(entry, effectiveLearned);
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
      <div class="quick-status-row">
        <span class="quick-state-pill">${escapeHtml(stateLabel)}</span>
      </div>
      ${countsMarkup}
      ${programTags ? `<div class="quick-program-tags">${programTags}</div>` : ""}
      <div class="quick-action-buttons">
        <button class="quick-action-button minor" type="button" data-page-quick-action="minor" data-page="${escapeHtml(page)}">${escapeHtml(t("quick.minor"))}</button>
        <button class="quick-action-button medium" type="button" data-page-quick-action="medium" data-page="${escapeHtml(page)}">${escapeHtml(t("quick.medium"))}</button>
        <button class="quick-action-button grave" type="button" data-page-quick-action="grave" data-page="${escapeHtml(page)}">${escapeHtml(t("quick.grave"))}</button>
        <button class="quick-action-button clear" type="button" data-page-quick-clear="${escapeHtml(page)}">${escapeHtml(t("quick.clear"))}</button>
      </div>
    </div>
  `;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function getLearnedHalfPages(plan) {
  return Math.max(0, Math.min((plan.summary.currentHalfPage || 1) - 1, plan.summary.totalHalfPages || 0));
}

function getDashboardMetrics(payload) {
  const { plan, errorTracking } = payload;
  const presentKeys = plan.order.filter((key) => plan.blocks[key].present);
  const completedKeys = presentKeys.filter((key) => plan.blocks[key].done);
  const learnedHalfPages = getLearnedHalfPages(plan);
  const learnedPages = learnedHalfPages / 2;
  const waveCheckedCount = plan.blocks.new.present ? Number(plan.blocks.new.checkedCount || 0) : 9;
  const waveCompleteCount = plan.blocks.new.present
    ? (plan.blocks.new.waves || []).filter((wave) => wave.complete).length
    : 3;
  const dailyPercent = presentKeys.length ? (completedKeys.length / presentKeys.length) * 100 : 100;
  const learnedPercent = plan.summary.totalHalfPages ? (learnedHalfPages / plan.summary.totalHalfPages) * 100 : 0;
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
    waveCheckedCount,
    waveCompleteCount,
    dailyPercent: clampPercent(dailyPercent),
    learnedPercent: clampPercent(learnedPercent),
    wavePercent: clampPercent(wavePercent),
    stablePercent: clampPercent(stablePercent),
  };
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

function launchMiniCelebration(origin) {
  const layer = getCelebrationLayer();
  if (!layer || !origin) {
    return;
  }

  const centerX = origin.left + origin.width / 2;
  const centerY = origin.top + origin.height / 2;
  const colors = ["#1d5b4f", "#b38946", "#5b7588", "#8f5e49", "#6e8d59"];

  for (let index = 0; index < 14; index += 1) {
    const piece = document.createElement("span");
    piece.className = "celebration-piece burst";
    piece.style.left = `${centerX}px`;
    piece.style.top = `${centerY}px`;
    piece.style.setProperty("--dx", `${(Math.random() - 0.5) * 170}px`);
    piece.style.setProperty("--dy", `${-40 - Math.random() * 120}px`);
    piece.style.setProperty("--rotation", `${(Math.random() - 0.5) * 540}deg`);
    piece.style.setProperty("--piece-color", colors[index % colors.length]);
    piece.style.animationDuration = `${700 + Math.random() * 380}ms`;
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), 1300);
  }
}

function launchGrandCelebration() {
  const layer = getCelebrationLayer();
  if (!layer) {
    return;
  }

  const colors = ["#1d5b4f", "#b38946", "#5b7588", "#8f5e49", "#6e8d59", "#f2d67b"];
  const width = window.innerWidth;

  for (let index = 0; index < 90; index += 1) {
    const piece = document.createElement("span");
    piece.className = "celebration-piece rain";
    piece.style.left = `${Math.random() * width}px`;
    piece.style.top = `${-20 - Math.random() * 160}px`;
    piece.style.setProperty("--dx", `${(Math.random() - 0.5) * 220}px`);
    piece.style.setProperty("--dy", `${window.innerHeight + 260 + Math.random() * 220}px`);
    piece.style.setProperty("--rotation", `${(Math.random() - 0.5) * 960}deg`);
    piece.style.setProperty("--piece-color", colors[index % colors.length]);
    piece.style.animationDuration = `${1800 + Math.random() * 1400}ms`;
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), 3600);
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

    if (block.done) {
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

function statusMarkup(block) {
  if (!block.present) {
    return `<span class="status-pill empty">${escapeHtml(t("status.unavailable"))}</span>`;
  }
  if (block.done) {
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

  return `
    <div class="card-meta">
      <article class="mini-chip">
        <span class="eyebrow">${escapeHtml(t("meta.range"))}</span>
        <strong>${escapeHtml(range.label)}</strong>
      </article>
      <article class="mini-chip">
        <span class="eyebrow">${escapeHtml(t("meta.size"))}</span>
        <strong>${escapeHtml(range.countLabel || formatPageCountFromHalfPages(range.count, state.payload))}</strong>
      </article>
    </div>
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

      return `
        <article class="rotation-chip mini-window ${window.active ? "active-window" : ""}">
          <span class="eyebrow">${escapeHtml(window.label)}</span>
          <strong>${escapeHtml(window.range.label)}</strong>
          <p class="helper">${escapeHtml(window.range.countLabel)}</p>
        </article>
      `;
    })
    .join("");

  return `
    <article class="${cardClassName("old", block)}">
      <div class="card-body">
        <div class="card-head">
          <div>
            <p class="eyebrow">${escapeHtml(`${block.order}. ${block.title}`)}</p>
            <h2>${escapeHtml(block.title)}</h2>
          </div>
          ${statusMarkup(block)}
        </div>
        <p class="helper">${escapeHtml(block.helper)}</p>
        ${rangeBlockMarkup(block.range)}
        ${
          block.present
            ? `
              <div class="rotation-grid">
                <article class="rotation-chip pool">
                  <span class="eyebrow">${escapeHtml(t("card.old.pool"))}</span>
                  <strong>${escapeHtml(block.poolRange.label)}</strong>
                  <p class="helper">${escapeHtml(block.poolRange.countLabel)}</p>
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
        ${toggleButtonMarkup("old", block)}
      </div>
    </article>
  `;
}

function simpleCardMarkup(blockKey, block) {
  return `
    <article class="${cardClassName(blockKey, block)}">
      <div class="card-body">
        <div class="card-head">
          <div>
            <p class="eyebrow">${block.order}. ${escapeHtml(block.title)}</p>
            <h2>${escapeHtml(block.title)}</h2>
          </div>
          ${statusMarkup(block)}
        </div>
        <p class="helper">${escapeHtml(block.helper)}</p>
        ${rangeBlockMarkup(block.range)}
        ${toggleButtonMarkup(blockKey, block)}
      </div>
    </article>
  `;
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

  return `
    <article class="${cardClassName("consolidation", block)}">
      <div class="card-body">
        <div class="card-head">
          <div>
            <p class="eyebrow">${escapeHtml(`${block.order}. ${block.title}`)}</p>
            <h2>${escapeHtml(block.title)}</h2>
          </div>
          ${statusMarkup(block)}
        </div>
        <p class="helper">${escapeHtml(block.helper)}</p>
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
        ${toggleButtonMarkup("consolidation", block)}
      </div>
    </article>
  `;
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

  return `
    <article class="${cardClassName("new", block)}">
      <div class="card-body">
        <div class="card-head">
          <div>
            <p class="eyebrow">${escapeHtml(`${block.order}. ${block.title}`)}</p>
            <h2>${escapeHtml(block.title)}</h2>
          </div>
          ${statusMarkup(block)}
        </div>
        <p class="helper">${escapeHtml(block.helper)}</p>
        ${rangeBlockMarkup(block.range)}
        ${
          block.present
            ? `
              <div class="summary-lines">
                <p>${escapeHtml(t("card.new.checked", { count: block.checkedCount }))}</p>
                <p>${escapeHtml(t("card.new.rule"))}</p>
                ${block.locked && block.blockedByLabels?.length ? `<p>${escapeHtml(t("card.new.locked", { items: block.blockedByLabels.join(", ") }))}</p>` : ""}
              </div>
              <div class="wave-grid">${waveCards.join("")}</div>
            `
            : ""
        }
      </div>
    </article>
  `;
}

function renderSummary(payload) {
  const { plan } = payload;
  const metrics = getDashboardMetrics(payload);
  const rank = getRankFromProgress(metrics.learnedPercent);

  $("#summary").innerHTML = `
    <div class="summary-hero">
      <article class="summary-progress tone-${escapeHtml(rank.tone)} ${plan.canAdvanceDay ? "complete" : ""}">
        <div class="summary-progress-head">
          <div class="summary-progress-copy">
            <span class="eyebrow">${escapeHtml(t("summary.progress", {}, payload))}</span>
            <strong>${escapeHtml(t("summary.learned", { count: formatPageCountFromHalfPages(metrics.learnedHalfPages, payload) }, payload))}</strong>
          </div>
          <span class="summary-progress-value">${escapeHtml(`${metrics.learnedPercent}%`)}</span>
        </div>
        <div class="summary-progress-track" aria-hidden="true">
          <span class="summary-progress-fill" style="width:${escapeHtml(metrics.learnedPercent)}%;"></span>
        </div>
        <p class="summary-progress-note">${escapeHtml(t("summary.totalPages", { count: plan.summary.totalPages }, payload))}</p>
      </article>
      <div class="summary-grid">
        <article class="summary-chip">
          <span class="eyebrow">${escapeHtml(t("summary.day", {}, payload))}</span>
          <strong>${escapeHtml(plan.summary.programDayIndex)}</strong>
        </article>
        <article class="summary-chip">
          <span class="eyebrow">${escapeHtml(t("summary.currentPoint", {}, payload))}</span>
          <strong>${escapeHtml(plan.summary.currentHalfPageLabel)}</strong>
        </article>
        <article class="summary-chip">
          <span class="eyebrow">${escapeHtml(t("summary.dailyNew", {}, payload))}</span>
          <strong>${escapeHtml(plan.summary.dailyNewLabel)}</strong>
        </article>
      </div>
    </div>
  `;
}

function renderHero(payload) {
  const firstName = normalizeFirstName(payload?.settings?.firstName || "");
  if (getLanguage(payload) === "en") {
    $("#hero-title").innerHTML = firstName
      ? `Bismillah, here is your plan for today ${escapeHtml(firstName)}!&#10024;`
      : "Bismillah, here is your plan for today!&#10024;";
    return;
  }

  $("#hero-title").innerHTML = firstName
    ? `Bismillah, voici ton plan du jour ${escapeHtml(firstName)} !&#10024;`
    : "Bismillah, voici ton plan du jour !&#10024;";
}

function renderDayStatus(payload) {
  const { plan } = payload;
  const metrics = getDashboardMetrics(payload);
  const missing = [];
  if (!plan.blocks.old.done) {
    missing.push(plan.blocks.old.title);
  }
  if (!plan.blocks.consolidation.done) {
    missing.push(plan.blocks.consolidation.title);
  }
  if (!plan.blocks.recent.done) {
    missing.push(plan.blocks.recent.title);
  }
  if (!plan.blocks.yesterday.done) {
    missing.push(plan.blocks.yesterday.title);
  }
  if (!plan.blocks.new.done) {
    missing.push(plan.blocks.new.title);
  }

  $("#day-status").innerHTML = plan.canAdvanceDay
    ? `
        <strong>${escapeHtml(t("day.completeTitle", {}, payload))}</strong>
        <div class="status-progress">
          <div class="progress-bar green large"><span style="width: 100%"></span></div>
          <p class="helper">${escapeHtml(t("day.completeHelper", { done: metrics.completedKeys.length, total: metrics.presentKeys.length }, payload))}</p>
        </div>
        <p>${escapeHtml(t("day.completeText", {}, payload))}</p>
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
}

function renderErrorTracking(payload) {
  const totalPages = payload.errorTracking.totalPages;
  const summary = payload.errorTracking.summary;
  const pageErrors = payload.pageErrors || {};
  const plan = payload.plan || {};
  state.activePage =
    Number.isInteger(state.activePage) && state.activePage >= 1 && state.activePage <= totalPages ? state.activePage : null;

  renderProgramLegend(plan);

  const pageCells = [];
  let effectiveLearnedPages = 0;
  for (let page = 1; page <= totalPages; page += 1) {
    const entry = normalizePageEntry(pageErrors[String(page)]);
    const programZones = getPageProgramZones(plan, page);
    const effectiveLearned = entry.learned || isLearnedFromProgram(programZones);
    const programTags = programZones
      .map((zone) => `<span class="program-tag ${escapeHtml(zone.key)}">${escapeHtml(zone.shortLabel)}</span>`)
      .join("");
    const programTitleSuffix = programZones.length ? ` - ${programZones.map((zone) => zone.label).join(", ")}` : "";
    const stateLabel = buildPageStateLabel(entry, effectiveLearned);

    if (effectiveLearned) {
      effectiveLearnedPages += 1;
    }

    pageCells.push(`
      <button
        class="${escapeHtml(pageCellClass(entry, page, effectiveLearned, programZones))}"
        type="button"
        data-page-cell="${escapeHtml(page)}"
        data-severity="${escapeHtml(entry.dominantSeverity)}"
        data-learned="${escapeHtml(effectiveLearned)}"
        title="${escapeHtml(t("page.label", { page }, payload))} - ${escapeHtml(stateLabel)}${escapeHtml(programTitleSuffix)}"
      >
        <span class="page-cell-number">${escapeHtml(page)}</span>
        ${effectiveLearned ? `<span class="learned-badge">${escapeHtml(t("page.learnedBadge", {}, payload))}</span>` : ""}
        <span class="page-cell-state">${escapeHtml(stateLabel)}</span>
        ${programTags ? `<span class="page-cell-program">${programTags}</span>` : ""}
        <span class="page-cell-counts">
          <span class="count-pill minor ${entry.errors.minor > 0 ? "filled" : ""}">${escapeHtml(t("count.minor", {}, payload))} ${escapeHtml(entry.errors.minor)}</span>
          <span class="count-pill medium ${entry.errors.medium > 0 ? "filled" : ""}">${escapeHtml(t("count.medium", {}, payload))} ${escapeHtml(entry.errors.medium)}</span>
          <span class="count-pill grave ${entry.errors.grave > 0 ? "filled" : ""}">${escapeHtml(t("count.grave", {}, payload))} ${escapeHtml(entry.errors.grave)}</span>
        </span>
      </button>
    `);
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

  renderPageQuickActions(payload);
  $("#error-grid").innerHTML = pageCells.join("");
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
  $("#first-name").value = payload.settings.firstName || "";
  $("#language").value = getLanguage(payload);
  $("#current-page").value = getCurrentPageFromHalfPage(payload.progress.currentHalfPage, payload.settings.totalHalfPages);
  $("#current-half").value = getCurrentHalfLabelFromHalfPage(payload.progress.currentHalfPage, payload.settings.totalHalfPages);
  $("#daily-new-half-pages").value = payload.settings.dailyNewHalfPages;
  $("#program-day-index").value = payload.progress.programDayIndex;
  $("#total-half-pages").value = payload.settings.totalHalfPages;
  syncCurrentPageMax();
}

function bindPageCellSelection() {
  $all("[data-page-cell]").forEach((button) => {
    button.addEventListener("click", () => {
      const page = Number(button.dataset.pageCell);
      state.activePage = state.activePage === page ? null : page;
      renderErrorTracking(state.payload);
      bindPageQuickActions();
      bindPageCellSelection();
      showToast(state.activePage ? t("toast.pageSelected", { page }) : t("toast.pageClosed", { page }));
    });
  });
}

function bindPageQuickActions() {
  $all("[data-page-quick-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        state.payload = await api("/api/page-errors", {
          method: "POST",
          body: JSON.stringify({
            page: Number(button.dataset.page),
            severity: String(button.dataset.pageQuickAction || ""),
          }),
        });
        render();
        showToast(
          t("toast.errorAdded", {
            severity: severityLabel(String(button.dataset.pageQuickAction || "")),
            page: button.dataset.page,
          }),
        );
      } catch (error) {
        showToast(error.message, true);
      }
    });
  });

  $all("[data-page-quick-clear]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        state.payload = await api("/api/page-errors/clear", {
          method: "POST",
          body: JSON.stringify({
            page: Number(button.dataset.pageQuickClear),
          }),
        });
        render();
        showToast(t("toast.errorsCleared", { page: button.dataset.pageQuickClear }));
      } catch (error) {
        showToast(error.message, true);
      }
    });
  });

  $all("[data-clear-active-page]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activePage = null;
      renderErrorTracking(state.payload);
      bindPageQuickActions();
      bindPageCellSelection();
    });
  });
}

function bindDynamicActions() {
  $all("[data-block-key]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const origin = button.getBoundingClientRect();
        const blockKey = button.dataset.blockKey;
        const wasDone = Boolean(state.payload?.plan?.blocks?.[blockKey]?.done);
        const wasComplete = Boolean(state.payload?.plan?.canAdvanceDay);
        state.payload = await api("/api/toggle-block", {
          method: "POST",
          body: JSON.stringify({ blockKey }),
        });
        render();
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

  $all("[data-wave-index]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const origin = button.getBoundingClientRect();
        const waveIndex = Number(button.dataset.waveIndex);
        const slotIndex = Number(button.dataset.slotIndex);
        const wasChecked = Boolean(state.payload?.plan?.blocks?.new?.waves?.[waveIndex]?.slots?.[slotIndex]?.checked);
        const wasComplete = Boolean(state.payload?.plan?.canAdvanceDay);
        state.payload = await api("/api/toggle-wave-slot", {
          method: "POST",
          body: JSON.stringify({
            waveIndex,
            slotIndex,
          }),
        });
        render();
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

  bindPageQuickActions();
  bindPageCellSelection();
}

function render() {
  document.body.classList.toggle("day-complete", Boolean(state.payload?.plan?.canAdvanceDay));
  localizeStaticUi(state.payload);
  renderHero(state.payload);
  renderSummary(state.payload);
  renderDayStatus(state.payload);
  renderErrorTracking(state.payload);
  renderCards(state.payload);
  fillForm(state.payload);
  setActiveView(state.activeView);
  renderRouteProgress(state.payload.plan);
  bindDynamicActions();
}

function bindStaticActions() {
  $("#config-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      state.payload = await api("/api/config", {
        method: "POST",
        body: JSON.stringify({
          settings: {
            firstName: $("#first-name").value,
            language: $("#language").value,
            dailyNewHalfPages: Number($("#daily-new-half-pages").value),
            totalHalfPages: Number($("#total-half-pages").value),
          },
          progress: {
            currentHalfPage: getCurrentHalfPageFromForm(),
            programDayIndex: Number($("#program-day-index").value),
          },
        }),
      });
      render();
      showToast(t("toast.dayRecalculated"));
    } catch (error) {
      showToast(error.message, true);
    }
  });

  $("#reset-button").addEventListener("click", async () => {
    try {
      state.payload = await api("/api/reset-today", { method: "POST" });
      render();
      showToast(t("toast.dayReset"));
    } catch (error) {
      showToast(error.message, true);
    }
  });

  $("#advance-button").addEventListener("click", async () => {
    try {
      state.payload = await api("/api/advance-day", { method: "POST" });
      render();
      showToast(t("toast.nextDay"));
    } catch (error) {
      showToast(error.message, true);
    }
  });

  $all("[data-view-target]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveView(button.dataset.viewTarget);
    });
  });

  $("#total-half-pages").addEventListener("input", () => {
    syncCurrentPageMax();
  });

  $("#current-page").addEventListener("change", () => {
    syncCurrentPageMax();
  });
}

async function init() {
  bindStaticActions();
  state.payload = await api("/api/state");
  render();
}

window.addEventListener("DOMContentLoaded", () => {
  init().catch((error) => showToast(error.message, true));
});
