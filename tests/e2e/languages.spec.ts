import { expect, type Locator, type Page } from "@playwright/test";
import { PAGES, test } from "./helpers";

function sidebar(page: Page): Locator {
  return page.getByRole("complementary", { name: "About this plugin" });
}

function row(page: Page, term: string): Locator {
  return sidebar(page).locator("dt", { hasText: new RegExp(`^${term}$`) }).locator("xpath=following-sibling::dd[1]");
}

async function resultIds(page: Page): Promise<string[]> {
  return page.getByTestId("results").locator("li span.font-mono").allTextContents();
}

test("a localized plugin lists its languages by their own and English names, English first", async ({ page }) => {
  await page.goto(PAGES.localizedPlugin);
  await expect(row(page, "Languages")).toHaveText("English, Deutsch (German), Nederlands (Dutch)");
  await expect(row(page, "Languages").locator("[lang]")).toHaveText(["English", "Deutsch", "Nederlands"]);
  await expect(row(page, "Languages").locator("[lang=nl]")).toHaveText("Nederlands");
  await expect(sidebar(page).getByRole("term").filter({ hasText: "Language pack" })).toHaveCount(0);
  await page.goto("/plugins/runesmith.git/versions/0.3.3");
  await expect(row(page, "Languages")).toHaveText("English, Deutsch (German), Nederlands (Dutch)");
});

test("a plugin that lists no languages shows none", async ({ page }) => {
  await page.goto(PAGES.verifiedPlugin);
  await expect(sidebar(page).getByRole("term").filter({ hasText: "Platforms" })).toBeVisible();
  await expect(sidebar(page).getByRole("term").filter({ hasText: "Language" })).toHaveCount(0);
  await expect(sidebar(page)).not.toContainText("Also available in");
});

test("a language pack shows its language and links what it translates", async ({ page }) => {
  await page.goto(PAGES.languagePack);
  await expect(page.getByRole("heading", { level: 1, name: "Dutch Language Pack" })).toBeVisible();
  await expect(row(page, "Language pack")).toHaveText("Nederlands (Dutch)");
  await expect(row(page, "Language pack").locator("[lang=nl]")).toHaveText("Nederlands");
  await expect(row(page, "Translates")).toHaveText("Runesmith, GitHub");
  await expect(row(page, "Translates").getByRole("link")).toHaveText(["GitHub"]);
  await expect(sidebar(page).getByRole("term").filter({ hasText: /^Languages$/ })).toHaveCount(0);
  await row(page, "Translates").getByRole("link", { name: "GitHub" }).click();
  await expect(page).toHaveURL(/\/plugins\/runesmith\.github$/);
  await expect(page.getByRole("heading", { level: 1, name: "GitHub" })).toBeVisible();
});

test("a plugin a language pack translates says so and links the pack", async ({ page }) => {
  await page.goto(PAGES.translatedPlugin);
  await expect(row(page, "Language packs")).toHaveText("Also available in Nederlands through Dutch Language Pack");
  await expect(sidebar(page).getByRole("term").filter({ hasText: /^Languages$/ })).toHaveCount(0);
  await row(page, "Language packs").getByRole("link", { name: "Dutch Language Pack" }).click();
  await expect(page).toHaveURL(/\/plugins\/runesmith\.dutch$/);
  await expect(page.getByRole("heading", { level: 1, name: "Dutch Language Pack" })).toBeVisible();
});

test("the language filter lists the languages of the index and lives in the address", async ({ page }) => {
  await page.goto("/search");
  const language = page.getByRole("combobox", { name: "Language" });
  await expect(language).toHaveValue("");
  await expect(language.getByRole("option")).toHaveText(["Any language", "Deutsch (German)", "Nederlands (Dutch)"]);
  await expect(page.getByTestId("result-count")).toHaveText("13 plugins");
  await language.selectOption("nl");
  await expect(page).toHaveURL(/[?&]language=nl$/);
  await expect(page.getByTestId("result-count")).toHaveText("3 plugins");
  expect(await resultIds(page)).toEqual(["runesmith.git", "runesmith.github", "runesmith.dutch"]);
  await language.selectOption("de");
  await expect(page).toHaveURL(/[?&]language=de$/);
  await expect.poll(() => resultIds(page)).toEqual(["runesmith.git"]);
  await page.goBack();
  await expect(language).toHaveValue("nl");
  await expect(page.getByTestId("result-count")).toHaveText("3 plugins");
  await language.selectOption("");
  await expect(page).not.toHaveURL(/language=/);
  await expect(page.getByTestId("result-count")).toHaveText("13 plugins");
});

test("a shared address restores the language and combines with the other filters", async ({ page }) => {
  await page.goto(PAGES.languageSearch);
  await expect(page.getByRole("combobox", { name: "Language" })).toHaveValue("nl");
  await expect.poll(() => resultIds(page)).toEqual(["runesmith.git", "runesmith.github", "runesmith.dutch"]);
  await page.getByRole("checkbox", { name: "No network access" }).click();
  await expect(page).toHaveURL(/without=network&language=nl$/);
  await expect.poll(() => resultIds(page)).toEqual(["runesmith.git", "runesmith.dutch"]);
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByRole("combobox", { name: "Language" })).toHaveValue("");
  await expect(page.getByTestId("result-count")).toHaveText("13 plugins");
  await page.goto("/search?language=fr");
  await expect(page.getByRole("combobox", { name: "Language" })).toHaveValue("");
  await expect(page.getByTestId("result-count")).toHaveText("13 plugins");
});

test("the language filter works from the keyboard", async ({ page }) => {
  await page.goto("/search");
  const language = page.getByRole("combobox", { name: "Language" });
  await language.focus();
  await page.keyboard.press("ArrowDown");
  await expect(language).toHaveValue("de");
  await expect(page).toHaveURL(/language=de/);
  await expect.poll(() => resultIds(page)).toEqual(["runesmith.git"]);
  await page.keyboard.press("Tab");
  const packs = page.getByRole("checkbox", { name: "Language packs only" });
  await expect(packs).toBeFocused();
  await page.keyboard.press("Space");
  await expect(packs).toBeChecked();
  await expect(page.getByTestId("result-count")).toHaveText("0 plugins");
});

test("language packs are a filter of their own and are found by the name of their language", async ({ page }) => {
  await page.goto("/search");
  await page.getByRole("checkbox", { name: "Language packs only" }).click();
  await expect(page).toHaveURL(/type=language-pack$/);
  await expect.poll(() => resultIds(page)).toEqual(["runesmith.dutch"]);
  await expect(page.getByTestId("results")).toContainText("Language pack");
  await page.goto("/search?language=nl&type=language-pack");
  await expect(page.getByRole("checkbox", { name: "Language packs only" })).toBeChecked();
  await expect.poll(() => resultIds(page)).toEqual(["runesmith.dutch"]);
  await page.goto("/search");
  await page.getByRole("searchbox", { name: "Search plugins" }).last().fill("nederlands");
  await expect.poll(async () => (await resultIds(page))[0]).toBe("runesmith.dutch");
});

test("a category offers only its own languages, and no language filter without a localized plugin", async ({ page }) => {
  await page.goto("/categories/other");
  await expect(page.getByRole("combobox", { name: "Language" }).getByRole("option")).toHaveText(["Any language", "Nederlands (Dutch)"]);
  await expect(page.getByRole("checkbox", { name: "Language packs only" })).toBeVisible();
  await page.goto("/categories/themes");
  await expect(page.getByRole("combobox", { name: "Platform" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Language" })).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: "Language packs only" })).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "Filters" }).getByRole("heading", { name: "Language" })).toHaveCount(0);
});

test("the publishing guide explains languages and language packs", async ({ page }) => {
  await page.goto(PAGES.guideTopic);
  await expect(page.getByRole("heading", { name: "Languages" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Localization" })).toHaveAttribute("href", "https://docs.runesmith.dev/plugins/localization");
  await expect(page.getByRole("link", { name: "Language packs" })).toHaveAttribute("href", "https://docs.runesmith.dev/plugins/language-packs");
});
