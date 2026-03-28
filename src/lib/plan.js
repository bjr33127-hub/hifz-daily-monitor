const DEFAULT_SETTINGS = {
  dailyNewHalfPages: 1,
  totalHalfPages: 1200,
  firstName: "",
  language: "fr",
};

const OLD_WINDOW_TARGET = 7;

const DEFAULT_PROGRESS = {
  currentHalfPage: 1,
  programDayIndex: 1,
};

const PLAN_TEXT = {
  fr: {
    halfPageSingular: "demi-page",
    halfPagePlural: "demi-pages",
    pageSingular: "page",
    pagePlural: "pages",
    upperHalf: "haute",
    lowerHalf: "basse",
    pageLabel: "Page {{page}}",
    halfPageLabel: "Page {{page}} moitie {{half}}",
    pageRangeLabel: "Page {{start}} -> Page {{end}}",
    partLabel: "Partie {{number}}",
    waveLabel: "Vague {{number}}",
    validationLabel: "Validation {{number}}",
    titleOld: "Ancien",
    titleConsolidation: "Consolidation",
    titleRecent: "Recent",
    titleYesterday: "Veille",
    titleNew: "Nouveau",
    oldHelper: "Rotation automatique en 7 parties equilibrees sur tout l'ancien situe avant J-30.",
    oldEmpty: "Pas encore d'ancien disponible.",
    consolidationHelper:
      "Revision de la partie des 30 derniers jours : la consolidation couvre J-8 a J-30, avec une seule partie active a valider aujourd'hui.",
    consolidationEmpty: "Pas encore de partie de revision sur les 30 derniers jours (J-8 a J-30).",
    recentHelper: "Bloc continu J-1 a J-7.",
    recentEmpty: "Pas encore de recent disponible.",
    yesterdayHelper: "Bloc de nouveau d'hier uniquement.",
    yesterdayEmpty: "Pas encore de veille disponible.",
    newHelper: "3 vagues, 3 validations par vague.",
    newEmpty: "Plus de nouveau a attribuer.",
    newFinished: "Nouveau termine",
    activePartLabel: "1 partie active",
    balancedPartsLabel: "Parties equilibrees",
  },
  en: {
    halfPageSingular: "half-page",
    halfPagePlural: "half-pages",
    pageSingular: "page",
    pagePlural: "pages",
    upperHalf: "upper",
    lowerHalf: "lower",
    pageLabel: "Page {{page}}",
    halfPageLabel: "Page {{page}} {{half}} half",
    pageRangeLabel: "Page {{start}} -> Page {{end}}",
    partLabel: "Part {{number}}",
    waveLabel: "Wave {{number}}",
    validationLabel: "Check {{number}}",
    titleOld: "Old",
    titleConsolidation: "Consolidation",
    titleRecent: "Recent",
    titleYesterday: "Yesterday",
    titleNew: "New",
    oldHelper: "Automatic rotation across 7 balanced parts over everything before J-30.",
    oldEmpty: "No old section is available yet.",
    consolidationHelper:
      "Review part of the last 30 days: consolidation covers J-8 to J-30, with one active part to validate today.",
    consolidationEmpty: "No review part is available yet for the last 30 days (J-8 to J-30).",
    recentHelper: "Continuous block from J-1 to J-7.",
    recentEmpty: "No recent block is available yet.",
    yesterdayHelper: "Yesterday's new block only.",
    yesterdayEmpty: "No yesterday block is available yet.",
    newHelper: "3 waves, 3 checks per wave.",
    newEmpty: "No new block remains to assign.",
    newFinished: "New work completed",
    activePartLabel: "1 active part",
    balancedPartsLabel: "Balanced parts",
  },
};

function clampInteger(value, min, max, fallback) {
  const normalized = Number.parseInt(value, 10);
  if (Number.isNaN(normalized)) {
    return fallback;
  }
  return Math.min(Math.max(normalized, min), max);
}

function normalizeLanguage(value) {
  return value === "en" ? "en" : "fr";
}

function interpolate(template, variables = {}) {
  return String(template).replace(/\{\{(\w+)\}\}/g, (_match, key) => String(variables[key] ?? ""));
}

function getPlanText(language, key, variables = {}) {
  const locale = normalizeLanguage(language);
  const dictionary = PLAN_TEXT[locale] || PLAN_TEXT.fr;
  const fallback = PLAN_TEXT.fr[key] || key;
  return interpolate(dictionary[key] || fallback, variables);
}

function formatHalfPageCount(value, language = "fr") {
  const normalized = Number(value || 0);
  const unit =
    normalized === 1 ? getPlanText(language, "halfPageSingular") : getPlanText(language, "halfPagePlural");
  return `${normalized} ${unit}`;
}

function formatPageCountFromHalfPages(halfPageCount, language = "fr") {
  const normalized = Number(halfPageCount || 0) / 2;
  const formatted = Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(1);
  const numeric = Number(formatted);
  const unit =
    numeric === 1 || numeric === 0.5 ? getPlanText(language, "pageSingular") : getPlanText(language, "pagePlural");
  return `${formatted} ${unit}`;
}

function formatWholePageCount(pageCount, language = "fr") {
  const normalized = Number(pageCount || 0);
  const unit =
    normalized === 1 ? getPlanText(language, "pageSingular") : getPlanText(language, "pagePlural");
  return `${normalized} ${unit}`;
}

function computeOldWindowCount() {
  return OLD_WINDOW_TARGET;
}

function normalizeShortText(value, fallback = "", maxLength = 40) {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
  return normalized || fallback;
}

function normalizeSettings(input = {}) {
  return {
    dailyNewHalfPages: clampInteger(input.dailyNewHalfPages, 1, 20, DEFAULT_SETTINGS.dailyNewHalfPages),
    totalHalfPages: clampInteger(input.totalHalfPages, 2, 4000, DEFAULT_SETTINGS.totalHalfPages),
    firstName: normalizeShortText(input.firstName, DEFAULT_SETTINGS.firstName),
    language: normalizeLanguage(input.language || DEFAULT_SETTINGS.language),
  };
}

function normalizeProgress(input = {}, settings = DEFAULT_SETTINGS) {
  return {
    currentHalfPage: clampInteger(input.currentHalfPage, 1, settings.totalHalfPages + 1, DEFAULT_PROGRESS.currentHalfPage),
    programDayIndex: clampInteger(input.programDayIndex, 1, 50000, DEFAULT_PROGRESS.programDayIndex),
  };
}

function createEmptyDailyStatus(signature = "") {
  return {
    signature,
    blocks: {
      old: false,
      consolidation: false,
      recent: false,
      yesterday: false,
    },
    waves: [
      [false, false, false],
      [false, false, false],
      [false, false, false],
    ],
  };
}

function normalizeDailyStatus(input = {}, signature = "") {
  const fallback = createEmptyDailyStatus(signature);
  const blocks = input.blocks || {};
  const rawWaves = Array.isArray(input.waves) ? input.waves : fallback.waves;

  return {
    signature: String(input.signature || signature),
    blocks: {
      old: Boolean(blocks.old),
      consolidation: Boolean(blocks.consolidation),
      recent: Boolean(blocks.recent),
      yesterday: Boolean(blocks.yesterday),
    },
    waves: [0, 1, 2].map((waveIndex) => {
      const rawSlots = Array.isArray(rawWaves[waveIndex]) ? rawWaves[waveIndex] : fallback.waves[waveIndex];
      return [0, 1, 2].map((slotIndex) => Boolean(rawSlots[slotIndex]));
    }),
  };
}

function getDaySignature(settings, progress) {
  return [
    settings.dailyNewHalfPages,
    settings.totalHalfPages,
    progress.currentHalfPage,
    progress.programDayIndex,
  ].join(":");
}

function halfPageToParts(index) {
  return {
    index,
    page: Math.ceil(index / 2),
    half: index % 2 === 1 ? "haute" : "basse",
  };
}

function formatHalfPage(index, language = "fr") {
  const parts = halfPageToParts(index);
  return getPlanText(language, "halfPageLabel", {
    page: parts.page,
    half: getPlanText(language, parts.half === "haute" ? "upperHalf" : "lowerHalf"),
  });
}

function formatRangeLabel(safeStart, safeEnd, language = "fr") {
  const startParts = halfPageToParts(safeStart);
  const endParts = halfPageToParts(safeEnd);
  const startsOnPageBoundary = safeStart % 2 === 1;
  const endsOnPageBoundary = safeEnd % 2 === 0;

  if (startsOnPageBoundary && endsOnPageBoundary) {
    if (startParts.page === endParts.page) {
      return getPlanText(language, "pageLabel", { page: startParts.page });
    }
    return getPlanText(language, "pageRangeLabel", { start: startParts.page, end: endParts.page });
  }

  const startLabel = formatHalfPage(safeStart, language);
  const endLabel = formatHalfPage(safeEnd, language);
  return safeStart === safeEnd ? startLabel : `${startLabel} -> ${endLabel}`;
}

function createRange(start, end, totalHalfPages, language = "fr") {
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null;
  }

  if (end < 1 || start > totalHalfPages || start > end) {
    return null;
  }

  const safeStart = Math.max(1, Math.min(start, totalHalfPages));
  const safeEnd = Math.max(1, Math.min(end, totalHalfPages));
  if (safeStart > safeEnd) {
    return null;
  }

  const startLabel = formatHalfPage(safeStart, language);
  const endLabel = formatHalfPage(safeEnd, language);
  const pageCount = (safeEnd - safeStart + 1) / 2;
  return {
    start: safeStart,
    end: safeEnd,
    count: safeEnd - safeStart + 1,
    pageCount,
    startLabel,
    endLabel,
    label: formatRangeLabel(safeStart, safeEnd, language),
    countLabel: formatPageCountFromHalfPages(safeEnd - safeStart + 1, language),
  };
}

function createPageWindowRange(startPage, endPage, poolRange, totalHalfPages, language = "fr") {
  if (!poolRange || !Number.isFinite(startPage) || !Number.isFinite(endPage) || startPage > endPage) {
    return null;
  }

  const poolPageStart = Math.ceil(poolRange.start / 2);
  const poolPageEnd = Math.ceil(poolRange.end / 2);
  const safeStartPage = Math.max(poolPageStart, startPage);
  const safeEndPage = Math.min(poolPageEnd, endPage);

  if (safeStartPage > safeEndPage) {
    return null;
  }

  const startHalfPage = safeStartPage === poolPageStart ? poolRange.start : (safeStartPage - 1) * 2 + 1;
  const endHalfPage = safeEndPage === poolPageEnd ? poolRange.end : safeEndPage * 2;
  const baseRange = createRange(startHalfPage, endHalfPage, totalHalfPages, language);

  if (!baseRange) {
    return null;
  }

  const pageCount = safeEndPage - safeStartPage + 1;
  return {
    ...baseRange,
    pageStart: safeStartPage,
    pageEnd: safeEndPage,
    pageCount,
    label:
      safeStartPage === safeEndPage
        ? getPlanText(language, "pageLabel", { page: safeStartPage })
        : getPlanText(language, "pageRangeLabel", { start: safeStartPage, end: safeEndPage }),
    countLabel: formatWholePageCount(pageCount, language),
  };
}

function splitConsolidationBands(range, programDayIndex, totalHalfPages, language = "fr") {
  const emptyResult = {
    fullRange: null,
    count: 0,
    activeBand: null,
    activeRange: null,
    bands: {
      A: null,
      B: null,
      C: null,
    },
  };

  if (!range) {
    return emptyResult;
  }

  const count = range.count;
  const base = Math.floor(count / 3);
  const remainder = count % 3;
  const lengths = [
    base + (remainder > 0 ? 1 : 0),
    base + (remainder > 1 ? 1 : 0),
    base,
  ];
  const bandKeys = ["A", "B", "C"];
  const bands = {};
  let cursor = range.start;

  for (let index = 0; index < bandKeys.length; index += 1) {
    const bandLength = lengths[index];
    bands[bandKeys[index]] =
      bandLength > 0 ? createRange(cursor, cursor + bandLength - 1, totalHalfPages, language) : null;
    cursor += bandLength;
  }

  const activeBand = bandKeys[(programDayIndex - 1) % 3];
  return {
    fullRange: range,
    count,
    activeBand,
    activeRange: bands[activeBand],
    bands,
  };
}

function buildOldBlock(oldPoolRange, programDayIndex, totalHalfPages, language = "fr") {
  if (!oldPoolRange) {
    return {
      poolRange: oldPoolRange,
      range: null,
      nextRange: null,
      windows: [],
      windowCount: 0,
      currentWindowNumber: 0,
      nextWindowNumber: 0,
    };
  }

  const poolPageStart = Math.ceil(oldPoolRange.start / 2);
  const poolPageEnd = Math.ceil(oldPoolRange.end / 2);
  const poolPageCount = poolPageEnd - poolPageStart + 1;
  const windowCount = Math.max(1, Math.min(computeOldWindowCount(), poolPageCount));
  const baseSize = Math.floor(poolPageCount / windowCount);
  const remainder = poolPageCount % windowCount;
  const lengths = Array.from({ length: windowCount }, (_unused, index) => baseSize + (index < remainder ? 1 : 0));
  const windowIndex = (programDayIndex - 1) % windowCount;
  const currentWindowNumber = windowIndex + 1;
  const nextWindowNumber = currentWindowNumber === windowCount ? 1 : currentWindowNumber + 1;
  let pageCursor = poolPageStart;
  const windows = lengths.map((length, index) => {
    const windowStartPage = pageCursor;
    const windowEndPage = pageCursor + length - 1;
    const windowRange = createPageWindowRange(windowStartPage, windowEndPage, oldPoolRange, totalHalfPages, language);
    pageCursor += length;
    return {
      number: index + 1,
      label: getPlanText(language, "partLabel", { number: index + 1 }),
      active: index === windowIndex,
      range: windowRange,
    };
  });
  const range = windows[windowIndex]?.range || null;
  const nextBlock = windows[nextWindowNumber - 1]?.range || null;

  const displayPoolRange = createPageWindowRange(poolPageStart, poolPageEnd, oldPoolRange, totalHalfPages, language);

  return {
    poolRange: displayPoolRange,
    range,
    nextRange: nextBlock,
    windows,
    windowCount,
    currentWindowNumber,
    nextWindowNumber,
    currentWindowLabel: `${getPlanText(language, "partLabel", { number: currentWindowNumber })} / ${windowCount}`,
    nextWindowLabel: `${getPlanText(language, "partLabel", { number: nextWindowNumber })} / ${windowCount}`,
    windowSizeLabel: getPlanText(language, "balancedPartsLabel"),
    startsAt: range ? range.start : null,
    nextStart: nextBlock ? nextBlock.start : null,
  };
}

function buildWaves(dailyStatus, language = "fr") {
  const waves = dailyStatus.waves.map((slots, waveIndex) => ({
    id: waveIndex + 1,
    label: getPlanText(language, "waveLabel", { number: waveIndex + 1 }),
    slots: slots.map((checked, slotIndex) => ({
      index: slotIndex,
      checked,
      label: getPlanText(language, "validationLabel", { number: slotIndex + 1 }),
    })),
    complete: slots.every(Boolean),
  }));

  return {
    items: waves,
    checkedCount: waves.flatMap((wave) => wave.slots).filter((slot) => slot.checked).length,
    isComplete: waves.every((wave) => wave.complete),
  };
}

function buildTodayPlan({ settings, progress, dailyStatus }) {
  const language = normalizeLanguage(settings.language);
  const q = settings.dailyNewHalfPages;
  const h = progress.currentHalfPage;
  const totalHalfPages = settings.totalHalfPages;

  const newRange = createRange(h, h + q - 1, totalHalfPages, language);
  const yesterdayRange = createRange(h - q, h - 1, totalHalfPages, language);
  const recentRange = createRange(h - 7 * q, h - 1, totalHalfPages, language);
  const consolidationRange = createRange(h - 30 * q, h - 8 * q + (q - 1), totalHalfPages, language);
  const oldPoolRange = consolidationRange ? createRange(1, consolidationRange.start - 1, totalHalfPages, language) : null;
  const oldBlock = buildOldBlock(oldPoolRange, progress.programDayIndex, totalHalfPages, language);
  const consolidation = splitConsolidationBands(consolidationRange, progress.programDayIndex, totalHalfPages, language);
  const waves = buildWaves(dailyStatus, language);

  const blocks = {
    old: {
      key: "old",
      title: getPlanText(language, "titleOld"),
      order: 1,
      present: Boolean(oldBlock.range),
      done: oldBlock.range ? Boolean(dailyStatus.blocks.old) : true,
      range: oldBlock.range,
      poolRange: oldBlock.poolRange,
      windows: oldBlock.windows,
      windowCount: oldBlock.windowCount,
      currentWindowNumber: oldBlock.currentWindowNumber,
      nextWindowNumber: oldBlock.nextWindowNumber,
      currentWindowLabel: oldBlock.currentWindowLabel,
      nextWindowLabel: oldBlock.nextWindowLabel,
      windowSizeLabel: oldBlock.windowSizeLabel,
      startsAt: oldBlock.startsAt,
      nextStart: oldBlock.nextStart,
      nextRange: oldBlock.nextRange,
      helper: oldBlock.range ? getPlanText(language, "oldHelper") : getPlanText(language, "oldEmpty"),
    },
    consolidation: {
      key: "consolidation",
      title: getPlanText(language, "titleConsolidation"),
      order: 2,
      present: Boolean(consolidation.fullRange && consolidation.activeRange),
      done: consolidation.fullRange && consolidation.activeRange ? Boolean(dailyStatus.blocks.consolidation) : true,
      fullRange: consolidation.fullRange,
      activeBand: consolidation.activeBand,
      activeRange: consolidation.activeRange,
      bands: consolidation.bands,
      helper: consolidation.fullRange
        ? getPlanText(language, "consolidationHelper")
        : getPlanText(language, "consolidationEmpty"),
    },
    recent: {
      key: "recent",
      title: getPlanText(language, "titleRecent"),
      order: 3,
      present: Boolean(recentRange),
      done: recentRange ? Boolean(dailyStatus.blocks.recent) : true,
      range: recentRange,
      helper: recentRange ? getPlanText(language, "recentHelper") : getPlanText(language, "recentEmpty"),
    },
    yesterday: {
      key: "yesterday",
      title: getPlanText(language, "titleYesterday"),
      order: 4,
      present: Boolean(yesterdayRange),
      done: yesterdayRange ? Boolean(dailyStatus.blocks.yesterday) : true,
      range: yesterdayRange,
      helper: yesterdayRange ? getPlanText(language, "yesterdayHelper") : getPlanText(language, "yesterdayEmpty"),
    },
    new: {
      key: "new",
      title: getPlanText(language, "titleNew"),
      order: 5,
      present: Boolean(newRange),
      done: newRange ? waves.isComplete : true,
      range: newRange,
      waves: waves.items,
      checkedCount: waves.checkedCount,
      helper: newRange ? getPlanText(language, "newHelper") : getPlanText(language, "newEmpty"),
    },
  };

  const order = ["old", "consolidation", "recent", "yesterday", "new"];

  for (const [index, blockKey] of order.entries()) {
    const previousKeys = order.slice(0, index).filter((key) => blocks[key].present);
    const blockedByKeys = previousKeys.filter((key) => !blocks[key].done);
    blocks[blockKey].blockedByKeys = blockedByKeys;
    blocks[blockKey].blockedByLabels = blockedByKeys.map((key) => blocks[key].title);
    blocks[blockKey].locked = blocks[blockKey].present && blockedByKeys.length > 0;
  }

  const canAdvanceDay =
    blocks.old.done &&
    blocks.consolidation.done &&
    blocks.recent.done &&
    blocks.yesterday.done &&
    blocks.new.done;

  return {
    signature: getDaySignature(settings, progress),
    summary: {
      currentHalfPage: progress.currentHalfPage,
      currentHalfPageLabel:
        progress.currentHalfPage <= totalHalfPages
          ? formatHalfPage(progress.currentHalfPage, language)
          : getPlanText(language, "newFinished"),
      dailyNewHalfPages: settings.dailyNewHalfPages,
      dailyNewLabel: formatPageCountFromHalfPages(settings.dailyNewHalfPages, language),
      oldWindowCount: computeOldWindowCount(),
      oldDailyLabel: getPlanText(language, "activePartLabel"),
      programDayIndex: progress.programDayIndex,
      totalHalfPages,
      totalPages: totalHalfPages / 2,
    },
    blocks,
    order,
    canAdvanceDay,
    nextProgress: {
      currentHalfPage: Math.min(progress.currentHalfPage + settings.dailyNewHalfPages, totalHalfPages + 1),
      programDayIndex: progress.programDayIndex + 1,
    },
  };
}

module.exports = {
  DEFAULT_PROGRESS,
  DEFAULT_SETTINGS,
  buildTodayPlan,
  createEmptyDailyStatus,
  formatHalfPage,
  formatHalfPageCount,
  formatPageCountFromHalfPages,
  formatWholePageCount,
  computeOldWindowCount,
  getDaySignature,
  normalizeDailyStatus,
  normalizeProgress,
  normalizeSettings,
};
