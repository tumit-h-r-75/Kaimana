"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Text that lands by settling out of noise, letter by letter.
 *
 * Adapted from the React Bits effect of the same name. React Bits is a
 * copy-in library rather than a dependency — you take the component and fit
 * it to your own project — so this one is written against this codebase's
 * conventions: it renders the final string on the server, respects
 * prefers-reduced-motion, and never animates text the user cannot see.
 *
 * It suits this brand specifically: a headline resolving out of scrambled
 * characters is what a terminal does, not a decoration bolted onto one.
 */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>[]{}=+*#%$";

export function DecryptedText({
  text,
  className = "",
  /** ms between reveals. The whole run is this times the character count. */
  speed = 38,
  /** Hold before starting, so several of these can cascade. */
  delay = 0,
}: {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
}) {
  // Server and first paint render the real string: the animation is an
  // enhancement, and a crawler or a reader with JS off gets the headline.
  const [display, setDisplay] = useState(text);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let started = false;

    const run = () => {
      // Characters resolve left to right; everything past the front is
      // noise. Spaces are left alone so the word shape holds throughout —
      // scrambling those makes the line jitter in width.
      timer = setInterval(() => {
        frame += 1;
        if (frame > text.length) {
          if (timer) clearInterval(timer);
          setDisplay(text);
          return;
        }
        setDisplay(
          text
            .split("")
            .map((ch, i) => (i < frame || ch === " " ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
            .join(""),
        );
      }, speed);
    };

    // Only animate once it is actually on screen, and only the first time.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        observer.disconnect();
        setDisplay(text.replace(/[^ ]/g, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]));
        setTimeout(run, delay);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (timer) clearInterval(timer);
    };
  }, [text, speed, delay]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
