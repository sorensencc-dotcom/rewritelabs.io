const state = {
  tripped: false,
  reason: null,
  lastErrorAt: null,
  errorWindow: [],
  windowMs: 5 * 60 * 1000,
  threshold: 10,
  cooldownMs: 5 * 60 * 1000
};

function recordError() {
  const now = Date.now();
  state.errorWindow.push(now);
  state.errorWindow = state.errorWindow.filter(t => now - t <= state.windowMs);
  state.lastErrorAt = now;

  if (!state.tripped && state.errorWindow.length >= state.threshold) {
    state.tripped = true;
    state.reason = `error threshold ${state.threshold} in ${state.windowMs}ms`;
  }
}

function maybeRecover() {
  if (!state.tripped) return;
  const now = Date.now();
  if (state.lastErrorAt && now - state.lastErrorAt >= state.cooldownMs) {
    state.tripped = false;
    state.reason = null;
    state.errorWindow = [];
  }
}

function forceTrip(reason = "manual") {
  state.tripped = true;
  state.reason = reason;
}

function forceReset() {
  state.tripped = false;
  state.reason = null;
  state.errorWindow = [];
  state.lastErrorAt = null;
}

function getState() {
  maybeRecover();
  return { ...state };
}

module.exports = {
  recordError,
  maybeRecover,
  forceTrip,
  forceReset,
  getState
};