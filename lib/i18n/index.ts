// The site's own words, in Bangla and English.
//
// This is deliberately not a translation framework. Kaimana has two
// audiences that matter — the Bangladeshi students it was built for, and
// everyone else — so it has two files of strings, typed against each other
// so a missing key is a build error rather than a blank space on a page.
//
// What the AI writes is a separate matter: that answers in any of a dozen
// languages (hooks/useAiLanguage.ts), because a model can. Interface copy
// cannot be machine-translated without someone who reads the language
// checking it, so the interface offers the two we can vouch for.

import { en } from "./en";
import { bn } from "./bn";

export type UiLanguage = "en" | "bn";
export type Dictionary = typeof en;

export const DICTIONARIES: Record<UiLanguage, Dictionary> = { en, bn };

export const UI_LANGUAGES: { code: UiLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "bn", label: "বাংলা" },
];

/**
 * Bangla for the people who read it, English for everyone else.
 *
 * The browser's own language list is the signal that matters — someone
 * Bangladeshi reading in London is still reading Bangla — with the country
 * the platform reports as a fallback for a browser that says nothing.
 */
export const languageFor = ({ country, acceptLanguage }: { country?: string | null; acceptLanguage?: string | null }): UiLanguage => {
  const languages = (acceptLanguage ?? "").toLowerCase();
  if (languages.includes("bn")) return "bn";
  if (!languages && country === "BD") return "bn";
  return "en";
};
