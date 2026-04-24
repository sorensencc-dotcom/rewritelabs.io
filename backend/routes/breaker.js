const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json(req.state.breaker.getState());
});

router.post("/trip", (req, res) => {
  req.state.breaker.forceTrip("manual");
  res.json(req.state.breaker.getState());
});

router.post("/reset", (req, res) => {
  req.state.breaker.forceReset();
  res.json(req.state.breaker.getState());
});

module.exports = router;
