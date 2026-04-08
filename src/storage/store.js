const { createEmptyCard, fsrs, Rating, State } = require("ts-fsrs");
const { createMemoryStateRepository, resolveDefaultStateRepository } = require("./state-repository");
const {
  DEFAULT_NOTIFICATION_PREFERENCES,
  buildStatistics,
  mergeNotificationPreferences,
  normalizeActivityHistory,
  normalizeNotificationPreferences,
  recordDayCompletion,
} = require("../lib/activity");
const {
  DEFAULT_PROGRESS,
  DEFAULT_SETTINGS,
  buildTodayPlan,
  createEmptyDailyStatus,
  getDaySignature,
  isLegacyProgressScale,
  normalizeDailyStatus,
  normalizeProgress,
  normalizeSettings,
} = require("../lib/plan");

const PAGE_ERROR_LEVELS = new Set(["minor", "medium", "grave"]);
const ERROR_LEVEL_KEYS = ["minor", "medium", "grave"];
const ERROR_SCOPE_KEYS = ["harakah", "word", "line", "next-page-link"];
const ERROR_SCOPE_TO_SEVERITY = {
  harakah: "minor",
  word: "medium",
  line: "grave",
  "next-page-link": "grave",
};
const MAX_PAGE_EVENTS = 24;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const ERROR_REVIEW_SCHEDULER = fsrs({
  enable_fuzz: false,
});
const STORE_TEXT = {
  fr: {
    noValidPages: "Aucune page valide n'a ete fournie.",
    invalidPageNumber: "Numero de page invalide.",
    invalidBlock: "Bloc invalide.",
    blockUnavailable: "Ce bloc n'est pas disponible aujourd'hui.",
    validateFirst: "Valide d'abord : {{items}}.",
    invalidWave: "Validation de vague invalide.",
    newUnavailable: "Le nouveau n'est pas disponible aujourd'hui.",
    dayNotComplete: "La journee n'est pas encore completement validee.",
    skipMemorizationUnavailable: "Ce bouton n'est disponible que quand tout est valide sauf le nouveau.",
    invalidErrorType: "Type d'erreur invalide.",
    invalidErrorScope: "Type de zone invalide.",
    invalidSelectionRect: "Zone selectionnee invalide.",
    invalidErrorItem: "Erreur introuvable.",
    nextPageLinkAlreadyExists: "Cette page a deja une erreur de liaison avec la page suivante.",
    invalidReviewItem: "Carte d'erreur introuvable.",
    invalidReviewResult: "Resultat de revision invalide.",
  },
  en: {
    noValidPages: "No valid page was provided.",
    invalidPageNumber: "Invalid page number.",
    invalidBlock: "Invalid block.",
    blockUnavailable: "This block is not available today.",
    validateFirst: "Validate first: {{items}}.",
    invalidWave: "Invalid wave check.",
    newUnavailable: "New work is not available today.",
    dayNotComplete: "The day is not fully validated yet.",
    skipMemorizationUnavailable: "This button is only available when everything is validated except the new block.",
    invalidErrorType: "Invalid error type.",
    invalidErrorScope: "Invalid error scope.",
    invalidSelectionRect: "Invalid selected area.",
    invalidErrorItem: "Error not found.",
    nextPageLinkAlreadyExists: "This page already has a next-page link error.",
    invalidReviewItem: "Error card not found.",
    invalidReviewResult: "Invalid review result.",
  },
  ar: {
    noValidPages: "لم يتم تقديم صفحة صالحة.",
    invalidPageNumber: "رقم الصفحة غير صالح.",
    invalidBlock: "الكتلة غير صالحة.",
    blockUnavailable: "هذه الكتلة غير متاحة اليوم.",
    validateFirst: "تحقق أولا من: {{items}}.",
    invalidWave: "تحقق الموجة غير صالح.",
    newUnavailable: "الجديد غير متاح اليوم.",
    dayNotComplete: "اليوم لم يكتمل التحقق منه بعد.",
    skipMemorizationUnavailable: "هذا الزر متاح فقط عندما يكون كل شيء متحققا ما عدا الجديد.",
    invalidErrorType: "نوع الخطأ غير صالح.",
    invalidErrorScope: "نوع المنطقة غير صالح.",
    invalidSelectionRect: "المنطقة المحددة غير صالحة.",
    invalidErrorItem: "الخطأ غير موجود.",
    nextPageLinkAlreadyExists: "هذه الصفحة فيها بالفعل خطأ ربط مع الصفحة التالية.",
    invalidReviewItem: "بطاقة الخطأ غير موجودة.",
    invalidReviewResult: "نتيجة المراجعة غير صالحة.",
  },
};
let stateRepository = resolveDefaultStateRepository();

function generateRandomId() {
  if (typeof globalThis !== "undefined" && globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `dabt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getLanguage(settings = DEFAULT_SETTINGS) {
  if (settings?.language === "en") {
    return "en";
  }
  if (settings?.language === "ar") {
    return "ar";
  }
  return "fr";
}

function translate(settings, key, variables = {}) {
  const language = getLanguage(settings);
  const template = (STORE_TEXT[language] && STORE_TEXT[language][key]) || STORE_TEXT.fr[key] || key;
  return String(template).replace(/\{\{(\w+)\}\}/g, (_match, token) => String(variables[token] ?? ""));
}

function createDefaultState() {
  const settings = { ...DEFAULT_SETTINGS };
  const progress = normalizeProgress(DEFAULT_PROGRESS, settings);
  const signature = getDaySignature(settings, progress);
  return {
    settings,
    progress,
    dailyStatus: createEmptyDailyStatus(signature),
    notificationPreferences: normalizeNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES),
    activityHistory: normalizeActivityHistory([]),
    pageErrors: {},
  };
}

function getStateRepository() {
  return stateRepository;
}

function setStateRepository(repository) {
  if (!repository || typeof repository.read !== "function" || typeof repository.write !== "function") {
    throw new Error("State repository invalide.");
  }

  stateRepository = repository;
}

function resetStateRepository() {
  stateRepository = resolveDefaultStateRepository();
}

function writeRawState(state) {
  getStateRepository().write(state);
}

function readRawState() {
  const rawState = getStateRepository().read();
  if (!rawState || typeof rawState !== "object") {
    const initial = createDefaultState();
    writeRawState(initial);
    return initial;
  }

  return rawState;
}

function normalizeState(rawState = {}) {
  const rawSettings = rawState.settings || DEFAULT_SETTINGS;
  const settings = normalizeSettings(rawSettings);
  const progress = normalizeProgress(rawState.progress || DEFAULT_PROGRESS, settings, {
    legacyScale: isLegacyProgressScale(rawSettings),
  });
  const signature = getDaySignature(settings, progress);
  const dailyStatus = normalizeDailyStatus(rawState.dailyStatus || {}, signature);
  const notificationPreferences = normalizeNotificationPreferences(rawState.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES);
  const activityHistory = normalizeActivityHistory(rawState.activityHistory || []);
  const pageErrors = normalizePageErrors(rawState.pageErrors || {}, settings);

  if (dailyStatus.signature !== signature) {
    return {
      settings,
      progress,
      dailyStatus: createEmptyDailyStatus(signature),
      notificationPreferences,
      activityHistory,
      pageErrors,
    };
  }

  return {
    settings,
    progress,
    dailyStatus,
    notificationPreferences,
    activityHistory,
    pageErrors,
  };
}

function readState() {
  const state = normalizeState(readRawState());
  writeRawState(state);
  return state;
}

function buildResponse(state) {
  const errorTracking = buildErrorTracking(state.settings, state.pageErrors);
  const errorReview = buildErrorReview(state.pageErrors);
  return {
    settings: state.settings,
    progress: state.progress,
    dailyStatus: state.dailyStatus,
    preferences: {
      notifications: state.notificationPreferences,
    },
    statistics: buildStatistics(state.activityHistory),
    pageErrors: state.pageErrors,
    errorTracking,
    errorReview,
    plan: buildTodayPlan(state),
  };
}

function getState() {
  return buildResponse(readState());
}

function saveConfig(input = {}) {
  const current = readState();
  const settings = normalizeSettings({
    ...current.settings,
    ...(input.settings || {}),
  });
  const progress = normalizeProgress(
    {
      ...current.progress,
      ...(input.progress || {}),
    },
    settings,
  );
  const notificationPreferences = mergeNotificationPreferences(
    current.notificationPreferences,
    input.preferences?.notifications || {},
  );
  const signature = getDaySignature(settings, progress);
  const state = {
    settings,
    progress,
    dailyStatus:
      signature === current.dailyStatus.signature
        ? normalizeDailyStatus(current.dailyStatus || {}, signature)
        : createEmptyDailyStatus(signature),
    notificationPreferences,
    activityHistory: normalizeActivityHistory(current.activityHistory),
    pageErrors: normalizePageErrors(current.pageErrors, settings),
  };
  writeRawState(state);
  return buildResponse(state);
}

function updateState(mutator) {
  const current = readState();
  const next = mutator({
    settings: { ...current.settings },
    progress: {
      ...current.progress,
      phaseProgressHalfPages: Array.isArray(current.progress.phaseProgressHalfPages)
        ? [...current.progress.phaseProgressHalfPages]
        : [],
    },
    dailyStatus: {
      signature: current.dailyStatus.signature,
      blocks: { ...current.dailyStatus.blocks },
      skipNew: Boolean(current.dailyStatus.skipNew),
      waves: current.dailyStatus.waves.map((wave) => [...wave]),
    },
    notificationPreferences: normalizeNotificationPreferences(current.notificationPreferences),
    activityHistory: normalizeActivityHistory(current.activityHistory),
    pageErrors: JSON.parse(JSON.stringify(current.pageErrors)),
  });
  const normalized = normalizeState(next);
  writeRawState(normalized);
  return buildResponse(normalized);
}

function normalizePageErrors(input = {}, settings = DEFAULT_SETTINGS) {
  const totalPages = Math.ceil(settings.totalHalfPages / 2);
  const normalized = {};

  if (!input || typeof input !== "object") {
    return normalized;
  }

  for (const [rawPage, rawSeverity] of Object.entries(input)) {
    const page = Number.parseInt(rawPage, 10);

    if (!Number.isInteger(page) || page < 1 || page > totalPages) {
      continue;
    }

    const entry = normalizePageEntry(rawSeverity, page);
    if (entry) {
      normalized[String(page)] = entry;
    }
  }

  return normalized;
}

function buildErrorTracking(settings, pageErrors = {}) {
  const summary = {
    minor: 0,
    medium: 0,
    grave: 0,
    pagesWithErrors: 0,
    learnedPages: 0,
  };

  for (const entry of Object.values(pageErrors)) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const totalErrors = ERROR_LEVEL_KEYS.reduce((count, key) => count + Number(entry.errors?.[key] || 0), 0);

    if (entry.learned) {
      summary.learnedPages += 1;
    }

    if (totalErrors > 0) {
      summary.pagesWithErrors += 1;
    }

    for (const key of ERROR_LEVEL_KEYS) {
      summary[key] += Number(entry.errors?.[key] || 0);
    }
  }

  return {
    totalPages: Math.ceil(settings.totalHalfPages / 2),
    summary,
  };
}

function addHours(date, hours) {
  return new Date(date.getTime() + Math.max(0, Number(hours) || 0) * HOUR_MS).toISOString();
}

function severityToScope(severity) {
  if (severity === "grave") {
    return "line";
  }
  if (severity === "medium") {
    return "word";
  }
  return "harakah";
}

function normalizeSelectionRect(rawRect) {
  if (!rawRect || typeof rawRect !== "object") {
    return null;
  }

  const x = Math.max(0, Math.min(1, Number(rawRect.x)));
  const y = Math.max(0, Math.min(1, Number(rawRect.y)));
  const width = Math.max(0, Math.min(1 - x, Number(rawRect.width)));
  const height = Math.max(0, Math.min(1 - y, Number(rawRect.height)));

  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }

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

function normalizeSelectionAnchor(rawAnchor, scope = "") {
  if (!rawAnchor || typeof rawAnchor !== "object") {
    return null;
  }

  const kind = rawAnchor.kind === "line" ? "line" : rawAnchor.kind === "word" ? "word" : "";
  if (!kind) {
    return null;
  }

  if ((scope === "line" || scope === "next-page-link") && kind !== "line") {
    return null;
  }

  if (scope && scope !== "line" && scope !== "next-page-link" && kind !== "word") {
    return null;
  }

  const lineNumber = Number.parseInt(rawAnchor.lineNumber, 10);
  if (!Number.isInteger(lineNumber) || lineNumber < 1) {
    return null;
  }

  if (kind === "line") {
    return {
      kind,
      lineNumber,
    };
  }

  const wordId = Number.parseInt(rawAnchor.wordId, 10);
  if (!Number.isInteger(wordId) || wordId < 1) {
    return null;
  }

  return {
    kind,
    lineNumber,
    wordId,
  };
}

function toDate(value, fallback = new Date()) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getTime());
  }

  const parsed = new Date(value || "");
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return fallback instanceof Date && !Number.isNaN(fallback.getTime()) ? new Date(fallback.getTime()) : new Date();
}

function toOptionalDate(value) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function clampFsrsState(value) {
  const numeric = Number.parseInt(value, 10);
  if (numeric === State.Learning || numeric === State.Review || numeric === State.Relearning) {
    return numeric;
  }
  return State.New;
}

function clampDifficulty(value, fallback = 5) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(1, Math.min(10, numeric));
}

function normalizeFsrsDifficulty(value, stateValue, fallback = 5) {
  const safeState = clampFsrsState(stateValue);
  if (safeState === State.New) {
    return 0;
  }
  return clampDifficulty(value, Math.max(1, fallback));
}

function clampStability(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(0, numeric);
}

function readStabilityOrFallback(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return clampStability(fallback, 0);
  }
  return clampStability(numeric, 0);
}

function toRoundedHours(fromDate, toDateValue) {
  const safeFrom = toDate(fromDate);
  const safeTo = toDate(toDateValue, safeFrom);
  return Math.max(0, Number(((safeTo.getTime() - safeFrom.getTime()) / HOUR_MS).toFixed(2)));
}

function difficultyToEaseFactor(difficulty) {
  const safeDifficulty = clampDifficulty(difficulty, 5);
  return Number(Math.max(1.3, Math.min(3.2, 3.25 - safeDifficulty * 0.17)).toFixed(2));
}

function getSchedulableStability(stateValue, dueDate, referenceDate, fallback = 0.2) {
  const safeState = clampFsrsState(stateValue);
  if (safeState === State.New) {
    return 0;
  }

  const safeDue = toDate(dueDate);
  const safeReference = toDate(referenceDate, safeDue);
  const dueGapDays = Math.max(0, (safeDue.getTime() - safeReference.getTime()) / DAY_MS);
  return Number(Math.max(0.1, dueGapDays || fallback).toFixed(4));
}

function serializeFsrsCard(card, fallbackDate = new Date()) {
  const due = toDate(card?.due, fallbackDate);
  const lastReview = toOptionalDate(card?.last_review);
  const state = clampFsrsState(card?.state);
  return {
    due: due.toISOString(),
    stability: Number(clampStability(card?.stability).toFixed(4)),
    difficulty: Number(normalizeFsrsDifficulty(card?.difficulty, state).toFixed(4)),
    elapsed_days: Math.max(0, Number.parseInt(card?.elapsed_days, 10) || 0),
    scheduled_days: Math.max(0, Number.parseInt(card?.scheduled_days, 10) || 0),
    learning_steps: Math.max(0, Number.parseInt(card?.learning_steps, 10) || 0),
    reps: Math.max(0, Number.parseInt(card?.reps, 10) || 0),
    lapses: Math.max(0, Number.parseInt(card?.lapses, 10) || 0),
    state,
    last_review: lastReview ? lastReview.toISOString() : "",
  };
}

function buildLegacyFsrsCard(review, createdAt = new Date().toISOString()) {
  const createdDate = toDate(createdAt);
  const dueDate = toDate(review?.dueAt, createdDate);
  const lastReviewDate = toOptionalDate(review?.lastReviewedAt);
  const successCount = Math.max(0, Number.parseInt(review?.successCount, 10) || 0);
  const failureCount = Math.max(0, Number.parseInt(review?.failureCount, 10) || 0);
  const totalReviews = Math.max(0, Number.parseInt(review?.repetitions, 10) || successCount + failureCount);
  const intervalHours = Math.max(
    0,
    Number(review?.intervalHours) || (lastReviewDate ? (dueDate.getTime() - lastReviewDate.getTime()) / HOUR_MS : 0),
  );
  const scheduledDays = Math.max(
    0,
    Number.parseInt(review?.fsrsCard?.scheduled_days, 10) || (intervalHours >= 24 ? Math.round(intervalHours / 24) : 0),
  );
  const totalAttempts = Math.max(1, successCount + failureCount);
  const failureRatio = failureCount / totalAttempts;

  let state = State.New;
  if (review?.lastResult === "failure") {
    state = State.Relearning;
  } else if (successCount > 0 || totalReviews > 0) {
    state = scheduledDays >= 1 || intervalHours >= 24 ? State.Review : State.Learning;
  }

  const baseCard = createEmptyCard(createdDate);
  return {
    ...baseCard,
    due: dueDate,
    stability: readStabilityOrFallback(
      review?.fsrsCard?.stability,
      scheduledDays > 0
        ? scheduledDays
        : successCount > 0
          ? Math.max(0.4, intervalHours / 24 || 0.5)
          : getSchedulableStability(state, dueDate, lastReviewDate || createdDate, 0.2),
    ),
    difficulty: normalizeFsrsDifficulty(review?.fsrsCard?.difficulty, state, 4.6 + failureRatio * 3.4),
    elapsed_days: Math.max(0, lastReviewDate ? Math.round((createdDate.getTime() - lastReviewDate.getTime()) / DAY_MS) : 0),
    scheduled_days: scheduledDays,
    learning_steps: Math.max(0, Number.parseInt(review?.fsrsCard?.learning_steps, 10) || 0),
    reps: totalReviews,
    lapses: failureCount,
    state,
    last_review: lastReviewDate,
  };
}

function deserializeFsrsCard(rawCard, createdAt = new Date().toISOString(), legacyReview = null) {
  if (!rawCard || typeof rawCard !== "object") {
    return buildLegacyFsrsCard(legacyReview, createdAt);
  }

  const createdDate = toDate(createdAt);
  const dueDate = toDate(rawCard.due, createdDate);
  const lastReviewDate = toOptionalDate(rawCard.last_review);
  const referenceDate = lastReviewDate || createdDate;
  const dueGapHours = Math.max(0, (dueDate.getTime() - referenceDate.getTime()) / HOUR_MS);
  const explicitScheduledDays = Math.max(0, Number.parseInt(rawCard.scheduled_days, 10) || 0);
  const normalizedScheduledDays = dueGapHours >= 24 ? explicitScheduledDays || Math.round(dueGapHours / 24) : 0;
  const explicitState = clampFsrsState(rawCard.state);
  const normalizedState = dueGapHours < 24 && explicitState === State.Review ? State.Learning : explicitState;
  const baseCard = createEmptyCard(createdDate);
  const normalizedStability = clampStability(
    readStabilityOrFallback(
      rawCard.stability,
      getSchedulableStability(normalizedState, dueDate, referenceDate, dueGapHours >= 24 ? normalizedScheduledDays || 1 : 0.2),
    ),
    0,
  );

  return {
    ...baseCard,
    due: dueDate,
    stability: normalizedStability,
    difficulty: normalizeFsrsDifficulty(rawCard.difficulty, normalizedState, 5),
    elapsed_days: Math.max(0, Number.parseInt(rawCard.elapsed_days, 10) || 0),
    scheduled_days: normalizedScheduledDays,
    learning_steps: Math.max(0, Number.parseInt(rawCard.learning_steps, 10) || 0),
    reps: Math.max(0, Number.parseInt(rawCard.reps, 10) || 0),
    lapses: Math.max(0, Number.parseInt(rawCard.lapses, 10) || 0),
    state: normalizedState,
    last_review: lastReviewDate,
  };
}

function buildPersistedReviewStateFromCard(card, meta = {}) {
  const createdDate = toDate(meta.createdAt || new Date().toISOString());
  const serializedCard = serializeFsrsCard(card, createdDate);
  const lastReviewedAt = serializedCard.last_review || "";
  const referenceDate = lastReviewedAt ? toDate(lastReviewedAt, createdDate) : createdDate;
  const dueAt = serializedCard.due;
  const intervalHours = toRoundedHours(referenceDate, dueAt);
  const successCount = Math.max(0, Number.parseInt(meta.successCount, 10) || 0);
  const failureCount = Math.max(0, Number.parseInt(meta.failureCount, 10) || 0);
  const lastResult = ["new", "success", "failure"].includes(meta.lastResult) ? meta.lastResult : "new";

  return {
    repetitions: serializedCard.reps,
    easeFactor: difficultyToEaseFactor(serializedCard.difficulty),
    intervalHours,
    dueAt,
    lastReviewedAt,
    lastResult,
    successCount,
    failureCount,
    fsrsCard: serializedCard,
  };
}

function createInitialReviewState(createdAt = new Date().toISOString()) {
  return buildPersistedReviewStateFromCard(createEmptyCard(toDate(createdAt)), {
    createdAt,
    lastResult: "new",
    successCount: 0,
    failureCount: 0,
  });
}

function normalizeReviewState(rawReview, createdAt = new Date().toISOString()) {
  const review = rawReview && typeof rawReview === "object" ? rawReview : {};
  const successCount = Math.max(0, Number.parseInt(review.successCount, 10) || 0);
  const failureCount = Math.max(0, Number.parseInt(review.failureCount, 10) || 0);
  const lastResult = ["new", "success", "failure"].includes(review.lastResult) ? review.lastResult : "new";
  const fsrsCard = deserializeFsrsCard(review.fsrsCard, createdAt, review);

  return buildPersistedReviewStateFromCard(fsrsCard, {
    createdAt,
    lastResult,
    successCount,
    failureCount,
  });
}

function buildNextReviewState(review, isCorrect, createdAt = new Date().toISOString()) {
  const now = new Date();
  const current = normalizeReviewState(review, createdAt);
  const currentCard = deserializeFsrsCard(current.fsrsCard, createdAt, current);
  const rating = isCorrect ? Rating.Good : Rating.Again;
  const result = ERROR_REVIEW_SCHEDULER.next(currentCard, now, rating);

  return buildPersistedReviewStateFromCard(result.card, {
    createdAt,
    lastResult: isCorrect ? "success" : "failure",
    successCount: current.successCount + (isCorrect ? 1 : 0),
    failureCount: current.failureCount + (isCorrect ? 0 : 1),
  });
}

function compareReviewItems(left, right) {
  const leftDue = Date.parse(left.review?.dueAt || left.createdAt || 0) || 0;
  const rightDue = Date.parse(right.review?.dueAt || right.createdAt || 0) || 0;
  if (leftDue !== rightDue) {
    return leftDue - rightDue;
  }

  const leftUpdated = Date.parse(left.review?.lastReviewedAt || left.createdAt || 0) || 0;
  const rightUpdated = Date.parse(right.review?.lastReviewedAt || right.createdAt || 0) || 0;
  if (leftUpdated !== rightUpdated) {
    return leftUpdated - rightUpdated;
  }

  return Number(left.page || 0) - Number(right.page || 0);
}

function buildErrorReview(pageErrors = {}) {
  const now = Date.now();
  const items = Object.entries(pageErrors).flatMap(([pageNumber, rawEntry]) => {
    const entry = normalizePageEntry(rawEntry, Number(pageNumber));
    return entry.events
      .filter((event) => event.rect || event.scope === "next-page-link")
      .map((event) => ({
        id: event.id,
        page: Number(pageNumber),
        severity: event.severity,
        scope: event.scope,
        note: event.note,
        rect: event.rect,
        anchor: event.anchor,
        createdAt: event.createdAt,
        review: event.review,
      }));
  });

  const sortedItems = items.sort(compareReviewItems);
  const dueItems = sortedItems.filter((item) => (Date.parse(item.review?.dueAt || item.createdAt || 0) || 0) <= now);
  const upcomingItems = sortedItems.filter((item) => !dueItems.some((dueItem) => dueItem.id === item.id));
  const nextDueAt = upcomingItems[0]?.review?.dueAt || "";
  const masteredCount = sortedItems.filter((item) => {
    const review = normalizeReviewState(item.review, item.createdAt);
    return review.successCount >= 3 && review.intervalHours >= 72;
  }).length;

  return {
    dueItems,
    upcomingItems,
    summary: {
      totalItems: sortedItems.length,
      dueCount: dueItems.length,
      upcomingCount: upcomingItems.length,
      masteredCount,
      nextDueAt,
    },
  };
}

function createEmptyPageEntry() {
  return {
    learned: false,
    errors: {
      minor: 0,
      medium: 0,
      grave: 0,
    },
    events: [],
  };
}

function normalizePageNote(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

function normalizePageEvent(rawEvent, pageNumber, index = 0) {
  if (!rawEvent || typeof rawEvent !== "object") {
    return null;
  }

  const severity = PAGE_ERROR_LEVELS.has(rawEvent.severity) ? rawEvent.severity : null;
  if (!severity) {
    return null;
  }

  const createdAt =
    typeof rawEvent.createdAt === "string" && rawEvent.createdAt.trim()
      ? rawEvent.createdAt.trim()
      : new Date().toISOString();
  const scope = ERROR_SCOPE_KEYS.includes(rawEvent.scope) ? rawEvent.scope : severityToScope(severity);
  const rect = normalizeSelectionRect(rawEvent.rect);
  const anchor = normalizeSelectionAnchor(rawEvent.anchor, scope);
  const legacyToken = String(rawEvent.note || "").slice(0, 24).replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "event";
  const id =
    typeof rawEvent.id === "string" && rawEvent.id.trim()
      ? rawEvent.id.trim()
      : `legacy-${pageNumber}-${severity}-${createdAt}-${index}-${legacyToken}`;

  return {
    id,
    severity,
    scope,
    rect,
    anchor,
    note: normalizePageNote(rawEvent.note),
    createdAt,
    review: normalizeReviewState(rawEvent.review, createdAt),
  };
}

function normalizePageEntry(rawEntry, pageNumber = 0) {
  const entry = createEmptyPageEntry();

  if (typeof rawEntry === "string") {
    if (!PAGE_ERROR_LEVELS.has(rawEntry)) {
      return null;
    }

    entry.errors[rawEntry] = 1;
    return entry;
  }

  if (!rawEntry || typeof rawEntry !== "object") {
    return null;
  }

  entry.learned = false;

  if (typeof rawEntry.severity === "string" && PAGE_ERROR_LEVELS.has(rawEntry.severity)) {
    entry.errors[rawEntry.severity] = Math.max(1, Number.parseInt(rawEntry.count, 10) || 1);
  }

  if (rawEntry.errors && typeof rawEntry.errors === "object") {
    for (const key of ERROR_LEVEL_KEYS) {
      const count = Number.parseInt(rawEntry.errors[key], 10);
      entry.errors[key] = Number.isInteger(count) && count > 0 ? count : 0;
    }
  }

  if (Array.isArray(rawEntry.events)) {
    entry.events = rawEntry.events
      .map((event, index) => normalizePageEvent(event, pageNumber, index))
      .filter(Boolean)
      .slice(0, MAX_PAGE_EVENTS);
  }

  return hasPageEntryContent(entry) ? entry : null;
}

function hasPageEntryContent(entry) {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  if (ERROR_LEVEL_KEYS.some((key) => Number(entry.errors?.[key] || 0) > 0)) {
    return true;
  }

  return Array.isArray(entry.events) && entry.events.length > 0;
}

function ensurePageEntry(state, pageNumber) {
  const key = String(pageNumber);
  const existing = normalizePageEntry(state.pageErrors[key], pageNumber);
  if (existing) {
    state.pageErrors[key] = existing;
    return existing;
  }

  const created = createEmptyPageEntry();
  state.pageErrors[key] = created;
  return created;
}

function prunePageEntry(state, pageNumber) {
  const key = String(pageNumber);
  const entry = normalizePageEntry(state.pageErrors[key], pageNumber);
  if (!entry) {
    delete state.pageErrors[key];
    return;
  }

  if (hasPageEntryContent(entry)) {
    state.pageErrors[key] = entry;
    return;
  }

  delete state.pageErrors[key];
}

function normalizePageList(rawPages, settings = DEFAULT_SETTINGS) {
  const totalPages = Math.ceil(settings.totalHalfPages / 2);
  const values = Array.isArray(rawPages) ? rawPages : [rawPages];
  const pages = values
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value));

  if (!pages.length) {
    throw new Error(translate(settings, "noValidPages"));
  }

  const uniquePages = [...new Set(pages)].sort((left, right) => left - right);
  for (const pageNumber of uniquePages) {
    if (pageNumber < 1 || pageNumber > totalPages) {
      throw new Error(translate(settings, "invalidPageNumber"));
    }
  }

  return uniquePages;
}

function markDayCompletion(state, plan = buildTodayPlan(state)) {
  if (!plan?.dayClosed) {
    return;
  }

  state.activityHistory = recordDayCompletion(state.activityHistory, {
    completedAt: new Date().toISOString(),
    skippedNew: Boolean(plan.skippedMemorizationDay),
    programDayIndex: state.progress.programDayIndex,
    phaseIndex: state.progress.phaseIndex,
  });
}

function toggleBlock(blockKey) {
  return updateState((state) => {
    if (!Object.prototype.hasOwnProperty.call(state.dailyStatus.blocks, blockKey)) {
      throw new Error(translate(state.settings, "invalidBlock"));
    }

    const plan = buildTodayPlan(state);
    const order = plan.order || ["old", "consolidation", "recent", "yesterday", "new"];
    const block = plan.blocks[blockKey];

    if (!block || !block.present) {
      throw new Error(translate(state.settings, "blockUnavailable"));
    }

    const isMarkingDone = !state.dailyStatus.blocks[blockKey];
    if (isMarkingDone) {
      if (block.blockedByLabels && block.blockedByLabels.length) {
        throw new Error(translate(state.settings, "validateFirst", { items: block.blockedByLabels.join(", ") }));
      }
      state.dailyStatus.blocks[blockKey] = true;
      markDayCompletion(state);
      return state;
    }

    state.dailyStatus.blocks[blockKey] = false;

    const blockIndex = order.indexOf(blockKey);
    for (const laterKey of order.slice(blockIndex + 1)) {
      if (Object.prototype.hasOwnProperty.call(state.dailyStatus.blocks, laterKey)) {
        state.dailyStatus.blocks[laterKey] = false;
      }
    }

    state.dailyStatus.waves = state.dailyStatus.waves.map((wave) => wave.map(() => false));
    return state;
  });
}

function toggleWaveSlot(waveIndex, slotIndex) {
  return updateState((state) => {
    if (!state.dailyStatus.waves[waveIndex] || typeof state.dailyStatus.waves[waveIndex][slotIndex] !== "boolean") {
      throw new Error(translate(state.settings, "invalidWave"));
    }

    const isMarkingDone = !state.dailyStatus.waves[waveIndex][slotIndex];
    if (isMarkingDone) {
      const plan = buildTodayPlan(state);
      const newBlock = plan.blocks.new;
      if (!newBlock.present) {
        throw new Error(translate(state.settings, "newUnavailable"));
      }
      if (newBlock.blockedByLabels && newBlock.blockedByLabels.length) {
        throw new Error(translate(state.settings, "validateFirst", { items: newBlock.blockedByLabels.join(", ") }));
      }
    }

    state.dailyStatus.skipNew = false;
    state.dailyStatus.waves[waveIndex][slotIndex] = !state.dailyStatus.waves[waveIndex][slotIndex];
    markDayCompletion(state);
    return state;
  });
}

function resetToday() {
  return updateState((state) => {
    state.dailyStatus = createEmptyDailyStatus(getDaySignature(state.settings, state.progress));
    return state;
  });
}

function advanceDay() {
  return updateState((state) => {
    const plan = buildTodayPlan(state);
    if (!plan.canAdvanceDay) {
      throw new Error(translate(state.settings, "dayNotComplete"));
    }

    markDayCompletion(state, plan);
    state.progress.currentHalfPage = plan.nextProgress.currentHalfPage;
    state.progress.programDayIndex = plan.nextProgress.programDayIndex;
    state.progress.phaseIndex = plan.nextProgress.phaseIndex;
    state.progress.phaseProgressHalfPages = Array.isArray(plan.nextProgress.phaseProgressHalfPages)
      ? [...plan.nextProgress.phaseProgressHalfPages]
      : [];
    state.dailyStatus = createEmptyDailyStatus(getDaySignature(state.settings, state.progress));
    return state;
  });
}

function skipMemorizationDay() {
  return updateState((state) => {
    const plan = buildTodayPlan(state);
    if (!plan.canSkipMemorizationDay) {
      throw new Error(translate(state.settings, "skipMemorizationUnavailable"));
    }

    state.dailyStatus.skipNew = true;
    markDayCompletion(state);
    return state;
  });
}

function setPageError(pages, severityOrOptions, note = "") {
  return updateState((state) => {
    const options =
      severityOrOptions && typeof severityOrOptions === "object"
        ? {
            severity: typeof severityOrOptions.severity === "string" ? severityOrOptions.severity : "",
            scope: typeof severityOrOptions.scope === "string" ? severityOrOptions.scope : "",
            rect: severityOrOptions.rect,
            anchor: severityOrOptions.anchor,
            note: severityOrOptions.note,
          }
        : {
            severity: String(severityOrOptions || ""),
            scope: "",
            rect: null,
            anchor: null,
            note,
          };

    const scope = ERROR_SCOPE_KEYS.includes(options.scope) ? options.scope : "";
    const severity = PAGE_ERROR_LEVELS.has(options.severity)
      ? options.severity
      : scope
        ? ERROR_SCOPE_TO_SEVERITY[scope]
        : "";

    if (scope && !severity) {
      throw new Error(translate(state.settings, "invalidErrorScope"));
    }

    if (!severity) {
      throw new Error(translate(state.settings, "invalidErrorType"));
    }

    const requiresSelection = scope !== "next-page-link";
    const rect =
      requiresSelection && options.rect !== null && typeof options.rect !== "undefined" ? normalizeSelectionRect(options.rect) : null;
    const anchor =
      requiresSelection && options.anchor !== null && typeof options.anchor !== "undefined" ? normalizeSelectionAnchor(options.anchor, scope) : null;
    if ((scope || options.rect) && requiresSelection && !rect) {
      throw new Error(translate(state.settings, "invalidSelectionRect"));
    }

    const normalizedNote = normalizePageNote(typeof options.note === "string" ? options.note : note);
    for (const pageNumber of normalizePageList(pages, state.settings)) {
      const entry = ensurePageEntry(state, pageNumber);
      if (scope === "next-page-link" && Array.isArray(entry.events) && entry.events.some((event) => event.scope === "next-page-link")) {
        throw new Error(translate(state.settings, "nextPageLinkAlreadyExists"));
      }
      const createdAt = new Date().toISOString();
      entry.errors[severity] += 1;
      entry.events = [
        {
          id: generateRandomId(),
          severity,
          scope: scope || severityToScope(severity),
          rect,
          anchor,
          note: normalizedNote,
          createdAt,
          review: createInitialReviewState(createdAt),
        },
        ...(Array.isArray(entry.events) ? entry.events : []),
      ].slice(0, MAX_PAGE_EVENTS);
    }
    return state;
  });
}

function answerErrorReview(itemId, result) {
  return updateState((state) => {
    const safeItemId = String(itemId || "").trim();
    const normalizedResult = result === "success" || result === "failure" ? result : "";

    if (!safeItemId) {
      throw new Error(translate(state.settings, "invalidReviewItem"));
    }
    if (!normalizedResult) {
      throw new Error(translate(state.settings, "invalidReviewResult"));
    }

    let found = false;

    for (const [pageKey, rawEntry] of Object.entries(state.pageErrors)) {
      const pageNumber = Number.parseInt(pageKey, 10);
      const entry = normalizePageEntry(rawEntry, pageNumber);
      const nextEvents = entry.events.map((event) => {
        if (event.id !== safeItemId) {
          return event;
        }

        found = true;
        return {
          ...event,
          review: buildNextReviewState(event.review, normalizedResult === "success", event.createdAt),
        };
      });

      if (found) {
        state.pageErrors[pageKey] = {
          ...entry,
          events: nextEvents,
        };
        break;
      }
    }

    if (!found) {
      throw new Error(translate(state.settings, "invalidReviewItem"));
    }

    return state;
  });
}

function clearPageError(pages) {
  return updateState((state) => {
    for (const pageNumber of normalizePageList(pages, state.settings)) {
      const entry = ensurePageEntry(state, pageNumber);
      for (const key of ERROR_LEVEL_KEYS) {
        entry.errors[key] = 0;
      }
      entry.events = [];
      prunePageEntry(state, pageNumber);
    }
    return state;
  });
}

function removePageErrorItem(pages, itemId) {
  return updateState((state) => {
    const safeItemId = String(itemId || "").trim();
    if (!safeItemId) {
      throw new Error(translate(state.settings, "invalidErrorItem"));
    }

    let removed = false;

    for (const pageNumber of normalizePageList(pages, state.settings)) {
      const key = String(pageNumber);
      const entry = normalizePageEntry(state.pageErrors[key], pageNumber);
      if (!entry) {
        continue;
      }

      const eventToRemove = entry.events.find((event) => event.id === safeItemId);
      if (!eventToRemove) {
        continue;
      }

      entry.events = entry.events.filter((event) => event.id !== safeItemId);
      if (PAGE_ERROR_LEVELS.has(eventToRemove.severity)) {
        entry.errors[eventToRemove.severity] = Math.max(0, Number(entry.errors[eventToRemove.severity] || 0) - 1);
      }

      state.pageErrors[key] = entry;
      prunePageEntry(state, pageNumber);
      removed = true;
      break;
    }

    if (!removed) {
      throw new Error(translate(state.settings, "invalidErrorItem"));
    }

    return state;
  });
}

function setPageLearned(pages, learned) {
  return updateState((state) => {
    for (const pageNumber of normalizePageList(pages, state.settings)) {
      const entry = ensurePageEntry(state, pageNumber);
      entry.learned = Boolean(learned);
      prunePageEntry(state, pageNumber);
    }
    return state;
  });
}

module.exports = {
  answerErrorReview,
  advanceDay,
  clearPageError,
  createMemoryStateRepository,
  getState,
  getStateRepository,
  removePageErrorItem,
  resetStateRepository,
  resetToday,
  saveConfig,
  setPageError,
  setPageLearned,
  setStateRepository,
  skipMemorizationDay,
  toggleBlock,
  toggleWaveSlot,
};
