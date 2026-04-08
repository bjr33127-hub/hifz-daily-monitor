const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");
const { dispatchApiRequest } = require("./platform/api-dispatcher");

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
  const body = req.method === "GET" ? {} : await parseBody(req);
  const result = await dispatchApiRequest({
    method: req.method,
    pathname: url.pathname,
    body,
  });
  if (!result.handled) {
    return false;
  }
  sendJson(res, 200, result.payload);
  return true;
}

function createServer(options = {}) {
  const host = options.host || HOST;
  const fallbackPort = Number.isInteger(options.port) ? options.port : PORT;

  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || `${host}:${fallbackPort}`}`);
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
}

function startServer(options = {}) {
  const host = options.host || HOST;
  const desiredPort = Number.isInteger(options.port) ? options.port : PORT;
  const server = createServer({ host, port: desiredPort });

  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };

    const onListening = () => {
      server.off("error", onError);
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : desiredPort;
      resolve({
        server,
        host,
        port,
        url: `http://${host}:${port}`,
      });
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(desiredPort, host);
  });
}

if (require.main === module) {
  startServer()
    .then(({ url }) => {
      console.log(`Hifz Daily Monitor running on ${url}`);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

module.exports = {
  createServer,
  startServer,
};
