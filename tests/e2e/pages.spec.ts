import { expect, test } from "@playwright/test";
import { PAGES, expectNoViolations, watchPolicy } from "./helpers";

for (const [name, path] of Object.entries(PAGES)) {
  test(`${name} loads without policy violations`, async ({ page }) => {
    const problems = await watchPolicy(page);
    const response = await page.goto(path, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(name === "notFound" ? 404 : 200);
    await expect(page.locator("h1").first()).toBeVisible();
    const csp = response?.headers()["content-security-policy"] ?? "";
    expect(csp).toContain("default-src 'none'");
    expect(csp).not.toContain("unsafe-inline");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("require-trusted-types-for 'script'");
    await expectNoViolations(page, problems);
  });
}

test("client-side navigation keeps the policy intact", async ({ page }) => {
  const problems = await watchPolicy(page);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Harbor Issues" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Harbor Issues" })).toBeVisible();
  await page.getByRole("tab", { name: "Security" }).click();
  await page.getByRole("link", { name: "Harbor Collective" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Harbor Collective" })).toBeVisible();
  await expectNoViolations(page, problems);
});

test("the blocked plugin page shows no media, README or download", async ({ page }) => {
  await page.goto(PAGES.blockedPlugin);
  await expect(page.getByTestId("blocked-plugin")).toContainText("Blocked by Runesmith");
  await expect(page.getByTestId("blocked-plugin")).toContainText("Reason: Malicious");
  await expect(page.locator("main img")).toHaveCount(0);
  await expect(page.getByTestId("install-button")).toHaveCount(0);
  await expect(page.locator("main a[href*='.rsplugin']")).toHaveCount(0);
});

test("notices for frozen, deprecated and deleted plugins", async ({ page }) => {
  await page.goto(PAGES.frozenPlugin);
  await expect(page.getByTestId("frozen-notice")).toContainText("Installs paused");
  await expect(page.getByTestId("install-button")).toHaveCount(0);
  await page.goto(PAGES.deprecatedPlugin);
  await expect(page.getByTestId("deprecated-notice")).toContainText("C#");
  await page.goto(PAGES.deletedPlugin);
  await expect(page.getByTestId("deleted-plugin")).toContainText("no longer available");
  await page.goto(PAGES.blockedVersion);
  await expect(page.getByTestId("blocked-version")).toContainText("Vulnerability");
});

test("compatibility labels speak about the plugin API", async ({ page }) => {
  await page.goto("/plugins/runesmith.csharp");
  const sidebar = page.getByRole("complementary", { name: "About this plugin" });
  await expect(sidebar).toContainText("Works with plugin API 0.1.1");
  await expect(sidebar).toContainText("Plugin API 0.1.1 to below 0.2.0");
  await page.goto("/plugins/atlas.rest");
  await expect(page.getByText("Needs plugin API 0.2.0 to below 0.3.0")).toBeVisible();
  await page.goto("/");
  await expect(page.getByText("Works with plugin API 0.1.1").first()).toBeVisible();
  await expect(page.getByText(/Works with Runesmith/)).toHaveCount(0);
});

test("the moderation dashboard loads its summary at runtime", async ({ page }) => {
  await page.goto(PAGES.moderation);
  const dashboard = page.getByTestId("dashboard");
  await expect(dashboard).toBeVisible();
  await expect(dashboard.getByRole("table", { name: "Review queue" })).toContainText("Harbor Issues");
  await expect(dashboard).toContainText("Private reports are not shown.");
});

test("Trusted Types only let the site's own scripts load", async ({ page }) => {
  await page.goto("/");
  const outcome = await page.evaluate(() => {
    const script = document.createElement("script");
    const results: string[] = [];
    for (const url of ["/_next/static/chunks/example.js", "https://evil.example/x.js", "/hub/search/terms.json"]) {
      try {
        script.src = url;
        results.push("allowed");
      } catch {
        results.push("blocked");
      }
    }
    try {
      // eslint-disable-next-line no-restricted-syntax -- asserts that Trusted Types block this sink
      document.createElement("div").innerHTML = "<b>x</b>";
      results.push("allowed");
    } catch {
      results.push("blocked");
    }
    return results;
  });
  expect(outcome).toEqual(["allowed", "blocked", "blocked", "blocked"]);
});

test("the sidebar shows the license and the security tab links the build and analysis report", async ({ page }) => {
  await page.goto(PAGES.verifiedPlugin);
  const sidebar = page.getByRole("complementary", { name: "About this plugin" });
  await expect(sidebar.getByRole("term").filter({ hasText: "License" })).toBeVisible();
  await expect(sidebar).toContainText("Apache-2.0");
  await page.getByRole("tab", { name: "Security" }).click();
  await expect(page.getByRole("link", { name: "Build and analysis" })).toHaveAttribute("href", /^https:\/\/github\.com\/RunesmithHub\/registry\/issues\/\d+$/);
});

test("a yanked version shows its developer's reason", async ({ page }) => {
  await page.goto(PAGES.yankedVersion);
  await expect(page.getByTestId("yanked-notice")).toBeVisible();
  await expect(page.getByTestId("yank-reason")).toHaveText("Reason: Crashed on empty files.");
});
