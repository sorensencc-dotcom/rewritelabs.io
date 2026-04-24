module.exports = function rewritelabsTools({ queue }) {
  return {
    "rewritelabs.scan": async ({ url }) => {
      const job = queue.newJob({ type: "scan", region: url });
      queue.setStatus(job.id, "completed");
      return { jobId: job.id, findings: ["placeholder"] };
    },

    "rewritelabs.rewrite": async ({ url }) => {
      const job = queue.newJob({ type: "rewrite", region: url });
      queue.setStatus(job.id, "completed");
      return { jobId: job.id, html: "<html>rewritten</html>" };
    }
  };
};
