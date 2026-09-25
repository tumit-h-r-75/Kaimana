"use client";

// Which language the AI should answer in.
//
// Guessed once from the browser — the language someone reads their own
// operating system in is a better first guess than English — and then
// remembered, because a guess you have to correct on every page is worse
// than no guess at all.

import { useCallback, useEffect, useState } from "react";

export const AI_LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "bn", label: "বাংলা" },
  { code: "hi", label: "हिन्दी" },
  { code: "ur", label: "اردو" },
  { code: "ar", label: "العربية" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "pt", label: "Português" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ru", label: "Русский" },
  { code: "zh", label: "简体中文" },
  { code: "ja", label: "日本語" },
];

const STORAGE_KEY = "kai-ai-language";
const SUPPORTED = new Set(AI_LANGUAGES.map((entry) => entry.code));

const detect = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.has(stored)) return stored;
  } catch {
    // Private mode: fall through to the browser's own setting.
  }
  const candidates = typeof navigator === "undefined" ? [] : [...(navigator.languages ?? []), navigator.language];
  for (const candidate of candidates) {
    const base = String(candidate ?? "").toLowerCase().split("-")[0];
    if (SUPPORTED.has(base)) return base;
  }
  return "en";
};

export function useAiLanguage() {
  // Server and first client render agree on English; the guess lands right
  // after, which avoids a hydration mismatch.
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    setLanguage(detect());
  }, []);

  const choose = useCallback((next: string) => {
    if (!SUPPORTED.has(next)) return;
    setLanguage(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not remembered, and that is all.
    }
  }, []);

  return { language, setLanguage: choose };
}
