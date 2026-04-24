export default {
  testEnvironment: "node",

  // Excluir temporales de Stryker
  modulePathIgnorePatterns: ["<rootDir>/.stryker-tmp"],

  // Cobertura de código
  collectCoverage: false, // activar con --coverage en CLI
  collectCoverageFrom: [
    "src/services/**/*.js",
    "src/routes/**/*.js",
    "!src/**/*.test.js",
    "!src/**/*.spec.js",
  ],
  coverageReporters: ["text", "lcov", "html"],
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: {
      branches:   70,
      functions:  80,
      lines:      80,
      statements: 80,
    },
  },

  // Supertest necesita que el módulo de la app no escuche en el mismo puerto
  // entre tests. Asegúrate de que server.js exporte `app` sin llamar .listen()
  // cuando NODE_ENV=test.
  testTimeout: 15000,

  // Patrón de archivos de test
  testMatch: [
    "**/*.test.js",
  ],
};