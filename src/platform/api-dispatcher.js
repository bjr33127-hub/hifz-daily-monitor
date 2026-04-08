const store = require("../storage/store");

async function dispatchApiRequest(request = {}) {
  const method = String(request.method || "GET").toUpperCase();
  const pathname = String(request.pathname || request.path || "").trim();
  const body = request.body && typeof request.body === "object" ? request.body : {};

  if (!pathname.startsWith("/api/")) {
    return { handled: false };
  }

  if (method === "GET" && pathname === "/api/state") {
    return { handled: true, payload: store.getState() };
  }

  if (method === "POST" && pathname === "/api/config") {
    return { handled: true, payload: store.saveConfig(body) };
  }

  if (method === "POST" && pathname === "/api/toggle-block") {
    return { handled: true, payload: store.toggleBlock(String(body.blockKey || "")) };
  }

  if (method === "POST" && pathname === "/api/toggle-wave-slot") {
    return {
      handled: true,
      payload: store.toggleWaveSlot(Number(body.waveIndex), Number(body.slotIndex)),
    };
  }

  if (method === "POST" && pathname === "/api/page-errors") {
    return {
      handled: true,
      payload: store.setPageError(body.pages || body.page, {
        severity: String(body.severity || ""),
        scope: String(body.scope || ""),
        rect: body.rect || null,
        anchor: body.anchor || null,
        note: body.note || "",
      }),
    };
  }

  if (method === "POST" && pathname === "/api/page-errors/clear") {
    return {
      handled: true,
      payload: store.clearPageError(body.pages || body.page),
    };
  }

  if (method === "POST" && pathname === "/api/page-errors/delete") {
    return {
      handled: true,
      payload: store.removePageErrorItem(body.pages || body.page, body.id),
    };
  }

  if (method === "POST" && pathname === "/api/page-learning") {
    return {
      handled: true,
      payload: store.setPageLearned(body.pages || body.page, Boolean(body.learned)),
    };
  }

  if (method === "POST" && pathname === "/api/reset-today") {
    return { handled: true, payload: store.resetToday() };
  }

  if (method === "POST" && pathname === "/api/advance-day") {
    return { handled: true, payload: store.advanceDay() };
  }

  if (method === "POST" && pathname === "/api/skip-memorization-day") {
    return { handled: true, payload: store.skipMemorizationDay() };
  }

  if (method === "POST" && pathname === "/api/error-review/answer") {
    return {
      handled: true,
      payload: store.answerErrorReview(body.id, String(body.result || "")),
    };
  }

  return { handled: false };
}

module.exports = {
  dispatchApiRequest,
};
