const router = require("./router");
const googleDriveTools = require("./tools/google-drive");
const rewritelabsTools = require("./tools/rewritelabs");
const systemTools = require("./tools/system");

module.exports = function initMcp(app, state) {
  const tools = {
    ...googleDriveTools(state),
    ...rewritelabsTools(state),
    ...systemTools(state)
  };

  app.use("/mcp", router(tools));
};
