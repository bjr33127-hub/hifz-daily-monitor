const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");
const store = require("./storage/store");

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 3100);
const PUBLIC_DIR = path.join(__dirname, "..", "public");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function sendText(res, statusCode, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(statusCode, {
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 2 * 1024 * 1024) {
        reject(new Error("Corps de requete trop volumineux."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (_error) {
        reject(new Error("JSON invalide."));
      }
    });

    req.on("error", reject);
  });
}

function serveStatic(reqPath, res) {
  const requestedPath = reqPath === "/" ? "/index.html" : reqPath;
  const fullPath = path.normalize(path.join(PUBLIC_DIR, requestedPath));

  if (!fullPath.startsWith(PUBLIC_DIR)) {
    sendText(res, 403, "Acces refuse.");
    return;
  }

  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    sendText(res, 404, "Fichier introuvable.");
    return;
  }

  const content = fs.readFileSync(fullPath);
  sendText(res, 200, content, MIME_TYPES[path.extname(fullPath).toLowerCase()] || "application/octet-stream");
}

async function handleApi(req, res, url) {
  const { pathname } = url;

  if (req.method === "GET" && pathname === "/api/state") {
    sendJson(res, 200, store.getState());
    return true;
  }

  if (req.method === "POST" && pathname === "/api/config") {
    sendJson(res, 200, store.saveConfig(await parseBody(req)));
    return true;
  }

  if (req.method === "POST" && pathname === "/api/toggle-block") {
    const body = await parseBody(req);
    sendJson(res, 200, store.toggleBlock(String(body.blockKey || "")));
    return true;
  }

  if (req.method === "POST" && pathname === "/api/toggle-wave-slot") {
    const body = await parseBody(req);
    sendJson(res, 200, store.toggleWaveSlot(Number(body.waveIndex), Number(body.slotIndex)));
    return true;
  }

  if (req.method === "POST" && pathname === "/api/page-errors") {
    const body = await parseBody(req);
    sendJson(
      res,
      200,
      store.setPageError(body.pages || body.page, {
        severity: String(body.severity || ""),
        scope: String(body.scope || ""),
        rect: body.rect || null,
        anchor: body.anchor || null,
        note: body.note || "",
      }),
    );
    return true;
  }

  if (req.method === "POST" && pathname === "/api/page-errors/clear") {
    const body = await parseBody(req);
    sendJson(res, 200, store.clearPageError(body.pages || body.page));
    return true;
  }

  if (req.method === "POST" && pathname === "/api/page-errors/delete") {
    const body = await parseBody(req);
    sendJson(res, 200, store.removePageErrorItem(body.pages || body.page, body.id));
    return true;
  }

  if (req.method === "POST" && pathname === "/api/page-learning") {
    const body = await parseBody(req);
    sendJson(res, 200, store.setPageLearned(body.pages || body.page, Boolean(body.learned)));
    return true;
  }

  if (req.method === "POST" && pathname === "/api/reset-today") {
    sendJson(res, 200, store.resetToday());
    return true;
  }

  if (req.method === "POST" && pathname === "/api/advance-day") {
    sendJson(res, 200, store.advanceDay());
    return true;
  }

  if (req.method === "POST" && pathname === "/api/skip-memorization-day") {
    sendJson(res, 200, store.skipMemorizationDay());
    return true;
  }

  if (req.method === "POST" && pathname === "/api/error-review/answer") {
    const body = await parseBody(req);
    sendJson(res, 200, store.answerErrorReview(body.id, String(body.result || "")));
    return true;
  }

  return false;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
    if (url.pathname.startsWith("/api/")) {
      const handled = await handleApi(req, res, url);
      if (!handled) {
        sendJson(res, 404, { error: "Route API introuvable." });
      }
      return;
    }

    if (req.method !== "GET") {
      sendText(res, 405, "Methode non autorisee.");
      return;
    }

    serveStatic(url.pathname, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Erreur interne." });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Hifz Daily Monitor running on http://${HOST}:${PORT}`);
});
