const state = {
  totalRuns: 0,
  totalSuccess: 0,
  totalFailure: 0,
  lastRunAt: null
};

function recordRun({ success }) {
  state.totalRuns += 1;
  if (success) state.totalSuccess += 1;
  else state.totalFailure += 1;
  state.lastRunAt = Date.now();
}

function getMetrics() {
  return { ...state };
}

module.exports = { recordRun, getMetrics };
