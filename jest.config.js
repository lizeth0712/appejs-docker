module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverage: true,
  coverageReporters: ["text", "lcov", "cobertura"],
  coverageDirectory: "coverage",
  moduleNameMapper: { "^bcrypt$": "bcryptjs" }
};
