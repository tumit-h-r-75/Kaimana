"use client";

// English or Bangla, for the interface itself.
//
// Two languages, so it is a switch rather than a menu: one press, and the
// label shows what you would get, not what you have.

import { useLanguage } from "@/providers/LanguageProvider";
import styles from "./themeToggle.module.css";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const next = language === "bn" ? "en" : "bn";
  const nextLabel = next === "bn" ? "বাংলা" : "English";

  return (
    <button
      type="button"
      className={`${styles.toggle} ${styles.wide}`}
      onClick={() => setLanguage(next)}
      aria-label={`Switch the interface to ${nextLabel}`}
      title={`Switch to ${nextLabel}`}
    >
      {language === "bn" ? "বাং" : "EN"}
    </button>
  );
}
