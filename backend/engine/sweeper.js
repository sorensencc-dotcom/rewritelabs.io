async function runSweep({ region, shardIndex = 0, shardCount = 1 }) {
  // placeholder: real logic later
  await new Promise(r => setTimeout(r, 250));
  return {
    region,
    shardIndex,
    shardCount,
    processed: 10,
    total: 10,
    success: true
  };
}

module.exports = { runSweep };