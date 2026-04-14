// Rewrite Labs Operator Console UI Loader

async function loadJSON(url) {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (err) {
    return { error: true, message: err.message };
  }
}

// ------------------------------
// OSM Engine Panel
// ------------------------------
async function updateOSM() {
  const el = document.getElementById("osm-status");
  const data = await loadJSON("/api/osm/status");

  if (data.error) {
    el.textContent = "Error loading OSM status";
    return;
  }

  el.innerHTML = `
    <div>Cache Size: ${data.cacheSize}</div>
    <div>Last Request: ${data.lastRequestAt || "none"}</div>
    <div>QPS: ${data.qps || "n/a"}</div>
    <div>Regions Loaded: ${data.bboxRegionsLoaded.length}</div>
  `;
}

// ------------------------------
// Sweeper Panel
// ------------------------------
async function updateSweeper() {
  const el = document.getElementById("sweeper-status");
  const data = await loadJSON("/api/sweeper/status");

  if (data.error) {
    el.textContent = "Error loading sweeper status";
    return;
  }

  el.innerHTML = `
    <div>Last Run: ${data.lastRun || "none"}</div>
    <div>Last ZIP: ${data.lastZip || "n/a"}</div>
    <div>Last Category: ${data.lastCategory || "n/a"}</div>
    <div>Progress: ${data.progress || "0%"}</div>
  `;
}

// ------------------------------
// Logs Panel
// ------------------------------
async function updateLogs() {
  const el = document.getElementById("logs");
  const data = await loadJSON("/api/logs/recent");

  if (!Array.isArray(data)) {
    el.textContent = "Error loading logs";
    return;
  }

  el.innerHTML = data
    .slice(-20)
    .map((l) => `<div class="log-line">${l}</div>`)
    .join("");
}

// ------------------------------
// Refresh Loop
// ------------------------------
function tick() {
  updateOSM();
  updateSweeper();
  updateLogs();
}

setInterval(tick, 2000);
tick();
