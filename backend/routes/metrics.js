const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json(req.state.metrics.getMetrics());
});

module.exports = router;
