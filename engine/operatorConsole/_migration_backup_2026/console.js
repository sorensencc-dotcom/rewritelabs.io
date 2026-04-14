// File: engine/operatorConsole/public/console.js

function fmtTime(ts) {
  if (!ts) return "–";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return d.toLocaleString();
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// -----------------------------
// OSM STATUS
// -----------------------------
async function refreshOSM() {
  const badge = document.getElementById("osm-status-badge");
  try {
    const data = await fetchJSON("/api/osm/status");

    document.getElementById("osm-cache-size").textContent = data.cacheSize ?? "0";
    document.getElementById("osm-qps").textContent = data.qps ?? "–";
    document.getElementById("osm-last-request").textContent = fmtTime(data.lastRequestAt);
    document.getElementById("osm-raw").textContent = JSON.stringify(data, null, 2);

    badge.textContent = "ok";
    badge.classList.remove("badge-warn");
    badge.classList.add("badge-ok");
  } catch (err) {
    document.getElementById("osm-raw").textContent = `Error: ${err.message}`;
    badge.textContent = "error";
    badge.classList.remove("badge-ok");
    badge.classList.add("badge-warn");
  }
}

// -----------------------------
// SWEEPER STATUS (SUMMARY)
// -----------------------------
async function refreshSweeper() {
  const badge = document.getElementById("sweeper-status-badge");
  try {
    const data = await fetchJSON("/api/sweeper/status");

    document.getElementById("sweeper-last-run").textContent = fmtTime(data.lastRun);
    document.getElementById("sweeper-last-zip").textContent = data.lastZip ?? "–";
    document.getElementById("sweeper-last-category").textContent = data.lastCategory ?? "–";
    document.getElementById("sweeper-raw").textContent = JSON.stringify(data, null, 2);

    badge.textContent = data.lastRun ? "recent" : "idle";
    badge.classList.remove("badge-warn");
    badge.classList.add("badge-ok");
  } catch (err) {
    document.getElementById("sweeper-raw").textContent = `Error: ${err.message}`;
    badge.textContent = "error";
    badge.classList.remove("badge-ok");
    badge.classList.add("badge-warn");
  }
}

// -----------------------------
// LOGS
// -----------------------------
async function refreshLogs() {
  try {
    const data = await fetchJSON("/api/logs/recent");
    const el = document.getElementById("logs-raw");
    el.textContent = data
      .map(entry => `[${entry.level || "info"}] ${entry.ts || ""} ${entry.msg || ""}`)
      .join("\n");
  } catch (err) {
    document.getElementById("logs-raw").textContent = `Error: ${err.message}`;
  }
}

// -----------------------------
// CLOCK
// -----------------------------
function tickClock() {
  const el = document.getElementById("clock");
  el.textContent = new Date().toLocaleTimeString();
}

// -----------------------------
// ZIP HEATMAP
// -----------------------------
function renderZipHeatmap(zipMetrics) {
  const container = document.getElementById("zipHeatmap");
  if (!container) return;

  container.innerHTML = "";

  const entries = Object.entries(zipMetrics || {});
  if (entries.length === 0) {
    container.textContent = "No data yet.";
    return;
  }

  const maxCount = Math.max(...entries.map(([_, m]) => m.lastCount || 0), 1);

  entries
    .sort((a, b) => (b[1].lastCount || 0) - (a[1].lastCount || 0))
    .forEach(([zip, m]) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.marginBottom = "4px";

      const label = document.createElement("div");
      label.style.width = "70px";
      label.style.fontSize = "11px";
      label.textContent = zip;

      const barOuter = document.createElement("div");
      barOuter.style.flex = "1";
      barOuter.style.height = "12px";
      barOuter.style.background = "var(--bg-elevated-strong)";
      barOuter.style.borderRadius = "4px";
      barOuter.style.overflow = "hidden";
      barOuter.style.marginLeft = "6px";

      const barInner = document.createElement("div");
      const pct = maxCount > 0 ? (m.lastCount / maxCount) * 100 : 0;
      barInner.style.width = `${pct}%`;
      barInner.style.height = "100%";
      barInner.style.background = "var(--accent)";

      barOuter.appendChild(barInner);

      const value = document.createElement("div");
      value.style.width = "40px";
      value.style.fontSize = "11px";
      value.style.textAlign = "right";
      value.style.marginLeft = "6px";
      value.textContent = m.lastCount;

      row.appendChild(label);
      row.appendChild(barOuter);
      row.appendChild(value);

      container.appendChild(row);
    });
}

// -----------------------------
// CATEGORY DISTRIBUTION
// -----------------------------
function renderCategoryChart(categoryStats) {
  const container = document.getElementById("categoryChart");
  if (!container) return;

  container.innerHTML = "";

  const entries = Object.entries(categoryStats || {});
  if (entries.length === 0) {
    container.textContent = "No data yet.";
    return;
  }

  const maxTotal = Math.max(...entries.map(([_, m]) => m.totalCount || 0), 1);

  entries
    .sort((a, b) => (b[1].totalCount || 0) - (a[1].totalCount || 0))
    .forEach(([cat, m]) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.marginBottom = "4px";

      const label = document.createElement("div");
      label.style.width = "110px";
      label.style.fontSize = "11px";
      label.textContent = cat;

      const barOuter = document.createElement("div");
      barOuter.style.flex = "1";
      barOuter.style.height = "12px";
      barOuter.style.background = "var(--bg-elevated-strong)";
      barOuter.style.borderRadius = "4px";
      barOuter.style.overflow = "hidden";
      barOuter.style.marginLeft = "6px";

      const barInner = document.createElement("div");
      const pct = maxTotal > 0 ? (m.totalCount / maxTotal) * 100 : 0;
      barInner.style.width = `${pct}%`;
      barInner.style.height = "100%";
      barInner.style.background = "var(--accent-soft)";

      barOuter.appendChild(barInner);

      const value = document.createElement("div");
      value.style.width = "50px";
      value.style.fontSize = "11px";
      value.style.textAlign = "right";
      value.style.marginLeft = "6px";
      value.textContent = m.totalCount;

      row.appendChild(label);
      row.appendChild(barOuter);
      row.appendChild(value);

      container.appendChild(row);
    });
}

// -----------------------------
// NEXT‑LEVEL METRICS PANELS
// -----------------------------
async function loadNextLevelPanels() {
  try {
    // Sweeper status + metrics
    const sweeper = await fetchJSON("/api/sweeper/status");
    const p = sweeper.progress || {};

    const pct = p.totalJobs > 0
      ? Math.round((p.completedJobs / p.totalJobs) * 100)
      : 0;

    const bar = document.getElementById("progressBar");
    if (bar) bar.style.width = pct + "%";

    const details = document.getElementById("progressDetails");
    if (details) {
      details.innerHTML = `
        <div><strong>${pct}%</strong> complete</div>
        <div>Current ZIP: ${p.currentZip || "–"}</div>
        <div>Current Category: ${p.currentCategory || "–"}</div>
        <div>Completed: ${p.completedJobs} / ${p.totalJobs}</div>
      `;
    }

    // Per-ZIP metrics table
    const zipBody = document.querySelector("#zipMetricsTable tbody");
    if (zipBody) {
      zipBody.innerHTML = "";
      Object.entries(sweeper.zipMetrics || {}).forEach(([zip, m]) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${zip}</td>
          <td>${m.runs}</td>
          <td>${m.lastDurationMs}</td>
          <td>${m.lastCount}</td>
        `;
        zipBody.appendChild(row);
      });
    }

    // Category stats table
    const catBody = document.querySelector("#categoryStatsTable tbody");
    if (catBody) {
      catBody.innerHTML = "";
      Object.entries(sweeper.categoryStats || {}).forEach(([cat, m]) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${cat}</td>
          <td>${m.runs}</td>
          <td>${m.totalCount}</td>
        `;
        catBody.appendChild(row);
      });
    }

    // ZIP heatmap + category chart
    renderZipHeatmap(sweeper.zipMetrics || {});
    renderCategoryChart(sweeper.categoryStats || {});

    // OSM timings
    const timings = await fetchJSON("/api/osm/timings");
    const tBody = document.querySelector("#osmTimingsTable tbody");
    if (tBody) {
      tBody.innerHTML = "";
      timings.slice(0, 20).forEach(t => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${fmtTime(t.ts)}</td>
          <td>${t.zip}</td>
          <td>${t.category}</td>
          <td>${t.durationMs}</td>
        `;
        tBody.appendChild(row);
      });
    }
document.getElementById("btn-start-sweep").onclick = () => {
  fetch("/api/sweeper/run", { method: "POST" });
};
    // Recent errors
    const errors = await fetchJSON("/api/errors/recent");
    const errList = document.getElementById("errorList");
    if (errList) {
      errList.innerHTML = "";
      errors.forEach(e => {
        const li = document.createElement("li");
        li.textContent = `${fmtTime(e.ts)} — [${e.zip}/${e.category}] ${e.message}`;
        errList.appendChild(li);
      });
    }

    // Redis status
    const redis = await fetchJSON("/api/redis/status");
    const redisBlock = document.getElementById("redisStatusBlock");
    if (redisBlock) {
      redisBlock.textContent = JSON.stringify(redis, null, 2);
    }

  } catch (err) {
    console.error("Failed to load next-level panels:", err);
  }
}

// -----------------------------
// WIRING
// -----------------------------
document.getElementById("btn-refresh-all").addEventListener("click", () => {
  refreshOSM();
  refreshSweeper();
  refreshLogs();
  loadNextLevelPanels();
});

setInterval(refreshOSM, 5000);
setInterval(refreshSweeper, 5000);
setInterval(refreshLogs, 7000);
setInterval(loadNextLevelPanels, 3000);
setInterval(tickClock, 1000);

refreshOSM();
refreshSweeper();
refreshLogs();
loadNextLevelPanels();
tickClock();