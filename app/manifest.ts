import type { MetadataRoute } from "next";

/**
 * Next serves this at /manifest.webmanifest and links it from every page.
 * The colours are the palette's literals rather than var(--bg): a manifest is
 * read by the OS before any stylesheet exists, so a custom property here
 * would resolve to nothing and the splash screen would fall back to white.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kaimana — Earn your edge",
    short_name: "Kaimana",
    description:
      "Practise algorithm problems against a real judge, get AI hints, a Big-O audit and refactor notes, then compete in live contests.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0B0D",
    theme_color: "#0A0B0D",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
