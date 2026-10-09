import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { generateFixture, type Tamper } from "../fixtures/generate.ts";

test.describe.configure({ mode: "serial" });

let workspace = "";

test.beforeAll(async () => {
  workspace = await mkdtemp(path.join(tmpdir(), "hub-verify-"));
});

test.afterAll(async () => {
  await rm(workspace, { recursive: true, force: true });
});

async function prepare(tamper: Tamper): Promise<{ status: number | null; output: string }> {
  const fixture = await generateFixture(path.join(workspace, tamper), { tamper });
  const site = path.join(workspace, `${tamper}-site`);
  const result = spawnSync(process.execPath, [path.resolve("scripts/prepare-data.ts")], {
    cwd: path.resolve("."),
    env: { ...process.env, HUB_INDEX_DIR: fixture.index, HUB_TRUST_ROOT: fixture.trustedRoot, HUB_DATA_ROOT: site },
    encoding: "utf8",
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

test("a correctly signed index verifies", async () => {
  const result = await prepare("none");
  expect(result.output).toContain("Verified: root 2");
  expect(result.status).toBe(0);
});

const failures: [Tamper, RegExp][] = [
  ["signature", /timestamp\.json has 0 valid timestamp signature/],
  ["hash", /plugin record harbor\.issues does not match its signed SHA-256/],
  ["expired-timestamp", /timestamp version \d+ expired/],
  ["root-threshold", /root\/2\.json \(signed by root 1\) has 1 valid root signature/],
];

for (const [tamper, message] of failures) {
  test(`the build refuses an index with a ${tamper} problem`, async () => {
    const result = await prepare(tamper);
    expect(result.status).toBe(1);
    expect(result.output).toMatch(message);
  });
}
