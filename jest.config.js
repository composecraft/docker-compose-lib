/** @type {import('ts-jest').JestConfigWithTsJest} **/
const { pathsToModuleNameMapper } = require("ts-jest");

module.exports = {
    testEnvironment: "node",
    moduleNameMapper: pathsToModuleNameMapper(
        {
            "@commons/*": ["./src/commons/*"],
            "@compose/*": ["./src/compose/*"],
        },
        { prefix: "<rootDir>/" },
    ),
    moduleDirectories: ["node_modules", "src"],
    testPathIgnorePatterns: ["/node_modules/", "/lib/"],
    transform: {
        "^.+.tsx?$": ["ts-jest", {}],
    },
    collectCoverage: true,
    collectCoverageFrom: [
        '**/*.{ts,js}',
        '!**/node_modules/**',
        '!**/lib/**',
        '!**/cov/**',
        '!**/testReal/**',
    ],
    coverageReporters: ['lcov'],
    coverageDirectory: "./cov"
};
