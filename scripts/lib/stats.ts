import { LIMITS } from "../../src/lib/hub/limits.ts";
import { parseJsonBytes } from "../../src/lib/hub/json.ts";
import type { IndexSource } from "../../src/lib/hub/source.ts";

function counts(value: unknown): Map<string, number> {
  const result = new Map<string, number>();
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return result;
  }
  for (const [id, count] of Object.entries(value)) {
    if (typeof count === "number" && Number.isSafeInteger(count) && count >= 0) {
      result.set(id, count);
    }
  }
  return result;
}

export async function readInstallCounts(source: IndexSource): Promise<Map<string, number>> {
  try {
    const bytes = await source.read("stats.json", LIMITS.stats);
    if (!bytes) {
      return new Map();
    }
    const parsed = parseJsonBytes(bytes, "stats.json");
    const nested = typeof parsed === "object" && parsed !== null && "installs" in parsed ? parsed.installs : parsed;
    return counts(nested);
  } catch (error) {
    console.warn(`warning: install counts are unavailable: ${(error as Error).message}`);
    return new Map();
  }
}
