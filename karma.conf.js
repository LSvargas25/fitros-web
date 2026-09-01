// Karma configuration for the `@angular/build:unit-test` karma runner.
// The whole spec suite is authored against the Jasmine API, so the project
// runs its unit tests under Karma + Jasmine rather than the builder's
// default Vitest runner. See angular.json -> architect.test.
const fs = require('fs');

// karma-chrome-launcher starts `ChromeHeadless` from `process.env.CHROME_BIN`.
// This machine has no Google Chrome installed; Edge is Chromium-based and works
// as a drop-in. Prefer a real Chrome when present (e.g. CI), fall back to Edge.
if (!process.env.CHROME_BIN) {
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (found) {
    process.env.CHROME_BIN = found;
  }
}

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
    ],
    client: {
      jasmine: {},
      clearContext: false,
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['ChromeHeadlessCI'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
      },
    },
    restartOnFileChange: true,
    singleRun: true,
    // Edge/Chrome headless can be slow to report on the first spawn; keep it
    // from being declared dead mid-run.
    browserNoActivityTimeout: 120000,
    browserDisconnectTimeout: 30000,
    browserDisconnectTolerance: 2,
    captureTimeout: 120000,
  });
};
