const DEFAULT_SETTINGS = {
  dailyNewHalfPages: 1,
  totalHalfPages: 1200,
  firstName: "",
};

const OLD_WINDOW_TARGET = 7;

const DEFAULT_PROGRESS = {
  currentHalfPage: 1,
  programDayIndex: 1,
};

function clampInteger(value, min, max, fallback) {
  const normalized = Number.parseInt(value, 10);
  if (Number.isNaN(normalized)) {
    return fallback;
  }
  return Math.min(Math.max(normalized, min), max);
}

function formatHalfPageCount(value) {
  const normalized = Number(value || 0);
  return `${normalized} demi-page${normalized === 1 ? "" : "s"}`;
}

function formatPageCountFromHalfPages(halfPageCount) {
  const normalized = Number(halfPageCount || 0) / 2;
  const formatted = Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(1);
  const numeric = Number(formatted);
  return `${formatted} page${numeric === 1 || numeric === 0.5 ? "" : "s"}`;
}

function formatWholePageCount(pageCount) {
  const normalized = Number(pageCount || 0);
  return `${normalized} page${normalized === 1 ? "" : "s"}`;
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

function formatHalfPage(index) {
  const parts = halfPageToParts(index);
  return `Page ${parts.page} moitie ${parts.half}`;
}

function formatRangeLabel(safeStart, safeEnd) {
  const startParts = halfPageToParts(safeStart);
  const endParts = halfPageToParts(safeEnd);
  const startsOnPageBoundary = safeStart % 2 === 1;
  const endsOnPageBoundary = safeEnd % 2 === 0;

  if (startsOnPageBoundary && endsOnPageBoundary) {
    if (startParts.page === endParts.page) {
      return `Page ${startParts.page}`;
    }
    return `Page ${startParts.page} -> Page ${endParts.page}`;
  }

  const startLabel = formatHalfPage(safeStart);
  const endLabel = formatHalfPage(safeEnd);
  return safeStart === safeEnd ? startLabel : `${startLabel} -> ${endLabel}`;
}

function createRange(start, end, totalHalfPages) {
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

  const startLabel = formatHalfPage(safeStart);
  const endLabel = formatHalfPage(safeEnd);
  const pageCount = (safeEnd - safeStart + 1) / 2;
  return {
    start: safeStart,
    end: safeEnd,
    count: safeEnd - safeStart + 1,
    pageCount,
    startLabel,
    endLabel,
    label: formatRangeLabel(safeStart, safeEnd),
    countLabel: formatPageCountFromHalfPages(safeEnd - safeStart + 1),
  };
}

function createPageWindowRange(startPage, endPage, poolRange, totalHalfPages) {
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
  const baseRange = createRange(startHalfPage, endHalfPage, totalHalfPages);

  if (!baseRange) {
    return null;
  }

  const pageCount = safeEndPage - safeStartPage + 1;
  return {
    ...baseRange,
    pageStart: safeStartPage,
    pageEnd: safeEndPage,
    pageCount,
    label: safeStartPage === safeEndPage ? `Page ${safeStartPage}` : `Page ${safeStartPage} -> Page ${safeEndPage}`,
    countLabel: formatWholePageCount(pageCount),
  };
}

function splitConsolidationBands(range, programDayIndex, totalHalfPages) {
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
    bands[bandKeys[index]] = bandLength > 0 ? createRange(cursor, cursor + bandLength - 1, totalHalfPages) : null;
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

function buildOldBlock(oldPoolRange, programDayIndex, totalHalfPages) {
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
    const windowRange = createPageWindowRange(windowStartPage, windowEndPage, oldPoolRange, totalHalfPages);
    pageCursor += length;
    return {
      number: index + 1,
      label: `Partie ${index + 1}`,
      active: index === windowIndex,
      range: windowRange,
    };
  });
  const range = windows[windowIndex]?.range || null;
  const nextBlock = windows[nextWindowNumber - 1]?.range || null;

  const displayPoolRange = createPageWindowRange(poolPageStart, poolPageEnd, oldPoolRange, totalHalfPages);

  return {
    poolRange: displayPoolRange,
    range,
    nextRange: nextBlock,
    windows,
    windowCount,
    currentWindowNumber,
    nextWindowNumber,
    currentWindowLabel: `Partie ${currentWindowNumber} / ${windowCount}`,
    nextWindowLabel: `Partie ${nextWindowNumber} / ${windowCount}`,
    windowSizeLabel: "Parties equilibrees",
    startsAt: range ? range.start : null,
    nextStart: nextBlock ? nextBlock.start : null,
  };
}

function buildWaves(dailyStatus) {
  const waves = dailyStatus.waves.map((slots, waveIndex) => ({
    id: waveIndex + 1,
    label: `Vague ${waveIndex + 1}`,
    slots: slots.map((checked, slotIndex) => ({
      index: slotIndex,
      checked,
      label: `Validation ${slotIndex + 1}`,
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
  const q = settings.dailyNewHalfPages;
  const h = progress.currentHalfPage;
  const totalHalfPages = settings.totalHalfPages;

  const newRange = createRange(h, h + q - 1, totalHalfPages);
  const yesterdayRange = createRange(h - q, h - 1, totalHalfPages);
  const recentRange = createRange(h - 7 * q, h - 1, totalHalfPages);
  const consolidationRange = createRange(h - 30 * q, h - 8 * q + (q - 1), totalHalfPages);
  const oldPoolRange = consolidationRange ? createRange(1, consolidationRange.start - 1, totalHalfPages) : null;
  const oldBlock = buildOldBlock(oldPoolRange, progress.programDayIndex, totalHalfPages);
  const consolidation = splitConsolidationBands(consolidationRange, progress.programDayIndex, totalHalfPages);
  const waves = buildWaves(dailyStatus);

  const blocks = {
    old: {
      key: "old",
      title: "Ancien",
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
      helper: oldBlock.range
        ? "Rotation automatique en 7 parties equilibrees sur tout l'ancien situe avant J-30."
        : "Pas encore d'ancien disponible.",
    },
    consolidation: {
      key: "consolidation",
      title: "Consolidation",
      order: 2,
      present: Boolean(consolidation.fullRange && consolidation.activeRange),
      done: consolidation.fullRange && consolidation.activeRange ? Boolean(dailyStatus.blocks.consolidation) : true,
      fullRange: consolidation.fullRange,
      activeBand: consolidation.activeBand,
      activeRange: consolidation.activeRange,
      bands: consolidation.bands,
      helper: consolidation.fullRange
        ? "Revision de la partie des 30 derniers jours : la consolidation couvre J-8 a J-30, avec une seule partie active a valider aujourd'hui."
        : "Pas encore de partie de revision sur les 30 derniers jours (J-8 a J-30).",
    },
    recent: {
      key: "recent",
      title: "Recent",
      order: 3,
      present: Boolean(recentRange),
      done: recentRange ? Boolean(dailyStatus.blocks.recent) : true,
      range: recentRange,
      helper: recentRange ? "Bloc continu J-1 a J-7." : "Pas encore de recent disponible.",
    },
    yesterday: {
      key: "yesterday",
      title: "Veille",
      order: 4,
      present: Boolean(yesterdayRange),
      done: yesterdayRange ? Boolean(dailyStatus.blocks.yesterday) : true,
      range: yesterdayRange,
      helper: yesterdayRange ? "Bloc de nouveau d'hier uniquement." : "Pas encore de veille disponible.",
    },
    new: {
      key: "new",
      title: "Nouveau",
      order: 5,
      present: Boolean(newRange),
      done: newRange ? waves.isComplete : true,
      range: newRange,
      waves: waves.items,
      checkedCount: waves.checkedCount,
      helper: newRange ? "3 vagues, 3 validations par vague." : "Plus de nouveau a attribuer.",
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
        progress.currentHalfPage <= totalHalfPages ? formatHalfPage(progress.currentHalfPage) : "Nouveau termine",
      dailyNewHalfPages: settings.dailyNewHalfPages,
      dailyNewLabel: formatPageCountFromHalfPages(settings.dailyNewHalfPages),
      oldWindowCount: computeOldWindowCount(),
      oldDailyLabel: "1 partie active",
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
