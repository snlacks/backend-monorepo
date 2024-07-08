
module.exports = {
  extends: "../../packages/config/.eslintrc.js",
  ignorePatterns: ["_gmail-init.js", "prettierrc.js"],
  parserOptions: {
    project: '../tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
}