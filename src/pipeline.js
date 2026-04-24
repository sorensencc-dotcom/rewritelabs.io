import { runEnumerator } from "./enumerator.js";
import { sweep } from "./sweeper.js";
import { resolve } from "./resolver.js";
import { index } from "./index.js";

export async function runPipeline(opts = {}) {
  try {
    if (opts.forceError) throw new Error("Forced error");

    const enumerated = await runEnumerator();
    const swept = await sweep(enumerated);
    const resolved = await Promise.all(swept.map(resolve));
    const indexed = await Promise.all(resolved.map(index));

    return {
      success: true,
      items: indexed
    };
  } catch (err) {
    return {
      success: false,
      errorHandled: true,
      message: err.message
    };
  }
}
