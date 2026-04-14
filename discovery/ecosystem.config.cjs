// FILE: C:\Users\soren\rewritelabs.io\discovery\ecosystem.config.cjs

module.exports = {
  apps: [
    // ...existing apps...
    {
      name: "discovery-deployer",
      script: "./deployer/index.js",
      env: {
        POSTGRES_URL: "postgres://postgres:postgres@localhost:5432/discovery",
        REDIS_HOST: "localhost",
        REDIS_PORT: "6379",
        PORT: 4015
      }
    }
  ]
};