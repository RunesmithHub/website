import { expect, type Page } from "@playwright/test";
import { test } from "./helpers";

async function resultIds(page: Page): Promise<string[]> {
  return page.getByTestId("results").locator("li span.font-mono").allTextContents();
}

test("typing searches by name, keyword and with typos", async ({ page }) => {
  await page.goto("/search");
  const input = page.getByRole("searchbox", { name: "Search plugins" }).last();
  await input.fill("harbor");
  await expect(page.getByTestId("result-count")).not.toHaveText("13 plugins");
  expect((await resultIds(page))[0]).toBe("harbor.issues");
  await input.fill("docker");
  await expect.poll(() => resultIds(page)).toEqual(["cobalt.docker"]);
  await input.fill("harbr");
  await expect.poll(async () => (await resultIds(page))[0]).toBe("harbor.issues");
  await input.fill("lumen.todo");
  await expect.poll(async () => (await resultIds(page))[0]).toBe("lumen.todo");
  await expect(page).toHaveURL(/\?q=lumen\.todo$/);
});

test("tier and capability filters narrow the results and live in the address", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByTestId("result-count")).toHaveText("13 plugins");
  await page.getByRole("checkbox", { name: "Official" }).click();
  await expect(page.getByTestId("result-count")).toHaveText("4 plugins");
  await expect(page).toHaveURL(/tier=official/);
  await page.getByRole("checkbox", { name: "No network access" }).click();
  await expect.poll(() => resultIds(page)).toEqual(["runesmith.git", "runesmith.dutch"]);
  await page.goBack();
  await expect(page.getByTestId("result-count")).toHaveText("4 plugins");
  await expect(page.getByRole("checkbox", { name: "No network access" })).not.toBeChecked();
});

test("category and platform filters", async ({ page }) => {
  await page.goto("/search?category=themes");
  await expect.poll(async () => (await resultIds(page)).sort()).toEqual(["ember.themes", "pixel.icons"]);
  await page.goto("/search?platform=windows");
  expect(await resultIds(page)).not.toContain("cobalt.docker");
});

test("the plugin API filter defaults to the latest version and lives in the address", async ({ page }) => {
  await page.goto("/search");
  const api = page.getByRole("combobox", { name: "Works with plugin API" });
  await expect(api).toHaveValue("0.1.3");
  await expect(api.getByRole("option")).toHaveText(["Plugin API 0.1.3 (latest)", "Plugin API 0.1.2", "Plugin API 0.1.1", "Plugin API 0.1.0", "Any plugin API"]);
  await expect(page.getByTestId("result-count")).toHaveText("13 plugins");
  await api.focus();
  await api.selectOption("0.1.0");
  await expect(page).toHaveURL(/api=0\.1\.0/);
  await expect(page.getByTestId("result-count")).toHaveText("12 plugins");
  const ids = await resultIds(page);
  expect(ids).not.toContain("tide.formatter");
  expect(ids).toContain("runesmith.csharp");
  await api.selectOption("any");
  await expect(page).toHaveURL(/api=any/);
  await expect(page.getByTestId("result-count")).toHaveText("13 plugins");
  await page.goBack();
  await expect(api).toHaveValue("0.1.0");
  await page.goto("/search?api=0.1.0");
  await expect(page.getByRole("combobox", { name: "Works with plugin API" })).toHaveValue("0.1.0");
  await expect(page.getByTestId("result-count")).toHaveText("12 plugins");
});

test("sorting by name and the shared URL restore the same view", async ({ page }) => {
  await page.goto("/search?sort=name&tier=verified");
  await expect.poll(() => resultIds(page)).toEqual(["ember.themes", "harbor.issues", "northwind.charts", "tide.formatter"]);
  await expect(page.getByRole("combobox", { name: "Sort by" })).toHaveValue("name");
  await expect(page.getByRole("checkbox", { name: "Verified", exact: true })).toBeChecked();
});

test("deprecated plugins rank last", async ({ page }) => {
  await page.goto("/search");
  await expect.poll(async () => (await resultIds(page)).at(-1)).toBe("copper.snippets");
});

test("pressing / focuses the search box", async ({ page }) => {
  await page.goto("/");
  await page.locator("body").press("/");
  await expect(page.getByRole("searchbox", { name: "Search plugins" })).toBeFocused();
  await page.keyboard.type("charts");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=charts/);
  await expect.poll(async () => (await resultIds(page))[0]).toBe("northwind.charts");
});
