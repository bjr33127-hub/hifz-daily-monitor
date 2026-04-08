const { contextBridge, ipcRenderer } = require("electron");

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

contextBridge.exposeInMainWorld("dabtBridge", {
  platform: "desktop",
  request(path, options = {}) {
    return ipcRenderer.invoke("dabt:request", {
      path,
      method: options.method || "GET",
      body: normalizeBridgeBody(options.body),
    });
  },
});

window.addEventListener("DOMContentLoaded", () => {
  document.documentElement.classList.add("desktop-shell");
});
