import assert from "node:assert/strict";
import { test } from "node:test";
import { compareLanguages, isEnglish, languageView, namedLanguage } from "../../src/lib/site/languages.ts";

const unknown = (): null => null;

test("a language is named in itself, with its English name", () => {
  assert.deepEqual(languageView("nl"), { tag: "nl", name: "Nederlands", englishName: "Dutch", label: "Nederlands (Dutch)" });
  assert.equal(languageView("de").label, "Deutsch (German)");
});

test("a name the Unicode data writes in lower case starts with a capital", () => {
  assert.equal(languageView("fr").name, "Français");
  assert.equal(languageView("pt-BR").label, "Português (Brasil) (Brazilian Portuguese)");
});

test("English is named once", () => {
  assert.equal(languageView("en").label, "English");
  assert.equal(isEnglish("EN"), true);
  assert.equal(isEnglish("en-GB"), false);
});

test("the fallback table names common languages when the runtime has no language names", () => {
  assert.deepEqual(languageView("nl", undefined, unknown), { tag: "nl", name: "Nederlands", englishName: "Dutch", label: "Nederlands (Dutch)" });
  assert.equal(languageView("pt-BR", undefined, unknown).label, "Português (Brasil) (Brazilian Portuguese)");
  assert.equal(languageView("en", undefined, unknown).label, "English");
});

test("a language nothing knows takes the names a language pack declares, or else its tag", () => {
  const declared = { name: "tlhIngan Hol", englishName: "Klingon" };
  assert.equal(languageView("tlh", declared, unknown).label, "tlhIngan Hol (Klingon)");
  assert.equal(languageView("qaa", declared).label, "tlhIngan Hol (Klingon)");
  assert.deepEqual(languageView("qaa"), { tag: "qaa", name: "qaa", englishName: "qaa", label: "qaa" });
  assert.equal(languageView("not a tag").label, "not a tag");
});

test("the Unicode data wins over the names a language pack declares", () => {
  assert.equal(languageView("nl", { name: "Hollands", englishName: "Hollandic" }).label, "Nederlands (Dutch)");
});

test("a language pack's own language is named exactly as it declares", () => {
  assert.deepEqual(namedLanguage("nl", { name: "Hollands", englishName: "Hollandic" }), { tag: "nl", name: "Hollands", englishName: "Hollandic", label: "Hollands (Hollandic)" });
  assert.equal(namedLanguage("en-GB", { name: "English", englishName: "English" }).label, "English");
});

test("English sorts first and the other languages by their label", () => {
  const sorted = ["nl", "de", "en", "fr"].map((tag) => languageView(tag)).sort(compareLanguages);
  assert.deepEqual(sorted.map((language) => language.label), ["English", "Deutsch (German)", "Français (French)", "Nederlands (Dutch)"]);
});
