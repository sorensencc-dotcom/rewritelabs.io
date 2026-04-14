import { discoverLocalBusinesses } from "./engine/localBusinessDiscovery.js";

async function main() {
  const result = await discoverLocalBusinesses({
    city: "Tampa",
    state: "FL",
    category: "plumber",
    maxResults: 50
  });

  console.log("Discovery result:", result);
}

main();