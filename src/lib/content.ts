import { readFileSync } from "node:fs";
import path from "node:path";

export function readContent(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), "src", "content", relativePath), "utf8");
}
