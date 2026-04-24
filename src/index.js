export async function index(resolvedItem) {
  // Minimal indexer stub — assigns ID and timestamp
  return {
    ...resolvedItem,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  };
}
