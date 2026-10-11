import type { LanguageView } from "./types.ts";

export const ENGLISH = "en";

export interface LanguageNames {
  readonly name: string;
  readonly englishName: string;
}

/** Looks up the name of a language in the language of a locale, or null when the runtime does not know it. */
export type NameLookup = (locale: string, tag: string) => string | null;

const FALLBACK_NAMES: Readonly<Record<string, LanguageNames>> = {
  ar: { name: "العربية", englishName: "Arabic" },
  cs: { name: "Čeština", englishName: "Czech" },
  da: { name: "Dansk", englishName: "Danish" },
  de: { name: "Deutsch", englishName: "German" },
  el: { name: "Ελληνικά", englishName: "Greek" },
  en: { name: "English", englishName: "English" },
  es: { name: "Español", englishName: "Spanish" },
  fi: { name: "Suomi", englishName: "Finnish" },
  fr: { name: "Français", englishName: "French" },
  he: { name: "עברית", englishName: "Hebrew" },
  hi: { name: "हिन्दी", englishName: "Hindi" },
  hu: { name: "Magyar", englishName: "Hungarian" },
  id: { name: "Indonesia", englishName: "Indonesian" },
  it: { name: "Italiano", englishName: "Italian" },
  ja: { name: "日本語", englishName: "Japanese" },
  ko: { name: "한국어", englishName: "Korean" },
  nb: { name: "Norsk bokmål", englishName: "Norwegian Bokmål" },
  nl: { name: "Nederlands", englishName: "Dutch" },
  pl: { name: "Polski", englishName: "Polish" },
  pt: { name: "Português", englishName: "Portuguese" },
  "pt-br": { name: "Português (Brasil)", englishName: "Brazilian Portuguese" },
  ro: { name: "Română", englishName: "Romanian" },
  ru: { name: "Русский", englishName: "Russian" },
  sv: { name: "Svenska", englishName: "Swedish" },
  tr: { name: "Türkçe", englishName: "Turkish" },
  uk: { name: "Українська", englishName: "Ukrainian" },
  vi: { name: "Tiếng Việt", englishName: "Vietnamese" },
  "zh-hans": { name: "简体中文", englishName: "Simplified Chinese" },
  "zh-hant": { name: "繁體中文", englishName: "Traditional Chinese" },
};

function displayName(locale: string, tag: string): string | null {
  try {
    if (Intl.DisplayNames.supportedLocalesOf([locale]).length === 0) {
      return null;
    }
    return new Intl.DisplayNames([locale], { type: "language", fallback: "none" }).of(tag) ?? null;
  } catch {
    return null;
  }
}

function capitalized(text: string, tag: string): string {
  try {
    return text.charAt(0).toLocaleUpperCase(tag) + text.slice(1);
  } catch {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}

/** Names a language exactly as given, as a language pack declares its own. */
export function namedLanguage(tag: string, names: LanguageNames): LanguageView {
  const { name, englishName } = names;
  return { tag, name, englishName, label: name === englishName ? name : `${name} (${englishName})` };
}

/** Names a language in itself and in English: from the runtime's Unicode CLDR data, else the fallback table, else the declared names, else its tag. */
export function languageView(tag: string, declared?: LanguageNames, lookup: NameLookup = displayName): LanguageView {
  const known = FALLBACK_NAMES[tag.toLowerCase()];
  const englishName = lookup(ENGLISH, tag) ?? known?.englishName ?? declared?.englishName ?? tag;
  const own = lookup(tag, tag);
  return namedLanguage(tag, { name: own ? capitalized(own, tag) : (known?.name ?? declared?.name ?? englishName), englishName });
}

export function isEnglish(tag: string): boolean {
  return tag.toLowerCase() === ENGLISH;
}

/** Puts English first and the other languages in the order of their labels. */
export function compareLanguages(a: LanguageView, b: LanguageView): number {
  return Number(isEnglish(b.tag)) - Number(isEnglish(a.tag)) || a.label.localeCompare(b.label, ENGLISH);
}
