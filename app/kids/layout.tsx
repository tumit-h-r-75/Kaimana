import type { Metadata } from "next";

// Code Quest used to load two rounded faces of its own, which was most of
// why it looked like a different website. It now uses the site's Inter and
// JetBrains Mono, one size up — so this layout carries the section's
// metadata and nothing else.

export const metadata: Metadata = {
  // Bare title, not "… | Kaimana": the root layout's title template
  // appends the site name, so spelling it out here doubled it up.
  title: "Code Quest for Kids",
  description: "A coding adventure for ages 8–14: robot puzzles, loops and decisions, then real Python.",
};

export default function KidsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
