function cloneState(value) {
  if (value === null || value === undefined) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
}

function loadNodeBuiltin(moduleName) {
  const isNodeRuntime = typeof process !== "undefined" && Boolean(process.versions && process.versions.node);
  if (!isNodeRuntime) {
    throw new Error(`Node builtin unavailable: ${moduleName}`);
  }

  const nodeRequire =
    typeof require === "function"
      ? require
      : typeof module !== "undefined" && module && typeof module.require === "function"
        ? module.require.bind(module)
        : null;
  if (!nodeRequire) {
    throw new Error(`Node builtin unavailable: ${moduleName}`);
  }
  return nodeRequire(moduleName);
}

function canUseLocalStorage() {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch (_error) {
    return false;
  }
}

function createLocalStorageStateRepository(options = {}) {
  const storageKey = String(options.storageKey || "dabt:store-state:v1");

  return {
    kind: "local-storage",
    location: `local-storage://${storageKey}`,
    read() {
      if (!canUseLocalStorage()) {
        return null;
      }

      try {
        const raw = window.localStorage.getItem(storageKey);
        return raw ? JSON.parse(raw) : null;
      } catch (_error) {
        return null;
      }
    },
    write(state) {
      if (!canUseLocalStorage()) {
        return;
      }

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (_error) {
        // Ignore quota or privacy mode failures for now.
      }
    },
  };
}

function createFileStateRepository(options = {}) {
  const fs = loadNodeBuiltin("node:fs");
  const path = loadNodeBuiltin("node:path");
  const defaultDataDir = path.join(__dirname, "..", "..", "data");
  const dataDir = path.resolve(options.dataDir || process.env.HIFZ_DATA_DIR || defaultDataDir);
  const fileName = options.fileName || "state.json";
  const stateFile = path.join(dataDir, fileName);

  function ensureDirectory() {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  return {
    kind: "file",
    location: stateFile,
    read() {
      ensureDirectory();
      if (!fs.existsSync(stateFile)) {
        return null;
      }

      try {
        return JSON.parse(fs.readFileSync(stateFile, "utf8"));
      } catch (_error) {
        return null;
      }
    },
    write(state) {
      ensureDirectory();
      fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    },
  };
}

function createMemoryStateRepository(initialState = null) {
  let snapshot = cloneState(initialState);

  return {
    kind: "memory",
    location: "memory://state",
    read() {
      return cloneState(snapshot);
    },
    write(state) {
      snapshot = cloneState(state);
    },
  };
}

function resolveDefaultStateRepository() {
  if (canUseLocalStorage()) {
    return createLocalStorageStateRepository();
  }

  return createFileStateRepository();
}

module.exports = {
  createFileStateRepository,
  createLocalStorageStateRepository,
  createMemoryStateRepository,
  resolveDefaultStateRepository,
};
