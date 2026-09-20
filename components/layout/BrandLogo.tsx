import Link from "next/link";

/**
 * The Kaimana mark: a diamond cut from four straight facets — a rotated
 * square, the table line across the crown, and two facet edges running down
 * to the culet. Strokes, never fill, and stroke="currentColor" throughout, so
 * the mark takes the accent from whatever it sits inside instead of pinning a
 * colour of its own.
 *
 * The table line stops exactly on the outer edges: at y=16.75 the 45° sides
 * sit at x=12.75 and x=35.25, so it meets them rather than crossing or
 * falling short.
 *
 * `size="lg"` is the footer's larger treatment; the default is the header's.
 */

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 5.5 42.5 24 24 42.5 5.5 24Z" />
        <path d="M12.75 16.75h22.5" strokeOpacity=".85" />
        <path d="M12.75 16.75 24 42.5" strokeOpacity=".6" />
        <path d="M35.25 16.75 24 42.5" strokeOpacity=".6" />
      </svg>
    </span>
  );
}

interface BrandLogoProps {
  size?: "md" | "lg";
  href?: string;
  className?: string;
}

export function BrandLogo({ size = "md", href = "/", className }: BrandLogoProps) {
  return (
    <Link
      className={`brand${size === "lg" ? " brand-lg" : ""}${className ? ` ${className}` : ""}`}
      href={href}
      aria-label="Kaimana home"
    >
      <BrandMark />
      <span className="brand-word">
        Kai<span>mana</span>
      </span>
    </Link>
  );
}
