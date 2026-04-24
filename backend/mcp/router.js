const express = require("express");

module.exports = function router(tools) {
  const r = express.Router();

  r.post("/call", async (req, res) => {
    const { tool, params } = req.body || {};
    if (!tool || !tools[tool]) {
      return res.status(400).json({ error: "unknown tool" });
    }

    try {
      const result = await tools[tool](params || {});
      res.json({ result });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  return r;
};
