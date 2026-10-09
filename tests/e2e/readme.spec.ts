import { expect, test } from "@playwright/test";
import { PAGES, expectNoViolations, watchPolicy } from "./helpers";

test("a hostile README renders with nothing active", async ({ page }) => {
  const problems = await watchPolicy(page);
  const external: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1")) {
      external.push(request.url());
    }
  });
  await page.goto(PAGES.unverifiedPlugin, { waitUntil: "networkidle" });
  const readme = page.locator("[data-untrusted-content]").first();
  await expect(readme).toContainText("Collects TODO comments");

  await expect(readme.locator("script, iframe, svg, img, object, embed, style")).toHaveCount(0);
  expect(await readme.evaluate((root) => [...root.querySelectorAll("*")].flatMap((element) => element.getAttributeNames()).filter((name) => name.startsWith("on")))).toEqual([]);
  const hrefs = await readme.locator("a").evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
  expect(hrefs.every((href) => /^(https?:|mailto:|#)/.test(href))).toBe(true);
  expect(hrefs.some((href) => href.startsWith("javascript:") || href.startsWith("data:"))).toBe(false);

  const tracker = readme.getByRole("link", { name: "Image: Tracking pixel" });
  await expect(tracker).toHaveAttribute("href", "https://tracker.example/pixel.png?u=visitor");
  await expect(readme.getByRole("link", { name: "the docs" })).toHaveAttribute("href", /^https:\/\/github\.com\/lumen-labs\/todo\/blob\/[0-9a-f]{40}\/docs\/usage\.md$/);
  for (const rel of await readme.locator("a").evaluateAll((links) => links.map((link) => link.getAttribute("rel") ?? ""))) {
    expect(rel).toBe("nofollow ugc noopener noreferrer");
  }
  await expect(readme.getByText("Click me")).toBeVisible();
  await expect(readme.getByRole("link", { name: "Click me" })).toHaveCount(0);

  expect(external).toEqual([]);
  await expectNoViolations(page, problems);
});
