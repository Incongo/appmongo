const path = require("path");

function getRootPath() {
  return path.resolve(__dirname, "../..");
}

function getScriptPath(relativePath) {
  return path.resolve(getRootPath(), relativePath);
}

module.exports = {
  getRootPath,
  getScriptPath,
};
