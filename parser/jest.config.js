/* eslint-disable no-undef */
module.exports = {
    coverageDirectory: "coverage",
    testEnvironment: "node",
    "roots": [
        "tests"
    ],
    testMatch: [
        "**/tests/**/*.+(ts|tsx|js)",
        "**/?(*.)+(spec|test).+(ts|tsx|js)"
    ],
    maxWorkers: "10%",
        // "transform": {
        //     "^.+\\.(ts|tsx)?$": "ts-jest"
        // },
};