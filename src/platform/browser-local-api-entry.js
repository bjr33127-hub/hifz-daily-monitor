const { LocalNotifications } = require("@capacitor/local-notifications");
const { dispatchApiRequest } = require("./api-dispatcher");

const NOTIFICATION_CHANNEL_ID = "dabt-daily-reminders";
const NOTIFICATION_IDS = Object.freeze({
  review: 41001,
  newMorning: 41002,
  newNoon: 41003,
  newEvening: 41004,
});

function isNativeCapacitorRuntime() {
  try {
    return Boolean(window.Capacitor?.isNativePlatform?.());
  } catch (_error) {
    return false;
  }
}

function canUseNativeNotifications() {
  return isNativeCapacitorRuntime() && LocalNotifications && typeof LocalNotifications.schedule === "function";
}

function parseTimeString(value, fallback = "09:00") {
  const match = String(value || fallback)
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return parseTimeString(fallback, "09:00");
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return parseTimeString(fallback, "09:00");
  }

  return {
    hour,
    minute,
  };
}

function normalizeReminder(input = {}) {
  if (!input || typeof input !== "object") {
    return null;
  }

  const key = typeof input.key === "string" ? input.key.trim() : "";
  const id = NOTIFICATION_IDS[key];
  if (!id) {
    return null;
  }

  const title = String(input.title || "").trim();
  const body = String(input.body || "").trim();
  if (!title || !body) {
    return null;
  }

  const { hour, minute } = parseTimeString(input.time, "09:00");

  return {
    id,
    key,
    title,
    body,
    hour,
    minute,
    enabled: Boolean(input.enabled),
  };
}

async function ensureNotificationChannel() {
  if (!canUseNativeNotifications()) {
    return;
  }

  try {
    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: "Rappels Dabt",
      description: "Rappels quotidiens pour la revision et le nouveau",
      importance: 5,
      visibility: 1,
    });
  } catch (_error) {
    // Channel may already exist or be unsupported on the current platform.
  }
}

async function cancelManagedNotifications() {
  if (!canUseNativeNotifications()) {
    return;
  }

  await LocalNotifications.cancel({
    notifications: Object.values(NOTIFICATION_IDS).map((id) => ({ id })),
  }).catch(() => undefined);
}

async function getNotificationStatus() {
  if (!canUseNativeNotifications()) {
    return {
      supported: false,
      native: false,
      display: "prompt",
      exactAlarm: "prompt",
      pendingCount: 0,
    };
  }

  let display = "prompt";
  let exactAlarm = "prompt";
  let pendingCount = 0;

  try {
    display = (await LocalNotifications.checkPermissions()).display || "prompt";
  } catch (_error) {
    display = "prompt";
  }

  try {
    exactAlarm = (await LocalNotifications.checkExactNotificationSetting()).exact_alarm || "prompt";
  } catch (_error) {
    exactAlarm = "prompt";
  }

  try {
    const pending = await LocalNotifications.getPending();
    pendingCount = (pending.notifications || []).filter((notification) =>
      Object.values(NOTIFICATION_IDS).includes(Number(notification.id)),
    ).length;
  } catch (_error) {
    pendingCount = 0;
  }

  return {
    supported: true,
    native: true,
    display,
    exactAlarm,
    pendingCount,
  };
}

async function syncNotifications(config = {}) {
  const baseStatus = await getNotificationStatus();
  if (!baseStatus.native) {
    return {
      ...baseStatus,
      synced: false,
      scheduledCount: 0,
      reason: "unsupported",
    };
  }

  const reminders = Array.isArray(config.reminders) ? config.reminders.map(normalizeReminder).filter(Boolean) : [];
  let display = baseStatus.display;

  if (config.requestPermission !== false && display !== "granted" && Boolean(config.enabled)) {
    try {
      display = (await LocalNotifications.requestPermissions()).display || display;
    } catch (_error) {
      display = "denied";
    }
  }

  await cancelManagedNotifications();

  if (!config.enabled) {
    return {
      ...(await getNotificationStatus()),
      synced: false,
      scheduledCount: 0,
      reason: "disabled",
    };
  }

  if (display !== "granted") {
    return {
      ...(await getNotificationStatus()),
      display,
      synced: false,
      scheduledCount: 0,
      reason: "permission-denied",
    };
  }

  const activeReminders = reminders.filter((reminder) => reminder.enabled);
  if (!activeReminders.length) {
    return {
      ...(await getNotificationStatus()),
      display,
      synced: false,
      scheduledCount: 0,
      reason: "empty",
    };
  }

  await ensureNotificationChannel();
  await LocalNotifications.schedule({
    notifications: activeReminders.map((reminder) => ({
      id: reminder.id,
      title: reminder.title,
      body: reminder.body,
      channelId: NOTIFICATION_CHANNEL_ID,
      schedule: {
        on: {
          hour: reminder.hour,
          minute: reminder.minute,
        },
        repeats: true,
        allowWhileIdle: true,
      },
      extra: {
        reminderKey: reminder.key,
      },
    })),
  });

  return {
    ...(await getNotificationStatus()),
    display,
    synced: true,
    scheduledCount: activeReminders.length,
    reason: "scheduled",
  };
}

window.dabtBrowserLocalApi = {
  platform: "browser-local",
  async request(path, options = {}) {
    const result = await dispatchApiRequest({
      pathname: path,
      method: options.method || "GET",
      body: options.body || {},
    });

    if (!result.handled) {
      throw new Error("Route API introuvable.");
    }

    return result.payload;
  },
  notifications: {
    getStatus: getNotificationStatus,
    sync: syncNotifications,
  },
};
