const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const configJs = fs.readFileSync(path.join(repoRoot, "assets", "site-config.js"), "utf8");
const commonJs = fs.readFileSync(path.join(repoRoot, "assets", "common.js"), "utf8");
const messagesJs = fs.readFileSync(path.join(repoRoot, "assets", "messages.js"), "utf8");

test("test mode config exists and is disabled by default", () => {
  assert.ok(configJs.includes("TEST_MODE: false"));
  assert.ok(commonJs.includes("window.spIsTestMode"));
  assert.ok(commonJs.includes("window.spIsWorldUnlocked"));
  assert.ok(commonJs.includes("test-mode-badge"));
});

test("message library includes cheerful world and mascot text", () => {
  assert.ok(messagesJs.includes("Namaste, little explorer! I'm Mithu!"));
  assert.ok(messagesJs.includes("alphabetForest"));
  assert.ok(messagesJs.includes("worldWelcome"));
  assert.ok(messagesJs.includes("Hooray! Your next adventure is ready!"));
});
