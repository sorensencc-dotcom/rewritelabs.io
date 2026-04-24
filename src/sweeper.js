export async function sweep(items) {
  return items.map(i => ({ ...i, normalized: true }));
}
