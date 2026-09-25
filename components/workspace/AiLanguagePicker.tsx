"use client";

// Which language the coach answers in.
//
// It sits in the AI panel's own tab bar, because that is the only place its
// choice has any effect — the interface around it does not change, and a
// setting buried in a profile page would never be found by the person who
// needs it most.

import { AI_LANGUAGES, useAiLanguage } from "@/hooks/useAiLanguage";
import styles from "./AiLanguagePicker.module.css";

export default function AiLanguagePicker() {
  const { language, setLanguage } = useAiLanguage();

  return (
    <label className={styles.picker}>
      <span className="sr-only">Language the AI coach answers in</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17M12 3.5c2.2 2.4 3.3 5.3 3.3 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.3-5.3-3.3-8.5S9.8 5.9 12 3.5Z" />
      </svg>
      <select value={language} onChange={(event) => setLanguage(event.target.value)}>
        {AI_LANGUAGES.map((entry) => (
          <option key={entry.code} value={entry.code}>
            {entry.label}
          </option>
        ))}
      </select>
    </label>
  );
}
