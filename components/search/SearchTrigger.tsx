"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import styles from "./commandPalette.module.css";

const CommandPalette = dynamic(
  () => import("./CommandPalette").then((module) => module.CommandPalette),
  {
    ssr: false,
    loading: () => (
      <button
        className={styles.trigger}
        type="button"
        disabled
        aria-busy="true"
      >
        Opening search…
      </button>
    ),
  },
);

export function SearchTrigger() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (enabled) return;
    const open = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setEnabled(true);
      }
    };
    window.addEventListener("keydown", open);
    return () => window.removeEventListener("keydown", open);
  }, [enabled]);

  if (enabled) return <CommandPalette initiallyOpen />;
  return (
    <button
      type="button"
      className={styles.trigger}
      onClick={() => setEnabled(true)}
      aria-label="Search Kaimana"
      aria-keyshortcuts="Control+K Meta+K"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15 15 5 5" />
      </svg>
      <span>Search</span>
      <kbd>Ctrl K</kbd>
    </button>
  );
}
