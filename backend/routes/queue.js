const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json(req.state.queue.getJobs());
});

router.get("/summary", (req, res) => {
  res.json(req.state.queue.summary());
});

router.post("/clear", (req, res) => {
  req.state.queue.clear();
  res.json({ ok: true });
});

module.exports = router;
