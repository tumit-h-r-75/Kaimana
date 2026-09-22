// Shared loading indicators.
//
// The spinner is the brand mark rather than a generic ring: the same four
// silhouette as the logo, drawn in strokes, with the outline tracing itself and
// the cut lines breathing behind it. A loading state is often the first
// thing a visitor sees on a cold start, so it may as well be the product's
// own shape.
//
// Keyframes live in globals.css beside the rest of the shared chrome.

import type { CSSProperties } from "react";

type LoaderSize = "sm" | "md" | "lg";

const DIAMETER: Record<LoaderSize, number> = { sm: 18, md: 28, lg: 52 };

export function Spinner({ size = "md", className = "" }: { size?: LoaderSize; className?: string }) {
  const d = DIAMETER[size];
  return (
    <span
      className={`kai-spinner ${className}`.trim()}
      style={{ width: d, height: d }}
      role="status"
      aria-label="Loading"
    >
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {/* The outline stays drawn the whole time. Tracing it with a dash
            instead left only a fragment visible at any moment, which read
            as a stray triangle rather than the mark. */}
        <path className="kai-spinner-edge" d="M14 8H34L45 18 24 43 3 18Z" strokeWidth="2.5" />
        {/* A brighter segment travelling that same outline supplies the
            motion without ever hiding the shape. */}
        <path className="kai-spinner-trace" d="M14 8H34L45 18 24 43 3 18Z" strokeWidth="2.5" />
        {/* The girdle, the table and the pavilion cuts, lighting in sequence. */}
        <path className="kai-spinner-cut" d="M3 18H45" strokeWidth="2" />
        <path className="kai-spinner-cut kai-spinner-cut-b" d="M14 8 24 18 34 8" strokeWidth="2" />
        <path className="kai-spinner-cut kai-spinner-cut-c" d="M15 18 24 43 33 18" strokeWidth="2" />
      </svg>
    </span>
  );
}

/** Inline loader: a spinner plus a text label, for use inside cards/lists. */
export function Loader({ label = "Loading…", size = "md" }: { label?: string; size?: LoaderSize }) {
  return (
    <div className="kai-loader" role="status" aria-live="polite">
      <Spinner size={size} />
      <span>{label}</span>
    </div>
  );
}

/**
 * Full-height loader for page-level and auth-gate loading states.
 *
 * It is a <main> on purpose: the shell in globals.css gives body > main the
 * spare height, which is what keeps the footer at the bottom of the screen
 * instead of riding up behind a half-page spinner.
 */
export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <main className="kai-page-loader" role="status" aria-live="polite">
      <Spinner size="lg" />
      <p>{label}</p>
      <span className="kai-page-loader-track" aria-hidden="true"><i /></span>
    </main>
  );
}

/** Rectangular skeleton block for content placeholders (cards, rows, text lines). */
export function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div className={`kai-skeleton ${className}`.trim()} style={style} aria-hidden="true" />;
}
