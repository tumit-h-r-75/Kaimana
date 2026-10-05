import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/config";

/** Public pages with content a signed-out crawler can render. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${appConfig.appUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${appConfig.appUrl}/problems`, changeFrequency: "daily", priority: 0.9 },
  ];
}
