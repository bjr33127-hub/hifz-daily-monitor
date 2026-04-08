const path = require("node:path");
const { app, BrowserWindow, ipcMain } = require("electron");

let serverHandle = null;
let mainWindow = null;
let startServer = null;
let dispatchApiRequest = null;

function registerDesktopBridge() {
  if (!dispatchApiRequest) {
    ({ dispatchApiRequest } = require("../src/platform/api-dispatcher"));
  }

  ipcMain.removeHandler("dabt:request");
  ipcMain.handle("dabt:request", async (_event, request = {}) => {
    const result = await dispatchApiRequest({
      method: request.method || "GET",
      pathname: request.path || "",
      body: request.body || {},
    });

    if (!result.handled) {
      throw new Error("Route API introuvable.");
    }

    return result.payload;
  });
}

async function createMainWindow() {
  if (!startServer) {
    process.env.HIFZ_DATA_DIR = process.env.HIFZ_DATA_DIR || path.join(app.getPath("userData"), "data");
    ({ startServer } = require("../src/server"));
  }

  if (!serverHandle) {
    serverHandle = await startServer({
      host: "127.0.0.1",
      port: 0,
    });
  }

  mainWindow = new BrowserWindow({
    width: 1480,
    height: 980,
    minWidth: 1100,
    minHeight: 760,
    autoHideMenuBar: true,
    title: "Dabt",
    backgroundColor: "#f5f0e6",
    icon: path.join(__dirname, "..", "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  await mainWindow.loadURL(serverHandle.url);
}

app.whenReady().then(async () => {
  registerDesktopBridge();
  await createMainWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (serverHandle?.server) {
    serverHandle.server.close();
    serverHandle = null;
  }
});
