import { expect } from "@playwright/test";
import { test } from "./helpers";

test("dark is the default and the toggle remembers the choice without cookies", async ({ page, context }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const root = page.locator("html");
  await expect(root).toHaveAttribute("data-theme", "dark");
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(background).toBe("rgb(19, 20, 24)");
  await page.getByTestId("theme-toggle").click();
  await expect(root).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(() => localStorage.getItem("hub-theme"))).toBe("light");
  await page.reload();
  await expect(root).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(242, 243, 245)");
  expect(await context.cookies()).toEqual([]);
});

test("the operating system's light preference applies until the user picks", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/search");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByTestId("theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
