import { test as base, expect, type Page } from "@playwright/test";

export const PAGES = {
  home: "/",
  search: "/search",
  languageSearch: "/search?language=nl",
  verifiedPlugin: "/plugins/harbor.issues",
  unverifiedPlugin: "/plugins/lumen.todo",
  frozenPlugin: "/plugins/pixel.icons",
  deprecatedPlugin: "/plugins/copper.snippets",
  blockedPlugin: "/plugins/fastcode.helper",
  deletedPlugin: "/plugins/copper.markdown",
  localizedPlugin: "/plugins/runesmith.git",
  translatedPlugin: "/plugins/runesmith.github",
  languagePack: "/plugins/runesmith.dutch",
  version: "/plugins/harbor.issues/versions/1.3.2",
  blockedVersion: "/plugins/harbor.issues/versions/1.3.1",
  yankedVersion: "/plugins/lumen.todo/versions/0.9.2",
  publisher: "/publishers/harbor",
  blockedPublisher: "/publishers/fastcode",
  category: "/categories/productivity",
  advisories: "/advisories",
  advisory: "/advisories/7",
  guide: "/publish",
  guideTopic: "/publish/manifest",
  register: "/publish/register",
  moderation: "/moderation",
  publisherPolicy: "/policies/publisher",
  contentPolicy: "/policies/content",
  security: "/security",
  notFound: "/this-page-does-not-exist",
} as const;

declare global {
  interface Window {
    __violations: string[];
  }
}

export async function watchPolicy(page: Page): Promise<string[]> {
  const problems: string[] = [];
  await page.addInitScript(() => {
    window.__violations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      window.__violations.push(`${event.violatedDirective}: ${event.blockedURI} ${event.sample}`);
    });
  });
  page.on("console", (message) => {
    if (message.type() === "error" && /Content.Security.Policy|Trusted Type|Refused to/i.test(message.text())) {
      problems.push(message.text());
    }
  });
  page.on("pageerror", (error) => problems.push(`page error: ${error.message}`));
  page.on("dialog", (dialog) => {
    problems.push(`unexpected dialog: ${dialog.message()}`);
    void dialog.dismiss();
  });
  return problems;
}

export async function expectNoViolations(page: Page, problems: readonly string[]): Promise<void> {
  const violations = await page.evaluate(() => window.__violations);
  expect([...violations, ...problems]).toEqual([]);
}

export const test = base.extend<{ policyWatch: undefined }>({
  policyWatch: [
    async ({ page }, use) => {
      const problems = await watchPolicy(page);
      await use(undefined);
      if (!page.isClosed() && page.url().startsWith("http")) {
        await expectNoViolations(page, problems);
      }
    },
    { auto: true },
  ],
});
