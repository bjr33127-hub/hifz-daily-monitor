const state = {
  payload: null,
  activePage: null,
  activeView: "today",
};

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeFirstName(value = "") {
  return String(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

function getCurrentPageFromHalfPage(currentHalfPage, totalHalfPages) {
  const safeTotal = Math.max(2, Number(totalHalfPages) || 2);
  const safeHalfPage = Math.max(1, Math.min(Number(currentHalfPage) || 1, safeTotal));
  return Math.ceil(safeHalfPage / 2);
}

function getCurrentHalfLabelFromHalfPage(currentHalfPage, totalHalfPages) {
  const safeTotal = Math.max(2, Number(totalHalfPages) || 2);
  const safeHalfPage = Math.max(1, Math.min(Number(currentHalfPage) || 1, safeTotal));
  return safeHalfPage % 2 === 0 ? "basse" : "haute";
}

function syncCurrentPageMax() {
  const totalHalfPages = Math.max(2, Number($("#total-half-pages")?.value) || 2);
  const totalPages = Math.max(1, Math.ceil(totalHalfPages / 2));
  const currentPageInput = $("#current-page");

  if (!currentPageInput) {
    return;
  }

  currentPageInput.max = String(totalPages);
  const currentPage = Math.max(1, Number(currentPageInput.value) || 1);
  if (currentPage > totalPages) {
    currentPageInput.value = String(totalPages);
  }
}

function getCurrentHalfPageFromForm() {
  const totalHalfPages = Math.max(2, Number($("#total-half-pages")?.value) || 2);
  const totalPages = Math.max(1, Math.ceil(totalHalfPages / 2));
  const currentPage = Math.min(totalPages, Math.max(1, Number($("#current-page")?.value) || 1));
  const currentHalf = $("#current-half")?.value === "basse" ? "basse" : "haute";
  return (currentPage - 1) * 2 + (currentHalf === "basse" ? 2 : 1);
}

async function api(path, options = {}) {
  const config = {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  };

  if (config.body && !config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }

  const response = await fetch(path, config);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Erreur reseau.");
  }
  return payload;
}

function showToast(message, isError = false) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.style.background = isError ? "rgba(141, 81, 71, 0.96)" : "rgba(17, 52, 45, 0.96)";
  toast.classList.add("visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("visible"), 2400);
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

function cardClassName(blockKey, block) {
  return `card card-${blockKey} ${block.done ? "done" : ""} ${block.present ? "" : "empty"} ${block.locked ? "locked" : ""}`;
}

function severityLabel(severity) {
  if (severity === "minor") {
    return "Mineur";
  }
  if (severity === "medium") {
    return "Moyenne";
  }
  if (severity === "grave") {
    return "Grave";
  }
  return "Neutre";
}

function normalizePageEntry(entry) {
  const safeEntry = entry && typeof entry === "object" ? entry : {};
  const errors = safeEntry.errors && typeof safeEntry.errors === "object" ? safeEntry.errors : {};
  const normalized = {
    learned: Boolean(safeEntry.learned),
    errors: {
      minor: Math.max(0, Number(errors.minor || 0)),
      medium: Math.max(0, Number(errors.medium || 0)),
      grave: Math.max(0, Number(errors.grave || 0)),
    },
  };

  normalized.totalErrors = normalized.errors.minor + normalized.errors.medium + normalized.errors.grave;
  normalized.dominantSeverity =
    normalized.errors.grave > 0
      ? "grave"
      : normalized.errors.medium > 0
        ? "medium"
        : normalized.errors.minor > 0
          ? "minor"
          : "none";

  return normalized;
}

function uniqueSortedPages(pages) {
  return [...new Set((pages || []).map((page) => Number(page)).filter((page) => Number.isInteger(page) && page > 0))].sort(
    (left, right) => left - right,
  );
}

function parsePagesInput(rawValue, totalPages) {
  const source = String(rawValue || "").trim();
  if (!source) {
    return [];
  }

  const pages = [];
  const chunks = source.split(",").map((chunk) => chunk.trim()).filter(Boolean);

  for (const chunk of chunks) {
    const rangeMatch = chunk.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = Number.parseInt(rangeMatch[1], 10);
      const end = Number.parseInt(rangeMatch[2], 10);
      if (!Number.isInteger(start) || !Number.isInteger(end)) {
        throw new Error("Format de pages invalide.");
      }

      const safeStart = Math.min(start, end);
      const safeEnd = Math.max(start, end);
      if (safeStart < 1 || safeEnd > totalPages) {
        throw new Error("Une page est hors limite.");
      }

      for (let page = safeStart; page <= safeEnd; page += 1) {
        pages.push(page);
      }
      continue;
    }

    const page = Number.parseInt(chunk, 10);
    if (!Number.isInteger(page)) {
      throw new Error("Format de pages invalide. Utilise 12, 14, 20-25.");
    }

    if (page < 1 || page > totalPages) {
      throw new Error("Une page est hors limite.");
    }

    pages.push(page);
  }

  return uniqueSortedPages(pages);
}

function formatPagesSelection(pages) {
  const uniquePages = uniqueSortedPages(pages);
  if (!uniquePages.length) {
    return "";
  }

  const parts = [];
  let start = uniquePages[0];
  let previous = uniquePages[0];

  for (let index = 1; index <= uniquePages.length; index += 1) {
    const current = uniquePages[index];
    if (current === previous + 1) {
      previous = current;
      continue;
    }

    parts.push(start === previous ? String(start) : `${start}-${previous}`);
    start = current;
    previous = current;
  }

  return parts.join(", ");
}

function syncSelectedPages(pages) {
  state.activePage = uniqueSortedPages(pages)[0] || null;
}

function getSelectedPages(totalPages) {
  if (!Number.isInteger(state.activePage) || state.activePage < 1 || state.activePage > totalPages) {
    throw new Error("Choisis d'abord une page.");
  }
  return [state.activePage];
}

function setActiveView(view) {
  state.activeView = view;
  document.body.classList.toggle("pages-view-active", view === "pages");
  $all("[data-view-target]").forEach((button) => {
    button.classList.toggle("active", button.dataset.viewTarget === view);
  });
  $all(".content-view").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `view-${view}`);
  });
}

function getPrimaryProgramZone(programZones) {
  const priority = ["new", "yesterday", "recent", "consolidation", "old-today", "old-pool"];
  return priority.find((zoneKey) => programZones.some((zone) => zone.key === zoneKey)) || null;
}

function isLearnedFromProgram(programZones) {
  return programZones.some((zone) => zone.key !== "new");
}

function pageCellClass(entry, page, effectiveLearned, programZones) {
  const classes = ["page-cell"];
  if (entry.dominantSeverity !== "none") {
    classes.push(entry.dominantSeverity);
  } else {
    classes.push("none");
  }

  if (effectiveLearned) {
    classes.push("learned");
  }

  const primaryZone = getPrimaryProgramZone(programZones);
  if (primaryZone) {
    classes.push(`zone-${primaryZone}`);
  }

  if (programZones.length > 1) {
    classes.push("multi-zone");
  }

  if (state.activePage === page) {
    classes.push("active-page");
  }

  return classes.join(" ");
}

function pageIntersectsRange(page, range) {
  if (!range) {
    return false;
  }

  const pageStart = (page - 1) * 2 + 1;
  const pageEnd = page * 2;
  return range.start <= pageEnd && range.end >= pageStart;
}

function getProgramZones(plan) {
  const blocks = plan && plan.blocks ? plan.blocks : {};
  return [
    {
      key: "old-pool",
      label: "Ancien",
      shortLabel: "Anc.",
      range: blocks.old && blocks.old.poolRange ? blocks.old.poolRange : null,
      definition: "Tout ce qui est avant J-30.",
    },
    {
      key: "old-today",
      label: "Ancien du jour",
      shortLabel: "Anc. jour",
      range: blocks.old && blocks.old.range ? blocks.old.range : null,
      definition: "La partie d'ancien a reviser aujourd'hui.",
    },
    {
      key: "consolidation",
      label: "Consolidation",
      shortLabel: "Cons.",
      range: blocks.consolidation && blocks.consolidation.fullRange ? blocks.consolidation.fullRange : null,
      definition: "Tout ce qui est entre J-8 et J-30.",
    },
    {
      key: "recent",
      label: "Recent",
      shortLabel: "Recent",
      range: blocks.recent && blocks.recent.range ? blocks.recent.range : null,
      definition: "Tout ce qui est entre J-1 et J-7.",
    },
    {
      key: "yesterday",
      label: "Veille",
      shortLabel: "Veille",
      range: blocks.yesterday && blocks.yesterday.range ? blocks.yesterday.range : null,
      definition: "Le bloc appris hier, soit J-1.",
    },
    {
      key: "new",
      label: "Nouveau",
      shortLabel: "Nouveau",
      range: blocks.new && blocks.new.range ? blocks.new.range : null,
      definition: "Le bloc a apprendre aujourd'hui.",
    },
  ];
}

function getPageProgramZones(plan, page) {
  return getProgramZones(plan).filter((zone) => pageIntersectsRange(page, zone.range));
}

function renderProgramLegend(plan) {
  const markup = getProgramZones(plan)
    .map((zone) => {
      return `
        <article class="program-legend-chip ${zone.key} ${zone.range ? "" : "disabled"}">
          <span class="program-tag ${zone.key}">${escapeHtml(zone.label)}</span>
          <p class="program-definition">${escapeHtml(zone.definition)}</p>
        </article>
      `;
    })
    .join("");

  $("#program-legend").innerHTML = markup;
}

function buildPageStateLabel(entry, effectiveLearned) {
  const severity = severityLabel(entry.dominantSeverity);
  if (!effectiveLearned) {
    return severity;
  }

  if (entry.dominantSeverity === "none") {
    return "Apprise";
  }

  return `Apprise - ${severity}`;
}

function renderPageQuickActions(payload) {
  const container = $("#page-quick-actions");
  const totalPages = payload.errorTracking.totalPages;

  if (!Number.isInteger(state.activePage) || state.activePage < 1 || state.activePage > totalPages) {
    state.activePage = null;
    container.innerHTML = `
      <div class="quick-actions-card empty">
        <p class="eyebrow">Actions rapides</p>
        <strong>Aucune page active</strong>
        <p class="helper">Clique une page dans la grille pour ouvrir ce panneau fixe a droite.</p>
      </div>
    `;
    return;
  }

  const page = state.activePage;
  const entry = normalizePageEntry((payload.pageErrors || {})[String(page)]);
  const programZones = getPageProgramZones(payload.plan || {}, page);
  const effectiveLearned = entry.learned || isLearnedFromProgram(programZones);
  const stateLabel = buildPageStateLabel(entry, effectiveLearned);
  const programTags = programZones
    .map((zone) => `<span class="program-tag ${escapeHtml(zone.key)}">${escapeHtml(zone.shortLabel)}</span>`)
    .join("");
  const countsMarkup = `
    <div class="quick-counts">
      <span class="count-pill minor ${entry.errors.minor > 0 ? "filled" : ""}">V ${escapeHtml(entry.errors.minor)}</span>
      <span class="count-pill medium ${entry.errors.medium > 0 ? "filled" : ""}">M ${escapeHtml(entry.errors.medium)}</span>
      <span class="count-pill grave ${entry.errors.grave > 0 ? "filled" : ""}">G ${escapeHtml(entry.errors.grave)}</span>
    </div>
  `;

  container.innerHTML = `
    <div class="quick-actions-card">
      <div class="quick-actions-head">
        <div class="quick-title">
          <p class="eyebrow">Actions rapides</p>
          <h3>Page ${escapeHtml(page)}</h3>
          <p class="helper">Ajoute une erreur en un clic ou efface l'historique de cette page.</p>
        </div>
        <button class="quick-close" type="button" data-clear-active-page="true">Fermer</button>
      </div>
      <div class="quick-status-row">
        <span class="quick-state-pill">${escapeHtml(stateLabel)}</span>
      </div>
      ${countsMarkup}
      ${programTags ? `<div class="quick-program-tags">${programTags}</div>` : ""}
      <div class="quick-action-buttons">
        <button class="quick-action-button minor" type="button" data-page-quick-action="minor" data-page="${escapeHtml(page)}">Mineur</button>
        <button class="quick-action-button medium" type="button" data-page-quick-action="medium" data-page="${escapeHtml(page)}">Moyenne</button>
        <button class="quick-action-button grave" type="button" data-page-quick-action="grave" data-page="${escapeHtml(page)}">Grave</button>
        <button class="quick-action-button clear" type="button" data-page-quick-clear="${escapeHtml(page)}">Effacer</button>
      </div>
    </div>
  `;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function getLearnedHalfPages(plan) {
  return Math.max(0, Math.min((plan.summary.currentHalfPage || 1) - 1, plan.summary.totalHalfPages || 0));
}

function getDashboardMetrics(payload) {
  const { plan, errorTracking } = payload;
  const presentKeys = plan.order.filter((key) => plan.blocks[key].present);
  const completedKeys = presentKeys.filter((key) => plan.blocks[key].done);
  const learnedHalfPages = getLearnedHalfPages(plan);
  const learnedPages = learnedHalfPages / 2;
  const waveCheckedCount = plan.blocks.new.present ? Number(plan.blocks.new.checkedCount || 0) : 9;
  const waveCompleteCount = plan.blocks.new.present
    ? (plan.blocks.new.waves || []).filter((wave) => wave.complete).length
    : 3;
  const dailyPercent = presentKeys.length ? (completedKeys.length / presentKeys.length) * 100 : 100;
  const learnedPercent = plan.summary.totalHalfPages ? (learnedHalfPages / plan.summary.totalHalfPages) * 100 : 0;
  const wavePercent = (waveCheckedCount / 9) * 100;
  const stablePercent =
    learnedPages > 0
      ? Math.max(0, 100 - (errorTracking.summary.pagesWithErrors / Math.max(learnedPages, 1)) * 100)
      : 100;

  return {
    presentKeys,
    completedKeys,
    learnedHalfPages,
    learnedPages,
    waveCheckedCount,
    waveCompleteCount,
    dailyPercent: clampPercent(dailyPercent),
    learnedPercent: clampPercent(learnedPercent),
    wavePercent: clampPercent(wavePercent),
    stablePercent: clampPercent(stablePercent),
  };
}

function getRankFromProgress(learnedPercent) {
  if (learnedPercent >= 100) {
    return {
      label: "Khatma",
      helper: "Tout le corpus est couvert.",
      tone: "emerald",
    };
  }
  if (learnedPercent >= 75) {
    return {
      label: "Endurant",
      helper: "La plus grande partie est deja memorisee.",
      tone: "gold",
    };
  }
  if (learnedPercent >= 50) {
    return {
      label: "Solide",
      helper: "Le milieu du parcours est bien engage.",
      tone: "sky",
    };
  }
  if (learnedPercent >= 25) {
    return {
      label: "Bati",
      helper: "Le socle du programme commence a etre dense.",
      tone: "clay",
    };
  }
  if (learnedPercent >= 10) {
    return {
      label: "En elan",
      helper: "Le rythme s'installe.",
      tone: "leaf",
    };
  }
  return {
    label: "Mise en route",
    helper: "Le programme prend forme jour apres jour.",
    tone: "leaf",
  };
}

function progressBarMarkup({ label, value, helper, tone = "green" }) {
  return `
    <article class="progress-card tone-${escapeHtml(tone)}">
      <div class="progress-card-head">
        <span class="eyebrow">${escapeHtml(label)}</span>
        <strong>${escapeHtml(`${clampPercent(value)}%`)}</strong>
      </div>
      <div class="progress-bar ${escapeHtml(tone)}">
        <span style="width: ${escapeHtml(clampPercent(value))}%"></span>
      </div>
      <p class="summary-note">${escapeHtml(helper)}</p>
    </article>
  `;
}

function getCelebrationLayer() {
  return $("#celebration-layer");
}

function launchMiniCelebration(origin) {
  const layer = getCelebrationLayer();
  if (!layer || !origin) {
    return;
  }

  const centerX = origin.left + origin.width / 2;
  const centerY = origin.top + origin.height / 2;
  const colors = ["#1d5b4f", "#b38946", "#5b7588", "#8f5e49", "#6e8d59"];

  for (let index = 0; index < 14; index += 1) {
    const piece = document.createElement("span");
    piece.className = "celebration-piece burst";
    piece.style.left = `${centerX}px`;
    piece.style.top = `${centerY}px`;
    piece.style.setProperty("--dx", `${(Math.random() - 0.5) * 170}px`);
    piece.style.setProperty("--dy", `${-40 - Math.random() * 120}px`);
    piece.style.setProperty("--rotation", `${(Math.random() - 0.5) * 540}deg`);
    piece.style.setProperty("--piece-color", colors[index % colors.length]);
    piece.style.animationDuration = `${700 + Math.random() * 380}ms`;
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), 1300);
  }
}

function launchGrandCelebration() {
  const layer = getCelebrationLayer();
  if (!layer) {
    return;
  }

  const colors = ["#1d5b4f", "#b38946", "#5b7588", "#8f5e49", "#6e8d59", "#f2d67b"];
  const width = window.innerWidth;

  for (let index = 0; index < 90; index += 1) {
    const piece = document.createElement("span");
    piece.className = "celebration-piece rain";
    piece.style.left = `${Math.random() * width}px`;
    piece.style.top = `${-20 - Math.random() * 160}px`;
    piece.style.setProperty("--dx", `${(Math.random() - 0.5) * 220}px`);
    piece.style.setProperty("--dy", `${window.innerHeight + 260 + Math.random() * 220}px`);
    piece.style.setProperty("--rotation", `${(Math.random() - 0.5) * 960}deg`);
    piece.style.setProperty("--piece-color", colors[index % colors.length]);
    piece.style.animationDuration = `${1800 + Math.random() * 1400}ms`;
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), 3600);
  }
}

function renderRouteProgress(plan) {
  let currentAssigned = false;

  $all("[data-route-key]").forEach((step) => {
    const blockKey = step.dataset.routeKey;
    const block = plan.blocks[blockKey];
    if (!block) {
      return;
    }

    const status = step.querySelector(".route-status");
    step.classList.remove("done", "current", "locked", "inactive");

    if (!block.present) {
      step.classList.add("inactive");
      if (status) {
        status.textContent = "Non requis";
      }
      return;
    }

    if (block.done) {
      step.classList.add("done");
      if (status) {
        status.textContent = "Valide";
      }
      return;
    }

    if (!currentAssigned) {
      currentAssigned = true;
      step.classList.add("current");
      if (status) {
        status.textContent = "En focus";
      }
      return;
    }

    step.classList.add("locked");
    if (status) {
      status.textContent = "En attente";
    }
  });
}

function statusMarkup(block) {
  if (!block.present) {
    return '<span class="status-pill empty">Indisponible</span>';
  }
  if (block.done) {
    return '<span class="status-pill done">Valide</span>';
  }
  if (block.locked) {
    return '<span class="status-pill locked">Verrouille</span>';
  }
  return '<span class="status-pill pending">A valider</span>';
}

function lockNoteMarkup(block) {
  if (!block.locked || !block.blockedByLabels || !block.blockedByLabels.length) {
    return "";
  }

  return `<p class="helper lock-note">Valide d'abord : ${escapeHtml(block.blockedByLabels.join(", "))}.</p>`;
}

function rangeBlockMarkup(range) {
  if (!range) {
    return '<div class="empty-note">Aucun bloc disponible pour cette section aujourd\'hui.</div>';
  }

  return `
    <div class="card-meta">
      <article class="mini-chip">
        <span class="eyebrow">Plage</span>
        <strong>${escapeHtml(range.label)}</strong>
      </article>
      <article class="mini-chip">
        <span class="eyebrow">Taille</span>
        <strong>${escapeHtml(range.countLabel || formatPageCountFromHalfPages(range.count))}</strong>
      </article>
    </div>
  `;
}

function toggleButtonMarkup(blockKey, block) {
  if (!block.present) {
    return "";
  }

  return `
    <button class="toggle-button" type="button" data-block-key="${escapeHtml(blockKey)}" ${block.locked && !block.done ? "disabled" : ""}>
      ${block.done ? "Annuler la validation" : "Marquer comme valide"}
    </button>
    ${lockNoteMarkup(block)}
  `;
}

function oldCardMarkup(block) {
  const windowsMarkup = (block.windows || [])
    .map((window) => {
      if (!window.range) {
        return "";
      }

      return `
        <article class="rotation-chip mini-window ${window.active ? "active-window" : ""}">
          <span class="eyebrow">${escapeHtml(window.label)}</span>
          <strong>${escapeHtml(window.range.label)}</strong>
          <p class="helper">${escapeHtml(window.range.countLabel)}</p>
        </article>
      `;
    })
    .join("");

  return `
    <article class="${cardClassName("old", block)}">
      <div class="card-body">
        <div class="card-head">
          <div>
            <p class="eyebrow">${block.order}. Ancien</p>
            <h2>Ancien</h2>
          </div>
          ${statusMarkup(block)}
        </div>
        <p class="helper">${escapeHtml(block.helper)}</p>
        ${rangeBlockMarkup(block.range)}
        ${
          block.present
            ? `
              <div class="rotation-grid">
                <article class="rotation-chip pool">
                  <span class="eyebrow">Pool ancien</span>
                  <strong>${escapeHtml(block.poolRange.label)}</strong>
                  <p class="helper">${escapeHtml(block.poolRange.countLabel)}</p>
                </article>
              </div>
              <div class="summary-lines">
                <p><strong>Roulement complet :</strong> ${escapeHtml(block.windowCount)} partie(s) equilibrees sur tout l'ancien &gt; 30 jours.</p>
              </div>
              <div class="old-windows-grid">
                ${windowsMarkup}
              </div>
            `
            : ""
        }
        ${toggleButtonMarkup("old", block)}
      </div>
    </article>
  `;
}

function simpleCardMarkup(blockKey, block) {
  return `
    <article class="${cardClassName(blockKey, block)}">
      <div class="card-body">
        <div class="card-head">
          <div>
            <p class="eyebrow">${block.order}. ${escapeHtml(block.title)}</p>
            <h2>${escapeHtml(block.title)}</h2>
          </div>
          ${statusMarkup(block)}
        </div>
        <p class="helper">${escapeHtml(block.helper)}</p>
        ${rangeBlockMarkup(block.range)}
        ${toggleButtonMarkup(blockKey, block)}
      </div>
    </article>
  `;
}

function consolidationCardMarkup(block) {
  const bandLabels = { A: "Partie 1", B: "Partie 2", C: "Partie 3" };
  const bands = ["A", "B", "C"].map((bandKey) => {
    const band = block.bands[bandKey];
    const isActive = block.activeBand === bandKey;
    return `
      <article class="band-chip ${isActive ? "active" : ""}">
        <span class="eyebrow">${escapeHtml(bandLabels[bandKey] || bandKey)}</span>
        <strong>${band ? escapeHtml(band.label) : "Aucune plage"}</strong>
        <p class="helper">${isActive ? "Partie active du jour" : "Partie inactive aujourd'hui"}</p>
      </article>
    `;
  });

  return `
    <article class="${cardClassName("consolidation", block)}">
      <div class="card-body">
        <div class="card-head">
          <div>
            <p class="eyebrow">${block.order}. Consolidation</p>
            <h2>Consolidation</h2>
          </div>
          ${statusMarkup(block)}
        </div>
        <p class="helper">${escapeHtml(block.helper)}</p>
        ${rangeBlockMarkup(block.fullRange)}
        ${
          block.fullRange
            ? `
              <div class="summary-lines">
                <p><strong>Partie concernee :</strong> revision des 30 derniers jours, sur la tranche J-8 a J-30.</p>
                <p><strong>Partie active aujourd'hui :</strong> ${escapeHtml(bandLabels[block.activeBand] || "-")}</p>
                <p><strong>Bloc a valider :</strong> ${escapeHtml(block.activeRange ? block.activeRange.label : "Aucun")}</p>
              </div>
              <div class="band-grid">${bands.join("")}</div>
            `
            : ""
        }
        ${toggleButtonMarkup("consolidation", block)}
      </div>
    </article>
  `;
}

function newCardMarkup(block) {
  const waveMoments = ["matin", "midi", "soir"];
  const waveCards = block.waves.map((wave, waveIndex) => {
    const slots = wave.slots.map((slot) => {
      return `
        <button
          class="slot-button ${slot.checked ? "active" : ""}"
          type="button"
          data-wave-index="${waveIndex}"
          data-slot-index="${slot.index}"
          ${block.locked ? "disabled" : ""}
        >
          ${escapeHtml(slot.label)}
        </button>
      `;
    });

    return `
      <article class="wave-card ${wave.complete ? "complete" : ""}">
        <div>
          <p class="eyebrow">${escapeHtml(`${wave.label} - ${waveMoments[waveIndex] || "journee"}`)}</p>
          <h3>${wave.complete ? "Complete" : "En cours"}</h3>
        </div>
        <div class="slot-grid">${slots.join("")}</div>
      </article>
    `;
  });

  return `
    <article class="${cardClassName("new", block)}">
      <div class="card-body">
        <div class="card-head">
          <div>
            <p class="eyebrow">${block.order}. Nouveau</p>
            <h2>Nouveau</h2>
          </div>
          ${statusMarkup(block)}
        </div>
        <p class="helper">${escapeHtml(block.helper)}</p>
        ${rangeBlockMarkup(block.range)}
        ${
          block.present
            ? `
              <div class="summary-lines">
                <p><strong>Validations completes :</strong> ${escapeHtml(block.checkedCount)} / 9</p>
                <p><strong>Regle :</strong> les 9 emplacements doivent etre valides pour clore le nouveau du jour.</p>
                ${block.locked && block.blockedByLabels?.length ? `<p><strong>Verrouille :</strong> valide d'abord ${escapeHtml(block.blockedByLabels.join(", "))}.</p>` : ""}
              </div>
              <div class="wave-grid">${waveCards.join("")}</div>
            `
            : ""
        }
      </div>
    </article>
  `;
}

function renderSummary(payload) {
  const { plan } = payload;
  const metrics = getDashboardMetrics(payload);
  const rank = getRankFromProgress(metrics.learnedPercent);

  $("#summary").innerHTML = `
    <div class="summary-hero">
      <article class="summary-progress tone-${escapeHtml(rank.tone)} ${plan.canAdvanceDay ? "complete" : ""}">
        <div class="summary-progress-head">
          <div class="summary-progress-copy">
            <span class="eyebrow">Progression</span>
            <strong>${escapeHtml(formatPageCountFromHalfPages(metrics.learnedHalfPages))} apprises</strong>
          </div>
          <span class="summary-progress-value">${escapeHtml(`${metrics.learnedPercent}%`)}</span>
        </div>
        <div class="summary-progress-track" aria-hidden="true">
          <span class="summary-progress-fill" style="width:${escapeHtml(metrics.learnedPercent)}%;"></span>
        </div>
        <p class="summary-progress-note">${escapeHtml(plan.summary.totalPages)} pages au total</p>
      </article>
      <div class="summary-grid">
        <article class="summary-chip">
          <span class="eyebrow">Jour</span>
          <strong>${escapeHtml(plan.summary.programDayIndex)}</strong>
        </article>
        <article class="summary-chip">
          <span class="eyebrow">Point actuel</span>
          <strong>${escapeHtml(plan.summary.currentHalfPageLabel)}</strong>
        </article>
        <article class="summary-chip">
          <span class="eyebrow">Nouveau / jour</span>
          <strong>${escapeHtml(plan.summary.dailyNewLabel)}</strong>
        </article>
      </div>
    </div>
  `;
}

function renderHero(payload) {
  const firstName = normalizeFirstName(payload?.settings?.firstName || "");
  $("#hero-title").innerHTML = firstName
    ? `Bismillah, voici ton plan du jour ${escapeHtml(firstName)} !&#10024;`
    : "Bismillah, voici ton plan du jour !&#10024;";
}

function renderDayStatus(payload) {
  const { plan } = payload;
  const metrics = getDashboardMetrics(payload);
  const missing = [];
  if (!plan.blocks.old.done) {
    missing.push("Ancien");
  }
  if (!plan.blocks.consolidation.done) {
    missing.push("Consolidation");
  }
  if (!plan.blocks.recent.done) {
    missing.push("Recent");
  }
  if (!plan.blocks.yesterday.done) {
    missing.push("Veille");
  }
  if (!plan.blocks.new.done) {
    missing.push("Nouveau");
  }

  $("#day-status").innerHTML = plan.canAdvanceDay
    ? `
        <strong>Journee complete.</strong>
        <div class="status-progress">
          <div class="progress-bar green large"><span style="width: 100%"></span></div>
          <p class="helper">${escapeHtml(metrics.completedKeys.length)} / ${escapeHtml(metrics.presentKeys.length)} blocs valides, le programme peut avancer.</p>
        </div>
        <p>Tu peux passer au lendemain. Le moteur fera avancer la demi-page actuelle et le jour du programme, puis recalculera automatiquement la rotation de l'ancien.</p>
      `
    : `
        <strong>Journee encore ouverte.</strong>
        <div class="status-progress">
          <div class="progress-bar gold large"><span style="width: ${escapeHtml(metrics.dailyPercent)}%"></span></div>
          <p class="helper">${escapeHtml(metrics.completedKeys.length)} / ${escapeHtml(metrics.presentKeys.length)} blocs valides pour aujourd'hui.</p>
        </div>
        <p>Il reste a valider : ${escapeHtml(missing.join(", "))}.</p>
      `;

  $("#advance-button").disabled = !plan.canAdvanceDay;
}

function renderErrorTracking(payload) {
  const totalPages = payload.errorTracking.totalPages;
  const summary = payload.errorTracking.summary;
  const pageErrors = payload.pageErrors || {};
  const plan = payload.plan || {};
  state.activePage =
    Number.isInteger(state.activePage) && state.activePage >= 1 && state.activePage <= totalPages ? state.activePage : null;

  renderProgramLegend(plan);

  const pageCells = [];
  let effectiveLearnedPages = 0;
  for (let page = 1; page <= totalPages; page += 1) {
    const entry = normalizePageEntry(pageErrors[String(page)]);
    const programZones = getPageProgramZones(plan, page);
    const effectiveLearned = entry.learned || isLearnedFromProgram(programZones);
    const programTags = programZones
      .map((zone) => `<span class="program-tag ${escapeHtml(zone.key)}">${escapeHtml(zone.shortLabel)}</span>`)
      .join("");
    const programTitleSuffix = programZones.length ? ` - ${programZones.map((zone) => zone.label).join(", ")}` : "";
    const stateLabel = buildPageStateLabel(entry, effectiveLearned);

    if (effectiveLearned) {
      effectiveLearnedPages += 1;
    }

    pageCells.push(`
      <button
        class="${escapeHtml(pageCellClass(entry, page, effectiveLearned, programZones))}"
        type="button"
        data-page-cell="${escapeHtml(page)}"
        data-severity="${escapeHtml(entry.dominantSeverity)}"
        data-learned="${escapeHtml(effectiveLearned)}"
        title="Page ${escapeHtml(page)} - ${escapeHtml(stateLabel)}${escapeHtml(programTitleSuffix)}"
      >
        <span class="page-cell-number">${escapeHtml(page)}</span>
        ${effectiveLearned ? '<span class="learned-badge">A</span>' : ""}
        <span class="page-cell-state">${escapeHtml(stateLabel)}</span>
        ${programTags ? `<span class="page-cell-program">${programTags}</span>` : ""}
        <span class="page-cell-counts">
          <span class="count-pill minor ${entry.errors.minor > 0 ? "filled" : ""}">V ${escapeHtml(entry.errors.minor)}</span>
          <span class="count-pill medium ${entry.errors.medium > 0 ? "filled" : ""}">M ${escapeHtml(entry.errors.medium)}</span>
          <span class="count-pill grave ${entry.errors.grave > 0 ? "filled" : ""}">G ${escapeHtml(entry.errors.grave)}</span>
        </span>
      </button>
    `);
  }

  $("#error-summary").innerHTML = `
    <article class="summary-chip error-summary-chip neutral">
      <span class="eyebrow">Pages avec erreurs</span>
      <strong>${escapeHtml(summary.pagesWithErrors)}</strong>
      <p class="summary-note">pages fragiles sur ${escapeHtml(totalPages)}.</p>
    </article>
    <article class="summary-chip error-summary-chip learned">
      <span class="eyebrow">Pages apprises</span>
      <strong>${escapeHtml(effectiveLearnedPages)}</strong>
      <p class="summary-note">inclut le marquage automatique jusqu'a la veille.</p>
    </article>
    <article class="summary-chip error-summary-chip minor">
      <span class="eyebrow">Mineur</span>
      <strong>${escapeHtml(summary.minor)}</strong>
      <p class="summary-note">occurrences de voyelles.</p>
    </article>
    <article class="summary-chip error-summary-chip medium">
      <span class="eyebrow">Moyenne</span>
      <strong>${escapeHtml(summary.medium)}</strong>
      <p class="summary-note">occurrences dans un mot.</p>
    </article>
    <article class="summary-chip error-summary-chip grave">
      <span class="eyebrow">Grave</span>
      <strong>${escapeHtml(summary.grave)}</strong>
      <p class="summary-note">occurrences de blocage ou oubli.</p>
    </article>
  `;

  renderPageQuickActions(payload);
  $("#error-grid").innerHTML = pageCells.join("");
}

function renderCards(payload) {
  const { blocks, order } = payload.plan;
  const markup = order.map((blockKey) => {
    if (blockKey === "old") {
      return oldCardMarkup(blocks[blockKey]);
    }
    if (blockKey === "consolidation") {
      return consolidationCardMarkup(blocks[blockKey]);
    }
    if (blockKey === "new") {
      return newCardMarkup(blocks[blockKey]);
    }
    return simpleCardMarkup(blockKey, blocks[blockKey]);
  });

  $("#cards").innerHTML = markup.join("");
}

function fillForm(payload) {
  $("#first-name").value = payload.settings.firstName || "";
  $("#current-page").value = getCurrentPageFromHalfPage(payload.progress.currentHalfPage, payload.settings.totalHalfPages);
  $("#current-half").value = getCurrentHalfLabelFromHalfPage(payload.progress.currentHalfPage, payload.settings.totalHalfPages);
  $("#daily-new-half-pages").value = payload.settings.dailyNewHalfPages;
  $("#program-day-index").value = payload.progress.programDayIndex;
  $("#total-half-pages").value = payload.settings.totalHalfPages;
  syncCurrentPageMax();
}

function bindPageCellSelection() {
  $all("[data-page-cell]").forEach((button) => {
    button.addEventListener("click", () => {
      const page = Number(button.dataset.pageCell);
      state.activePage = state.activePage === page ? null : page;
      renderErrorTracking(state.payload);
      bindPageQuickActions();
      bindPageCellSelection();
      showToast(state.activePage ? `Page ${page} selectionnee.` : `Page ${page} fermee.`);
    });
  });
}

function bindPageQuickActions() {
  $all("[data-page-quick-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        state.payload = await api("/api/page-errors", {
          method: "POST",
          body: JSON.stringify({
            page: Number(button.dataset.page),
            severity: String(button.dataset.pageQuickAction || ""),
          }),
        });
        render();
        showToast(`Erreur ${button.textContent.toLowerCase()} ajoutee a la page ${button.dataset.page}.`);
      } catch (error) {
        showToast(error.message, true);
      }
    });
  });

  $all("[data-page-quick-clear]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        state.payload = await api("/api/page-errors/clear", {
          method: "POST",
          body: JSON.stringify({
            page: Number(button.dataset.pageQuickClear),
          }),
        });
        render();
        showToast(`Erreurs retirees de la page ${button.dataset.pageQuickClear}.`);
      } catch (error) {
        showToast(error.message, true);
      }
    });
  });

  $all("[data-clear-active-page]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activePage = null;
      renderErrorTracking(state.payload);
      bindPageQuickActions();
      bindPageCellSelection();
    });
  });
}

function bindDynamicActions() {
  $all("[data-block-key]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const origin = button.getBoundingClientRect();
        const blockKey = button.dataset.blockKey;
        const wasDone = Boolean(state.payload?.plan?.blocks?.[blockKey]?.done);
        const wasComplete = Boolean(state.payload?.plan?.canAdvanceDay);
        state.payload = await api("/api/toggle-block", {
          method: "POST",
          body: JSON.stringify({ blockKey }),
        });
        render();
        const isDone = Boolean(state.payload?.plan?.blocks?.[blockKey]?.done);
        const isComplete = Boolean(state.payload?.plan?.canAdvanceDay);
        if (!wasDone && isDone) {
          launchMiniCelebration(origin);
        }
        if (!wasComplete && isComplete) {
          launchGrandCelebration();
        }
      } catch (error) {
        showToast(error.message, true);
      }
    });
  });

  $all("[data-wave-index]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const origin = button.getBoundingClientRect();
        const waveIndex = Number(button.dataset.waveIndex);
        const slotIndex = Number(button.dataset.slotIndex);
        const wasChecked = Boolean(state.payload?.plan?.blocks?.new?.waves?.[waveIndex]?.slots?.[slotIndex]?.checked);
        const wasComplete = Boolean(state.payload?.plan?.canAdvanceDay);
        state.payload = await api("/api/toggle-wave-slot", {
          method: "POST",
          body: JSON.stringify({
            waveIndex,
            slotIndex,
          }),
        });
        render();
        const isChecked = Boolean(state.payload?.plan?.blocks?.new?.waves?.[waveIndex]?.slots?.[slotIndex]?.checked);
        const isComplete = Boolean(state.payload?.plan?.canAdvanceDay);
        if (!wasChecked && isChecked) {
          launchMiniCelebration(origin);
        }
        if (!wasComplete && isComplete) {
          launchGrandCelebration();
        }
      } catch (error) {
        showToast(error.message, true);
      }
    });
  });

  bindPageQuickActions();
  bindPageCellSelection();
}

function render() {
  document.body.classList.toggle("day-complete", Boolean(state.payload?.plan?.canAdvanceDay));
  renderHero(state.payload);
  renderSummary(state.payload);
  renderDayStatus(state.payload);
  renderErrorTracking(state.payload);
  renderCards(state.payload);
  fillForm(state.payload);
  setActiveView(state.activeView);
  renderRouteProgress(state.payload.plan);
  bindDynamicActions();
}

function bindStaticActions() {
  $("#config-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      state.payload = await api("/api/config", {
        method: "POST",
        body: JSON.stringify({
          settings: {
            firstName: $("#first-name").value,
            dailyNewHalfPages: Number($("#daily-new-half-pages").value),
            totalHalfPages: Number($("#total-half-pages").value),
          },
          progress: {
            currentHalfPage: getCurrentHalfPageFromForm(),
            programDayIndex: Number($("#program-day-index").value),
          },
        }),
      });
      render();
      showToast("Journee recalculee.");
    } catch (error) {
      showToast(error.message, true);
    }
  });

  $("#reset-button").addEventListener("click", async () => {
    try {
      state.payload = await api("/api/reset-today", { method: "POST" });
      render();
      showToast("Validations du jour reinitialisees.");
    } catch (error) {
      showToast(error.message, true);
    }
  });

  $("#advance-button").addEventListener("click", async () => {
    try {
      state.payload = await api("/api/advance-day", { method: "POST" });
      render();
      showToast("Passage au jour suivant.");
    } catch (error) {
      showToast(error.message, true);
    }
  });

  $all("[data-view-target]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveView(button.dataset.viewTarget);
    });
  });

  $("#total-half-pages").addEventListener("input", () => {
    syncCurrentPageMax();
  });

  $("#current-page").addEventListener("change", () => {
    syncCurrentPageMax();
  });
}

async function init() {
  bindStaticActions();
  state.payload = await api("/api/state");
  render();
}

window.addEventListener("DOMContentLoaded", () => {
  init().catch((error) => showToast(error.message, true));
});
