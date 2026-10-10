import assert from "node:assert/strict";
import { test } from "node:test";
import { apiRangeText, runsOn, supportedApis } from "../../src/lib/site/compat.ts";

const VERSIONS = ["0.1.1", "0.1.0"];

test("a ^0.1.1 plugin runs on plugin API 0.1.1 and not 0.1.0", () => {
  assert.equal(runsOn(">=0.1.1 <0.2.0", "0.1.1", "0.1.0"), true);
  assert.equal(runsOn(">=0.1.1 <0.2.0", "0.1.0", "0.1.0"), false);
  assert.deepEqual(supportedApis(">=0.1.1 <0.2.0", VERSIONS, "0.1.0"), ["0.1.1"]);
});

test("a ^0.1.0 plugin runs on plugin API 0.1.1 and 0.1.0", () => {
  assert.deepEqual(supportedApis(">=0.1.0 <0.2.0", VERSIONS, "0.1.0"), ["0.1.1", "0.1.0"]);
});

test("a plugin for another API line runs on none of them", () => {
  assert.deepEqual(supportedApis(">=0.2.0 <0.3.0", VERSIONS, "0.1.0"), []);
  assert.deepEqual(supportedApis("not a range", VERSIONS, "0.1.0"), []);
});

test("a range below the oldest supported API does not run", () => {
  assert.equal(runsOn(">=0.0.5 <0.2.0", "0.1.1", "0.1.0"), false);
});

test("the declared range reads as plugin API text", () => {
  assert.equal(apiRangeText(">=0.1.1 <0.2.0"), "Plugin API 0.1.1 to below 0.2.0");
});
