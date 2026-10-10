import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_STATE, matchesFilters, readState, selectedApi, writeState } from "../../src/lib/search/state.ts";
import type { SearchDocument } from "../../src/lib/site/types.ts";

const VERSIONS = ["0.1.1", "0.1.0"];

function document(id: string, apis: string[]): SearchDocument {
  return {
    id,
    name: id,
    publisher: "p",
    publisherName: "P",
    tier: "verified",
    status: "listed",
    summary: "",
    categories: [],
    capabilities: [],
    platforms: [],
    apis,
    installs: 0,
    updatedAt: "",
    icon: null,
  };
}

const newer = document("newer", ["0.1.1"]);
const older = document("older", ["0.1.1", "0.1.0"]);

function visible(search: string): string[] {
  const state = readState(search);
  const api = selectedApi(state, VERSIONS);
  return [newer, older].filter((item) => matchesFilters(item, state, null, api)).map((item) => item.id);
}

test("the API filter defaults to the latest version", () => {
  assert.equal(selectedApi(EMPTY_STATE, VERSIONS), "0.1.1");
  assert.deepEqual(visible(""), ["newer", "older"]);
});

test("choosing an older API version hides plugins that need a newer one", () => {
  assert.deepEqual(visible("?api=0.1.0"), ["older"]);
});

test("any API version shows every plugin", () => {
  assert.equal(selectedApi(readState("?api=any"), VERSIONS), null);
  assert.deepEqual(visible("?api=any"), ["newer", "older"]);
});

test("an unknown API version falls back to the latest", () => {
  assert.equal(selectedApi(readState("?api=9.9.9"), VERSIONS), "0.1.1");
});

test("the chosen API version round-trips through the address", () => {
  assert.equal(writeState({ ...EMPTY_STATE, api: "0.1.0" }), "?api=0.1.0");
  assert.equal(writeState(EMPTY_STATE), "");
  assert.equal(readState("?api=0.1.0").api, "0.1.0");
});
