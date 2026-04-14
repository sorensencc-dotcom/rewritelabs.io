// FILE: C:\Users\soren\rewritelabs.io\discovery\ecosystem.config.cjs

module.exports = {
  apps: [
    // ...existing apps...
    {
      name: "discovery-ai",
      script: "./ai/index.js",
      env: {
        GEMMA_API_KEY: "REPLACE_ME",
        PORT: 4020
      }
    }
  ]
};