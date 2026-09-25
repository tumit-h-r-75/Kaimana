"use client";

// Light or dark, and "whatever this device says".
//
// The choice is written to <html data-theme> and to localStorage, and read
// back before the first paint by the inline script in app/layout.tsx — which
// is the only way to avoid a dark page flashing white on the way in.
//
// Three states rather than two: someone who has never chosen follows their
// system, and someone who has chosen keeps that choice everywhere.

import { useEffect, useState } from "react";
import styles from "./themeToggle.module.css";

type Choice = "light" | "dark" | "system";

const STORAGE_KEY = "kai-theme";

const systemPrefersDark = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;

/** The attribute is only ever set for light; dark is the stylesheet's default. */
const applyTheme = (choice: Choice) => {
  const dark = choice === "dark" || (choice === "system" && systemPrefersDark());
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
};

const ICONS: Record<Choice, React.ReactNode> = {
  light: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </>
  ),
  dark: <path d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5Z" />,
  system: (
    <>
      <rect x="3" y="4.5" width="18" height="12" rx="2" />
      <path d="M8.5 20h7M12 16.5V20" />
    </>
  ),
};

const LABEL: Record<Choice, string> = { light: "Light", dark: "Dark", system: "System" };
const NEXT: Record<Choice, Choice> = { system: "light", light: "dark", dark: "system" };

export function ThemeToggle() {
  // Server-rendered as "system" so the markup matches; the real choice lands
  // in the effect below, after the inline script has already painted it.
  const [choice, setChoice] = useState<Choice>("system");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") setChoice(stored);
    } catch {
      // Blocked storage: the system setting is a fine place to stay.
    }
  }, []);

  // Someone on "system" who changes their device setting should see it here.
  useEffect(() => {
    if (choice !== "system" || typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [choice]);

  const cycle = () => {
    const next = NEXT[choice];
    setChoice(next);
    applyTheme(next);
    try {
      if (next === "system") window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not remembered, and that is all.
    }
  };

  return (
    <button type="button" className={styles.toggle} onClick={cycle} aria-label={`Theme: ${LABEL[choice]}. Switch to ${LABEL[NEXT[choice]]}.`} title={`Theme: ${LABEL[choice]}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {ICONS[choice]}
      </svg>
    </button>
  );
}
