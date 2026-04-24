const express = require("express");
const router = express.Router();

router.post("/run", async (req, res) => {
  const { region } = req.body || {};
  if (!region) return res.status(400).json({ error: "region required" });

  const result = await req.state.sweeper.runSweep({ region });
  res.json(result);
});

module.exports = router;
