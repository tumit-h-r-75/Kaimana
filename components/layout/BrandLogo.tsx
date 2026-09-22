import Link from "next/link";
import { useId } from "react";

/**
 * The Kaimana mark: a cut gem, drawn as six flat facets rather than an
 * outline. The crown (the top band) catches the light — its middle facet, the
 * table, is the brightest thing in the mark — and the pavilion falls away
 * underneath into a deep blue core. No tile behind it: the stone stands on
 * whatever surface it is placed on.
 *
 * Geometry, in a 48-unit box:
 *   table     14,8 → 34,8
 *   girdle    3,18 → 45,18   (crown facets meet it at 24; the pavilion's
 *                              core facet spans 15 → 33)
 *   culet     24,43
 * app/icon.svg and the generated PNG icons use the same numbers, so the
 * favicon and the header can never drift apart.
 *
 * Gradient ids come from useId: the logo is on the page more than once
 * (header and footer, both halves of the sign-in page), and a duplicated id
 * resolves to the first copy — which on the sign-in page is inside a panel
 * hidden on phones, and a gradient inside display:none paints nothing.
 *
 * `size="lg"` is the footer's larger treatment; the default is the header's.
 */

export function BrandMark() {
  const uid = useId();
  const ref = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${ref(name)})`;

  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 48 48">
        <defs>
          <linearGradient id={ref("table")} x1="24" y1="8" x2="24" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#E6FFF9" />
            <stop offset="1" stopColor="#8DF5DE" />
          </linearGradient>
          <linearGradient id={ref("left")} x1="6" y1="18" x2="24" y2="43" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#3ED8C4" />
            <stop offset="1" stopColor="#168893" />
          </linearGradient>
          <linearGradient id={ref("core")} x1="24" y1="18" x2="24" y2="43" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#1F93D2" />
            <stop offset="1" stopColor="#123C88" />
          </linearGradient>
          <linearGradient id={ref("right")} x1="42" y1="18" x2="24" y2="43" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#23B4C2" />
            <stop offset="1" stopColor="#0F5F82" />
          </linearGradient>
          <clipPath id={ref("stone")}>
            <path d="M14 8H34L45 18 24 43 3 18Z" />
          </clipPath>
        </defs>

        {/* Crown */}
        <path d="M3 18 14 8 24 18Z" fill="#74EED8" />
        <path d="M14 8H34L24 18Z" fill={url("table")} />
        <path d="M34 8 45 18H24Z" fill="#45D6C4" />
        {/* Pavilion */}
        <path d="M3 18H15L24 43Z" fill={url("left")} />
        <path d="M15 18H33L24 43Z" fill={url("core")} />
        <path d="M33 18H45L24 43Z" fill={url("right")} />
        {/* Hairline cut edges, so the facets read as cut rather than as
            colour bands at small sizes. */}
        <path
          d="M3 18H45M14 8 24 18 34 8M15 18 24 43 33 18"
          fill="none"
          stroke="#fff"
          strokeOpacity=".3"
          strokeWidth=".7"
          strokeLinejoin="round"
        />
        {/* A glint that crosses the stone on hover (.brand-shine in
            globals.css), clipped to the silhouette so it never spills. */}
        <g clipPath={url("stone")}>
          <path className="brand-shine" d="M2 48 18 0h6L8 48Z" fill="#fff" />
        </g>
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
        K<span>aimana</span>
      </span>
    </Link>
  );
}
