import { expect } from "@playwright/test";
import { PAGES, test } from "./helpers";

test("a verified plugin opens Runesmith directly and explains what happens", async ({ page }) => {
  await page.goto(PAGES.verifiedPlugin);
  const install = page.getByTestId("install-button");
  await expect(install).toHaveAttribute("href", "runesmith://hub/plugin/harbor.issues");
  await install.click();
  const popover = page.getByTestId("install-popover");
  await expect(popover).toContainText("Runesmith should open now");
  await expect(popover.getByRole("link", { name: "Download Runesmith" })).toBeVisible();
  await expect(popover).toContainText("harbor.issues");
  await expect(page.getByTestId("unverified-dialog")).toBeHidden();
});

test("the copy button copies the plugin ID", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-write"]);
  await page.goto(PAGES.verifiedPlugin);
  await page.getByTestId("install-button").click();
  await page.getByRole("button", { name: "Copy ID" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
});

test("an unverified plugin warns first, and Cancel keeps the user on the page", async ({ page }) => {
  await page.goto(PAGES.unverifiedPlugin);
  await expect(page.getByTestId("unverified-warning")).toBeVisible();
  await page.getByTestId("install-button").click();
  const dialog = page.getByTestId("unverified-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Lumen Todo hasn't been reviewed by Runesmith");
  await expect(dialog).toContainText("Install it only if you trust Lumen Labs.");
  await expect(dialog).toContainText("Runesmith will warn you again before installing.");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("install-popover")).toHaveCount(0);
});

test("Continue to Runesmith uses the same link and shows the popover", async ({ page }) => {
  await page.goto(PAGES.unverifiedPlugin);
  await page.getByTestId("install-button").click();
  const next = page.getByTestId("continue-button");
  await expect(next).toHaveAttribute("href", "runesmith://hub/plugin/lumen.todo");
  await next.click();
  await expect(page.getByTestId("unverified-dialog")).toBeHidden();
  await expect(page.getByTestId("install-popover")).toContainText("Runesmith should open now");
});

test("Escape closes the warning dialog", async ({ page }) => {
  await page.goto(PAGES.unverifiedPlugin);
  await page.getByTestId("install-button").click();
  await expect(page.getByTestId("unverified-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("unverified-dialog")).toBeHidden();
});

test("picking a version adds it to the link and warns for a yanked one", async ({ page }) => {
  await page.goto(PAGES.unverifiedPlugin);
  await page.getByRole("combobox", { name: "Version" }).selectOption("0.9.2");
  await expect(page.getByTestId("install-button")).toHaveAttribute("href", "runesmith://hub/plugin/lumen.todo?version=0.9.2");
  await expect(page.getByTestId("yanked-warning")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Version" }).locator("option")).toHaveText(["1.0.0", "0.9.2 (yanked)"]);
});

test("frozen, blocked and deleted plugins have no install button", async ({ page }) => {
  for (const path of [PAGES.frozenPlugin, PAGES.blockedPlugin, PAGES.deletedPlugin]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByTestId("install-button")).toHaveCount(0);
  }
});

test("the report menu offers the three kinds of report", async ({ page }) => {
  await page.goto(PAGES.verifiedPlugin);
  await page.getByTestId("report-button").click();
  await expect(page.getByRole("menuitem", { name: /malicious or a security risk/ })).toHaveAttribute("href", /RunesmithHub\/registry\/security\/advisories\/new$/);
  await expect(page.getByRole("menuitem", { name: /broken or doesn't work/ })).toHaveAttribute("href", /^https:\/\/github\.com\/harbor-collective\/issues\/issues\/new\?/);
  await expect(page.getByRole("menuitem", { name: /breaks the rules/ })).toHaveAttribute("href", /RunesmithHub\/registry\/issues\/new\?template=policy\.yml/);
});
