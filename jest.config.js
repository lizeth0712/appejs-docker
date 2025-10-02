// jest.config.js
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverage: true,
  coverageReporters: ["text", "lcov", "cobertura"],
  coverageDirectory: "coverage",
  moduleNameMapper: {
    "^bcrypt$": "bcryptjs",
    "\\.(css|png|jpg|jpeg)$": "<rootDir>/tests/__mocks__/fileMock.js"
  }
};
