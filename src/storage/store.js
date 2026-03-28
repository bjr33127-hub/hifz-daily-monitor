const fs = require("node:fs");
const path = require("node:path");
const {
  DEFAULT_PROGRESS,
  DEFAULT_SETTINGS,
  buildTodayPlan,
  createEmptyDailyStatus,
  getDaySignature,
  normalizeDailyStatus,
  normalizeProgress,
  normalizeSettings,
} = require("../lib/plan");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const STATE_FILE = path.join(DATA_DIR, "state.json");
const PAGE_ERROR_LEVELS = new Set(["minor", "medium", "grave"]);
const ERROR_LEVEL_KEYS = ["minor", "medium", "grave"];
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
    invalidErrorType: "Type d'erreur invalide.",
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
    invalidErrorType: "Invalid error type.",
  },
};

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getLanguage(settings = DEFAULT_SETTINGS) {
  return settings?.language === "en" ? "en" : "fr";
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
    pageErrors: {},
  };
}

function writeRawState(state) {
  ensureDataDir();
  fs.writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function readRawState() {
  ensureDataDir();
  if (!fs.existsSync(STATE_FILE)) {
    const initial = createDefaultState();
    writeRawState(initial);
    return initial;
  }

  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch (_error) {
    const fallback = createDefaultState();
    writeRawState(fallback);
    return fallback;
  }
}

function normalizeState(rawState = {}) {
  const settings = normalizeSettings(rawState.settings || DEFAULT_SETTINGS);
  const progress = normalizeProgress(rawState.progress || DEFAULT_PROGRESS, settings);
  const signature = getDaySignature(settings, progress);
  const dailyStatus = normalizeDailyStatus(rawState.dailyStatus || {}, signature);
  const pageErrors = normalizePageErrors(rawState.pageErrors || {}, settings);

  if (dailyStatus.signature !== signature) {
    return {
      settings,
      progress,
      dailyStatus: createEmptyDailyStatus(signature),
      pageErrors,
    };
  }

  return {
    settings,
    progress,
    dailyStatus,
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
  return {
    settings: state.settings,
    progress: state.progress,
    dailyStatus: state.dailyStatus,
    pageErrors: state.pageErrors,
    errorTracking,
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
  const signature = getDaySignature(settings, progress);
  const state = {
    settings,
    progress,
    dailyStatus:
      signature === current.dailyStatus.signature
        ? normalizeDailyStatus(current.dailyStatus || {}, signature)
        : createEmptyDailyStatus(signature),
    pageErrors: normalizePageErrors(current.pageErrors, settings),
  };
  writeRawState(state);
  return buildResponse(state);
}

function updateState(mutator) {
  const current = readState();
  const next = mutator({
    settings: { ...current.settings },
    progress: { ...current.progress },
    dailyStatus: {
      signature: current.dailyStatus.signature,
      blocks: { ...current.dailyStatus.blocks },
      waves: current.dailyStatus.waves.map((wave) => [...wave]),
    },
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

    const entry = normalizePageEntry(rawSeverity);
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

function createEmptyPageEntry() {
  return {
    learned: false,
    errors: {
      minor: 0,
      medium: 0,
      grave: 0,
    },
  };
}

function normalizePageEntry(rawEntry) {
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

  entry.learned = Boolean(rawEntry.learned);

  if (typeof rawEntry.severity === "string" && PAGE_ERROR_LEVELS.has(rawEntry.severity)) {
    entry.errors[rawEntry.severity] = Math.max(1, Number.parseInt(rawEntry.count, 10) || 1);
  }

  if (rawEntry.errors && typeof rawEntry.errors === "object") {
    for (const key of ERROR_LEVEL_KEYS) {
      const count = Number.parseInt(rawEntry.errors[key], 10);
      entry.errors[key] = Number.isInteger(count) && count > 0 ? count : 0;
    }
  }

  return hasPageEntryContent(entry) ? entry : null;
}

function hasPageEntryContent(entry) {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  if (entry.learned) {
    return true;
  }

  return ERROR_LEVEL_KEYS.some((key) => Number(entry.errors?.[key] || 0) > 0);
}

function ensurePageEntry(state, pageNumber) {
  const key = String(pageNumber);
  const existing = normalizePageEntry(state.pageErrors[key]);
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
  const entry = normalizePageEntry(state.pageErrors[key]);
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

    state.dailyStatus.waves[waveIndex][slotIndex] = !state.dailyStatus.waves[waveIndex][slotIndex];
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

    state.progress.currentHalfPage = plan.nextProgress.currentHalfPage;
    state.progress.programDayIndex = plan.nextProgress.programDayIndex;
    state.dailyStatus = createEmptyDailyStatus(getDaySignature(state.settings, state.progress));
    return state;
  });
}

function setPageError(pages, severity) {
  return updateState((state) => {
    if (!PAGE_ERROR_LEVELS.has(severity)) {
      throw new Error(translate(state.settings, "invalidErrorType"));
    }

    for (const pageNumber of normalizePageList(pages, state.settings)) {
      const entry = ensurePageEntry(state, pageNumber);
      entry.errors[severity] += 1;
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
      prunePageEntry(state, pageNumber);
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
  advanceDay,
  clearPageError,
  getState,
  resetToday,
  saveConfig,
  setPageError,
  setPageLearned,
  toggleBlock,
  toggleWaveSlot,
};
