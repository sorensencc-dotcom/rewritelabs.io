// File: discover-all.js

import { discoverFromYelp } from "./engine/discovery/yelpDiscovery.js";
import { discoverFromYellowPages } from "./engine/discovery/yellowPagesDiscovery.js";
import { discoverFromOSM } from "./engine/discovery/osmDiscovery.js";
import { discoverFromGooglePlaces } from "./engine/discovery/googlePlacesDiscovery.js";

async function main() {
  await discoverFromYelp({ city: "Tampa", state: "FL", category: "plumber" });
  await discoverFromYellowPages({ city: "Tampa", state: "FL", category: "plumber" });
  await discoverFromOSM({ city: "Tampa", state: "FL" });
  await discoverFromGooglePlaces({
    city: "Tampa",
    state: "FL",
    category: "plumber",
    maxResults: 30,
  });
}

main();