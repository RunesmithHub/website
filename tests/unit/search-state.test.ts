import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_STATE, languageOptions, matchesFilters, readState, selectedApi, selectedLanguage, writeState } from "../../src/lib/search/state.ts";
import { languageView } from "../../src/lib/site/languages.ts";
import type { SearchDocument } from "../../src/lib/site/types.ts";

const VERSIONS = ["0.1.1", "0.1.0"];

function document(id: string, apis: string[], languages: string[] = [], languagePack = false): SearchDocument {
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
    languages,
    languagePack,
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
  return [newer, older].filter((item) => matchesFilters(item, state, null, api, null)).map((item) => item.id);
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

const LANGUAGES = [languageView("de"), languageView("nl"), languageView("pt-BR")];
const english = document("english", VERSIONS);
const localized = document("localized", VERSIONS, ["en", "nl", "de"]);
const translated = document("translated", VERSIONS, ["nl"]);
const dutchPack = document("dutch-pack", VERSIONS, ["nl"], true);
const ALL = [english, localized, translated, dutchPack];

function inLanguage(search: string, documents: readonly SearchDocument[] = ALL): string[] {
  const state = readState(search);
  const language = selectedLanguage(state, languageOptions(documents, LANGUAGES));
  return documents.filter((item) => matchesFilters(item, state, null, null, language)).map((item) => item.id);
}

test("the language filter offers only the languages plugins can be used in", () => {
  assert.deepEqual(languageOptions(ALL, LANGUAGES).map((language) => language.label), ["Deutsch (German)", "Nederlands (Dutch)"]);
  assert.deepEqual(languageOptions([english, translated], LANGUAGES).map((language) => language.tag), ["nl"]);
});

test("without a localized plugin there is no language to filter by", () => {
  assert.deepEqual(languageOptions([english, newer, older], LANGUAGES), []);
  assert.deepEqual(languageOptions(ALL, []), []);
  assert.deepEqual(inLanguage("?language=nl", [english, newer]), ["english", "newer"]);
});

test("no chosen language shows every plugin", () => {
  assert.equal(selectedLanguage(EMPTY_STATE, LANGUAGES), null);
  assert.deepEqual(inLanguage(""), ["english", "localized", "translated", "dutch-pack"]);
});

test("a chosen language shows the plugins that carry it, those a language pack translates into it, and its language packs", () => {
  assert.deepEqual(inLanguage("?language=nl"), ["localized", "translated", "dutch-pack"]);
  assert.deepEqual(inLanguage("?language=de"), ["localized"]);
});

test("the language in the address matches in any case, and an unknown one filters nothing", () => {
  assert.equal(selectedLanguage(readState("?language=PT-br"), LANGUAGES), "pt-BR");
  assert.equal(selectedLanguage(readState("?language=xx"), LANGUAGES), null);
  assert.deepEqual(inLanguage("?language=NL"), ["localized", "translated", "dutch-pack"]);
  assert.deepEqual(inLanguage("?language=fr"), ["english", "localized", "translated", "dutch-pack"]);
});

test("the language pack filter shows only language packs and combines with a language", () => {
  assert.deepEqual(inLanguage("?type=language-pack"), ["dutch-pack"]);
  assert.deepEqual(inLanguage("?language=nl&type=language-pack"), ["dutch-pack"]);
  assert.deepEqual(inLanguage("?language=de&type=language-pack"), []);
  assert.equal(readState("?type=theme").languagePacks, false);
});

test("the language and the language pack filter round-trip through the address", () => {
  assert.equal(writeState({ ...EMPTY_STATE, language: "nl" }), "?language=nl");
  assert.equal(writeState({ ...EMPTY_STATE, languagePacks: true }), "?type=language-pack");
  assert.equal(writeState({ ...EMPTY_STATE, query: "git", language: "pt-BR", languagePacks: true, sort: "name" }), "?q=git&language=pt-BR&type=language-pack&sort=name");
  assert.deepEqual(readState("?q=git&language=pt-BR&type=language-pack&sort=name"), { ...EMPTY_STATE, query: "git", language: "pt-BR", languagePacks: true, sort: "name" });
});
