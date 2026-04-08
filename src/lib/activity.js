const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ACTIVITY_HISTORY = 400;
const REMINDER_KEYS = ["review", "newMorning", "newNoon", "newEvening"];
const DEFAULT_NOTIFICATION_PREFERENCES = Object.freeze({
  enabled: false,
  reminders: {
    review: {
      enabled: true,
      time: "07:30",
    },
    newMorning: {
      enabled: true,
      time: "09:00",
    },
    newNoon: {
      enabled: true,
      time: "13:00",
    },
    newEvening: {
      enabled: true,
      time: "20:00",
    },
  },
});

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

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function getLocalDateKey(input = new Date()) {
  const date = toDate(input);
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
}

function normalizeTimeString(value, fallback = "09:00") {
  const raw = String(value || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/);

  if (!raw) {
    return fallback;
  }

  const hours = Number.parseInt(raw[1], 10);
  const minutes = Number.parseInt(raw[2], 10);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return fallback;
  }

  return `${padNumber(hours)}:${padNumber(minutes)}`;
}

function normalizeReminderPreference(input = {}, fallback = {}) {
  return {
    enabled: typeof input.enabled === "boolean" ? input.enabled : Boolean(fallback.enabled),
    time: normalizeTimeString(input.time, normalizeTimeString(fallback.time, "09:00")),
  };
}

function mergeNotificationPreferences(current = DEFAULT_NOTIFICATION_PREFERENCES, patch = {}) {
  const safeCurrent = normalizeNotificationPreferences(current);
  const safePatch = patch && typeof patch === "object" ? patch : {};
  const patchReminders = safePatch.reminders && typeof safePatch.reminders === "object" ? safePatch.reminders : {};

  return normalizeNotificationPreferences({
    enabled: typeof safePatch.enabled === "boolean" ? safePatch.enabled : safeCurrent.enabled,
    reminders: REMINDER_KEYS.reduce((accumulator, reminderKey) => {
      accumulator[reminderKey] = {
        ...safeCurrent.reminders[reminderKey],
        ...(patchReminders[reminderKey] && typeof patchReminders[reminderKey] === "object" ? patchReminders[reminderKey] : {}),
      };
      return accumulator;
    }, {}),
  });
}

function normalizeNotificationPreferences(input = {}) {
  const reminders = input.reminders && typeof input.reminders === "object" ? input.reminders : {};
  return {
    enabled: Boolean(input.enabled),
    reminders: {
      review: normalizeReminderPreference(reminders.review, DEFAULT_NOTIFICATION_PREFERENCES.reminders.review),
      newMorning: normalizeReminderPreference(reminders.newMorning, DEFAULT_NOTIFICATION_PREFERENCES.reminders.newMorning),
      newNoon: normalizeReminderPreference(reminders.newNoon, DEFAULT_NOTIFICATION_PREFERENCES.reminders.newNoon),
      newEvening: normalizeReminderPreference(reminders.newEvening, DEFAULT_NOTIFICATION_PREFERENCES.reminders.newEvening),
    },
  };
}

function normalizeActivityEntry(input = {}) {
  if (!input || typeof input !== "object") {
    return null;
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(input.date || "").trim())
    ? String(input.date).trim()
    : getLocalDateKey(input.completedAt || new Date());
  const completedAt = toDate(input.completedAt || `${date}T00:00:00`).toISOString();

  return {
    date,
    completedAt,
    skippedNew: Boolean(input.skippedNew),
    programDayIndex: Math.max(1, Number.parseInt(input.programDayIndex, 10) || 1),
    phaseIndex: Math.max(1, Number.parseInt(input.phaseIndex, 10) || 1),
  };
}

function compareActivityEntries(left, right) {
  return String(left.date || "").localeCompare(String(right.date || ""));
}

function normalizeActivityHistory(input = []) {
  const values = Array.isArray(input) ? input : [];
  const deduped = new Map();

  values.forEach((entry) => {
    const normalized = normalizeActivityEntry(entry);
    if (!normalized) {
      return;
    }

    const existing = deduped.get(normalized.date);
    if (!existing || String(existing.completedAt || "") <= normalized.completedAt) {
      deduped.set(normalized.date, normalized);
    }
  });

  return Array.from(deduped.values()).sort(compareActivityEntries).slice(-MAX_ACTIVITY_HISTORY);
}

function upsertActivityEntry(history = [], entry = {}) {
  return normalizeActivityHistory([...normalizeActivityHistory(history), entry]);
}

function recordDayCompletion(history = [], details = {}) {
  const now = toDate(details.completedAt || new Date());
  return upsertActivityEntry(history, {
    date: getLocalDateKey(now),
    completedAt: now.toISOString(),
    skippedNew: Boolean(details.skippedNew),
    programDayIndex: Math.max(1, Number.parseInt(details.programDayIndex, 10) || 1),
    phaseIndex: Math.max(1, Number.parseInt(details.phaseIndex, 10) || 1),
  });
}

function startOfDateKey(dateKey) {
  const parsed = toDate(`${dateKey}T00:00:00`);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function resolveDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim()) ? String(value).trim() : getLocalDateKey(value);
}

function addDays(date, count) {
  const next = toDate(date);
  next.setDate(next.getDate() + Number(count || 0));
  return next;
}

function diffInCalendarDays(leftDate, rightDate) {
  const left = startOfDateKey(resolveDateKey(leftDate));
  const right = startOfDateKey(resolveDateKey(rightDate));
  return Math.round((left.getTime() - right.getTime()) / DAY_MS);
}

function computeStreak(history = [], referenceDate = new Date()) {
  const normalizedHistory = normalizeActivityHistory(history);
  if (!normalizedHistory.length) {
    return {
      current: 0,
      best: 0,
      lastCompletedOn: "",
      activeToday: false,
      activeYesterday: false,
    };
  }

  let currentRun = 0;
  let bestRun = 0;
  let previousDate = null;

  normalizedHistory.forEach((entry) => {
    const entryDate = startOfDateKey(entry.date);
    if (!previousDate) {
      currentRun = 1;
    } else {
      const gap = diffInCalendarDays(entryDate, previousDate);
      currentRun = gap === 1 ? currentRun + 1 : 1;
    }

    previousDate = entryDate;
    bestRun = Math.max(bestRun, currentRun);
  });

  const lastEntry = normalizedHistory[normalizedHistory.length - 1];
  const referenceKey = getLocalDateKey(referenceDate);
  const lastKey = String(lastEntry.date || "");
  const gapFromReference = diffInCalendarDays(referenceKey, lastKey);
  const activeToday = gapFromReference === 0;
  const activeYesterday = gapFromReference === 1;

  if (gapFromReference > 1) {
    currentRun = 0;
  }

  return {
    current: currentRun,
    best: bestRun,
    lastCompletedOn: lastKey,
    activeToday,
    activeYesterday,
  };
}

function buildTimeline(history = [], days = 30, referenceDate = new Date()) {
  const normalizedHistory = normalizeActivityHistory(history);
  const historyByDate = new Map(normalizedHistory.map((entry) => [entry.date, entry]));
  const today = startOfDateKey(referenceDate);
  const items = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = addDays(today, -offset);
    const dateKey = getLocalDateKey(date);
    const entry = historyByDate.get(dateKey);
    items.push({
      date: dateKey,
      closed: Boolean(entry),
      skippedNew: Boolean(entry?.skippedNew),
      isToday: offset === 0,
      dayOfMonth: date.getDate(),
      weekdayIndex: date.getDay(),
      programDayIndex: entry?.programDayIndex || null,
      phaseIndex: entry?.phaseIndex || null,
      completedAt: entry?.completedAt || "",
    });
  }

  return items;
}

function buildStatistics(history = [], referenceDate = new Date()) {
  const normalizedHistory = normalizeActivityHistory(history);
  const streak = computeStreak(normalizedHistory, referenceDate);
  const timeline30 = buildTimeline(normalizedHistory, 30, referenceDate);
  const timeline7 = timeline30.slice(-7);
  const closedDaysLast30 = timeline30.filter((entry) => entry.closed).length;
  const closedDaysLast7 = timeline7.filter((entry) => entry.closed).length;
  const skippedNewLast30 = timeline30.filter((entry) => entry.closed && entry.skippedNew).length;
  const recentClosures = normalizedHistory
    .slice(-8)
    .reverse()
    .map((entry) => ({
      date: entry.date,
      skippedNew: Boolean(entry.skippedNew),
      programDayIndex: entry.programDayIndex,
      phaseIndex: entry.phaseIndex,
      completedAt: entry.completedAt,
    }));

  return {
    streak,
    overview: {
      closedDaysLast7,
      closedDaysLast30,
      completionRateLast30: Math.round((closedDaysLast30 / Math.max(1, timeline30.length)) * 100),
      skippedNewLast30,
      totalClosedDays: normalizedHistory.length,
    },
    timeline: timeline30,
    recentClosures,
  };
}

module.exports = {
  DEFAULT_NOTIFICATION_PREFERENCES,
  REMINDER_KEYS,
  buildStatistics,
  computeStreak,
  getLocalDateKey,
  mergeNotificationPreferences,
  normalizeActivityHistory,
  normalizeNotificationPreferences,
  normalizeTimeString,
  recordDayCompletion,
};
