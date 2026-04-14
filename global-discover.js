import { sweepGlobal } from "./engine/discovery/globalSweeper.js";

await sweepGlobal({
  citiesUS: [{ city: "Tampa", state: "FL" }],
  citiesUK: ["London"],
});