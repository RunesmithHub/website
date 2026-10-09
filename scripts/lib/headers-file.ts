export interface HeaderRule {
  readonly pattern: string;
  readonly set: readonly (readonly [string, string])[];
  readonly detach: readonly string[];
}

export function parseHeadersFile(text: string): HeaderRule[] {
  const rules: { pattern: string; set: [string, string][]; detach: string[] }[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("#")) {
      continue;
    }
    if (!/^\s/.test(line)) {
      rules.push({ pattern: line.trim(), set: [], detach: [] });
      continue;
    }
    const rule = rules.at(-1);
    const entry = line.trim();
    if (!rule) {
      throw new Error(`header line without a path: ${entry}`);
    }
    if (entry.startsWith("!")) {
      rule.detach.push(entry.slice(1).trim().toLowerCase());
      continue;
    }
    const colon = entry.indexOf(":");
    rule.set.push([entry.slice(0, colon).trim(), entry.slice(colon + 1).trim()]);
  }
  return rules;
}

function patternToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/:[A-Za-z]\w*/g, "[^/]+"))
    .join(".*");
  return new RegExp(`^${escaped}$`);
}

export function headersFor(rules: readonly HeaderRule[], pathname: string): Map<string, string> {
  const result = new Map<string, string>();
  for (const rule of rules) {
    if (!patternToRegExp(rule.pattern).test(pathname)) {
      continue;
    }
    for (const name of rule.detach) {
      result.delete(name);
    }
    for (const [name, value] of rule.set) {
      const key = name.toLowerCase();
      const existing = result.get(key);
      result.set(key, existing ? `${existing}, ${value}` : value);
    }
  }
  return result;
}
