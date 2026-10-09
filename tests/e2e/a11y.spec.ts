import { expect } from "@playwright/test";
import { auditPage } from "./a11y-checks";
import { PAGES, test } from "./helpers";

for (const theme of ["dark", "light"] as const) {
  for (const [name, path] of Object.entries(PAGES)) {
    test(`${name} meets the basic accessibility checks in the ${theme} theme`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("hub-theme", value), theme);
      await page.goto(path, { waitUntil: "networkidle" });
      if (name === "moderation") {
        await expect(page.getByTestId("dashboard")).toBeVisible();
      }
      const report = await page.evaluate(auditPage);
      expect(report.lang).toBe("en");
      expect(report.mains).toBe(1);
      expect(report.h1).toBe(1);
      expect(report.unlabelled).toEqual([]);
      expect(report.missingAlt).toEqual([]);
      expect(report.duplicateIds).toEqual([]);
      expect(report.lowContrast).toEqual([]);
    });
  }
}

test("keyboard users can skip to the content and reach the main controls", async ({ page }) => {
  await page.goto(PAGES.verifiedPlugin);
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  const tabs = page.getByRole("tab");
  await tabs.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Versions" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("tab", { name: "Versions" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("1.3.2");
});

test("focus is visible on interactive elements", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement ?? document.body).outlineStyle);
  expect(outline).not.toBe("none");
});

test("search results are announced", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByTestId("result-count")).toHaveAttribute("aria-live", "polite");
});
