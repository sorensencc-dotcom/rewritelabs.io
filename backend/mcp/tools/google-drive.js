module.exports = function googleDriveTools({ queue, sweeper }) {
  return {
    "google.drive.sweep": async ({ region }) => {
      const job = queue.newJob({ type: "drive-sweep", region });
      queue.setStatus(job.id, "running");

      const result = await sweeper.runSweep({ region });
      queue.updateProgress(job.id, { processed: result.processed, total: result.total });
      queue.setStatus(job.id, "completed");

      return { jobId: job.id, result };
    }
  };
};
