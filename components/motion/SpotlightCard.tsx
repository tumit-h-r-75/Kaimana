"use client";

import { useRef, type ReactNode } from "react";
import styles from "./spotlightCard.module.css";

/**
 * A card with a soft light that follows the cursor across it.
 *
 * Adapted from the React Bits component of the same name — that library is
 * copied into a project rather than installed, so this is fitted to this
 * codebase: the glow is the accent token, the position is handed to CSS as
 * custom properties, and it degrades to a plain card under
 * prefers-reduced-motion and on anything without a pointer.
 *
 * Position is written straight to the element's style rather than held in
 * React state — a card that re-rendered on every mousemove would drop
 * frames for an effect nobody asked to pay for.
 */
export function SpotlightCard({
  children,
  className = "",
  as: Tag = "div",
  innerRef,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
  /**
   * Handed the same node. Callers commonly wrap this in useReveal, which
   * needs the element to observe — and .reveal starts at opacity 0, so a
   * dropped ref does not degrade the animation, it leaves the card
   * permanently invisible.
   */
  innerRef?: { current: HTMLElement | null };
}) {
  const ref = useRef<HTMLElement | null>(null);

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        ref.current = node;
        if (innerRef) innerRef.current = node;
      }}
      className={`${styles.card} ${className}`.trim()}
      onPointerMove={(event: React.PointerEvent<HTMLElement>) => {
        if (event.pointerType !== "mouse") return;
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--x", `${event.clientX - rect.left}px`);
        el.style.setProperty("--y", `${event.clientY - rect.top}px`);
        el.style.setProperty("--lit", "1");
      }}
      onPointerLeave={() => ref.current?.style.setProperty("--lit", "0")}
    >
      {children}
    </Tag>
  );
}
