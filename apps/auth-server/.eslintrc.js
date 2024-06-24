const { ignorePatterns } = require("../../eslintrc");

module.exports = {
  extends: "@snlacks/config/eslintrc.js",
  ignorePatterns: ["_gmail-init.js", "prettierrc.js"]
}