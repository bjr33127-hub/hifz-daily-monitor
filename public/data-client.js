(function initDabtDataClient() {
  const SNAPSHOT_KEY = "dabt:state-snapshot:v1";

  function canUseLocalStorage() {
    try {
      return typeof window.localStorage !== "undefined";
    } catch (_error) {
      return false;
    }
  }

  const browserStateRepository = {
    read() {
      if (!canUseLocalStorage()) {
        return null;
      }

      try {
        const raw = window.localStorage.getItem(SNAPSHOT_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (_error) {
        return null;
      }
    },
    write(payload) {
      if (!canUseLocalStorage()) {
        return;
      }

      try {
        window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(payload));
      } catch (_error) {
        // Ignore quota/privacy failures for now.
      }
    },
    clear() {
      if (!canUseLocalStorage()) {
        return;
      }

      try {
        window.localStorage.removeItem(SNAPSHOT_KEY);
      } catch (_error) {
        // Ignore storage failures.
      }
    },
  };

  function isStatePayload(payload) {
    return Boolean(payload && typeof payload === "object" && payload.settings && payload.progress && payload.plan);
  }

  function clonePayload(payload) {
    return JSON.parse(JSON.stringify(payload));
  }

  function normalizeBridgeBody(body) {
    if (!body) {
      return {};
    }

    if (typeof body === "string") {
      try {
        return JSON.parse(body);
      } catch (_error) {
        return {};
      }
    }

    return typeof body === "object" ? body : {};
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

  function isApiPath(path) {
    return String(path || "").startsWith("/api/");
  }

  function prepareFetchConfig(options = {}) {
    const config = {
      ...options,
      headers: {
        ...(options.headers || {}),
      },
    };

    if (config.body && typeof config.body === "object" && !(config.body instanceof FormData)) {
      if (!config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
      }
      config.body = JSON.stringify(config.body);
    }

    return config;
  }

  function rememberState(payload) {
    if (isStatePayload(payload)) {
      browserStateRepository.write(payload);
    }
    return payload;
  }

  function markSnapshotPayload(payload) {
    if (!isStatePayload(payload)) {
      return payload;
    }

    const cloned = clonePayload(payload);
    cloned.meta = {
      ...(cloned.meta || {}),
      source: "browser-snapshot",
    };
    return cloned;
  }

  async function request(path, options = {}) {
    if (isApiPath(path) && window.dabtBridge?.request) {
      return rememberState(
        await window.dabtBridge.request(path, {
          method: options.method || "GET",
          body: normalizeBridgeBody(options.body),
        }),
      );
    }

    if (isApiPath(path) && isNativeAppRuntime() && window.dabtBrowserLocalApi?.request) {
      return rememberState(
        await window.dabtBrowserLocalApi.request(path, {
          method: options.method || "GET",
          body: normalizeBridgeBody(options.body),
        }),
      );
    }

    try {
      const config = prepareFetchConfig(options);
      const response = await fetch(path, config);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Network error.");
      }
      return rememberState(payload);
    } catch (error) {
      if (isApiPath(path) && window.dabtBrowserLocalApi?.request) {
        return rememberState(
          await window.dabtBrowserLocalApi.request(path, {
            method: options.method || "GET",
            body: normalizeBridgeBody(options.body),
          }),
        );
      }

      throw error;
    }
  }

  async function getState(options = {}) {
    try {
      return await request("/api/state");
    } catch (error) {
      if (!options.allowSnapshotFallback) {
        throw error;
      }

      const snapshot = browserStateRepository.read();
      if (snapshot) {
        return markSnapshotPayload(snapshot);
      }

      throw error;
    }
  }

  window.dabtDataClient = {
    browserStateRepository,
    clearSnapshot() {
      browserStateRepository.clear();
    },
    getState,
    isSnapshotPayload(payload) {
      return payload?.meta?.source === "browser-snapshot";
    },
    saveConfig(input) {
      return request("/api/config", { method: "POST", body: input });
    },
    toggleBlock(blockKey) {
      return request("/api/toggle-block", {
        method: "POST",
        body: { blockKey },
      });
    },
    toggleWaveSlot(waveIndex, slotIndex) {
      return request("/api/toggle-wave-slot", {
        method: "POST",
        body: { waveIndex, slotIndex },
      });
    },
    setPageError(page, input) {
      return request("/api/page-errors", {
        method: "POST",
        body: { page, ...input },
      });
    },
    clearPageError(page) {
      return request("/api/page-errors/clear", {
        method: "POST",
        body: { page },
      });
    },
    removePageErrorItem(page, id) {
      return request("/api/page-errors/delete", {
        method: "POST",
        body: { page, id },
      });
    },
    resetToday() {
      return request("/api/reset-today", { method: "POST" });
    },
    advanceDay() {
      return request("/api/advance-day", { method: "POST" });
    },
    skipMemorizationDay() {
      return request("/api/skip-memorization-day", { method: "POST" });
    },
    answerErrorReview(id, result) {
      return request("/api/error-review/answer", {
        method: "POST",
        body: { id, result },
      });
    },
    request,
  };
})();
