import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/config";

/**
 * The homepage and paginated problem catalogue are public; account pages have an auth
 * gate, so a crawler that follows those links only ever reaches the sign-in
 * redirect. Keeping them out of the index avoids filling search results with
 * near-identical "Checking your session…" pages.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/problems"],
      disallow: ["/admin", "/profile", "/analytics", "/submissions", "/host", "/interview", "/signin", "/forgot-password", "/reset-password", "/verify-email", "/api/"],
    },
    sitemap: `${appConfig.appUrl}/sitemap.xml`,
  };
}
