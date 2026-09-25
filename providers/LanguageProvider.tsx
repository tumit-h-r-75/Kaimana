"use client";

// Which language the interface itself speaks.
//
// The first visit follows the browser — someone whose phone is in Bangla
// gets Bangla without asking — and a choice, once made, is kept. Everything
// the AI writes is chosen separately (hooks/useAiLanguage.ts): a reader may
// well want the interface in English and the explanations in Bangla, and
// tying the two together would make that impossible.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DICTIONARIES, type Dictionary, type UiLanguage } from "@/lib/i18n";

const STORAGE_KEY = "kai-ui-language";

interface LanguageValue {
  language: UiLanguage;
  setLanguage: (next: UiLanguage) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageValue>({ language: "en", setLanguage: () => undefined, t: DICTIONARIES.en });

export function LanguageProvider({ children }: { children: ReactNode }) {
  // English on the server and on the first client render, so the two agree;
  // the real choice lands immediately afterwards.
  const [language, setLanguageState] = useState<UiLanguage>("en");

  useEffect(() => {
    let next: UiLanguage | null = null;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "bn") next = stored;
    } catch {
      // Blocked storage: fall through to the browser's own list.
    }
    if (!next) {
      const spoken = [...(navigator.languages ?? []), navigator.language].join(",").toLowerCase();
      next = spoken.includes("bn") ? "bn" : "en";
    }
    setLanguageState(next);
    document.documentElement.lang = next;
  }, []);

  const setLanguage = useCallback((next: UiLanguage) => {
    setLanguageState(next);
    document.documentElement.lang = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not remembered, and that is all.
    }
  }, []);

  const value = useMemo<LanguageValue>(() => ({ language, setLanguage, t: DICTIONARIES[language] }), [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
