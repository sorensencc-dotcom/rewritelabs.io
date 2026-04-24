const { randomUUID } = require("crypto");

const jobs = new Map();

function newJob({ region, shardIndex = 0, shardCount = 1, total = 0, type = "sweep" }) {
  const id = randomUUID();
  const now = Date.now();

  const job = {
    id,
    type,
    region,
    shardIndex,
    shardCount,
    status: "queued",
    processed: 0,
    total,
    created: now,
    updated: now,
    meta: {}
  };

  jobs.set(id, job);
  return job;
}

function getJob(id) {
  return jobs.get(id) || null;
}

function getJobs(status) {
  let list = Array.from(jobs.values());
  if (status) list = list.filter(j => j.status === status);
  return list.sort((a, b) => a.created - b.created);
}

function setStatus(id, status) {
  const job = getJob(id);
  if (!job) return null;
  job.status = status;
  job.updated = Date.now();
  return job;
}

function updateProgress(id, { processed, total }) {
  const job = getJob(id);
  if (!job) return null;
  if (typeof processed === "number") job.processed = processed;
  if (typeof total === "number") job.total = total;
  job.updated = Date.now();
  return job;
}

function incrementProcessed(id, by = 1) {
  const job = getJob(id);
  if (!job) return null;
  job.processed = Math.max(0, job.processed + by);
  job.updated = Date.now();
  return job;
}

function removeJob(id) {
  return jobs.delete(id);
}

function clear() {
  jobs.clear();
}

function summary() {
  const list = Array.from(jobs.values());
  const total = list.length;
  const byStatus = list.reduce((acc, j) => {
    acc[j.status] = (acc[j.status] || 0) + 1;
    return acc;
  }, {});
  return { total, byStatus };
}

module.exports = {
  newJob,
  getJob,
  getJobs,
  setStatus,
  updateProgress,
  incrementProcessed,
  removeJob,
  clear,
  summary
};