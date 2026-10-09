export interface A11yReport {
  readonly h1: number;
  readonly mains: number;
  readonly lang: string;
  readonly unlabelled: string[];
  readonly missingAlt: string[];
  readonly lowContrast: string[];
  readonly duplicateIds: string[];
}

export function auditPage(): A11yReport {
  type Rgba = [number, number, number, number];

  const parse = (value: string): Rgba | null => {
    const numbers = value.match(/-?[\d.]+/g)?.map(Number) ?? [];
    if (value.startsWith("rgb")) {
      return [numbers[0] ?? 0, numbers[1] ?? 0, numbers[2] ?? 0, numbers[3] ?? 1];
    }
    if (value.startsWith("color(srgb")) {
      return [(numbers[0] ?? 0) * 255, (numbers[1] ?? 0) * 255, (numbers[2] ?? 0) * 255, numbers[3] ?? 1];
    }
    return null;
  };
  const blend = (top: Rgba, bottom: Rgba): Rgba => {
    const alpha = top[3] + bottom[3] * (1 - top[3]);
    const channel = (index: 0 | 1 | 2): number => (top[index] * top[3] + bottom[index] * bottom[3] * (1 - top[3])) / (alpha || 1);
    return [channel(0), channel(1), channel(2), alpha];
  };
  const luminance = ([r, g, b]: Rgba): number => {
    const linear = (channel: number): number => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  };
  const background = (element: Element): Rgba | null => {
    const layers: Rgba[] = [];
    for (let current: Element | null = element; current; current = current.parentElement) {
      const style = getComputedStyle(current);
      if (style.backgroundImage !== "none") {
        return null;
      }
      const color = parse(style.backgroundColor);
      if (color && color[3] > 0) {
        layers.push(color);
        if (color[3] >= 1) {
          break;
        }
      }
    }
    return layers.reduceRight<Rgba>((under, layer) => blend(layer, under), [255, 255, 255, 1]);
  };
  const visible = (element: Element): boolean => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return box.width > 0 && box.height > 0 && style.visibility !== "hidden" && Number(style.opacity) > 0 && !element.closest("[aria-hidden='true'], .sr-only");
  };
  const describe = (element: Element): string => `${element.tagName.toLowerCase()} "${(element.textContent ?? "").trim().slice(0, 40)}"`;

  const lowContrast: string[] = [];
  for (const element of document.body.querySelectorAll("*")) {
    const ownText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
    if (!ownText || !visible(element) || element.closest("[data-untrusted-content] pre, .line-through, [data-over-image]") || getComputedStyle(element).textDecorationLine.includes("line-through")) {
      continue;
    }
    const style = getComputedStyle(element);
    const color = parse(style.color);
    const under = background(element);
    if (!color || !under) {
      continue;
    }
    const foreground = blend(color, under);
    const [light, dark] = [luminance(foreground), luminance(under)].sort((a, b) => b - a) as [number, number];
    const ratio = (light + 0.05) / (dark + 0.05);
    const size = parseFloat(style.fontSize);
    const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
    if (ratio < (large ? 3 : 4.5) - 0.01) {
      lowContrast.push(`${describe(element)} ${ratio.toFixed(2)}:1`);
    }
  }

  const name = (element: Element): string => {
    const labelledBy = element.getAttribute("aria-labelledby");
    const labelled = labelledBy ? labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ") : "";
    const id = element.getAttribute("id");
    const label = id ? (document.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent ?? "") : "";
    const images = [...element.querySelectorAll("img[alt]")].map((image) => image.getAttribute("alt") ?? "").join(" ");
    return [element.getAttribute("aria-label") ?? "", labelled, label, element.closest("label")?.textContent ?? "", element.textContent ?? "", images, element.getAttribute("title") ?? ""]
      .join(" ")
      .trim();
  };
  const controls = document.querySelectorAll("a[href], button, input:not([type=hidden]), select, textarea, [role=combobox], [role=checkbox], [role=tab]");
  const unlabelled = [...controls].filter((element) => visible(element) && !name(element)).map((element) => element.outerHTML.slice(0, 120));
  const missingAlt = [...document.querySelectorAll("img")].filter((image) => !image.hasAttribute("alt")).map((image) => image.outerHTML.slice(0, 120));
  const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  return {
    h1: document.querySelectorAll("h1").length,
    mains: document.querySelectorAll("main").length,
    lang: document.documentElement.lang,
    unlabelled,
    missingAlt,
    lowContrast,
    duplicateIds,
  };
}
